import type { ReactNode } from 'react'

interface SidebarShellProps {
  children: ReactNode
}

export function SidebarShell({ children }: SidebarShellProps) {
  return (
    <aside className="w-[248px] shrink-0 border-r border-hairline bg-surface flex flex-col min-h-0">
      {children}
    </aside>
  )
}
