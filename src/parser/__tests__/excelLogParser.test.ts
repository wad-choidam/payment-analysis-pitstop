import { describe, it, expect } from 'vitest'
import { extractPosLogFromExcel, isExcelFile } from '../excelLogParser'
import { utils, write } from 'xlsx'

function createTestExcel(rows: Record<string, string>[]): ArrayBuffer {
  const ws = utils.json_to_sheet(rows)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, '이벤트 로그')
  return write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('extractPosLogFromExcel', () => {
  it('extracts detailLog from raw JSON column', () => {
    const rows = [
      {
        regDateTime: '2026-03-08T18:19:40',
        eventName: 'CAT_SYNC',
        raw: JSON.stringify({
          raw: {
            detailLog: '#18:19:30.039 [전송] 승인 접속 시도#18:19:30.095 [수신] 단말기 접속 성공',
          },
        }),
      },
    ]
    const buffer = createTestExcel(rows)
    const result = extractPosLogFromExcel(buffer)
    expect(result.posLog).toContain('[전송] 승인 접속 시도')
    expect(result.posLog).toContain('[수신] 단말기 접속 성공')
  })

  it('concatenates multiple rows', () => {
    const rows = [
      { raw: JSON.stringify({ raw: { detailLog: '#18:19:30.039 [전송] 승인 접속 시도' } }) },
      { raw: JSON.stringify({ raw: { detailLog: '#18:19:43.407 [전송] 승인 접속 시도' } }) },
    ]
    const buffer = createTestExcel(rows)
    const result = extractPosLogFromExcel(buffer)
    expect(result.posLog).toContain('18:19:30')
    expect(result.posLog).toContain('18:19:43')
  })

  it('returns empty for empty workbook', () => {
    const buffer = createTestExcel([])
    const result = extractPosLogFromExcel(buffer)
    expect(result.posLog).toBe('')
  })

  it('skips rows with invalid JSON in raw column', () => {
    const rows = [
      { raw: 'not-json' },
      { raw: JSON.stringify({ raw: { detailLog: '#12:00:00.000 [전송] 승인 접속 시도' } }) },
    ]
    const buffer = createTestExcel(rows)
    const result = extractPosLogFromExcel(buffer)
    expect(result.posLog).toContain('승인 접속 시도')
  })

  it('extracts serviceType from rows', () => {
    const rows = [
      {
        serviceType: 'BPOS',
        raw: JSON.stringify({ raw: { detailLog: '#19:55:34.143 [전송] 승인 접속 시도' } }),
      },
    ]
    const buffer = createTestExcel(rows)
    const result = extractPosLogFromExcel(buffer)
    expect(result.serviceType).toBe('BPOS')
  })
})

describe('isExcelFile', () => {
  it('recognizes .xlsx files', () => {
    expect(isExcelFile(new File([], 'test.xlsx'))).toBe(true)
  })

  it('recognizes .xls files', () => {
    expect(isExcelFile(new File([], 'test.xls'))).toBe(true)
  })

  it('rejects .txt files', () => {
    expect(isExcelFile(new File([], 'log.txt'))).toBe(false)
  })
})
