import { useState, useRef, useEffect } from 'react'
import { useSandbox } from '@/hooks/useSandbox'
import { Icon } from '@/components/ui/Icon'
import { Markdown } from '@/components/ui/Markdown'

export function SandboxPanel() {
  const { messages, typing, sendMessage, reset } = useSandbox()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    sendMessage(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-accent-purple text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
        title="샌드박스"
      >
        <Icon name="code" size={20} stroke="white" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 w-[420px] h-[560px] bg-surface border border-hairline rounded-xl shadow-2xl flex flex-col z-50 esc-rise overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="code" size={16} stroke="var(--accent-purple)" />
          <span className="text-ink text-[14px] font-medium">샌드박스</span>
          <span className="text-[11px] text-mute">자유롭게 질문하세요</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            className="w-7 h-7 rounded flex items-center justify-center text-ash hover:text-body hover:bg-surface-elevated transition-colors"
            title="대화 초기화"
          >
            <Icon name="refresh" size={14} />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded flex items-center justify-center text-ash hover:text-body hover:bg-surface-elevated transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>

      {/* 메시지 */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-3">
        {messages.length === 0 && !typing ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Icon name="code" size={28} stroke="var(--stone)" />
            <p className="text-mute text-[14px] mt-3">부담 없이 물어보세요</p>
            <p className="text-stone text-[12px] mt-1">"이벤트 루프가 뭐야?", "클로저 쉽게 설명해줘"</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2.5 text-[13px] ${
                    msg.role === 'user'
                      ? 'bg-surface-elevated border border-hairline rounded-tr-xs'
                      : 'bg-surface border border-hairline rounded-tl-xs'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-body whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <Markdown className="text-[13px]">{msg.text}</Markdown>
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
        )}
      </div>

      {/* 입력 */}
      <div className="shrink-0 border-t border-hairline px-3 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={typing}
            placeholder="아무거나 물어보세요..."
            rows={1}
            className="flex-1 bg-surface-elevated border border-hairline rounded-lg px-3 py-2 text-[13px] text-body placeholder-stone resize-none focus:outline-none focus:border-hairline-strong max-h-[80px]"
          />
          <button
            onClick={handleSend}
            disabled={typing || !text.trim()}
            className="w-8 h-8 rounded-md bg-accent-purple text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
          >
            <Icon name="send" size={14} stroke="white" />
          </button>
        </div>
      </div>
    </div>
  )
}
