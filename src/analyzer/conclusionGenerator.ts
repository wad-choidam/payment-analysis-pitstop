import type { PaymentAttempt } from '../types'

export interface ConclusionResult {
  conclusion: string;
  actualApprovalCount: number;
  isDuplicatePaymentSuspected: boolean;
}

export function generateConclusion(attempts: PaymentAttempt[]): ConclusionResult {
  if (attempts.length === 0) {
    return {
      conclusion: '분석할 결제 시도가 없습니다.',
      actualApprovalCount: 0,
      isDuplicatePaymentSuspected: false,
    }
  }

  const actualApprovalCount = attempts.filter(a => a.vanApprovalSuccess).length
  const totalAttempts = attempts.length

  // 시도별 요약 생성
  const attemptSummaries = attempts.map(a =>
    `${a.attemptNumber}차: ${a.resultDetail}`,
  )
  const summaryText = attemptSummaries.join(' → ')

  let conclusion: string
  let isDuplicatePaymentSuspected: boolean

  if (actualApprovalCount === 0) {
    conclusion = `총 ${totalAttempts}회 결제 시도 중 VAN 승인 완료 건이 없습니다. 중복 결제 아님.`
    isDuplicatePaymentSuspected = false
  } else if (actualApprovalCount === 1) {
    conclusion = `총 ${totalAttempts}회 결제 시도 중 VAN 승인 1건 완료. 중복 결제 아님.`
    isDuplicatePaymentSuspected = false
  } else {
    conclusion = `총 ${totalAttempts}회 결제 시도 중 VAN 승인 ${actualApprovalCount}건 완료. 중복 결제 의심 — UBMS 확인 필요.`
    isDuplicatePaymentSuspected = true
  }

  conclusion += `\n(${summaryText})`

  return {
    conclusion,
    actualApprovalCount,
    isDuplicatePaymentSuspected,
  }
}
