import type { LogEntry } from '../types'

export function mergeLogEntries(posEntries: LogEntry[], terminalEntries: LogEntry[]): LogEntry[] {
  const all = [...posEntries, ...terminalEntries]

  return all.sort((a, b) => {
    const cmp = a.timestamp.localeCompare(b.timestamp)
    if (cmp !== 0) return cmp
    if (a.source === 'POS' && b.source === 'TERMINAL') return -1
    if (a.source === 'TERMINAL' && b.source === 'POS') return 1
    return 0
  })
}
