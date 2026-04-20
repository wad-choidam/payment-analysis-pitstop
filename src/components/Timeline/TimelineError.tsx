import type { LogEntry } from '../../types'

interface TimelineErrorProps {
  entry: LogEntry
}

export function TimelineError({ entry }: TimelineErrorProps) {
  return (
    <div className="my-3 p-2 bg-red-900/20 border border-[#e94560] rounded-md text-center">
      <span className="text-[#e94560] text-sm font-bold">⚠️ {entry.event} — {entry.timestamp}</span>
    </div>
  )
}
