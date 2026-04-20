import { describe, it, expect } from 'vitest'
import { parsePosLog } from '../posLogParser'

// 기존 형식 (#{HH:mm:ss})
const SAMPLE_POS_LOG = `#{14:32:01} [전송] 승인 접속 시도
#{14:32:01} [수신] 단말기 접속 성공
#{14:32:02} [전송] 직전 거래 데이터 요청
#{14:32:03} [수신] 승인 전문 수신 - CPOS-6ecdadc1-bdf8-428e-b083-7b0136c2220d, 결제 성공
#{14:32:03} 중복결제 확인 결과 '승인금액 다름'
#{14:32:05} [전송] 카드 결제승인 요청 전문 전송 - CPOS-1b81a584-1c73-437d-ae69-1167036f71fd
#{14:32:15} [수신] 승인 중단 실패 (9991_결제 진행 중) 타이머 종료
#{14:32:18} 타이머 3초 미응답으로 접속 종료
#{14:32:19} [전송] 직전 거래 데이터 요청 (사용자취소 후 승인전문 수신)`

// 실제 형식: #HH:mm:ss.SSS (2024-11-19 사용자 취소 케이스)
const REAL_POS_LOG_1119 = `#14:46:53.615 [전송] 승인 접속 시도
#14:46:54.059 [수신] 단말기 접속 성공
#14:46:54.061 [전송] 직전 거래 데이터 요청
#14:46:54.106 [수신] 승인 전문 수신 - CPOS-83923ff9-ec88-4f9c-9521-03a6ba5916a8, 결제 성공
#14:46:54.108 중복결제 확인 결과 '알고있는 승인내역'
#14:46:54.108 [전송] 카드 결제승인 요청 전문 전송 - CPOS-bb95670e-456b-46b4-bd6f-ca002b79d06c
#14:46:57.740 [수신] 승인 전문 수신 - , 사용자 취소
#14:46:57.740 승인 실패
#14:46:57.740 [전송] 단말기 접속 해제 시도
#14:46:57.741 [수신] 단말기 접속 해제
#14:46:57.741 최종결론: 사용자 취소`

// 2024-11-24: 타이머 만료 + 동기화 실패
const REAL_POS_LOG_1124 = `#01:49:56.908 [전송] 직전 거래 데이터 요청
#01:49:56.908 [시도] 타이머 설정 - 마지막승인요청
#01:49:56.908 [확인] 타이머 설정 - 마지막승인요청
#01:49:56.908 [동작] 타이머 설정 - 마지막승인요청
#01:49:59.696 [수신] 승인 전문 수신 - CPOS-cc6bb4e7-116a-414c-876e-7bb8100703b1, 결제 성공
#01:49:59.696 [전송] 카드 결제승인 요청 전문 전송 - CPOS-28ba84c8-2025-43af-9bfd-c9822ee51f75
#01:50:01.713 [동작] 타이머 마지막승인요청 - 3초 미응답
#01:50:01.713 마지막 승인데이터 요청에 대한 응답실패 - 접속 해제
#01:50:01.718 [전송] 승인정보 동기화 접속 시도
#01:50:02.772 승인정보 동기화 접속 성공 및 PtxID 비교 CPOS-28ba84c8-2025-43af-9bfd-c9822ee51f75 CPOS-cc6bb4e7-116a-414c-876e-7bb8100703b1
#01:50:02.772 승인정보 동기화 실패 (PtxID 불일치)
#01:50:02.773 최종결론: 실패(예외처리 - 응답없이 종료됨)`

// 2024-12-06: 단말기 수신 불가
const REAL_POS_LOG_1206 = `#00:04:06.965 [전송] 직전 거래 데이터 요청
#00:04:06.982 [수신] 승인 전문 수신 - CPOS-81400ce4-b71e-4b5f-94ef-a45d8d425beb, 결제 성공
#00:04:06.983 [전송] 카드 결제승인 요청 전문 전송 - CPOS-42ea48c1-46b3-417b-af6f-db80174622ee
#00:04:07.008 [수신] 승인 전문 수신 - , 단말기가 수신 가능한 상태가 아님
#00:04:07.009 최종결론: 단말기가 수신 가능한 상태가 아님`

describe('parsePosLog', () => {
  it('parses legacy format (#{HH:mm:ss})', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].timestamp).toBe('14:32:01')
  })

  it('parses real format (#HH:mm:ss.SSS)', () => {
    const entries = parsePosLog(REAL_POS_LOG_1119)
    expect(entries.length).toBeGreaterThan(5)
    expect(entries[0].timestamp).toBe('14:46:53')
  })

  it('sets source to POS', () => {
    parsePosLog(REAL_POS_LOG_1119).forEach(e => expect(e.source).toBe('POS'))
  })

  it('detects connection and approval flow', () => {
    const entries = parsePosLog(REAL_POS_LOG_1119)
    expect(entries[0].event).toBe('단말기 연결 요청')
    expect(entries[1].event).toBe('연결 성공')
    expect(entries.find(e => e.event === '직전거래 조회 요청')).toBeDefined()
  })

  it('extracts ptxId from responses and requests', () => {
    const entries = parsePosLog(REAL_POS_LOG_1119)
    expect(entries.find(e => e.event === '직전거래 응답 (성공)')?.ptxId).toBe('CPOS-83923ff9-ec88-4f9c-9521-03a6ba5916a8')
    expect(entries.find(e => e.event === '승인 요청')?.ptxId).toBe('CPOS-bb95670e-456b-46b4-bd6f-ca002b79d06c')
  })

  it('detects known approval as success', () => {
    const entry = parsePosLog(REAL_POS_LOG_1119).find(e => e.event.includes('알고있는 승인내역'))
    expect(entry?.status).toBe('success')
  })

  it('detects user cancel and disconnect', () => {
    const entries = parsePosLog(REAL_POS_LOG_1119)
    expect(entries.some(e => e.event === '사용자 취소')).toBe(true)
    expect(entries.some(e => e.event === '단말기 접속 해제 시도')).toBe(true)
    expect(entries.some(e => e.event === '단말기 접속 해제')).toBe(true)
  })

  it('detects final conclusion', () => {
    const entries = parsePosLog(REAL_POS_LOG_1119)
    expect(entries.some(e => e.event.includes('최종결론') && e.event.includes('사용자 취소'))).toBe(true)
  })

  it('detects timer expiry (1124 case)', () => {
    const entries = parsePosLog(REAL_POS_LOG_1124)
    expect(entries.some(e => e.event.includes('타이머 만료'))).toBe(true)
  })

  it('detects sync failure (1124 case)', () => {
    const entries = parsePosLog(REAL_POS_LOG_1124)
    expect(entries.some(e => e.event.includes('동기화 실패'))).toBe(true)
    expect(entries.some(e => e.event === '승인정보 동기화 접속 시도')).toBe(true)
  })

  it('detects terminal unavailable (1206 case)', () => {
    const entries = parsePosLog(REAL_POS_LOG_1206)
    expect(entries.some(e => e.event === '단말기 수신 불가')).toBe(true)
  })

  it('filters timer noise', () => {
    const entries = parsePosLog(REAL_POS_LOG_1124)
    expect(entries.filter(e => e.event.includes('타이머 설정')).length).toBe(0)
  })

  it('returns empty for empty input', () => {
    expect(parsePosLog('')).toEqual([])
  })
})
