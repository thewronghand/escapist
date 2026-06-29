import { useState, useEffect } from 'react'

export interface SessionConfig {
  allowedTools: string[]
  model: string
}

const TOOL_OPTIONS = [
  { id: 'WebSearch', label: 'WebSearch' },
  { id: 'WebFetch', label: 'WebFetch' },
  { id: 'Read', label: 'Read' },
  { id: 'Bash', label: 'Bash' },
] as const

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (기본)' },
  { value: 'claude-opus-4-8', label: 'Opus 4.8' },
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
] as const

const STORAGE_KEY = 'escapist:sessionConfig'

const DEFAULT_CONFIG: SessionConfig = {
  allowedTools: [],
  model: 'claude-sonnet-4-6',
}

export function useSessionConfig() {
  const [config, setConfig] = useState<SessionConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as SessionConfig
    } catch {
      // 파싱 실패 시 기본값
    }
    return DEFAULT_CONFIG
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  return { config, setConfig }
}

interface SessionConfigPanelProps {
  config: SessionConfig
  onChange: (config: SessionConfig) => void
}

export function SessionConfigPanel({ config, onChange }: SessionConfigPanelProps) {
  const toggleTool = (toolId: string) => {
    const next = config.allowedTools.includes(toolId)
      ? config.allowedTools.filter((t) => t !== toolId)
      : [...config.allowedTools, toolId]
    onChange({ ...config, allowedTools: next })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[12px] text-mute mb-2">허용 도구</p>
        <div className="flex flex-wrap gap-2">
          {TOOL_OPTIONS.map((tool) => {
            const active = config.allowedTools.includes(tool.id)
            return (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`px-3 py-1.5 rounded-md text-[12px] border transition-colors ${
                  active
                    ? 'border-hairline-strong bg-surface-elevated text-ink'
                    : 'border-hairline text-mute hover:text-body'
                }`}
              >
                {tool.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[12px] text-mute mb-2">모델</p>
        <div className="flex flex-col gap-1.5">
          {MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...config, model: opt.value })}
              className={`w-full text-left px-3 py-2 rounded-md text-[13px] border transition-colors ${
                config.model === opt.value
                  ? 'border-hairline-strong bg-surface-elevated text-ink'
                  : 'border-hairline text-mute hover:text-body'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
