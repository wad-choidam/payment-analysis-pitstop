import { describe, it, expect } from 'vitest'
import { parseAndroidExcelRows } from '../androidExcelParser'
import { SAMPLE_APOS_ROWS } from '../../data/sampleLogs'

describe('parseAndroidExcelRows', () => {
  it('returns empty array for empty rows', () => {
    expect(parseAndroidExcelRows([])).toEqual([])
  })

  it('maps data2 event names to normalized iOS-compatible events', () => {
    const entries = parseAndroidExcelRows([
      {
        eventDateTime: '2026-01-30T13:50:16.296192+09:00',
        data2: '카드 결제 승인 클릭',
        data3: 'APOS-abc',
        raw: '{"raw":{"data3":"APOS-abc","data2":"카드 결제 승인 클릭"}}',
      },
    ])
    expect(entries[0].event).toBe('승인 요청')
    expect(entries[0].ptxId).toBe('APOS-abc')
    expect(entries[0].source).toBe('POS')
  })

  it('classifies card data response resultCode=0000 as approval success', () => {
    const entries = parseAndroidExcelRows([
      {
        eventDateTime: '2026-01-30T13:50:22.861460+09:00',
        data2: '카드 데이터 응답',
        data3: 'APOS-abc',
        raw: '{"raw":{"data3":"APOS-abc","response":"{\\"resultCode\\":\\"0000\\",\\"resultMessage\\":\\"완료\\"}","data2":"카드 데이터 응답"}}',
      },
    ])
    expect(entries[0].event).toBe('승인 성공')
    expect(entries[0].status).toBe('success')
    expect(entries[0].resultCode).toBe('0000')
  })

  it('classifies card data response resultCode=9999 as 단말기 수신 불가', () => {
    const entries = parseAndroidExcelRows([
      {
        eventDateTime: '2026-01-30T13:50:52.287874+09:00',
        data2: '카드 데이터 응답',
        data3: 'NULL',
        raw: '{"raw":{"data3":"","response":"{\\"resultCode\\":\\"9999\\",\\"resultMessage\\":\\"단말기가 수신 가능한 상태가 아님\\"}","data2":"카드 데이터 응답"}}',
      },
    ])
    expect(entries[0].event).toBe('단말기 수신 불가 (9999)')
    expect(entries[0].status).toBe('failure')
    expect(entries[0].resultCode).toBe('9999')
    expect(entries[0].resultMessage).toBe('단말기가 수신 가능한 상태가 아님')
  })

  it('maps previous transaction events to 직전거래 events', () => {
    const entries = parseAndroidExcelRows([
      { eventDateTime: '2026-01-30T13:50:23.213462+09:00', data2: '이전 카드 데이터 클릭', data3: 'APOS-abc', raw: '{"raw":{"data3":"APOS-abc","data2":"이전 카드 데이터 클릭"}}' },
      { eventDateTime: '2026-01-30T13:50:23.328935+09:00', data2: '이전 카드 데이터 요청', data3: 'APOS-abc', raw: '{"raw":{"data3":"APOS-abc","data2":"이전 카드 데이터 요청"}}' },
      { eventDateTime: '2026-01-30T13:50:25.763074+09:00', data2: '이전 카드 데이터 응답', data3: 'APOS-xyz', raw: '{"raw":{"data3":"APOS-xyz","response":"{\\"resultCode\\":\\"0000\\",\\"resultMessage\\":\\"결제 성공\\"}","data2":"이전 카드 데이터 응답"}}' },
    ])
    expect(entries[0].event).toBe('직전거래 조회 클릭')
    expect(entries[1].event).toBe('직전거래 조회 요청')
    expect(entries[2].event).toBe('직전거래 응답 (성공)')
    expect(entries[2].ptxId).toBe('APOS-xyz')
  })

  it('formats timestamps as HH:MM:SS.mmm', () => {
    const entries = parseAndroidExcelRows([
      { eventDateTime: '2026-01-30T13:50:16.296192+09:00', data2: '카드 결제 승인 클릭', raw: '{"raw":{"data2":"카드 결제 승인 클릭"}}' },
    ])
    expect(entries[0].timestamp).toBe('13:50:16.296')
  })

  it('parses sample APOS rows into 11 entries with 2 approval requests', () => {
    const entries = parseAndroidExcelRows(SAMPLE_APOS_ROWS)
    expect(entries).toHaveLength(11)
    const approvalRequests = entries.filter(e => e.event === '승인 요청')
    expect(approvalRequests).toHaveLength(2)
  })
})
