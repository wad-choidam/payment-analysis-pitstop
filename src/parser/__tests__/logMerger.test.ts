import { describe, it, expect } from 'vitest'
import { mergeLogEntries } from '../logMerger'
import type { LogEntry } from '../../types'

describe('mergeLogEntries', () => {
  it('merges and sorts entries by timestamp', () => {
    const posEntries: LogEntry[] = [
      { timestamp: '14:32:01', source: 'POS', event: 'A', rawLog: '', status: 'info' },
      { timestamp: '14:32:05', source: 'POS', event: 'C', rawLog: '', status: 'info' },
    ]
    const terminalEntries: LogEntry[] = [
      { timestamp: '14:32:03', source: 'TERMINAL', event: 'B', rawLog: '', status: 'info' },
    ]
    const merged = mergeLogEntries(posEntries, terminalEntries)
    expect(merged.map(e => e.event)).toEqual(['A', 'B', 'C'])
  })

  it('handles empty arrays', () => {
    expect(mergeLogEntries([], [])).toEqual([])
  })

  it('preserves order for same timestamp (POS first)', () => {
    const pos: LogEntry[] = [
      { timestamp: '14:32:01', source: 'POS', event: 'POS event', rawLog: '', status: 'info' },
    ]
    const terminal: LogEntry[] = [
      { timestamp: '14:32:01', source: 'TERMINAL', event: 'Terminal event', rawLog: '', status: 'info' },
    ]
    const merged = mergeLogEntries(pos, terminal)
    expect(merged[0].source).toBe('POS')
    expect(merged[1].source).toBe('TERMINAL')
  })
})
