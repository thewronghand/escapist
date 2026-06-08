import { Icon } from '@/components/ui/Icon'

interface HeaderProps {
  onSettings?: () => void
}

export function Header({ onSettings }: HeaderProps) {
  return (
    <header className="h-[56px] shrink-0 border-b border-hairline bg-canvas flex items-center justify-between px-5">
      <div className="flex items-center gap-1.5">
        <img src="/logo.svg" alt="Escapist" className="w-6 h-6" />
        <span className="text-ink text-[15px] font-semibold tracking-tight">Escapist</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-hairline text-[12px] text-mute">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          Claude CLI 연결됨
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
