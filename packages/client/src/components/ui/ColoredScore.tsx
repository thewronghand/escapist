import { scoreColor } from '@/lib/utils'

interface ColoredScoreProps {
  score: number
  max?: number
  className?: string
  suffix?: string
}

export function ColoredScore({ score, max = 10, className, suffix }: ColoredScoreProps) {
  return (
    <span className={className} style={{ color: scoreColor(score, max) }}>
      {score}{suffix}
    </span>
  )
}
