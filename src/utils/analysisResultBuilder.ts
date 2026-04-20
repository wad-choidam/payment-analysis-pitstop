import type { AnalysisResult } from '../types'

const RESULT_LABELS: Record<string, string> = {
  success: '성공',
  failure: '실패',
  cancelled: '사용자 취소',
  timeout: '타임아웃',
  unknown: '—',
}

export function buildAnalysisResultText(result: AnalysisResult): string {
  const lines: string[] = []
  const attempts = result.attempts ?? []

  // 요약
  lines.push(`[${result.posType}] 불일치 유형: ${result.discrepancyType}`)
  lines.push('')

  // 시도별 상세
  for (const a of attempts) {
    const label = RESULT_LABELS[a.result] ?? a.result
    lines.push(`${a.attemptNumber}차 결제 시도 (${a.startTimestamp}~${a.endTimestamp}) => ${label}`)
    lines.push(a.resultDetail)
  }

  // 결론
  if (attempts.length > 0) {
    lines.push('')
    lines.push(`VAN 실 승인: ${result.actualApprovalCount ?? 0}건`)
    lines.push(result.isDuplicatePaymentSuspected
      ? '결론: 중복 결제 의심 — UBMS 확인 필요'
      : '결론: 중복 결제 아님')
  }

  return lines.join('\n')
}
