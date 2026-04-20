import { describe, it, expect } from 'vitest'
import { parseTerminalLog } from '../terminalLogParser'

const SAMPLE_TERMINAL_LOG = `2024-05-15 14:32:01.123 AgentSocketServer: CLIENT IP/192.168.123.112
2024-05-15 14:32:02.456 <REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)
2024-05-15 14:32:05.789 [POS -> T650P]: [CARD_APPROVAL] CPOS-1b81a584-1c73-437d-ae69-1167036f71fd
2024-05-15 14:32:15.012 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 0000
2024-05-15 14:32:20.345 ChargingStatusReceiver: charging dock connected`

describe('parseTerminalLog', () => {
  it('parses entries from terminal log text', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries.length).toBe(5)
  })

  it('extracts timestamps as HH:mm:ss', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[0].timestamp).toBe('14:32:01')
    expect(entries[2].timestamp).toBe('14:32:05')
  })

  it('sets source to TERMINAL for all entries', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    entries.forEach(e => expect(e.source).toBe('TERMINAL'))
  })

  it('detects client connection event', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[0].event).toContain('POS 연결 요청')
    expect(entries[0].status).toBe('info')
  })

  it('detects previous transaction inquiry', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[1].event).toBe('직전거래 조회 수신')
  })

  it('detects card approval request and extracts ptxId', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[2].event).toBe('승인 요청 수신')
    expect(entries[2].ptxId).toBe('CPOS-1b81a584-1c73-437d-ae69-1167036f71fd')
  })

  it('detects approval success response (0000)', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[3].event).toBe('승인 성공 응답')
    expect(entries[3].status).toBe('success')
  })

  it('detects charging dock event as warning', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[4].event).toContain('충전독')
    expect(entries[4].status).toBe('warning')
  })

  it('returns empty array for empty input', () => {
    expect(parseTerminalLog('')).toEqual([])
  })

  it('detects 9999 as terminal unavailable', () => {
    const log = '2024-05-15 14:32:15.012 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 9999'
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('단말기 수신 불가 응답')
    expect(entries[0].status).toBe('failure')
  })

  it('detects non-0000 response as failure', () => {
    const log = '2024-05-15 14:32:15.012 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 1234'
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('승인 실패 응답 (1234)')
    expect(entries[0].status).toBe('failure')
  })
})
