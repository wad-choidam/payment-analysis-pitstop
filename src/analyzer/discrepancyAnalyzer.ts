import type { AnalysisResult, LogEntry, PosType, TerminalType } from '../types'
import { groupPaymentAttempts } from './attemptGrouper'
import { generateConclusion } from './conclusionGenerator'

function detectPosType(entries: LogEntry[], posTypeHint?: string): PosType {
  for (const entry of entries) {
    if (entry.ptxId?.startsWith('APOS-')) return 'APOS'
    if (entry.ptxId?.startsWith('BPOS-')) return 'BPOS'
    if (entry.ptxId?.startsWith('CPOS-')) return 'CPOS'
  }
  if (posTypeHint === 'APOS') return 'APOS'
  if (posTypeHint === 'BPOS') return 'BPOS'
  if (posTypeHint === 'CPOS') return 'CPOS'
  return 'UNKNOWN'
}

function detectTerminal(entries: LogEntry[], posTypeHint?: string): TerminalType {
  for (const entry of entries) {
    if (entry.rawLog.includes('T650P') || entry.source === 'TERMINAL') return 'Eximbay'
  }
  // 엑셀에서 serviceType이 있으면 결제 불일치 알림 대상 = Eximbay 단말기
  if (posTypeHint === 'APOS' || posTypeHint === 'BPOS' || posTypeHint === 'CPOS') return 'Eximbay'
  return 'UNKNOWN'
}

function detectDiscrepancyType(entries: LogEntry[]): string {
  const events = entries.map(e => e.event)

  // 우선순위 순으로 체크
  if (events.some(e => e.includes('동기화 실패'))) return 'PtxID 불일치 (동기화 실패)'
  if (events.some(e => e.includes('EOT 비정상'))) return '결제 불일치 (EOT 비정상)'
  if (events.some(e => e.includes('타이머 만료'))) return '타이머 만료'
  if (events.some(e => e.includes('중단 실패') || e.includes('승인 중단 실패'))) return '연결 끊김 (중단 실패)'
  if (events.some(e => e.includes('단말기 수신 불가'))) return '단말기 수신 불가 (9999)'
  if (events.some(e => e.includes('트랜잭션 스킵'))) return '단말기 사용 불가'
  if (events.some(e => e.includes('충전독 분리'))) return '충전독 분리'
  if (events.some(e => e.includes('충전독'))) return '충전독 접촉'
  if (events.some(e => e.includes('접속 타임아웃') || e.includes('Attempt to connect to host timed out'))) return '접속 타임아웃'
  if (events.some(e => e === '중복 결제 의심')) return '중복 결제 의심'
  if (events.some(e => e.includes('중복결제 확인 응답실패'))) return '중복결제 확인 응답실패'
  if (events.some(e => e.includes('마지막 승인 응답실패'))) return '마지막 승인 응답실패'

  // 최종결론에서 추출
  const conclusion = entries.find(e => e.event.startsWith('최종결론:'))
  if (conclusion) {
    const reason = conclusion.event.replace('최종결론: ', '')
    if (reason.includes('사용자 취소')) return '사용자 취소'
    if (reason.includes('접속 실패')) return '접속 실패'
    if (reason.includes('단말기가 수신 가능한 상태가 아님')) return '단말기 수신 불가'
    return reason
  }

  return '알 수 없음'
}

function findPtxId(entries: LogEntry[]): string {
  // 승인 요청의 ptxId를 우선 반환 (직전거래 응답이 아닌)
  for (const entry of entries) {
    if (entry.ptxId && entry.event === '승인 요청') return entry.ptxId
  }
  for (const entry of entries) {
    if (entry.ptxId) return entry.ptxId
  }
  return ''
}

function findErrorPoints(entries: LogEntry[]): number[] {
  return entries
    .map((entry, index) => entry.status === 'failure' ? index : -1)
    .filter(i => i !== -1)
}

export interface AnalyzeOptions {
  posTypeHint?: string;
}

export function analyzeDiscrepancy(entries: LogEntry[], options?: AnalyzeOptions): AnalysisResult {
  const attempts = groupPaymentAttempts(entries)
  const generated = generateConclusion(attempts)
  const hasTerminalLog = entries.some(e => e.source === 'TERMINAL')

  let { conclusion } = generated
  if (!hasTerminalLog && entries.length > 0) {
    conclusion += '\n(단말기 로그 없이 포스 로그만으로 분석한 결과입니다. 정확한 VAN 승인 여부는 단말기 로그로 확인 필요.)'
  }

  return {
    posType: detectPosType(entries, options?.posTypeHint),
    terminal: detectTerminal(entries, options?.posTypeHint),
    discrepancyType: detectDiscrepancyType(entries),
    ptxId: findPtxId(entries),
    entries,
    errorPoints: findErrorPoints(entries),
    attempts,
    conclusion,
    actualApprovalCount: generated.actualApprovalCount,
    isDuplicatePaymentSuspected: generated.isDuplicatePaymentSuspected,
  }
}
