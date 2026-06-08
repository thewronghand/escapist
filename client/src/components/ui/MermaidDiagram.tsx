import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#0d0d0d',
    primaryColor: '#242728',
    primaryTextColor: '#cdcdcd',
    primaryBorderColor: '#434345',
    lineColor: '#6a6b6c',
    secondaryColor: '#121212',
    tertiaryColor: '#101111',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
})

interface MermaidDiagramProps {
  code: string
  className?: string
}

export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    const id = `mermaid-${Math.random().toString(36).slice(2, 8)}`

    mermaid.render(id, code).then(({ svg: rendered }) => {
      if (!cancelled) {
        setSvg(rendered)
        setError('')
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Mermaid 렌더링 실패')
        setSvg('')
      }
    })

    return () => { cancelled = true }
  }, [code])

  if (error) {
    return (
      <div className={`bg-surface-card border border-hairline rounded-md p-3 ${className ?? ''}`}>
        <p className="text-accent-red text-[12px] mb-2">다이어그램 렌더링 실패</p>
        <pre className="text-[12px] text-mute font-mono whitespace-pre-wrap">{code}</pre>
      </div>
    )
  }

  if (!svg) return null

  return (
    <div
      ref={containerRef}
      className={`bg-surface-card border border-hairline rounded-md p-4 overflow-x-auto ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
