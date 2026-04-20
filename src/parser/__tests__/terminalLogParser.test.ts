import { describe, it, expect } from 'vitest'
import { parseTerminalLog } from '../terminalLogParser'

const SAMPLE_TERMINAL_LOG = `2024-05-15 14:32:01.123 AgentSocketServer: CLIENT IP/192.168.123.112
2024-05-15 14:32:02.456 <REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)
2024-05-15 14:32:05.789 [POS -> T650P]: [CARD_APPROVAL] CPOS-1b81a584-1c73-437d-ae69-1167036f71fd
2024-05-15 14:32:15.012 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 0000
2024-05-15 14:32:20.345 ChargingStatusReceiver: charging dock connected`

// 실제 로그 (2024-11-19 케이스, [version] prefix 포함)
const REAL_TERMINAL_LOG = `[1.0.127] 2024-11-19 14:46:53:903 AgentSocketServer: CLIENT IP/192.168.0.14
[1.0.127] 2024-11-19 14:46:53:907 <REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)
[1.0.127] 2024-11-19 14:46:53:948 <REQUEST>: [POS -> T650P] CARD_APPROVAL(010010)
[1.0.127] 2024-11-19 14:46:53:953 [POS -> T650P]:
============================================================
[CARD_APPROVAL] CPOS-bb95670e-456b-46b4-bd6f-ca002b79d06c
============================================================
[1.0.127] 2024-11-19 14:46:54:022 CardReaderActivity: onCreate
[1.0.127] 2024-11-19 14:46:54:433 CardReaderPresenter: READ START | mode: CT_CTLS
[1.0.127] 2024-11-19 14:46:57:520 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 9999
[1.0.127] 2024-11-19 14:46:58:495 <REQUEST>: [T650P -> VAN] CARD_APPROVAL
[1.0.127] 2024-11-19 14:46:58:871 <RESPONSE>: [VAN -> T650P] CARD_APPROVAL
[1.0.127] 2024-11-19 14:46:58:871 CardController: [*] CARD PAYMENT | ptxid: CPOS-bb95670e-456b-46b4-bd6f-ca002b79d06c
[1.0.127] 2024-11-19 14:46:58:872 CardController: CARD PAYMENT COMPLETE
[1.0.127] 2024-11-19 14:46:59:082 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 0000
[1.0.127] 2024-11-19 14:46:59:095 ResultActivity: onResume`

// 2024-12-02: 충전독 분리 + EOT 비정상
const REAL_TERMINAL_LOG_1202 = `[1.0.127] 2024-12-02 07:58:49:172 AgentSocketServer: CLIENT IP/192.168.0.11
[1.0.127] 2024-12-02 07:58:49:181 <REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)
[1.0.127] 2024-12-02 07:58:49:461 ChargingStatusReceiver: ACTION_POWER_DISCONNECTED
[1.0.127] 2024-12-02 07:58:52:260 <REQUEST>: [POS -> T650P] CARD_APPROVAL(010010)
[1.0.127] 2024-12-02 07:58:55:046 <REQUEST>: [T650P -> VAN] CARD_APPROVAL
[1.0.127] 2024-12-02 07:58:55:872 <RESPONSE>: [VAN -> T650P] CARD_APPROVAL
[1.0.127] 2024-12-02 07:58:56:064 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 0000
[1.0.127] 2024-12-02 07:58:56:396 CatchPosAPI::[Success] Upload Transaction:  req: 010010 | res: 010010
[1.0.127] 2024-12-02 07:58:58:076 ResultActivity: [!] EOT ABNORMAL | Print itself`

// 2024-12-06: 트랜잭션 스킵
const REAL_TERMINAL_LOG_1206 = `[1.0.127] 2024-12-06 00:04:06:621 AgentSocketServer: CLIENT IP/192.168.123.193
[1.0.127] 2024-12-06 00:04:06:624 <REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)
[1.0.127] 2024-12-06 00:04:06:643 <REQUEST>: [POS -> T650P] CARD_APPROVAL(010010)
[1.0.127] 2024-12-06 00:04:06:661 AgentController: [*] [CARD_APPROVAL] Transaction Skipped! NOT AVAILABLE
[1.0.127] 2024-12-06 00:04:06:656 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 9999`

