import { useState, useRef, useEffect } from 'react'

interface EventTooltipProps {
  description: string
}

export function EventTooltip({ description }: EventTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [vertical, setVertical] = useState<'bottom' | 'top'>('bottom')
  const [horizontal, setHorizontal] = useState<'center' | 'right'>('center')
  const iconRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (visible && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setVertical(spaceBelow < 100 ? 'top' : 'bottom')
      // 아이콘 기준 오른쪽 공간이 부족하면 툴팁을 왼쪽으로 정렬
      const spaceRight = window.innerWidth - rect.right
      setHorizontal(spaceRight < 280 ? 'right' : 'center')
    }
  }, [visible])

  const horizontalClass = horizontal === 'right'
    ? 'right-0'
    : 'left-1/2 -translate-x-1/2'

  return (
    <span className="relative inline-flex ml-1 align-middle">
      <span
        ref={iconRef}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold cursor-help select-none border border-[#00d2ff] text-[#00d2ff] hover:bg-[#00d2ff]/20 transition-colors"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        i
      </span>
      {visible && (
        <div
          className={`absolute z-50 w-64 px-3 py-2 rounded-md bg-[#1a2540] border border-[#0f3460] shadow-lg text-[11px] text-gray-300 leading-relaxed ${horizontalClass} ${
            vertical === 'bottom' ? 'top-5' : 'bottom-5'
          }`}
        >
          {description}
        </div>
      )}
    </span>
  )
}
