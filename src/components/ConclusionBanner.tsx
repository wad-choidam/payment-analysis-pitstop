import { useState, useCallback, useMemo } from 'react'
import type { AnalysisResult } from '../types'
import { buildAnalysisResultText } from '../utils/analysisResultBuilder'

interface ConclusionBannerProps {
  result: AnalysisResult
}

export function ConclusionBanner({ result }: ConclusionBannerProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const copyText = useMemo(() => buildAnalysisResultText(result), [result])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [copyText])

  if (!result.conclusion) return null

  const isDuplicate = result.isDuplicatePaymentSuspected
  const bgColor = isDuplicate ? 'rgba(233, 69, 96, 0.15)' : 'rgba(74, 222, 128, 0.15)'
  const borderColor = isDuplicate ? '#e94560' : '#4ade80'
  const textColor = isDuplicate ? '#e94560' : '#4ade80'
  const icon = isDuplicate ? '⚠️' : '✅'

  const [mainConclusion, ...restLines] = result.conclusion.split('\n')
  const summaryLine = restLines.filter(l => l.startsWith('(')).join('\n')

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
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-gray-400">
                결제 시도: <span className="text-white font-bold">{result.attempts?.length ?? 0}회</span>
              </span>
              <span className="text-gray-400">
                VAN 실 승인: <span className="font-bold" style={{ color: textColor }}>{result.actualApprovalCount ?? 0}건</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 text-xs px-3 py-1.5 rounded-md bg-[#00d2ff] text-[#0a0a1a] font-bold hover:bg-[#00b8e6] transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>{expanded ? '접기' : '분석 결과 더보기'}</span>
              <span className="text-[10px]">{expanded ? '▲' : '▼'}</span>
            </button>
            {expanded && (
              <div className="mt-3 bg-[#0a0a1a] border border-[#0f3460] rounded-md p-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs px-3 py-1.5 rounded-md border border-[#0f3460] text-gray-300 hover:border-[#00d2ff] hover:text-[#00d2ff] transition-colors cursor-pointer mb-3"
                >
                  {copied ? '복사 완료' : '분석 결과 복사'}
                </button>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-96 overflow-auto">
                  {copyText}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