describe('parseTerminalLog', () => {
  it('parses basic format', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].timestamp).toBe('14:32:01')
    expect(entries[0].event).toContain('POS 연결 요청')
  })

  it('parses real format with [version] prefix', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG)
    expect(entries.length).toBeGreaterThan(5)
    expect(entries[0].timestamp).toBe('14:46:53')
  })

  it('sets source to TERMINAL', () => {
    parseTerminalLog(REAL_TERMINAL_LOG).forEach(e => expect(e.source).toBe('TERMINAL'))
  })

  it('detects POS connection', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG)
    expect(entries[0].event).toContain('POS 연결 요청 수신')
  })

  it('extracts ptxId from CARD_APPROVAL block', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG)
    const approval = entries.find(e => e.event === '카드 승인 요청 수신')
    expect(approval?.ptxId).toBe('CPOS-bb95670e-456b-46b4-bd6f-ca002b79d06c')
  })

  it('detects 9999 response', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG)
    const unavailable = entries.find(e => e.event.includes('수신 불가'))
    expect(unavailable?.status).toBe('failure')
  })

  it('detects VAN communication', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG)
    expect(entries.some(e => e.event === 'VAN사에 승인 요청')).toBe(true)
    expect(entries.some(e => e.event === 'VAN사 승인 응답')).toBe(true)
  })

  it('detects card payment with ptxId', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG)
    const payment = entries.find(e => e.event === '카드 결제 처리')
    expect(payment?.ptxId).toBe('CPOS-bb95670e-456b-46b4-bd6f-ca002b79d06c')
  })

  it('detects 0000 success response', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG)
    expect(entries.some(e => e.event === '승인 성공 응답')).toBe(true)
  })

  it('detects charging dock disconnect (1202 case)', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG_1202)
    expect(entries.some(e => e.event.includes('충전독 분리'))).toBe(true)
  })

  it('detects EOT ABNORMAL (1202 case)', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG_1202)
    const eot = entries.find(e => e.event.includes('EOT 비정상'))
    expect(eot?.status).toBe('failure')
  })

  it('detects upload success (1202 case)', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG_1202)
    expect(entries.some(e => e.event.includes('업로드 성공'))).toBe(true)
  })

  it('detects transaction skipped (1206 case)', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG_1206)
    const skipped = entries.find(e => e.event.includes('트랜잭션 스킵'))
    expect(skipped?.status).toBe('failure')
  })

  it('filters noise logs (Activity lifecycle, etc.)', () => {
    const entries = parseTerminalLog(REAL_TERMINAL_LOG)
    expect(entries.every(e => !e.event.includes('onCreate'))).toBe(true)
    expect(entries.every(e => !e.event.includes('onResume'))).toBe(true)
  })

  it('returns empty for empty input', () => {
    expect(parseTerminalLog('')).toEqual([])
  })

  it('detects IC card reading failure (CX01/CX06)', () => {
    const log = `[1.0.127] 2025-09-28 14:29:50:100 CardReaderPresenter: [!] FAIL | ICC CARD READ | code: CX06
[1.0.127] 2025-09-28 14:29:50:200 CardReaderPresenter: [!] FAIL | ICC CARD READ | code: CX01`
    const entries = parseTerminalLog(log)
    expect(entries).toHaveLength(2)
    expect(entries[0].event).toBe('IC카드 리딩 실패 (CX06)')
    expect(entries[0].status).toBe('warning')
    expect(entries[1].event).toBe('IC카드 리딩 실패 (CX01)')
  })

  it('detects printer error (9959)', () => {
    const log = `[1.0.127] 2025-09-24 19:25:10:000 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 9959`
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('프린터 오류 (9959)')
    expect(entries[0].status).toBe('warning')
  })

  it('detects force cancel timeout (9989)', () => {
    const log = `[1.0.127] 2025-12-15 17:20:08:000 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 9989`
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('강제 취소 타임아웃 (9989)')
    expect(entries[0].status).toBe('failure')
  })

  it('detects SocketTimeoutException', () => {
    const log = `[1.0.127] 2025-12-15 17:20:02:000 VanManager: SocketTimeoutException - connection timed out`
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('VAN 통신 타임아웃 (SocketTimeoutException)')
    expect(entries[0].status).toBe('failure')
  })

  it('detects CARD_FORCE_CANCEL', () => {
    const log = `[1.0.127] 2025-12-15 17:20:03:000 <REQUEST>: [T650P -> VAN] CARD_FORCE_CANCEL`
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('강제 취소 요청')
    expect(entries[0].status).toBe('warning')
  })

  it('detects EOT ABNORMAL with Print itself (more specific)', () => {
    const log = `[1.0.127] 2025-01-09 00:06:05:000 ResultActivity: [!] EOT ABNORMAL | Print itself`
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('EOT 비정상 + 단말기 자체 영수증 출력')
    expect(entries[0].status).toBe('failure')
  })

  it('detects card reading cancel', () => {
    const log = `[1.0.127] 2025-08-23 02:21:21:500 <RESPONSE>: [T650P -> POS] req: AGENT_CARD_READING_CANCEL(910021) | res: 0000`
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('카드 리딩 취소 성공')
    expect(entries[0].status).toBe('warning')
  })
})
