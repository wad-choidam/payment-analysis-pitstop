import type { AnalysisResult } from '../types'

interface AnalysisSummaryProps {
  result: AnalysisResult
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 bg-[#16213e] rounded-lg p-3 text-center">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="font-bold text-lg mt-1" style={{ color }}>{value}</div>
    </div>
  )
}

export function AnalysisSummary({ result }: AnalysisSummaryProps) {
  const discrepancyColor = result.errorPoints.length > 0 ? '#e94560' : '#4ade80'

  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
        <span className="font-bold">분석 요약</span>
      </div>
      <div className="flex gap-3">
        <SummaryCard label="POS 유형" value={result.posType} color="#00d2ff" />
        <SummaryCard label="단말기" value={result.terminal} color="#00d2ff" />
        <SummaryCard label="불일치 유형" value={result.discrepancyType} color={discrepancyColor} />
        <SummaryCard
          label="ptxId"
          value={result.ptxId ? `${result.ptxId.slice(0, 18)}...` : '—'}
          color="#ffd700"
        />
      </div>
    </section>
  )
}
