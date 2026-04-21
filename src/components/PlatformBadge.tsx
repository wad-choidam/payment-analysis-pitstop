interface PlatformBadgeProps {
  serviceType: string
}

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; fg: string; bg: string; border: string }> = {
  APOS: { label: 'APOS (Android)', icon: '🤖', fg: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)', border: '#a78bfa' },
  BPOS: { label: 'BPOS (iOS)', icon: '🍎', fg: '#00d2ff', bg: 'rgba(0, 210, 255, 0.12)', border: '#00d2ff' },
  CPOS: { label: 'CPOS (iOS)', icon: '🍎', fg: '#00d2ff', bg: 'rgba(0, 210, 255, 0.12)', border: '#00d2ff' },
}

export function PlatformBadge({ serviceType }: PlatformBadgeProps) {
  const cfg = PLATFORM_CONFIG[serviceType]
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
      style={{ color: cfg.fg, background: cfg.bg, borderColor: cfg.border }}
      title={`${cfg.label} 파일이 감지되었습니다`}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  )
}
