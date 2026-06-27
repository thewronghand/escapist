import { Icon } from '@/components/ui/Icon'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'

interface HeaderProps {
  onSettings?: () => void
}

export function Header({ onSettings }: HeaderProps) {
  const workerConnected = useWorkerStatus()

  const statusDot = workerConnected === null
    ? 'bg-ash animate-pulse'
    : workerConnected
      ? 'bg-accent-green'
      : 'bg-accent-red'

  const statusText = workerConnected === null
    ? 'Claude CLI 확인 중'
    : workerConnected
      ? 'Claude CLI 연결됨'
      : 'Claude CLI 오프라인'

  return (
    <header className="h-[56px] shrink-0 border-b border-hairline bg-canvas flex items-center justify-between px-5">
      <div />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-hairline text-[12px] text-mute">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          {statusText}
        </div>
        {onSettings && (
          <button
            onClick={onSettings}
            className="w-8 h-8 rounded-md flex items-center justify-center text-ash hover:text-body hover:bg-surface-elevated transition-colors"
          >
            <Icon name="settings" size={16} />
          </button>
        )}
      </div>
    </header>
  )
}
