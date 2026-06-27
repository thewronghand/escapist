import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { MermaidDiagram } from '@/components/ui/MermaidDiagram'

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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

          const match = codeClass?.match(/language-(\w+)/)
          if (match) {
            const lang = match[1]
            return (
              <SyntaxHighlighter
                style={{
                  ...oneDark,
                  'pre[class*="language-"]': {
                    ...oneDark['pre[class*="language-"]'],
                    background: 'var(--surface-card)',
                  },
                  'code[class*="language-"]': {
                    ...oneDark['code[class*="language-"]'],
                    background: 'transparent',
                  },
                }}
                language={lang}
                customStyle={{
                  margin: 0,
                  marginBottom: '0.5rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--hairline)',
                  fontSize: '13px',
                  background: 'var(--surface-card)',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
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
