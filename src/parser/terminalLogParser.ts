import type { LogEntry } from '../types'

interface TerminalRule {
  pattern: RegExp;
  event: string | ((match: RegExpMatchArray) => string);
  status: LogEntry['status'];
  ptxId?: (match: RegExpMatchArray) => string | undefined;
}

const RULES: TerminalRule[] = [
  {
    pattern: /AgentSocketServer: CLIENT IP\/([\d.]+)/,
    event: (m) => `POS 연결 요청 수신 (${m[1]})`,
    status: 'info',
  },
  {
    pattern: /<REQUEST>: \[POS -> T650P\] INQUIRY_LATEST_TRANSACTION\(990001\)/,
    event: '직전거래 조회 수신',
    status: 'info',
  },
  {
    pattern: /\[POS -> T650P\]: \[CARD_APPROVAL\] ([A-Z]POS-[0-9a-f-]+)/,
    event: '승인 요청 수신',
    status: 'info',
    ptxId: (m) => m[1],
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: CARD_APPROVAL\(\d+\) \| res: 0000/,
    event: '승인 성공 응답',
    status: 'success',
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: CARD_APPROVAL\(\d+\) \| res: 9999/,
    event: '단말기 수신 불가 응답',
    status: 'failure',
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: .*\| res: (\d{4})/,
    event: (m) => `승인 실패 응답 (${m[1]})`,
    status: 'failure',
  },
  {
    pattern: /ChargingStatusReceiver/,
    event: '충전독 이벤트 (불일치 원인 가능)',
    status: 'warning',
  },
]

const TIME_PATTERN = /(\d{4}-\d{2}-\d{2}\s+)?(\d{2}:\d{2}:\d{2})[\d.]*\s+(.*)/

export function parseTerminalLog(raw: string): LogEntry[] {
  if (!raw.trim()) return []

  const lines = raw.split('\n').filter(l => l.trim())
  const entries: LogEntry[] = []

  for (const line of lines) {
    const timeMatch = line.match(TIME_PATTERN)
    if (!timeMatch) continue

    const timestamp = timeMatch[2]
    const content = timeMatch[3]

    let matched = false
    for (const rule of RULES) {
      const m = content.match(rule.pattern)
      if (m) {
        const event = typeof rule.event === 'function' ? rule.event(m) : rule.event
        entries.push({
          timestamp,
          source: 'TERMINAL',
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
        source: 'TERMINAL',
        event: content.trim(),
        rawLog: line.trim(),
        status: 'info',
      })
    }
  }

  return entries
}
