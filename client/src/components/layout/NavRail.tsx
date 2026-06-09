import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  icon: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: 'grid', label: '대시보드' },
  { id: 'learn', icon: 'book', label: '학습' },
  { id: 'interview', icon: 'mic', label: '면접' },
  { id: 'endless', icon: 'infinity', label: '무한' },
]

interface NavRailProps {
  active: string
  onNavigate: (id: string) => void
}

export function NavRail({ active, onNavigate }: NavRailProps) {
  return (
    <nav className="w-[76px] shrink-0 border-r border-hairline bg-canvas flex flex-col items-center pt-4 gap-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => { if (active !== item.id) onNavigate(item.id) }}
          className={cn(
            'w-[56px] h-[56px] rounded-lg flex flex-col items-center justify-center gap-1 transition-colors',
            active === item.id
              ? 'bg-surface-elevated text-ink'
              : 'text-ash hover:text-body hover:bg-surface-elevated/50',
          )}
        >
          <Icon name={item.icon} size={20} />
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
