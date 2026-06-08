import type { Question } from '@/types'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { DifficultyStars } from '@/components/ui/DifficultyStars'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Icon } from '@/components/ui/Icon'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unlearned: { label: '미학습', color: 'var(--stone)' },
  learning: { label: '학습중', color: 'var(--accent-blue)' },
  weak: { label: '약함', color: 'var(--accent-red)' },
  master: { label: '마스터', color: 'var(--accent-green)' },
}

interface QuestionCardProps {
  question: Question
  onClick: () => void
}

export function QuestionCard({ question, onClick }: QuestionCardProps) {
  const status = STATUS_LABELS[question.status] ?? STATUS_LABELS.unlearned

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 border border-hairline rounded-lg bg-surface hover:border-hairline-strong hover:bg-surface-elevated transition-colors text-left group"
    >
      {question.bestScore !== null ? (
        <ScoreRing score={question.bestScore} size={38} />
      ) : (
        <div className="w-[38px] h-[38px] rounded-full border border-hairline flex items-center justify-center">
          <span className="text-stone text-[12px]">-</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-ink truncate">{question.question}</p>
        <div className="flex items-center gap-2 mt-1">
          <CategoryTag category={question.category} />
          <DifficultyStars value={question.difficulty} size={10} />
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
            <span className="text-[11px] text-mute">{status.label}</span>
          </div>
        </div>
      </div>

      <Icon name="chevright" size={16} className="text-ash group-hover:text-body transition-colors shrink-0" />
    </button>
  )
}
