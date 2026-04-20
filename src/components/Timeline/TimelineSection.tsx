import type { AnalysisResult } from '../../types'
import { TimelineEvent } from './TimelineEvent'
import { TimelineError } from './TimelineError'

interface TimelineSectionProps {
  result: AnalysisResult
}

export function TimelineSection({ result }: TimelineSectionProps) {
  const errorSet = new Set(result.errorPoints)

  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
        <span className="font-bold">타임라인 흐름도</span>
        <span className="text-gray-500 text-sm ml-2">POS ↔ 단말기 통신 흐름</span>
      </div>

      <div className="px-10">
        <div className="flex justify-between mb-4">
          <div className="text-center text-[#00d2ff] font-bold text-sm w-24">POS</div>
          <div className="text-center text-[#ffd700] font-bold text-sm w-24">단말기</div>
        </div>

        {result.entries.map((entry, index) => (
          errorSet.has(index)
            ? <TimelineError key={index} entry={entry} />
            : <TimelineEvent key={index} entry={entry} />
        ))}
      </div>
    </section>
  )
}
