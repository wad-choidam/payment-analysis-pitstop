import type { LogEntry, PaymentAttempt, AttemptResult } from '../types'

const BOUNDARY_EVENTS = [
  '단말기 연결 요청',       // POS side
]

const BOUNDARY_PATTERNS = [
  /^POS 연결 요청 수신/,   // TERMINAL side
]

function isBoundaryEvent(entry: LogEntry): boolean {
  if (BOUNDARY_EVENTS.includes(entry.event)) return true
  return BOUNDARY_PATTERNS.some(p => p.test(entry.event))
}

function hasPosApprovalSuccess(entries: LogEntry[]): boolean {
  const approvalIdx = entries.findIndex(e => e.event === '승인 요청')
  if (approvalIdx < 0) return false
  const approvalPtxId = entries[approvalIdx].ptxId
  return entries.some((e, i) => {
    if (e.source !== 'POS' || i <= approvalIdx) return false
    if (e.event === '승인 성공' || e.event === '승인 수신 확인 응답') return true
    if (e.event.startsWith('직전거래 응답') && e.status === 'success') {
      // 직전거래 응답은 과거 거래에 대한 응답일 수 있으므로 ptxId가 현재 승인 요청과 일치할 때만 실 승인으로 간주
      return !!approvalPtxId && e.ptxId === approvalPtxId
    }
    return false
  })
}

function determineResult(entries: LogEntry[]): AttemptResult {
  const events = entries.map(e => e.event)

  // 사용자 취소
  if (events.some(e => e === '사용자 취소' || e === '중단 성공')) return 'cancelled'

  // 타이머 만료
  if (events.some(e => e.includes('타이머 만료'))) return 'timeout'

  // POS 측에서 승인 요청 이후 성공 수신
  if (hasPosApprovalSuccess(entries)) return 'success'

  // 단말기 측 0000 응답 (POS 미수신이어도 VAN 승인은 됨)
  if (events.some(e => e === '승인 성공 응답')) return 'success'

  // 실패 이벤트가 있으면
  if (entries.some(e => e.status === 'failure')) return 'failure'

  return 'unknown'
}

function generateResultDetail(entries: LogEntry[], result: AttemptResult): string {
  const events = entries.map(e => e.event)
  const vanSent = events.some(e => e === 'VAN사에 승인 요청')
  const vanSuccess = events.some(e => e === '승인 성공 응답')
  const posReceived = hasPosApprovalSuccess(entries)
  const hasTerminal = entries.some(e => e.source === 'TERMINAL')
  const approvalSuccess = vanSuccess || (!hasTerminal && posReceived)
  const has9999 = events.some(e => e.includes('단말기 수신 불가'))
  const hasCxFail = events.some(e => e.includes('IC카드 리딩 실패'))
  const hasPrinterError = events.some(e => e.includes('프린터 오류'))
  const hasEotPrint = events.some(e => e.includes('단말기 자체 영수증'))
  const hasSocketTimeout = events.some(e => e.includes('SocketTimeoutException'))
  const hasForceCancelTimeout = events.some(e => e.includes('강제 취소 타임아웃'))

  const hasManualRegister = events.some(e => e.includes('임의등록'))
  const hasDuplicateSuspect = events.some(e => e === '중복 결제 의심')

  if (result === 'cancelled') return '사용자 취소'
  if (result === 'timeout') return '타이머 만료로 접속 종료'
  if (hasManualRegister) return '중복결제 의심 → 임의등록 처리'
  if (hasDuplicateSuspect) return '중복결제 의심'

  if (hasSocketTimeout) return 'VAN 통신 타임아웃'
  if (hasForceCancelTimeout) return '강제 취소 타임아웃 (VAN 통신 불가)'

  if (approvalSuccess && posReceived) return '승인 완료, POS 정상 수신'
  if (vanSuccess && !posReceived && hasEotPrint) return 'VAN 승인 완료, POS 미수신 → 단말기 자체 영수증 출력'
  if (vanSuccess && !posReceived) return 'VAN 승인 완료, POS 미수신 (단말기 단독 결제)'
  if (vanSent && !vanSuccess) return 'VAN 승인 요청 후 응답 없음'

  if (has9999) return '단말기 수신 불가 (9999)'
  if (hasCxFail) return 'IC카드 리딩 실패'
  if (hasPrinterError) return '프린터 오류'

  if (result === 'failure') return '결제 실패'
  return '상세 불명'
}

function buildAttempt(
  attemptNumber: number,
  entries: LogEntry[],
  startIndex: number,
  endIndex: number,
): PaymentAttempt {
  const events = entries.map(e => e.event)
  const vanApprovalSent = events.some(e => e === 'VAN사에 승인 요청')
  const vanApprovalSuccess = events.some(e => e === '승인 성공 응답')
  const posReceivedSuccess = hasPosApprovalSuccess(entries)
  const hasTerminalLog = entries.some(e => e.source === 'TERMINAL')
  // 단말기 로그가 없으면 POS 측 승인 성공을 VAN 승인 성공으로 간주
  const effectiveVanSuccess = vanApprovalSuccess || (!hasTerminalLog && posReceivedSuccess)

  const result = determineResult(entries)
  const resultDetail = generateResultDetail(entries, result)

  return {
    attemptNumber,
    startIndex,
    endIndex,
    startTimestamp: entries[0]?.timestamp ?? '',
    endTimestamp: entries[entries.length - 1]?.timestamp ?? '',
    vanApprovalSent,
    vanApprovalSuccess: effectiveVanSuccess,
    posReceivedSuccess,
    result,
    resultDetail,
  }
}

export function groupPaymentAttempts(allEntries: LogEntry[]): PaymentAttempt[] {
  if (allEntries.length === 0) return []

  const attempts: PaymentAttempt[] = []
  let currentStart = 0

  for (let i = 0; i < allEntries.length; i++) {
    if (i > currentStart && isBoundaryEvent(allEntries[i])) {
      const slice = allEntries.slice(currentStart, i)
      attempts.push(buildAttempt(attempts.length + 1, slice, currentStart, i - 1))
      currentStart = i
    }
  }

  // 마지막 attempt
  const slice = allEntries.slice(currentStart)
  if (slice.length > 0) {
    attempts.push(buildAttempt(attempts.length + 1, slice, currentStart, allEntries.length - 1))
  }

  return attempts
}
