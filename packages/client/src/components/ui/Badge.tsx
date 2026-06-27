import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent'
  accent?: string
  className?: string
}

const ACCENT_CLASSES: Record<string, string> = {
  red: 'bg-accent-red-soft text-accent-red',
  green: 'bg-accent-green-soft text-accent-green',
  blue: 'bg-accent-blue-soft text-accent-blue',
  yellow: 'bg-accent-yellow-soft text-accent-yellow',
  purple: 'bg-accent-purple-soft text-accent-purple',
}

export function Badge({ children, variant = 'default', accent, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-1.5 rounded-xs text-[11px] font-medium',
        variant === 'accent' && accent ? ACCENT_CLASSES[accent] : 'bg-surface-card text-mute',
        className,
      )}
    >
      {children}
    </span>
  )
}
