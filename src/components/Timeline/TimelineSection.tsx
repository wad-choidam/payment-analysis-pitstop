import type { AnalysisResult } from '../../types'
import { TimelineEvent } from './TimelineEvent'
import { TimelineError } from './TimelineError'

interface TimelineSectionProps {
  result: AnalysisResult
}

export function TimelineSection({ result }: TimelineSectionProps) {
  const errorSet = new Set(result.errorPoints)

  // 결제 시도 경계 인덱스 → attempt 번호 매핑
  const attemptBoundaries = new Map<number, number>()
  if (result.attempts) {
    for (const a of result.attempts) {
      attemptBoundaries.set(a.startIndex, a.attemptNumber)
    }
  }

  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
        <span className="font-bold">타임라인 흐름도</span>
        <span className="text-gray-500 text-sm ml-2">POS ↔ 단말기 통신 흐름</span>
      </div>

      <div className="px-10">
        <div className="flex justify-between mb-4">
          <div className="text-center text-[#00d2ff] font-bold text-sm w-24">POS</div>
          <div className="text-center text-[#ffd700] font-bold text-sm w-24">단말기</div>
        </div>

        {result.entries.map((entry, index) => {
          const attemptNum = attemptBoundaries.get(index)
          return (
            <div key={index}>
              {attemptNum !== undefined && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 border-t border-dashed border-[#0f3460]" />
                  <span className="text-[#00d2ff] text-xs font-bold px-2 py-0.5 bg-[#0a0a1a] rounded">
                    {attemptNum}차 결제 시도
                  </span>
                  <div className="flex-1 border-t border-dashed border-[#0f3460]" />
                </div>
              )}
              {errorSet.has(index)
                ? <TimelineError entry={entry} />
                : <TimelineEvent entry={entry} />
              }
            </div>
          )
        })}
      </div>
    </section>
  )
}
