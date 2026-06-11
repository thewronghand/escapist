import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

interface SandboxInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  compact?: boolean
}

export function SandboxInput({ onSend, disabled, compact }: SandboxInputProps) {
  const [text, setText] = useState('')

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`shrink-0 border-t border-hairline ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="아무거나 물어보세요..."
          rows={1}
          className={`flex-1 bg-surface-elevated border border-hairline rounded-lg px-3 py-2 text-body placeholder-stone resize-none focus:outline-none focus:border-hairline-strong max-h-[80px] ${compact ? 'text-[13px]' : 'text-[14px]'}`}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className={`rounded-md bg-accent-purple text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0 ${compact ? 'w-8 h-8' : 'w-9 h-9'}`}
        >
          <Icon name="send" size={compact ? 14 : 16} stroke="white" />
        </button>
      </div>
    </div>
  )
}
