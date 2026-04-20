import type { LogEntry } from '../types'

interface PatternRule {
  pattern: RegExp;
  event: string | ((match: RegExpMatchArray) => string);
  status: LogEntry['status'];
  ptxId?: (match: RegExpMatchArray) => string | undefined;
}

const RULES: PatternRule[] = [
  {
    pattern: /\[전송\] 승인 접속 시도/,
    event: '단말기 연결 요청',
    status: 'info',
  },
  {
    pattern: /\[수신\] 단말기 접속 성공/,
    event: '연결 성공',
    status: 'success',
  },
  {
    pattern: /\[전송\] 직전 거래 데이터 요청/,
    event: '직전거래 조회 요청',
    status: 'info',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - ([A-Z]POS-[0-9a-f-]+), 결제 성공/,
    event: '직전거래 응답 (성공)',
    status: 'success',
    ptxId: (m) => m[1],
  },
  {
    pattern: /중복결제 확인 결과/,
    event: (m) => `중복 결제 의심: ${m[0]}`,
    status: 'warning',
  },
  {
    pattern: /\[전송\] 카드 결제승인 요청 전문 전송 - ([A-Z]POS-[0-9a-f-]+)/,
    event: '승인 요청',
    status: 'info',
    ptxId: (m) => m[1],
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - .+성공/,
    event: '승인 성공',
    status: 'success',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - .+실패/,
    event: '승인 실패',
    status: 'failure',
  },
  {
    pattern: /\[수신\] 승인 중단 성공/,
    event: '중단 성공',
    status: 'success',
  },
  {
    pattern: /\[수신\] 승인 중단 실패\s*\(([^)]+)\)/,
    event: (m) => `중단 실패 (${m[1]})`,
    status: 'failure',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - , 사용자 취소/,
    event: '사용자 취소',
    status: 'warning',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - , 단말기가 수신 가능한 상태가 아님/,
    event: '단말기 수신 불가',
    status: 'failure',
  },
  {
    pattern: /타이머 3초 미응답으로 접속 종료/,
    event: '타이머 만료',
    status: 'failure',
  },
  {
    pattern: /\[전송\] 단말기 정상 승인 수신 응답 전송/,
    event: '승인 수신 확인 응답',
    status: 'success',
  },
]

const TIME_PATTERN = /#\{(\d{2}:\d{2}:\d{2})\}\s*(.*)/

export function parsePosLog(raw: string): LogEntry[] {
  if (!raw.trim()) return []

  const lines = raw.split('\n').filter(l => l.trim())
  const entries: LogEntry[] = []

  for (const line of lines) {
    const timeMatch = line.match(TIME_PATTERN)
    if (!timeMatch) continue

    const timestamp = timeMatch[1]
    const content = timeMatch[2]

    let matched = false
    for (const rule of RULES) {
      const m = content.match(rule.pattern)
      if (m) {
        const event = typeof rule.event === 'function' ? rule.event(m) : rule.event
        entries.push({
          timestamp,
          source: 'POS',
          event,
          rawLog: line.trim(),
          status: rule.status,
          ptxId: rule.ptxId?.(m),
        })
        matched = true
        break
      }
    }

    if (!matched) {
      entries.push({
        timestamp,
        source: 'POS',
        event: content.trim(),
        rawLog: line.trim(),
        status: 'info',
      })
    }
  }

  return entries
}
