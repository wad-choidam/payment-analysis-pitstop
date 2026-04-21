import { describe, it, expect } from 'vitest'
import { parseAndroidExcelRows } from '../../parser/androidExcelParser'
import { analyzeDiscrepancy } from '../discrepancyAnalyzer'
import { SAMPLE_APOS_ROWS } from '../../data/sampleLogs'

describe('Android APOS end-to-end analyzer flow', () => {
  it('groups sample APOS rows into 2 attempts with 1 real approval', () => {
    const entries = parseAndroidExcelRows(SAMPLE_APOS_ROWS)
    const result = analyzeDiscrepancy(entries, { posTypeHint: 'APOS' })
    expect(result.posType).toBe('APOS')
    expect(result.terminal).toBe('Eximbay')
    expect(result.attempts).toHaveLength(2)
    expect(result.actualApprovalCount).toBe(1)
    expect(result.isDuplicatePaymentSuspected).toBe(false)
  })

  it('uses 승인 요청 event as boundary when no 단말기 연결 요청 exists (android)', () => {
    const entries = parseAndroidExcelRows(SAMPLE_APOS_ROWS)
    const result = analyzeDiscrepancy(entries, { posTypeHint: 'APOS' })
    const [first, second] = result.attempts ?? []
    expect(first.result).toBe('success')
    expect(first.resultDetail).toContain('승인 완료')
    expect(second.result).toBe('failure')
    expect(second.resultDetail).toContain('단말기 수신 불가')
  })

  it('does not count stale 직전거래 응답 (different ptxId) as approval success', () => {
    const entries = parseAndroidExcelRows(SAMPLE_APOS_ROWS)
    const result = analyzeDiscrepancy(entries, { posTypeHint: 'APOS' })
    const second = result.attempts?.[1]
    expect(second?.vanApprovalSuccess).toBe(false)
    expect(second?.posReceivedSuccess).toBe(false)
  })

  it('detects APOS- prefix to set posType', () => {
    const entries = parseAndroidExcelRows([
      { eventDateTime: '2026-01-30T13:50:16.296192+09:00', data2: '카드 결제 승인 클릭', data3: 'APOS-abc', raw: '{"raw":{"data3":"APOS-abc","data2":"카드 결제 승인 클릭"}}' },
    ])
    const result = analyzeDiscrepancy(entries)
    expect(result.posType).toBe('APOS')
  })
})
