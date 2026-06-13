import { useState, useRef, useEffect } from 'react'
import { useSandbox } from '@/hooks/useSandbox'
import { Icon } from '@/components/ui/Icon'
import { SandboxChat } from '@/components/sandbox/SandboxChat'
import { SandboxInput } from '@/components/sandbox/SandboxInput'
import { timeAgo } from '@/lib/utils'

interface SandboxOverlayProps {
  onNavigateToPage?: () => void
}

export function SandboxOverlay({ onNavigateToPage }: SandboxOverlayProps) {
  const { messages, typing, sendMessage, createSession, sessions, sandboxId, loadSession } = useSandbox()
  const [open, setOpen] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!showSessions) return
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSessions(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showSessions])

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

  const currentTitle = sessions.find((s) => s.id === sandboxId)?.questionText || '새 대화'

  return (
    <div className="fixed bottom-5 right-5 w-[420px] h-[560px] bg-surface border border-hairline rounded-xl shadow-2xl flex flex-col z-50 esc-rise overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline shrink-0">
        {/* 세션 드롭다운 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="flex items-center gap-1.5 text-ink text-[14px] font-medium hover:text-body transition-colors"
          >
            <Icon name="code" size={16} stroke="var(--accent-purple)" />
            <span className="max-w-[160px] truncate">{currentTitle}</span>
            <Icon name="chevdown" size={12} style={{ transform: showSessions ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
          </button>

          {showSessions && (
            <div className="absolute top-full left-0 mt-1.5 w-[280px] bg-surface border border-hairline rounded-lg shadow-lg py-1 max-h-[300px] overflow-auto" style={{ animation: 'esc-rise-sm 0.15s ease both' }}>
              <button
                onClick={() => { createSession(); setShowSessions(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-elevated transition-colors text-accent-purple"
              >
                <Icon name="plus" size={14} />
                <span className="text-[13px] font-medium">새 대화</span>
              </button>
              <div className="h-px bg-hairline my-1" />
              {sessions.length === 0 ? (
                <p className="text-[12px] text-stone px-3 py-2">대화 기록 없음</p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { loadSession(s.id); setShowSessions(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                      sandboxId === s.id ? 'bg-surface-elevated text-ink' : 'hover:bg-surface-elevated/50 text-mute'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] truncate">{s.questionText || '새 대화'}</p>
                      <span className="text-[10px] text-stone">{timeAgo(s.lastActivityAt ?? s.createdAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
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
            onClick={createSession}
            className="w-7 h-7 rounded flex items-center justify-center text-ash hover:text-body hover:bg-surface-elevated transition-colors"
            title="새 대화"
          >
            <Icon name="plus" size={14} />
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
