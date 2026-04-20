import { describe, it, expect } from 'vitest'
import { analyzeDiscrepancy } from '../discrepancyAnalyzer'
import type { LogEntry } from '../../types'

describe('analyzeDiscrepancy', () => {
  it('detects CPOS type from ptxId', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:05', source: 'POS', event: '승인 요청', rawLog: '', status: 'info', ptxId: 'CPOS-abc-123' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.posType).toBe('CPOS')
    expect(result.ptxId).toBe('CPOS-abc-123')
  })

  it('detects BPOS type from ptxId', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:05', source: 'POS', event: '승인 요청', rawLog: '', status: 'info', ptxId: 'BPOS-def-456' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.posType).toBe('BPOS')
  })

  it('detects Eximbay terminal from log patterns', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:01', source: 'TERMINAL', event: '직전거래 조회 수신', rawLog: '<REQUEST>: [POS -> T650P]', status: 'info' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.terminal).toBe('Eximbay')
  })

  it('identifies error points', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:01', source: 'POS', event: '연결 성공', rawLog: '', status: 'success' },
      { timestamp: '14:32:05', source: 'POS', event: '타이머 만료', rawLog: '', status: 'failure' },
      { timestamp: '14:32:06', source: 'POS', event: '직전거래 조회 요청', rawLog: '', status: 'info' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.errorPoints).toEqual([1])
  })

  it('detects timer expiry discrepancy type', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:15', source: 'POS', event: '타이머 만료', rawLog: '', status: 'failure' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.discrepancyType).toBe('타이머 만료')
  })

  it('detects connection loss discrepancy type', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:15', source: 'POS', event: '중단 실패 (9991_결제 진행 중)', rawLog: '', status: 'failure' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.discrepancyType).toBe('연결 끊김')
  })

  it('detects charging dock discrepancy type', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:20', source: 'TERMINAL', event: '충전독 이벤트 (불일치 원인 가능)', rawLog: '', status: 'warning' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.discrepancyType).toBe('충전독 접촉')
  })

  it('returns UNKNOWN for no entries', () => {
    const result = analyzeDiscrepancy([])
    expect(result.posType).toBe('UNKNOWN')
    expect(result.terminal).toBe('UNKNOWN')
    expect(result.discrepancyType).toBe('알 수 없음')
  })
})
