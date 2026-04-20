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
    expect(analyzeDiscrepancy(entries).posType).toBe('BPOS')
  })

  it('detects Eximbay terminal', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:01', source: 'TERMINAL', event: '직전거래 조회 수신', rawLog: '<REQUEST>: [POS -> T650P]', status: 'info' },
    ]
    expect(analyzeDiscrepancy(entries).terminal).toBe('Eximbay')
  })

  it('identifies error points', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:01', source: 'POS', event: '연결 성공', rawLog: '', status: 'success' },
      { timestamp: '14:32:05', source: 'POS', event: '타이머 만료', rawLog: '', status: 'failure' },
      { timestamp: '14:32:06', source: 'POS', event: '직전거래 조회 요청', rawLog: '', status: 'info' },
    ]
    expect(analyzeDiscrepancy(entries).errorPoints).toEqual([1])
  })

  it('detects timer expiry', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:15', source: 'POS', event: '타이머 만료', rawLog: '', status: 'failure' },
    ]
    expect(analyzeDiscrepancy(entries).discrepancyType).toBe('타이머 만료')
  })

  it('detects connection loss (cancel failure)', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:15', source: 'POS', event: '승인 중단 실패 (응답 대기중)', rawLog: '', status: 'failure' },
    ]
    expect(analyzeDiscrepancy(entries).discrepancyType).toContain('연결 끊김')
  })

  it('detects terminal unavailable (9999)', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:15', source: 'POS', event: '단말기 수신 불가', rawLog: '', status: 'failure' },
    ]
    expect(analyzeDiscrepancy(entries).discrepancyType).toContain('단말기 수신 불가')
  })

  it('detects charging dock disconnection', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:20', source: 'TERMINAL', event: '충전독 분리 (불일치 원인 가능)', rawLog: '', status: 'warning' },
    ]
    expect(analyzeDiscrepancy(entries).discrepancyType).toBe('충전독 분리')
  })

  it('detects sync failure (PtxID mismatch)', () => {
    const entries: LogEntry[] = [
      { timestamp: '01:50:02', source: 'POS', event: '승인정보 동기화 실패 (PtxID 불일치)', rawLog: '', status: 'failure' },
    ]
    expect(analyzeDiscrepancy(entries).discrepancyType).toContain('동기화 실패')
  })

  it('detects EOT ABNORMAL', () => {
    const entries: LogEntry[] = [
      { timestamp: '07:58:58', source: 'TERMINAL', event: 'EOT 비정상 종료 (결제 불일치 가능)', rawLog: '', status: 'failure' },
    ]
    expect(analyzeDiscrepancy(entries).discrepancyType).toContain('EOT 비정상')
  })

  it('detects transaction skipped', () => {
    const entries: LogEntry[] = [
      { timestamp: '00:04:06', source: 'TERMINAL', event: '트랜잭션 스킵 (단말기 사용 불가)', rawLog: '', status: 'failure' },
    ]
    expect(analyzeDiscrepancy(entries).discrepancyType).toBe('단말기 사용 불가')
  })

  it('prefers approval request ptxId over previous tx ptxId', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:03', source: 'POS', event: '직전거래 응답 (성공)', rawLog: '', status: 'success', ptxId: 'CPOS-old-111' },
      { timestamp: '14:32:05', source: 'POS', event: '승인 요청', rawLog: '', status: 'info', ptxId: 'CPOS-new-222' },
    ]
    expect(analyzeDiscrepancy(entries).ptxId).toBe('CPOS-new-222')
  })

  it('extracts discrepancy from final conclusion', () => {
    const entries: LogEntry[] = [
      { timestamp: '15:27:37', source: 'POS', event: '최종결론: 실패(사용자 취소)', rawLog: '', status: 'info' },
    ]
    expect(analyzeDiscrepancy(entries).discrepancyType).toBe('사용자 취소')
  })

  it('returns UNKNOWN for no entries', () => {
    const result = analyzeDiscrepancy([])
    expect(result.posType).toBe('UNKNOWN')
    expect(result.terminal).toBe('UNKNOWN')
    expect(result.discrepancyType).toBe('알 수 없음')
  })
})
