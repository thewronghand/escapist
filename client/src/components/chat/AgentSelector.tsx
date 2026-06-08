import { useState, useRef, useEffect } from 'react'
import type { AgentId } from '@/types'
import { AGENTS } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'

interface AgentSelectorProps {
  agent: AgentId
  onChange: (agent: AgentId) => void
}

export function AgentSelector({ agent, onChange }: AgentSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const current = AGENTS.find((a) => a.id === agent) ?? AGENTS[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-2.5 rounded-md flex items-center gap-1.5 text-mute hover:text-body hover:bg-surface-elevated transition-colors"
      >
        <Avatar icon={current.icon} accent={current.accent} size={20} square />
        <span className="text-[12px]">{current.name}</span>
        <Icon name="chevdown" size={12} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1.5 w-[220px] bg-surface border border-hairline rounded-lg py-1 shadow-lg"
          style={{ animation: 'esc-rise-sm 0.15s ease both' }}
        >
          {AGENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => { onChange(a.id); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-elevated transition-colors"
            >
              <Avatar icon={a.icon} accent={a.accent} size={26} square />
              <div className="flex-1 text-left">
                <p className="text-[13px] text-ink">{a.name}</p>
                <p className="text-[11px] text-mute">{a.description}</p>
              </div>
              {a.id === agent && <Icon name="check" size={14} stroke="var(--accent-green)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
