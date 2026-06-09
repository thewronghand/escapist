import { useState } from 'react'
import type { EndlessResult } from '@/components/endless/EndlessProgress'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { scoreColor } from '@/lib/utils'

interface GameOverScreenProps {
  result: EndlessResult
  bestStreak: number
  onRetry: () => void
  onDashboard: () => void
}

export function GameOverScreen({ result, bestStreak, onRetry, onDashboard }: GameOverScreenProps) {
  const [showHistory, setShowHistory] = useState(false)
  const isNewRecord = result.streak > bestStreak

  return (
    <div className="max-w-[640px] mx-auto px-6 py-8 text-center">
      {/* 헤더 */}
      <p className="text-[14px] text-mute uppercase tracking-wider mb-2">
        {result.cleared ? 'ALL CLEAR' : 'GAME OVER'}
      </p>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon name="flame" size={28} stroke="var(--accent-red)" />
        <span className="text-[48px] font-bold text-ink">{result.streak}</span>
      </div>
      {isNewRecord && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-yellow-soft text-accent-yellow text-[12px] font-medium mb-4">
          NEW RECORD!
        </span>
      )}

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 my-6">
        {[
          { label: '최종 스트릭', value: result.streak },
          { label: '총 답변', value: `${result.totalAnswered}문제` },
          { label: '평균 점수', value: result.averageScore },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-hairline rounded-lg p-4">
            <p className="text-[11px] text-mute mb-1">{stat.label}</p>
            <p className="text-ink text-[20px] font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 막힌 질문 */}
      {!result.cleared && result.last && (
        <div className="bg-surface border border-hairline rounded-lg p-4 text-left mb-4">
          <p className="text-[11px] text-accent-red mb-1">막힌 질문</p>
          <p className="text-[14px] text-ink mb-2">{result.last.question}</p>
          {result.last.modelAnswer && (
            <div className="bg-surface-card rounded-md p-3">
              <p className="text-[11px] text-accent-green mb-1">모범답안</p>
              <p className="text-[12px] text-body">{result.last.modelAnswer}</p>
            </div>
          )}
        </div>
      )}

      {/* 히스토리 */}
      {result.history.length > 0 && <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-1 mx-auto text-[13px] text-mute hover:text-body transition-colors mb-4"
      >
        전체 답변 히스토리
        <Icon name="chevdown" size={14} style={{ transform: showHistory ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>}
      {showHistory && result.history.length > 0 && (
        <div className="flex flex-col gap-1 text-left mb-6">
          {result.history.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-surface rounded-md border border-hairline">
              <span className="text-[12px] text-mute w-4">{i + 1}</span>
              <span className="text-[13px] text-body flex-1 truncate">{item.question}</span>
              <span className="text-[13px] font-medium" style={{ color: scoreColor(item.score) }}>{item.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* 버튼 */}
      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={onDashboard}>대시보드로</Button>
        <Button variant="primary" onClick={onRetry}>다시 도전</Button>
      </div>
    </div>
  )
}
