import { useState, useRef, useCallback, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSend: (message: string) => void
  onSkip?: () => void
  disabled?: boolean
  hintSlot?: ReactNode
}

export function ChatInput({ onSend, onSkip, disabled, hintSlot }: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div
      className="border-t border-hairline px-4 py-3"
      style={{ background: 'rgba(7,8,10,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-[820px] mx-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); handleInput() }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="답변을 입력하세요..."
          rows={1}
          className="w-full bg-surface-elevated border border-hairline rounded-lg px-4 py-3 text-[14px] text-body placeholder-stone resize-none focus:outline-none focus:border-hairline-strong transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-stone">
            @튜터 · @리서처 · @다이어그램
          </span>
          <div className="flex items-center gap-2">
            {hintSlot}
            {onSkip && (
              <Button variant="tertiary" size="sm" onClick={onSkip} disabled={disabled}>
                모르겠다
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon="send"
              onClick={handleSend}
              disabled={disabled || !text.trim()}
            >
              제출
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
