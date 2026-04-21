import { describe, it, expect } from 'vitest'
import { parsePosLog } from '../../parser/posLogParser'
import { parseTerminalLog } from '../../parser/terminalLogParser'
import { mergeLogEntries } from '../../parser/logMerger'
import { analyzeDiscrepancy } from '../discrepancyAnalyzer'

// ─── 회귀 테스트: Jira iOS (BPOS/CPOS) 학습 결과 기반 ───

describe('PLF-4507: 3회 시도 (취소 → 9999 → 자체 영수증 성공)', () => {
  const ptx1 = 'BPOS-aaa-1111-1111-111111111111'
  const ptx2 = 'BPOS-aaa-2222-2222-222222222222'
  const ptx3 = 'BPOS-aaa-3333-3333-333333333333'

  const posLog = [
    // 1차 시도: 연결 → 카드 리딩 취소 → 접속 해제
    `#12:05:40.510 [전송] 승인 접속 시도`,
    `#12:05:40.866 [수신] 단말기 접속 성공`,
    `#12:05:40.890 [전송] 직전 거래 데이터 요청`,
    `#12:05:40.996 [수신] 승인 전문 수신 - ${ptx1}, 결제 성공`,
    `#12:05:40.998 [전송] 카드 결제승인 요청 전문 전송 - ${ptx1}`,
    `#12:05:45.009 승인 중단 요청`,
    `#12:05:45.009 [전송] 승인 중단 요청 전문 전송`,
    `#12:05:45.690 [수신] 승인 중단 성공`,
    // 2차 시도: 연결 → 9999 응답
    `#12:06:14.596 [전송] 승인 접속 시도`,
    `#12:06:14.800 [수신] 단말기 접속 성공`,
    `#12:06:14.850 [전송] 직전 거래 데이터 요청`,
    `#12:06:14.900 [수신] 승인 전문 수신 - ${ptx1}, 결제 성공`,
    `#12:06:15.000 [전송] 카드 결제승인 요청 전문 전송 - ${ptx2}`,
    `#12:06:15.500 [수신] 승인 전문 수신 - , 단말기가 수신 가능한 상태가 아님`,
    // 3차 시도: 연결 → 결제 성공
    `#12:07:06.780 [전송] 승인 접속 시도`,
    `#12:07:06.900 [수신] 단말기 접속 성공`,
    `#12:07:06.950 [전송] 직전 거래 데이터 요청`,
    `#12:07:07.000 [수신] 승인 전문 수신 - ${ptx2}, 결제 성공`,
    `#12:07:07.100 [전송] 카드 결제승인 요청 전문 전송 - ${ptx3}`,
    `#12:07:10.200 [수신] 승인 전문 수신 - ${ptx3}, 결제 성공`,
  ].join('\n')

  it('groups into 3 attempts with 1 actual approval', () => {
    const posEntries = parsePosLog(posLog)
    const result = analyzeDiscrepancy(posEntries)
    expect(result.posType).toBe('BPOS')
    expect(result.attempts).toHaveLength(3)
    expect(result.actualApprovalCount).toBe(1)
    expect(result.isDuplicatePaymentSuspected).toBe(false)
  })

  it('first attempt result is cancelled', () => {
    const posEntries = parsePosLog(posLog)
    const result = analyzeDiscrepancy(posEntries)
    expect(result.attempts?.[0].result).toBe('cancelled')
  })

  it('second attempt result is failure (9999)', () => {
    const posEntries = parsePosLog(posLog)
    const result = analyzeDiscrepancy(posEntries)
    expect(result.attempts?.[1].result).toBe('failure')
    expect(result.attempts?.[1].resultDetail).toContain('단말기 수신 불가')
  })
})

