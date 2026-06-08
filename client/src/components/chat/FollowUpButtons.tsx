import { Icon } from '@/components/ui/Icon'

interface FollowUpButtonsProps {
  questions: string[]
  onSelect: (question: string) => void
}

export function FollowUpButtons({ questions, onSelect }: FollowUpButtonsProps) {
  return (
    <div className="flex flex-col gap-2 mt-3">
      <span className="text-[11px] text-ash uppercase tracking-wider">꼬리질문</span>
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-hairline bg-surface hover:border-hairline-strong hover:bg-surface-elevated transition-colors text-left group"
        >
          <span className="w-[22px] h-[22px] rounded-sm bg-surface-card text-mute text-[12px] font-medium flex items-center justify-center shrink-0">
            {i + 1}
          </span>
          <span className="text-[14px] text-body flex-1">{q}</span>
          <Icon name="chevright" size={14} className="text-ash group-hover:text-body transition-colors" />
        </button>
      ))}
    </div>
  )
}
