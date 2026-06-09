import type { ReactNode } from 'react'

interface SidebarShellProps {
  children: ReactNode
}

export function SidebarShell({ children }: SidebarShellProps) {
  return (
    <aside className="hidden sm:flex w-[248px] shrink-0 border-r border-hairline bg-surface flex-col min-h-0">
      {children}
    </aside>
  )
}
