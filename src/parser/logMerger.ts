import type { LogEntry } from '../types'

/**
 * "HH:MM:SS" 또는 "HH:MM:SS.mmm" 형식을 ms 단위 정수로 변환.
 * 파싱 실패 시 매우 큰 값을 반환해 정렬 뒤쪽으로 밀어버린다.
 * (날짜 정보가 없으므로 자정 경계는 본질적으로 감지 불가 — 같은 날 기준 안정 정렬 보장이 목적)
 */
function timestampToMs(ts: string): number {
  const m = ts.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:[.,](\d{1,3}))?/)
  if (!m) return Number.MAX_SAFE_INTEGER
  const [, h, mm, s, msStr] = m
  const ms = msStr ? Number(msStr.padEnd(3, '0').slice(0, 3)) : 0
  return ((Number(h) * 60 + Number(mm)) * 60 + Number(s)) * 1000 + ms
}

export function mergeLogEntries(posEntries: LogEntry[], terminalEntries: LogEntry[]): LogEntry[] {
  const all = [...posEntries, ...terminalEntries]

  return all.sort((a, b) => {
    const diff = timestampToMs(a.timestamp) - timestampToMs(b.timestamp)
    if (diff !== 0) return diff
    if (a.source === 'POS' && b.source === 'TERMINAL') return -1
    if (a.source === 'TERMINAL' && b.source === 'POS') return 1
    return 0
  })
}
