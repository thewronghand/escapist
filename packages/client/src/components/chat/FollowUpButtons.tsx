import { Icon } from '@/components/ui/Icon'

interface FollowUpButtonsProps {
  questions: string[]
  onSelect: (question: string) => void
  onExplain?: (question: string) => void
}

export function FollowUpButtons({ questions, onSelect, onExplain }: FollowUpButtonsProps) {
  return (
    <div className="flex flex-col gap-2 mt-3">
      <span className="text-[11px] text-ash uppercase tracking-wider">꼬리질문</span>
      {questions.map((q, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={() => onSelect(q)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-hairline bg-surface hover:border-hairline-strong hover:bg-surface-elevated transition-colors text-left group flex-1"
          >
            <span className="w-[22px] h-[22px] rounded-sm bg-surface-card text-mute text-[12px] font-medium flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-[14px] text-body flex-1">{q}</span>
            <Icon name="chevright" size={14} className="text-ash group-hover:text-body transition-colors" />
          </button>
          {onExplain && (
            <button
              onClick={() => onExplain(q)}
              className="shrink-0 px-3 py-3 rounded-lg border border-hairline bg-surface hover:border-accent-green/30 hover:bg-accent-green-soft transition-colors text-accent-green text-[12px] font-medium"
              title="모범답변 보기"
            >
              알려줘요
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
