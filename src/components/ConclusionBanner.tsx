import type { AnalysisResult } from '../types'

interface ConclusionBannerProps {
  result: AnalysisResult
}

export function ConclusionBanner({ result }: ConclusionBannerProps) {
  if (!result.conclusion) return null

  const isDuplicate = result.isDuplicatePaymentSuspected
  const bgColor = isDuplicate ? 'rgba(233, 69, 96, 0.15)' : 'rgba(74, 222, 128, 0.15)'
  const borderColor = isDuplicate ? '#e94560' : '#4ade80'
  const textColor = isDuplicate ? '#e94560' : '#4ade80'
  const icon = isDuplicate ? '⚠️' : '✅'

  const [mainConclusion, summaryLine] = result.conclusion.split('\n')

  return (
    <section className="border-b border-[#0f3460] p-6">
      <div
        className="rounded-lg p-4"
        style={{ background: bgColor, border: `1px solid ${borderColor}` }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1">
            <div className="font-bold text-lg" style={{ color: textColor }}>
              {mainConclusion}
            </div>
            {summaryLine && (
              <div className="text-gray-400 text-sm mt-1">{summaryLine}</div>
            )}
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-gray-400">
                결제 시도: <span className="text-white font-bold">{result.attempts?.length ?? 0}회</span>
              </span>
              <span className="text-gray-400">
                VAN 실 승인: <span className="font-bold" style={{ color: textColor }}>{result.actualApprovalCount ?? 0}건</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
