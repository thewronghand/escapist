import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="esc-rise flex items-center gap-2 px-4 py-2.5 rounded-lg border border-hairline bg-surface text-[13px] shadow-lg"
            style={{ animation: 'esc-rise-sm 0.2s ease both' }}
          >
            {t.type === 'success' && <Icon name="check" size={14} stroke="var(--accent-green)" />}
            {t.type === 'error' && <Icon name="x" size={14} stroke="var(--accent-red)" />}
            {t.type === 'info' && <Icon name="lightbulb" size={14} stroke="var(--accent-blue)" />}
            <span className={t.type === 'error' ? 'text-accent-red' : 'text-body'}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
