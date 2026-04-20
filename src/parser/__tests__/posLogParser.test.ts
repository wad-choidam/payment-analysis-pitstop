import { describe, it, expect } from 'vitest'
import { parsePosLog } from '../posLogParser'

const SAMPLE_POS_LOG = `#{14:32:01} [전송] 승인 접속 시도
#{14:32:01} [수신] 단말기 접속 성공
#{14:32:02} [전송] 직전 거래 데이터 요청
#{14:32:03} [수신] 승인 전문 수신 - CPOS-6ecdadc1-bdf8-428e-b083-7b0136c2220d, 결제 성공
#{14:32:03} 중복결제 확인 결과 '승인금액 다름'
#{14:32:05} [전송] 카드 결제승인 요청 전문 전송 - CPOS-1b81a584-1c73-437d-ae69-1167036f71fd
#{14:32:15} [수신] 승인 중단 실패 (9991_결제 진행 중) 타이머 종료
#{14:32:18} 타이머 3초 미응답으로 접속 종료
#{14:32:19} [전송] 직전 거래 데이터 요청 (사용자취소 후 승인전문 수신)`

describe('parsePosLog', () => {
  it('parses entries from POS log text', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries.length).toBe(9)
  })

  it('extracts timestamps correctly', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[0].timestamp).toBe('14:32:01')
    expect(entries[5].timestamp).toBe('14:32:05')
  })

  it('sets source to POS for all entries', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    entries.forEach(e => expect(e.source).toBe('POS'))
  })

  it('detects connection request event', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[0].event).toBe('단말기 연결 요청')
    expect(entries[0].status).toBe('info')
  })

  it('detects connection success event', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[1].event).toBe('연결 성공')
    expect(entries[1].status).toBe('success')
  })

  it('detects previous transaction inquiry', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[2].event).toBe('직전거래 조회 요청')
  })

  it('extracts ptxId from approval response', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[3].ptxId).toBe('CPOS-6ecdadc1-bdf8-428e-b083-7b0136c2220d')
    expect(entries[3].status).toBe('success')
  })

  it('detects duplicate payment check', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[4].event).toContain('중복 결제')
    expect(entries[4].status).toBe('warning')
  })

  it('extracts ptxId from approval request', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[5].event).toBe('승인 요청')
    expect(entries[5].ptxId).toBe('CPOS-1b81a584-1c73-437d-ae69-1167036f71fd')
  })

  it('detects cancel failure', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[6].event).toContain('중단 실패')
    expect(entries[6].status).toBe('failure')
  })

  it('detects timer expiry', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[7].event).toBe('타이머 만료')
    expect(entries[7].status).toBe('failure')
  })

  it('returns empty array for empty input', () => {
    expect(parsePosLog('')).toEqual([])
  })
})
