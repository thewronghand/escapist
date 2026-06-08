import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'

interface Hint {
  level: number
  content: string
}

interface HintPopoverProps {
  hints: Hint[]
  loading: boolean
  canRequestMore: boolean
  remainingHints: number
  onRequestHint: () => void
  disabled?: boolean
}

export function HintPopover({ hints, loading, canRequestMore, remainingHints, onRequestHint, disabled }: HintPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="w-9 h-9 rounded-md flex items-center justify-center text-accent-yellow hover:bg-accent-yellow-soft transition-colors disabled:opacity-40 disabled:pointer-events-none"
        title="힌트"
      >
        <Icon name="lightbulb" size={18} />
        {hints.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-yellow text-[10px] text-black font-bold flex items-center justify-center">
            {hints.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-[360px] bg-surface border border-hairline rounded-lg shadow-lg esc-rise overflow-hidden"
          style={{ animation: 'esc-rise-sm 0.2s ease both' }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
            <div className="flex items-center gap-2">
              <Icon name="lightbulb" size={16} stroke="var(--accent-yellow)" />
              <span className="text-ink text-[14px] font-medium">힌트</span>
              <span className="text-[11px] text-mute">
                {hints.length}/5
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded flex items-center justify-center text-ash hover:text-body"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* 힌트 목록 */}
          <div className="max-h-[300px] overflow-auto">
            {hints.length === 0 && !loading ? (
              <div className="px-4 py-6 text-center">
                <p className="text-mute text-[13px]">힌트를 사용하면 단계별로 도움을 받을 수 있어요</p>
                <p className="text-stone text-[11px] mt-1">키워드 → 방향 → 설명 → 비교 → 상세답안</p>
              </div>
            ) : (
              <div className="p-3 flex flex-col gap-2">
                {hints.map((hint) => (
                  <div key={hint.level} className="flex gap-3 p-3 rounded-md bg-surface-elevated">
                    <span
                      className="w-5 h-5 rounded-sm bg-accent-yellow-soft text-accent-yellow text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                    >
                      {hint.level}
                    </span>
                    <Markdown className="text-[13px] flex-1">{hint.content}</Markdown>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-accent-yellow"
                          style={{ animation: 'esc-blink 1.2s infinite', animationDelay: `${i * 0.18}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-mute text-[12px]">힌트 생성 중...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 하단 */}
          <div className="px-4 py-3 border-t border-hairline">
            <Button
              variant="tertiary"
              size="sm"
              full
              icon="lightbulb"
              onClick={onRequestHint}
              disabled={!canRequestMore || loading}
            >
              {canRequestMore
                ? `힌트 ${hints.length + 1} 받기 (${remainingHints}회 남음)`
                : '힌트를 모두 사용했어요'
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
