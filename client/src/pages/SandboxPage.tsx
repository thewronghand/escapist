import { useSandbox } from '@/hooks/useSandbox'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { SandboxChat } from '@/components/sandbox/SandboxChat'
import { SandboxInput } from '@/components/sandbox/SandboxInput'

export function SandboxPage() {
  const { messages, typing, sendMessage, reset } = useSandbox()

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
        <Button variant="tertiary" size="sm" icon="refresh" onClick={reset}>초기화</Button>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col max-w-[820px] w-full mx-auto min-h-0">
        <SandboxChat messages={messages} typing={typing} />
        <SandboxInput onSend={sendMessage} disabled={typing} />
      </div>
    </div>
  )
}
