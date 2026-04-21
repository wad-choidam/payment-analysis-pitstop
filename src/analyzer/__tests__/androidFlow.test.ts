import { describe, it, expect } from 'vitest'
import type { AndroidExcelRow } from '../../parser/androidExcelParser'
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

// ─── 회귀 테스트: Jira AOS 학습 결과 기반 ───

function makeRow(time: string, data2: string, data3: string, resultCode?: string, resultMessage?: string): AndroidExcelRow {
  const response = resultCode ? JSON.stringify({ resultCode, resultMessage: resultMessage ?? '', data: { ptxid: data3 !== '' ? data3 : undefined } }) : undefined
  return {
    eventDateTime: `2026-01-30T${time}+09:00`,
    data2,
    data3,
    raw: JSON.stringify({ raw: { data2, data3, response } }),
  }
}

describe('PLF-4727: 4회 시도 + ptxId 4개 boundary 판정', () => {
  const ptx1 = 'APOS-aaa-001'
  const ptx2 = 'APOS-aaa-002'
  const ptx3 = 'APOS-aaa-003'
  const ptx4 = 'APOS-aaa-004'

  const rows: AndroidExcelRow[] = [
    // 1차: 승인 성공
    makeRow('10:00:00.000', '카드 결제 승인 클릭', ptx1),
    makeRow('10:00:01.000', '카드 데이터 응답', ptx1, '0000'),
    // 2차: 단말기 수신 불가
    makeRow('10:01:00.000', '카드 결제 승인 클릭', ptx2),
    makeRow('10:01:01.000', '카드 데이터 응답', ptx2, '9999', '단말기가 수신 가능한 상태가 아닙니다'),
    // 3차: 사용자 취소
    makeRow('10:02:00.000', '카드 결제 승인 클릭', ptx3),
    makeRow('10:02:01.000', '카드 데이터 응답', ptx3, '1001', '사용자 취소'),
    // 4차: 승인 성공
    makeRow('10:03:00.000', '카드 결제 승인 클릭', ptx4),
    makeRow('10:03:01.000', '카드 데이터 응답', ptx4, '0000'),
  ]

  it('groups into 4 attempts with 2 actual approvals', () => {
    const entries = parseAndroidExcelRows(rows)
    const result = analyzeDiscrepancy(entries, { posTypeHint: 'APOS' })
    expect(result.attempts).toHaveLength(4)
    expect(result.actualApprovalCount).toBe(2)
  })
})

describe('PLF-5663: 취소 개입 후 이전카드응답 복원', () => {
  const ptx = 'APOS-bbb-001'

  const rows: AndroidExcelRow[] = [
    // 1차 시도: 승인 요청
    makeRow('11:00:00.000', '카드 결제 승인 클릭', ptx),
    // 취소 시도 → 단말기 수신 불가(9999)
    makeRow('11:00:02.000', '카드 취소 클릭', ptx),
    makeRow('11:00:03.000', '카드 취소 데이터 응답', ptx, '9999', '단말기가 수신 가능한 상태가 아닙니다'),
    // 이전 카드 데이터로 승인 성공 확인
    makeRow('11:00:04.000', '이전 카드 데이터 클릭', ptx),
    makeRow('11:00:05.000', '이전 카드 데이터 응답', ptx, '0000'),
  ]

  it('maps cancel events and still counts 1 approval from previous response', () => {
    const entries = parseAndroidExcelRows(rows)
    // 취소 이벤트가 올바르게 매핑되었는지 확인
    const cancelReq = entries.find(e => e.event === '취소 요청')
    expect(cancelReq).toBeDefined()
    expect(cancelReq?.status).toBe('warning')

    const cancelRes = entries.find(e => e.event.includes('취소 실패'))
    expect(cancelRes).toBeDefined()
    expect(cancelRes?.status).toBe('failure')

    const result = analyzeDiscrepancy(entries, { posTypeHint: 'APOS' })
    expect(result.actualApprovalCount).toBe(1)
  })
})

describe('PLF-5530: 1건에 2개 독립 결제 (ptxId 다름, 모두 승인)', () => {
  const ptxA = 'APOS-ccc-001'
  const ptxB = 'APOS-ccc-002'

  const rows: AndroidExcelRow[] = [
    // 결제 A: 승인 성공
    makeRow('12:00:00.000', '카드 결제 승인 클릭', ptxA),
    makeRow('12:00:01.000', '카드 데이터 응답', ptxA, '0000'),
    // 결제 B: 승인 성공 (다른 ptxId)
    makeRow('12:01:00.000', '카드 결제 승인 클릭', ptxB),
    makeRow('12:01:01.000', '카드 데이터 응답', ptxB, '0000'),
  ]

  it('counts 2 actual approvals from independent payments', () => {
    const entries = parseAndroidExcelRows(rows)
    const result = analyzeDiscrepancy(entries, { posTypeHint: 'APOS' })
    expect(result.attempts).toHaveLength(2)
    expect(result.actualApprovalCount).toBe(2)
  })
})
