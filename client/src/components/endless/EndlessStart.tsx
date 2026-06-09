import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { CATEGORIES } from '@/types'

interface EndlessSettings {
  categories: string[]
  gameOverThreshold: number
}

interface EndlessStartProps {
  bestStreak: number
  onStart: (settings: EndlessSettings) => void
}

export function EndlessStart({ bestStreak, onStart }: EndlessStartProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [threshold, setThreshold] = useState(4)

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 py-8">
      {/* 베스트 레코드 */}
      <div className="relative overflow-hidden rounded-xl p-6 mb-8 bg-surface border border-hairline">
        <div className="esc-stripe-band" style={{ opacity: 0.5 }} />
        <div className="relative text-center">
          <p className="text-[12px] text-mute uppercase tracking-wider mb-1">BEST RECORD</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[48px] font-bold text-ink">{bestStreak}</span>
            <Icon name="flame" size={28} stroke="var(--accent-red)" />
          </div>
        </div>
      </div>

      {/* 규칙 */}
      <div className="mb-8">
        <h3 className="text-ink text-[16px] font-medium mb-3">규칙</h3>
        <div className="flex flex-col gap-2">
          {[
            '질문이 랜덤으로 출제됩니다',
            '정답이면 꼬리질문으로 이어집니다',
            '기준 점수 이하면 게임 오버',
            '질문이 모두 소진될 때까지 도전!',
          ].map((rule, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-sm bg-surface-card text-mute text-[12px] font-medium flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-[14px] text-body">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리 */}
      <div className="mb-6">
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
      </div>

      {/* 게임오버 기준 */}
      <div className="mb-8">
        <label className="text-[13px] text-mute mb-2 block">게임오버 기준 점수</label>
        <div className="flex bg-surface-card rounded-md p-0.5 gap-0.5">
          {[3, 4, 5].map((t) => (
            <button
              key={t}
              onClick={() => setThreshold(t)}
              className={`flex-1 px-3 py-1.5 rounded-sm text-[13px] transition-colors ${
                threshold === t ? 'bg-surface-elevated text-ink shadow-sm' : 'text-mute hover:text-body'
              }`}
            >
              {t}점 이하
            </button>
          ))}
        </div>
      </div>

      <Button variant="primary" size="lg" full onClick={() => onStart({ categories, gameOverThreshold: threshold })}>
        도전 시작
      </Button>
    </div>
  )
}

export type { EndlessSettings }
