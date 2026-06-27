import { CAT_ACCENT } from '@/types'

const ACCENT_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  blue: { dot: 'bg-accent-blue', bg: 'bg-accent-blue-soft', text: 'text-accent-blue' },
  red: { dot: 'bg-accent-red', bg: 'bg-accent-red-soft', text: 'text-accent-red' },
  green: { dot: 'bg-accent-green', bg: 'bg-accent-green-soft', text: 'text-accent-green' },
  yellow: { dot: 'bg-accent-yellow', bg: 'bg-accent-yellow-soft', text: 'text-accent-yellow' },
  purple: { dot: 'bg-accent-purple', bg: 'bg-accent-purple-soft', text: 'text-accent-purple' },
}

interface CategoryTagProps {
  category: string
  className?: string
}

export function CategoryTag({ category, className }: CategoryTagProps) {
  const accent = CAT_ACCENT[category] ?? 'blue'
  const colors = ACCENT_COLORS[accent] ?? ACCENT_COLORS.blue

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] ${colors.bg} ${colors.text} ${className ?? ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {category}
    </span>
  )
}
