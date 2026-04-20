import { describe, it, expect } from 'vitest'
import { groupPaymentAttempts } from '../attemptGrouper'
import type { LogEntry } from '../../types'

function entry(overrides: Partial<LogEntry>): LogEntry {
  return {
    timestamp: '12:00:00',
    source: 'POS',
    event: '',
    rawLog: '',
    status: 'info',
    ...overrides,
  }
}

describe('groupPaymentAttempts', () => {
  it('returns empty for empty entries', () => {
    expect(groupPaymentAttempts([])).toEqual([])
  })

  it('groups single successful attempt', () => {
    const entries: LogEntry[] = [
      entry({ timestamp: '14:27:15', event: '단말기 연결 요청' }),
      entry({ timestamp: '14:27:16', event: '연결 성공', status: 'success' }),
      entry({ timestamp: '14:27:17', event: '승인 요청' }),
      entry({ timestamp: '14:27:20', event: '승인 성공', status: 'success' }),
      entry({ timestamp: '14:27:21', event: '승인 수신 확인 응답', status: 'success' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts).toHaveLength(1)
    expect(attempts[0].attemptNumber).toBe(1)
    expect(attempts[0].result).toBe('success')
    expect(attempts[0].posReceivedSuccess).toBe(true)
  })

  it('groups multiple attempts separated by POS connection', () => {
    const entries: LogEntry[] = [
      entry({ timestamp: '14:27:15', event: '단말기 연결 요청' }),
      entry({ timestamp: '14:27:20', event: '단말기 수신 불가', status: 'failure' }),
      entry({ timestamp: '14:27:25', event: '단말기 연결 요청' }),
      entry({ timestamp: '14:27:30', event: '승인 성공', status: 'success' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts).toHaveLength(2)
    expect(attempts[0].result).toBe('failure')
    expect(attempts[1].result).toBe('success')
  })

  it('groups by terminal boundary event', () => {
    const entries: LogEntry[] = [
      entry({ timestamp: '14:27:15', source: 'TERMINAL', event: 'POS 연결 요청 수신 (192.168.0.1)' }),
      entry({ timestamp: '14:27:20', source: 'TERMINAL', event: '단말기 수신 불가 응답 (9999)', status: 'failure' }),
      entry({ timestamp: '14:27:25', source: 'TERMINAL', event: 'POS 연결 요청 수신 (192.168.0.1)' }),
      entry({ timestamp: '14:27:30', source: 'TERMINAL', event: '승인 성공 응답', status: 'success' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts).toHaveLength(2)
    expect(attempts[0].vanApprovalSuccess).toBe(false)
    expect(attempts[1].vanApprovalSuccess).toBe(true)
  })

  it('detects VAN approval sent and success', () => {
    const entries: LogEntry[] = [
      entry({ timestamp: '14:27:15', event: '단말기 연결 요청' }),
      entry({ timestamp: '14:27:17', source: 'TERMINAL', event: 'VAN사에 승인 요청' }),
      entry({ timestamp: '14:27:18', source: 'TERMINAL', event: 'VAN사 승인 응답' }),
      entry({ timestamp: '14:27:19', source: 'TERMINAL', event: '승인 성공 응답', status: 'success' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts[0].vanApprovalSent).toBe(true)
    expect(attempts[0].vanApprovalSuccess).toBe(true)
  })

  it('detects user cancellation', () => {
    const entries: LogEntry[] = [
      entry({ timestamp: '14:27:15', event: '단말기 연결 요청' }),
      entry({ timestamp: '14:27:20', event: '승인 중단 요청 전송', status: 'warning' }),
      entry({ timestamp: '14:27:21', event: '중단 성공', status: 'success' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts[0].result).toBe('cancelled')
    expect(attempts[0].resultDetail).toBe('사용자 취소')
  })

  it('detects timer timeout', () => {
    const entries: LogEntry[] = [
      entry({ timestamp: '14:27:15', event: '단말기 연결 요청' }),
      entry({ timestamp: '14:27:18', event: '타이머 만료 (3초 미응답 접속 종료)', status: 'failure' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts[0].result).toBe('timeout')
    expect(attempts[0].resultDetail).toBe('타이머 만료로 접속 종료')
  })

  it('detects standalone terminal payment (VAN success, POS not received)', () => {
    const entries: LogEntry[] = [
      entry({ timestamp: '14:27:15', event: '단말기 연결 요청' }),
      entry({ timestamp: '14:27:16', event: '단말기 수신 불가', status: 'failure' }),
      entry({ timestamp: '14:27:17', source: 'TERMINAL', event: 'VAN사에 승인 요청' }),
      entry({ timestamp: '14:27:18', source: 'TERMINAL', event: '승인 성공 응답', status: 'success' }),
      entry({ timestamp: '14:27:19', source: 'TERMINAL', event: 'EOT 비정상 + 단말기 자체 영수증 출력', status: 'failure' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts[0].vanApprovalSuccess).toBe(true)
    expect(attempts[0].posReceivedSuccess).toBe(false)
    expect(attempts[0].resultDetail).toContain('단말기 자체 영수증')
  })

  it('handles events before first boundary as attempt 1', () => {
    const entries: LogEntry[] = [
      entry({ timestamp: '14:27:10', source: 'TERMINAL', event: '단말기 데이터 초기화' }),
      entry({ timestamp: '14:27:15', event: '단말기 연결 요청' }),
      entry({ timestamp: '14:27:20', event: '승인 성공', status: 'success' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts).toHaveLength(2)
    expect(attempts[0].attemptNumber).toBe(1)
    expect(attempts[1].attemptNumber).toBe(2)
  })

  it('classic discrepancy: 3 attempts, only last succeeds', () => {
    const entries: LogEntry[] = [
      // 1차: 9999
      entry({ timestamp: '12:47:15', event: '단말기 연결 요청' }),
      entry({ timestamp: '12:47:20', event: '단말기 수신 불가', status: 'failure' }),
      // 2차: 9999
      entry({ timestamp: '12:47:23', event: '단말기 연결 요청' }),
      entry({ timestamp: '12:47:25', event: '단말기 수신 불가', status: 'failure' }),
      // 3차: 성공
      entry({ timestamp: '12:47:36', event: '단말기 연결 요청' }),
      entry({ timestamp: '12:47:40', event: '승인 성공', status: 'success' }),
    ]
    const attempts = groupPaymentAttempts(entries)
    expect(attempts).toHaveLength(3)
    expect(attempts[0].result).toBe('failure')
    expect(attempts[1].result).toBe('failure')
    expect(attempts[2].result).toBe('success')
  })
})
