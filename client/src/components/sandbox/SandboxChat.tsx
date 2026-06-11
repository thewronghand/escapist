import { useRef, useEffect } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Markdown } from '@/components/ui/Markdown'

interface SandboxMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
}

interface SandboxChatProps {
  messages: SandboxMessage[]
  typing: boolean
  compact?: boolean
}

export function SandboxChat({ messages, typing, compact }: SandboxChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing])

  const textSize = compact ? 'text-[13px]' : 'text-[14px]'

  if (messages.length === 0 && !typing) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <Icon name="code" size={compact ? 28 : 36} stroke="var(--stone)" />
        <p className={`text-mute ${compact ? 'text-[14px] mt-3' : 'text-[16px] mt-4'}`}>부담 없이 물어보세요</p>
        <p className={`text-stone mt-1 ${compact ? 'text-[12px]' : 'text-[13px]'}`}>"이벤트 루프가 뭐야?", "클로저 쉽게 설명해줘"</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-3">
      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2.5 ${textSize} ${
                msg.role === 'user'
                  ? 'bg-surface-elevated border border-hairline rounded-tr-xs'
                  : 'bg-surface border border-hairline rounded-tl-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-body whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <Markdown className={textSize}>{msg.text}</Markdown>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2 px-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent-purple"
                style={{ animation: 'esc-blink 1.2s infinite', animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
