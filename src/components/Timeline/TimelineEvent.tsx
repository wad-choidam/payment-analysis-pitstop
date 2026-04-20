import type { LogEntry } from '../../types'
import { getEventDescription } from '../eventDescriptions'
import { EventTooltip } from '../EventTooltip'

interface TimelineEventProps {
  entry: LogEntry
}

export function TimelineEvent({ entry }: TimelineEventProps) {
  const isPosToTerminal = entry.source === 'POS'
  const statusColors = {
    success: { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400' },
    failure: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400' },
    warning: { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-400' },
    info: { bg: 'bg-slate-800/50', border: 'border-slate-600', text: 'text-slate-300' },
  }
  const colors = statusColors[entry.status]
  const description = getEventDescription(entry.event)

  const eventBox = (
    <div className={`${colors.bg} border ${colors.border} rounded px-2 py-1 text-xs ${colors.text} shrink-0 max-w-[240px] flex items-center`}>
      <span className="truncate">{entry.event}</span>
      {description && <EventTooltip description={description} />}
    </div>
  )

  if (isPosToTerminal) {
    return (
      <div className="flex items-center mb-2">
        <div className="w-20 text-right text-gray-500 text-xs font-mono shrink-0">{entry.timestamp}</div>
        <div className="flex-1 flex items-center mx-3">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-[#00d2ff] to-[#ffd700]" />
          <span className="text-green-400 text-xs mx-1">→</span>
        </div>
        {eventBox}
      </div>
    )
  }

  return (
    <div className="flex items-center mb-2">
      {eventBox}
      <div className="flex-1 flex items-center mx-3">
        <span className="text-green-400 text-xs mx-1">←</span>
        <div className="flex-1 h-0.5 bg-gradient-to-l from-[#00d2ff] to-[#ffd700]" />
      </div>
      <div className="w-20 text-left text-gray-500 text-xs font-mono shrink-0">{entry.timestamp}</div>
    </div>
  )
}
