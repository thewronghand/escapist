import { useState } from 'react'
import type { Evaluation } from '@/types'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Icon } from '@/components/ui/Icon'
import { scoreColor } from '@/lib/utils'

interface EvaluationCardProps {
  evaluation: Evaluation
}

function BreakdownBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = scoreColor(value, max)

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-mute w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-surface-card">
        <div
          className="h-full rounded-full transition-all duration-600"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[12px] font-medium w-5 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

export function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="bg-surface border border-hairline rounded-lg p-5 esc-rise" style={{ animation: 'esc-rise 0.4s ease both' }}>
      <div className="flex gap-6 mb-4">
        <ScoreRing score={evaluation.score} size={76} label="SCORE" />
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
          {Object.entries(evaluation.breakdown).map(([key, val]) => (
            <BreakdownBar key={key} label={key} value={val} />
          ))}
        </div>
      </div>

      <p className="text-body text-[14px] mb-3">{evaluation.feedback}</p>

      {evaluation.improvements.length > 0 && (
        <div className="mb-3">
          {evaluation.improvements.map((item, i) => (
            <div key={i} className="flex items-start gap-2 mb-1">
              <Icon name="arrowup" size={14} stroke="var(--accent-yellow)" className="mt-0.5 shrink-0" />
              <span className="text-[13px] text-body">{item}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAnswer(!showAnswer)}
        className="flex items-center gap-2 text-accent-green text-[13px] font-medium hover:opacity-80 transition-opacity"
      >
        <Icon name="check" size={14} />
        모범답안
        <Icon
          name="chevdown"
          size={14}
          className="transition-transform"
          style={{ transform: showAnswer ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {showAnswer && (
        <div className="mt-2 p-3 bg-surface-card rounded-md border border-hairline">
          <p className="text-[13px] text-body whitespace-pre-wrap">{evaluation.modelAnswer}</p>
        </div>
      )}
    </div>
  )
}
