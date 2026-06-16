import type { SessionSummary } from '@/types'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { cn, timeAgo } from '@/lib/utils'

interface LearnSidebarProps {
  sessions: SessionSummary[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
}

export function LearnSidebar({ sessions, activeSessionId, onSelectSession, onNewSession }: LearnSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-[13px] text-mute font-medium">학습 세션</span>
        <span className="text-[11px] text-stone">{sessions.length}개</span>
      </div>
      <div className="flex-1 overflow-auto px-2">
        {sessions.length === 0 ? (
          <p className="text-[12px] text-stone px-2 py-4">아직 세션이 없어요</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={cn(
                'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left transition-colors mb-0.5',
                activeSessionId === s.id
                  ? 'bg-surface-elevated text-ink'
                  : 'text-mute hover:text-body hover:bg-surface-elevated/50',
              )}
            >
              <Icon name="book" size={14} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] truncate">{s.questionText || s.questionId}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-stone">{timeAgo(s.lastActivityAt ?? s.createdAt)}</span>
                  <span className="text-[10px] text-stone">{s.messageCount}개 메시지</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      <div className="p-3 border-t border-hairline">
        <Button variant="primary" size="sm" full icon="plus" onClick={onNewSession}>
          새 학습
        </Button>
      </div>
    </div>
  )
}
