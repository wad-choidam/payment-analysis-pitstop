import { describe, it, expect } from 'vitest'
import { generateConclusion } from '../conclusionGenerator'
import type { PaymentAttempt } from '../../types'

function attempt(overrides: Partial<PaymentAttempt>): PaymentAttempt {
  return {
    attemptNumber: 1,
    startIndex: 0,
    endIndex: 0,
    startTimestamp: '12:00:00',
    endTimestamp: '12:00:10',
    vanApprovalSent: false,
    vanApprovalSuccess: false,
    posReceivedSuccess: false,
    result: 'failure',
    resultDetail: '결제 실패',
    ...overrides,
  }
}

describe('generateConclusion', () => {
  it('returns default for empty attempts', () => {
    const result = generateConclusion([])
    expect(result.actualApprovalCount).toBe(0)
    expect(result.isDuplicatePaymentSuspected).toBe(false)
    expect(result.conclusion).toContain('분석할 결제 시도가 없습니다')
  })

  it('zero VAN approvals: not duplicate', () => {
    const result = generateConclusion([
      attempt({ attemptNumber: 1, resultDetail: '단말기 수신 불가 (9999)' }),
      attempt({ attemptNumber: 2, resultDetail: '단말기 수신 불가 (9999)' }),
    ])
    expect(result.actualApprovalCount).toBe(0)
    expect(result.isDuplicatePaymentSuspected).toBe(false)
    expect(result.conclusion).toContain('중복 결제 아님')
  })

  it('one VAN approval: not duplicate', () => {
    const result = generateConclusion([
      attempt({ attemptNumber: 1, resultDetail: '단말기 수신 불가 (9999)' }),
      attempt({ attemptNumber: 2, vanApprovalSuccess: true, result: 'success', resultDetail: 'VAN 승인 완료, POS 정상 수신' }),
    ])
    expect(result.actualApprovalCount).toBe(1)
    expect(result.isDuplicatePaymentSuspected).toBe(false)
    expect(result.conclusion).toContain('VAN 승인 1건 완료')
    expect(result.conclusion).toContain('중복 결제 아님')
  })

  it('two VAN approvals: duplicate suspected', () => {
    const result = generateConclusion([
      attempt({ attemptNumber: 1, vanApprovalSuccess: true, result: 'success', resultDetail: 'VAN 승인 완료, POS 미수신 (단말기 단독 결제)' }),
      attempt({ attemptNumber: 2, vanApprovalSuccess: true, result: 'success', resultDetail: 'VAN 승인 완료, POS 정상 수신' }),
    ])
    expect(result.actualApprovalCount).toBe(2)
    expect(result.isDuplicatePaymentSuspected).toBe(true)
    expect(result.conclusion).toContain('UBMS 확인 필요')
  })

  it('includes attempt summaries in conclusion', () => {
    const result = generateConclusion([
      attempt({ attemptNumber: 1, resultDetail: '사용자 취소' }),
      attempt({ attemptNumber: 2, vanApprovalSuccess: true, result: 'success', resultDetail: 'VAN 승인 완료, POS 정상 수신' }),
    ])
    expect(result.conclusion).toContain('1차: 사용자 취소')
    expect(result.conclusion).toContain('2차: VAN 승인 완료')
  })
})
