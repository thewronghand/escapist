import { Icon } from '@/components/ui/Icon'

const ACCENT_MAP: Record<string, { bg: string; fg: string }> = {
  red: { bg: 'bg-accent-red-soft', fg: 'text-accent-red' },
  green: { bg: 'bg-accent-green-soft', fg: 'text-accent-green' },
  blue: { bg: 'bg-accent-blue-soft', fg: 'text-accent-blue' },
  yellow: { bg: 'bg-accent-yellow-soft', fg: 'text-accent-yellow' },
  purple: { bg: 'bg-accent-purple-soft', fg: 'text-accent-purple' },
}

interface AvatarProps {
  icon: string
  accent?: string
  size?: number
  square?: boolean
  className?: string
}

export function Avatar({ icon, accent = 'blue', size = 28, square, className }: AvatarProps) {
  const colors = ACCENT_MAP[accent] ?? ACCENT_MAP.blue
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${colors.bg} ${colors.fg} ${square ? 'rounded-md' : 'rounded-full'} ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={size * 0.55} />
    </div>
  )
}
