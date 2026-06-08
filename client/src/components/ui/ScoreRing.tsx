import { scoreColor } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  max?: number
  size?: number
  label?: string
  className?: string
}

export function ScoreRing({ score, max = 10, size = 48, label, className }: ScoreRingProps) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, score / max))
  const offset = circ * (1 - pct)
  const color = scoreColor(score, max)

  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hairline)" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold leading-none" style={{ color, fontSize: size * 0.35 }}>
          {score}
        </span>
        {label && <span className="text-[9px] text-mute uppercase tracking-wider mt-0.5">{label}</span>}
      </div>
    </div>
  )
}
