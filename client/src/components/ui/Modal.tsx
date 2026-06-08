import { useEffect, type ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center esc-fade"
      style={{ background: 'rgba(2,3,4,0.72)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface border border-hairline rounded-xl w-full max-w-[520px] mx-4 esc-rise">
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <div>
              <h2 className="text-ink text-[18px] font-semibold">{title}</h2>
              {subtitle && <p className="text-mute text-[13px] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md flex items-center justify-center text-ash hover:text-body hover:bg-surface-elevated transition-colors"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
