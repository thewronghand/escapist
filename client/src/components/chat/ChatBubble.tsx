import type { ChatMessage } from '@/types'
import { AGENTS } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Markdown } from '@/components/ui/Markdown'

interface ChatBubbleProps {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const agent = AGENTS.find((a) => a.id === message.role)

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
