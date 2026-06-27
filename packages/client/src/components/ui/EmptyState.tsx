import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center mb-4">
          <Icon name={icon} size={22} stroke="var(--ash)" />
        </div>
      )}
      <h3 className="text-ink text-[16px] font-medium">{title}</h3>
      {description && <p className="text-mute text-[13px] mt-1 max-w-[300px]">{description}</p>}
      {action && (
        <Button variant="primary" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  )
}