describe('PLF-5083: CX06 삼성페이 반복 실패 → 승인 0건', () => {
  // 단말기 로그만으로 분석 (POS 로그 + 단말기 로그)
  const ptx = 'BPOS-bbb-1111-1111-111111111111'

  const terminalLog = [
    // 1차 시도: CX06 → 카드 리딩 취소
    `2025-11-23 21:19:02:100 AgentSocketServer: CLIENT IP/192.168.0.14`,
    `2025-11-23 21:19:02:200 <REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)`,
    `2025-11-23 21:19:03:100 <REQUEST>: [POS -> T650P] CARD_APPROVAL`,
    `2025-11-23 21:19:03:200 [CARD_APPROVAL] ${ptx}`,
    `2025-11-23 21:19:04:000 CardReaderPresenter: [REQUEST] ICC CARD READ | CT_CTLS`,
    `2025-11-23 21:19:05:000 CardReaderPresenter: [!] FAIL | ICC CARD READ | code: CX06`,
    `2025-11-23 21:19:05:500 CardReaderPresenter: [REQUEST] MSR CARD READ`,
    `2025-11-23 21:19:06:000 CardReaderPresenter: [OK] MSR CARD READ`,
    `2025-11-23 21:19:07:000 AgentController: command: AGENT_CARD_READING_CANCEL`,
    `2025-11-23 21:19:07:100 <RESPONSE>: [T650P -> POS] res: 9999`,
    // 2차 시도: CX06 → 카드 리딩 취소
    `2025-11-23 21:19:10:000 AgentSocketServer: CLIENT IP/192.168.0.14`,
    `2025-11-23 21:19:10:100 <REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)`,
    `2025-11-23 21:19:11:000 <REQUEST>: [POS -> T650P] CARD_APPROVAL`,
    `2025-11-23 21:19:11:100 [CARD_APPROVAL] ${ptx}`,
    `2025-11-23 21:19:12:000 CardReaderPresenter: [REQUEST] ICC CARD READ | CT_CTLS`,
    `2025-11-23 21:19:13:000 CardReaderPresenter: [!] FAIL | ICC CARD READ | code: CX06`,
    `2025-11-23 21:19:13:500 CardReaderPresenter: [REQUEST] MSR CARD READ`,
    `2025-11-23 21:19:14:000 CardReaderPresenter: [OK] MSR CARD READ`,
    `2025-11-23 21:19:15:000 AgentController: command: AGENT_CARD_READING_CANCEL`,
    `2025-11-23 21:19:15:100 <RESPONSE>: [T650P -> POS] res: 9999`,
  ].join('\n')

  const posLog = [
    `#21:19:02.000 [전송] 승인 접속 시도`,
    `#21:19:02.100 [수신] 단말기 접속 성공`,
    `#21:19:02.200 [전송] 직전 거래 데이터 요청`,
    `#21:19:03.000 [전송] 카드 결제승인 요청 전문 전송 - ${ptx}`,
    `#21:19:07.000 [수신] 승인 전문 수신 - , 단말기가 수신 가능한 상태가 아님`,
    `#21:19:10.000 [전송] 승인 접속 시도`,
    `#21:19:10.100 [수신] 단말기 접속 성공`,
    `#21:19:10.200 [전송] 직전 거래 데이터 요청`,
    `#21:19:11.000 [전송] 카드 결제승인 요청 전문 전송 - ${ptx}`,
    `#21:19:15.000 [수신] 승인 전문 수신 - , 단말기가 수신 가능한 상태가 아님`,
  ].join('\n')

  it('detects CX06 failures and counts 0 approvals', () => {
    const posEntries = parsePosLog(posLog)
    const terminalEntries = parseTerminalLog(terminalLog)
    const merged = mergeLogEntries(posEntries, terminalEntries)
    const result = analyzeDiscrepancy(merged)

    expect(result.posType).toBe('BPOS')
    expect(result.terminal).toBe('Eximbay')
    // POS + Terminal 양쪽 boundary (단말기 연결 요청 + POS 연결 요청 수신)가 각각 경계를 만들 수 있음
    expect(result.attempts!.length).toBeGreaterThanOrEqual(2)
    expect(result.actualApprovalCount).toBe(0)
    expect(result.isDuplicatePaymentSuspected).toBe(false)
  })

  it('detects CX06 IC card read failures in terminal entries', () => {
    const terminalEntries = parseTerminalLog(terminalLog)
    const cx06Events = terminalEntries.filter(e => e.event.includes('IC카드 리딩 실패'))
    expect(cx06Events).toHaveLength(2)
    expect(cx06Events[0].status).toBe('warning')
  })
})

describe('PLF-4337: 타임아웃 → 성공 → 다른 ptxId 연속 결제', () => {
  const ptx1 = 'BPOS-ccc-1111-1111-111111111111'
  const ptx2 = 'BPOS-ccc-2222-2222-222222222222'
  const ptx3 = 'BPOS-ccc-3333-3333-333333333333'

  const posLog = [
    // 1차 시도: 접속 타임아웃
    `#12:41:20.000 [전송] 승인 접속 시도`,
    `#12:41:30.000 최종결론: 접속 실패`,
    // 2차 시도: 결제 성공
    `#12:41:34.000 [전송] 승인 접속 시도`,
    `#12:41:34.200 [수신] 단말기 접속 성공`,
    `#12:41:34.300 [전송] 직전 거래 데이터 요청`,
    `#12:41:34.400 [수신] 승인 전문 수신 - ${ptx1}, 결제 성공`,
    `#12:41:34.500 [전송] 카드 결제승인 요청 전문 전송 - ${ptx2}`,
    `#12:41:36.000 [수신] 승인 전문 수신 - ${ptx2}, 결제 성공`,
    // 3차 시도: 다른 ptxId로 결제 요청 → 취소 실패
    `#12:41:38.000 [전송] 승인 접속 시도`,
    `#12:41:38.200 [수신] 단말기 접속 성공`,
    `#12:41:38.300 [전송] 직전 거래 데이터 요청`,
    `#12:41:38.400 중복결제 확인 결과 '승인금액 다름'`,
    `#12:41:38.500 [전송] 카드 결제승인 요청 전문 전송 - ${ptx3}`,
    `#12:41:48.000 승인 중단 요청`,
    `#12:41:48.100 [전송] 승인 중단 요청 전문 전송`,
    `#12:41:49.000 승인 중단 요청 실패 - 이전요청에 대한 응답 대기중`,
    `#12:41:50.000 [수신] 단말기 접속 해제`,
  ].join('\n')

  it('groups into 3 attempts with 1 actual approval', () => {
    const posEntries = parsePosLog(posLog)
    const result = analyzeDiscrepancy(posEntries)
    expect(result.posType).toBe('BPOS')
    expect(result.attempts).toHaveLength(3)
    expect(result.actualApprovalCount).toBe(1)
    expect(result.isDuplicatePaymentSuspected).toBe(false)
  })

  it('first attempt unknown (접속 실패), second succeeds, third is failure (중단 실패)', () => {
    const posEntries = parsePosLog(posLog)
    const result = analyzeDiscrepancy(posEntries)
    const [first, second, third] = result.attempts ?? []
    // 1차: 최종결론(info)만 있고 failure status 없음 → unknown
    expect(first.result).toBe('unknown')
    expect(second.result).toBe('success')
    expect(second.resultDetail).toContain('승인 완료')
    // 3차: 승인 중단 실패(failure status) → failure
    expect(third.result).toBe('failure')
  })

  it('detects 승인금액 다름 event for duplicate check bypass', () => {
    const posEntries = parsePosLog(posLog)
    const amountDiffEvent = posEntries.find(e => e.event.includes('승인금액 다름'))
    expect(amountDiffEvent).toBeDefined()
  })
})
