import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'grid', label: '대시보드' },
  { id: 'learn', icon: 'book', label: '학습' },
  { id: 'interview', icon: 'mic', label: '면접' },
  { id: 'endless', icon: 'infinity', label: '무한' },
]

interface BottomNavProps {
  active: string
  onNavigate: (id: string) => void
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="shrink-0 border-t border-hairline bg-canvas flex items-center justify-around px-2 py-1.5">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => { if (active !== item.id) onNavigate(item.id) }}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors',
            active === item.id
              ? 'text-ink'
              : 'text-ash',
          )}
        >
          <Icon name={item.icon} size={18} />
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
