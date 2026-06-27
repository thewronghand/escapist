import { useState } from 'react'
import { useSandbox } from '@/hooks/useSandbox'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { SandboxChat } from '@/components/sandbox/SandboxChat'
import { SandboxInput } from '@/components/sandbox/SandboxInput'
import { timeAgo } from '@/lib/utils'

export function SandboxPage() {
  const sandbox = useSandbox()
  const [tab, setTab] = useState<'chat' | 'sessions'>('chat')

  const handleSelectSession = (id: string) => {
    sandbox.loadSession(id)
    setTab('chat')
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-hairline px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="code" size={20} stroke="var(--accent-purple)" />
          <div>
            <h1 className="text-ink text-[18px] font-semibold">샌드박스</h1>
            <p className="text-mute text-[12px]">부담 없이 자유롭게 질문하세요</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="tertiary" size="sm" icon="plus" onClick={() => { sandbox.createSession(); setTab('chat') }}>새 대화</Button>
          <Button variant="tertiary" size="sm" icon="refresh" onClick={sandbox.refreshSessions}>새로고침</Button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-hairline">
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 py-3 text-[13px] font-medium text-center transition-colors ${
            tab === 'chat' ? 'text-ink border-b-2 border-ink' : 'text-mute'
          }`}
        >
          대화
        </button>
        <button
          onClick={() => setTab('sessions')}
          className={`flex-1 py-3 text-[13px] font-medium text-center transition-colors ${
            tab === 'sessions' ? 'text-ink border-b-2 border-ink' : 'text-mute'
          }`}
        >
          세션 ({sandbox.sessions.length})
        </button>
      </div>

      {/* 채팅 */}
      {tab === 'chat' && (
        <div className="flex-1 flex flex-col max-w-[820px] w-full mx-auto min-h-0">
          <SandboxChat messages={sandbox.messages} typing={sandbox.typing} />
          <SandboxInput onSend={sandbox.sendMessage} disabled={sandbox.typing} />
        </div>
      )}

      {/* 세션 목록 */}
      {tab === 'sessions' && (
        <div className="flex-1 overflow-auto px-6 py-4">
          {sandbox.sessions.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="code" size={28} className="mx-auto text-stone mb-3" />
              <p className="text-mute text-[14px]">아직 대화 기록이 없어요</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-w-[640px] mx-auto">
              {sandbox.sessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                    sandbox.sandboxId === s.id ? 'bg-surface-elevated' : 'hover:bg-surface-elevated/50'
                  }`}
                >
                  <button
                    onClick={() => handleSelectSession(s.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-[13px] text-body truncate">{s.questionText || '새 대화'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-stone">{timeAgo(s.lastActivityAt ?? s.createdAt)}</span>
                      <span className="text-[10px] text-stone">{s.messageCount}개 메시지</span>
                    </div>
                  </button>
                  <button
                    onClick={() => sandbox.deleteSession(s.id)}
                    className="w-7 h-7 rounded flex items-center justify-center text-ash hover:text-accent-red transition-colors shrink-0"
                    title="삭제"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
