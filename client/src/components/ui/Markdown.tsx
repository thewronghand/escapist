import ReactMarkdown from 'react-markdown'
import { MermaidDiagram } from '@/components/ui/MermaidDiagram'

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className}>
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-ink text-[18px] font-semibold mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-ink text-[16px] font-semibold mt-3 mb-1.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-ink text-[15px] font-medium mt-2 mb-1">{children}</h3>,
        p: ({ children }) => <p className="text-body text-[14px] mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="text-ink font-semibold">{children}</strong>,
        em: ({ children }) => <em className="text-body italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 text-[14px] text-body space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 text-[14px] text-body space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ className: codeClass, children }) => {
          const isMermaid = codeClass?.includes('language-mermaid')
          if (isMermaid) {
            const code = String(children).trim()
            return <MermaidDiagram code={code} className="my-2" />
          }

          const isBlock = codeClass?.includes('language-')
          if (isBlock) {
            return (
              <code className="block bg-surface-card border border-hairline rounded-md px-4 py-3 text-[13px] text-body font-mono overflow-x-auto whitespace-pre mb-2">
                {children}
              </code>
            )
          }
          return (
            <code className="px-1.5 py-0.5 bg-surface-card border border-hairline rounded-xs text-[13px] text-accent-blue font-mono">
              {children}
            </code>
          )
        },
        pre: ({ children }) => <pre className="mb-2">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-hairline-strong pl-3 my-2 text-mute italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-hairline my-3" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
    </div>
  )
}
