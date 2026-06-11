import { useState } from 'react'
import { useSandbox } from '@/hooks/useSandbox'
import { Icon } from '@/components/ui/Icon'
import { SandboxChat } from '@/components/sandbox/SandboxChat'
import { SandboxInput } from '@/components/sandbox/SandboxInput'

interface SandboxOverlayProps {
  onNavigateToPage?: () => void
}

export function SandboxOverlay({ onNavigateToPage }: SandboxOverlayProps) {
  const { messages, typing, sendMessage, reset } = useSandbox()
  const [open, setOpen] = useState(false)

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
        </div>
        <div className="flex items-center gap-1">
          {onNavigateToPage && (
            <button
              onClick={() => { setOpen(false); onNavigateToPage() }}
              className="w-7 h-7 rounded flex items-center justify-center text-ash hover:text-body hover:bg-surface-elevated transition-colors"
              title="전체 화면"
            >
              <Icon name="arrowright" size={14} />
            </button>
          )}
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

      <SandboxChat messages={messages} typing={typing} compact />
      <SandboxInput onSend={sendMessage} disabled={typing} compact />
    </div>
  )
}
