import type { AnalysisResult } from '../../types'

interface LogTableSectionProps {
  result: AnalysisResult
}

const STATUS_INDICATOR: Record<string, { color: string; label: string }> = {
  success: { color: '#4ade80', label: '성공' },
  failure: { color: '#e94560', label: '실패' },
  warning: { color: '#ffd700', label: '경고' },
  info: { color: '#94a3b8', label: '정보' },
}

export function LogTableSection({ result }: LogTableSectionProps) {
  const errorSet = new Set(result.errorPoints)

  return (
    <section className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
        <span className="font-bold">상세 로그 테이블</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#16213e]">
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460] w-20">시간</th>
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460] w-20">출처</th>
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460]">이벤트</th>
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460] w-16">상태</th>
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460] w-40">ptxId</th>
            </tr>
          </thead>
          <tbody>
            {result.entries.map((entry, index) => {
              const isError = errorSet.has(index)
              const status = STATUS_INDICATOR[entry.status]
              const rowBg = isError
                ? 'bg-red-900/20'
                : index % 2 === 0
                  ? 'bg-[#0d1a0d]/30'
                  : ''

              return (
                <tr key={index} className={rowBg} title={entry.rawLog}>
                  <td className="p-1.5 px-2 text-gray-500 font-mono">{entry.timestamp}</td>
                  <td className="p-1.5 px-2" style={{ color: entry.source === 'POS' ? '#00d2ff' : '#ffd700' }}>
                    {entry.source === 'POS' ? 'POS' : '단말기'}
                  </td>
                  <td className={`p-1.5 px-2 ${isError ? 'text-[#e94560] font-bold' : 'text-gray-300'}`}>
                    {isError && '⚠️ '}{entry.event}
                  </td>
                  <td className="p-1.5 px-2">
                    <span style={{ color: status.color }}>●</span>{' '}
                    <span className="text-gray-400">{status.label}</span>
                  </td>
                  <td className="p-1.5 px-2 text-[#ffd700] font-mono text-[10px]">
                    {entry.ptxId ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
