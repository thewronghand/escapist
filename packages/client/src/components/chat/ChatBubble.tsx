import type { ChatMessage } from '@/types'
import { AGENTS } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Markdown } from '@/components/ui/Markdown'
import { Icon } from '@/components/ui/Icon'

interface ChatBubbleProps {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const isSkip = message.role === 'system' || message.role === 'skip'
  const agent = AGENTS.find((a) => a.id === message.role)

  // 모르겠다 (skip)
  if (isSkip) {
    return (
      <div className="flex flex-col items-end" style={{ animation: 'esc-slide-left 0.3s ease both' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-red-soft border border-accent-red/20">
          <Icon name="x" size={14} stroke="var(--accent-red)" />
          <span className="text-accent-red text-[13px] font-medium">모르겠다</span>
        </div>
      </div>
    )
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end" style={{ animation: 'esc-slide-left 0.3s ease both' }}>
        <span className="text-[11px] text-ash mb-1">나의 답변</span>
        <div className="max-w-[80%] bg-surface-elevated border border-hairline rounded-lg rounded-tr-xs px-4 py-3">
          <Markdown>{message.text}</Markdown>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start" style={{ animation: 'esc-slide-right 0.3s ease both' }}>
      {agent && (
        <div className="flex items-center gap-2 mb-1">
          <Avatar icon={agent.icon} accent={agent.accent} size={22} square />
          <span className="text-[11px] text-ash">{agent.name}</span>
        </div>
      )}
      <div className="max-w-[80%] bg-surface border border-hairline rounded-lg rounded-tl-xs px-4 py-3">
        <Markdown>{message.text}</Markdown>
      </div>
    </div>
  )
}
