import type { Session } from '@/types'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface LearnSidebarProps {
  sessions: Session[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
}

export function LearnSidebar({ sessions, activeSessionId, onSelectSession, onNewSession }: LearnSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <span className="text-[13px] text-mute font-medium">학습 세션</span>
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
                'w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-left transition-colors mb-0.5',
                activeSessionId === s.id
                  ? 'bg-surface-elevated text-ink'
                  : 'text-mute hover:text-body hover:bg-surface-elevated/50',
              )}
            >
              <Icon name="book" size={14} />
              <span className="text-[13px] truncate flex-1">{s.questionId}</span>
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
