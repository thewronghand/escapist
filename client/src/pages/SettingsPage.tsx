import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { UserProfile } from '@/types'

const JOB_ROLES = ['frontend', 'fullstack', 'backend', 'mobile', 'devops'] as const
const JOB_LABELS: Record<string, string> = {
  frontend: '프론트엔드', fullstack: '풀스택', backend: '백엔드',
  mobile: '모바일', devops: 'DevOps',
}

const EXP_LEVELS = ['junior', '1-3y', '3-5y', '5y+'] as const
const EXP_LABELS: Record<string, string> = {
  junior: '신입', '1-3y': '1~3년', '3-5y': '3~5년', '5y+': '5년+',
}

function ChipInput({ value, onChange, placeholder }: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim() && !e.nativeEvent.isComposing) {
      e.preventDefault()
      const tag = input.trim().replace(',', '')
      if (tag && !value.includes(tag)) onChange([...value, tag])
      setInput('')
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 bg-surface-elevated border border-hairline rounded-md px-3 py-2 min-h-[40px] focus-within:border-hairline-strong">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-surface-card text-[12px] text-body">
          {tag}
          <button onClick={() => onChange(value.filter((t) => t !== tag))} className="text-ash hover:text-body">&times;</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={value.length ? '' : placeholder}
        className="flex-1 min-w-[100px] bg-transparent text-[14px] text-body placeholder-stone outline-none"
      />
    </div>
  )
}

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { profile, loading, saving, save } = useProfile()
  const { toast } = useToast()
  const [form, setForm] = useState<UserProfile>(profile)

  useEffect(() => { setForm(profile) }, [profile])

  const handleSave = async () => {
    const ok = await save(form)
    if (ok) toast('프로필이 저장되었습니다', 'success')
    else toast('저장에 실패했습니다', 'error')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-mute text-[14px]">로딩 중...</span>
      </div>
    )
  }

  return (
    <div className="max-w-[640px] mx-auto px-10 pt-10 pb-16 overflow-auto h-full">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-ash hover:text-body transition-colors">
          <Icon name="chevleft" size={18} />
        </button>
        <h1 className="text-ink text-[22px] font-semibold">설정</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* 직군 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">직군</label>
          <div className="flex gap-2 flex-wrap">
            {JOB_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setForm({ ...form, jobRole: role })}
                className={`px-4 py-2 rounded-md text-[13px] border transition-colors ${
                  form.jobRole === role
                    ? 'border-hairline-strong bg-surface-elevated text-ink'
                    : 'border-hairline text-mute hover:text-body'
                }`}
              >
                {JOB_LABELS[role] ?? role}
              </button>
            ))}
          </div>
        </div>

        {/* 경력 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">경력</label>
          <div className="flex gap-2">
            {EXP_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setForm({ ...form, experienceLevel: level })}
                className={`px-4 py-2 rounded-md text-[13px] border transition-colors ${
                  form.experienceLevel === level
                    ? 'border-hairline-strong bg-surface-elevated text-ink'
                    : 'border-hairline text-mute hover:text-body'
                }`}
              >
                {EXP_LABELS[level] ?? level}
              </button>
            ))}
          </div>
        </div>

        {/* 사용 스택 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">사용 스택</label>
          <ChipInput
            value={form.techStack}
            onChange={(v) => setForm({ ...form, techStack: v })}
            placeholder="React, TypeScript, Vite... (Enter로 추가)"
          />
        </div>

        {/* 관심 스택 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">관심 스택</label>
          <ChipInput
            value={form.interestStack}
            onChange={(v) => setForm({ ...form, interestStack: v })}
            placeholder="Next.js, Rust, Go... (Enter로 추가)"
          />
        </div>

        {/* AI 도구 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">AI 도구</label>
          <ChipInput
            value={form.aiTools}
            onChange={(v) => setForm({ ...form, aiTools: v })}
            placeholder="Claude Code, Copilot, Cursor... (Enter로 추가)"
          />
        </div>

        {/* 자유 메모 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">자유 메모</label>
          <textarea
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            placeholder="면접 준비 시 참고할 내용..."
            rows={4}
            className="w-full bg-surface-elevated border border-hairline rounded-md px-3 py-2.5 text-[14px] text-body placeholder-stone resize-y focus:outline-none focus:border-hairline-strong"
          />
        </div>

        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '프로필 저장'}
        </Button>
      </div>
    </div>
  )
}
