import { useState } from 'react'
import type { InterviewSettings } from '@/hooks/useInterview'
import { Button } from '@/components/ui/Button'
import { CATEGORIES } from '@/types'

interface InterviewSetupProps {
  onStart: (settings: InterviewSettings) => void
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
  labels?: Record<string, string>
}) {
  return (
    <div className="flex bg-surface-card rounded-md p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={String(opt)}
          onClick={() => onChange(opt)}
          className={`flex-1 px-3 py-1.5 rounded-sm text-[13px] transition-colors ${
            value === opt
              ? 'bg-surface-elevated text-ink shadow-sm'
              : 'text-mute hover:text-body'
          }`}
        >
          {labels?.[String(opt)] ?? String(opt)}
        </button>
      ))}
    </div>
  )
}

export function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [categories, setCategories] = useState<string[]>([])
  const [diffMin, setDiffMin] = useState(1)
  const [diffMax, setDiffMax] = useState(5)
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [strategy, setStrategy] = useState<'random' | 'weak-first' | 'unlearned-first'>('random')

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  const handleStart = () => {
    onStart({
      questionCount,
      categories,
      difficultyRange: [diffMin, diffMax],
      timeLimit,
      strategy,
    })
  }

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8">
      <h2 className="text-ink text-[24px] font-semibold mb-6">오늘의 면접</h2>

      <div className="flex flex-col gap-6">
        {/* 질문 수 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">질문 수</label>
          <Segmented options={[5, 10, 15]} value={questionCount} onChange={(v) => setQuestionCount(v as number)} />
        </div>

        {/* 카테고리 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                  categories.includes(cat) || categories.length === 0
                    ? 'border-hairline-strong bg-surface-elevated text-ink'
                    : 'border-hairline text-stone hover:text-mute'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-stone mt-1">선택하지 않으면 전체 카테고리에서 출제</p>
        </div>

        {/* 난이도 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">난이도 범위</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => {
                  if (d <= diffMin) setDiffMin(d)
                  else if (d >= diffMax) setDiffMax(d)
                  else if (Math.abs(d - diffMin) <= Math.abs(d - diffMax)) setDiffMin(d)
                  else setDiffMax(d)
                }}
                className={`w-10 h-10 rounded-md text-[14px] font-medium transition-colors ${
                  d >= diffMin && d <= diffMax
                    ? 'bg-surface-elevated text-ink border border-hairline-strong'
                    : 'bg-surface text-stone border border-hairline'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* 제한시간 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">질문당 제한시간</label>
          <Segmented
            options={[0, 60, 120, 180, 300]}
            value={timeLimit ?? 0}
            onChange={(v) => setTimeLimit(v === 0 ? null : v)}
            labels={{ '0': '없음', '60': '1분', '120': '2분', '180': '3분', '300': '5분' }}
          />
        </div>

        {/* 전략 */}
        <div>
          <label className="text-[13px] text-mute mb-2 block">질문 선택 전략</label>
          <Segmented
            options={['random', 'weak-first', 'unlearned-first'] as const}
            value={strategy}
            onChange={(v) => setStrategy(v as typeof strategy)}
            labels={{ random: '랜덤', 'weak-first': '약한 질문', 'unlearned-first': '미학습' }}
          />
        </div>

        <Button variant="primary" size="lg" full onClick={handleStart} className="mt-4">
          면접 시작
        </Button>
      </div>
    </div>
  )
}
