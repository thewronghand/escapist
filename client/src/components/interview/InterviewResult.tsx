import { useState } from 'react'
import type { InterviewResult as IResult } from '@/hooks/useInterview'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'
import { scoreColor } from '@/lib/utils'

interface InterviewResultProps {
  result: IResult
  summarizing: boolean
  onRetry: () => void
  onDashboard: () => void
}

const GRADE_SCORE: Record<string, number> = { S: 96, A: 86, B: 74, C: 64, D: 54, F: 40 }

export function InterviewResult({ result, summarizing, onRetry, onDashboard }: InterviewResultProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const gradeColor = scoreColor(GRADE_SCORE[result.grade] ?? 50, 100)

  const statusDot: Record<string, string> = {
    correct: 'bg-accent-green',
    partial: 'bg-accent-yellow',
    wrong: 'bg-accent-red',
    pass: 'bg-stone',
    timeout: 'bg-accent-red',
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8">
      {/* 히어로 */}
      <div className="bg-surface border border-hairline rounded-xl p-8 mb-6 text-center">
        <span className="text-[56px] font-bold" style={{ color: gradeColor }}>{result.grade}</span>
        <p className="text-ink text-[36px] font-semibold mt-1">{result.totalScore}<span className="text-mute text-[18px]">/100</span></p>
        <div className="flex justify-center gap-6 mt-4">
          {result.categoryAnalysis.map((ca) => (
            <div key={ca.category} className="text-center">
              <p className="text-[12px] text-mute">{ca.category}</p>
              <p className="text-[16px] font-medium" style={{ color: scoreColor(ca.avg) }}>{ca.avg}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 총평 */}
      <div className="bg-surface border border-hairline rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="mic" size={16} stroke="var(--accent-red)" />
          <span className="text-ink text-[14px] font-medium">면접관 총평</span>
        </div>
        {summarizing ? (
          <p className="text-mute text-[13px]">총평 생성 중...</p>
        ) : (
          <Markdown className="text-[14px]">{result.summary}</Markdown>
        )}
      </div>

      {/* 질문별 결과 */}
      <h3 className="text-ink text-[16px] font-medium mb-3">질문별 결과</h3>
      <div className="flex flex-col gap-1 mb-6">
        {result.items.map((item, i) => (
          <div key={i} className="border border-hairline rounded-lg bg-surface">
            <button
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-elevated/50 transition-colors"
            >
              <span className="text-[13px] text-mute w-5">{i + 1}</span>
              <span className={`w-2 h-2 rounded-full ${statusDot[item.status] ?? 'bg-stone'}`} />
              <span className="text-[14px] text-body flex-1 truncate">{item.question}</span>
              <span className="text-[14px] font-medium" style={{ color: scoreColor(item.score) }}>{item.score}</span>
              <Icon
                name="chevdown"
                size={14}
                className="text-ash transition-transform"
                style={{ transform: expandedIdx === i ? 'rotate(180deg)' : undefined }}
              />
            </button>
            {expandedIdx === i && (
              <div className="px-4 pb-3 pt-0 border-t border-hairline">
                <p className="text-[13px] text-body mt-2">{item.feedback}</p>
                {item.modelAnswer && (
                  <div className="mt-2 p-3 bg-surface-card rounded-md">
                    <p className="text-[11px] text-accent-green mb-1">모범답안</p>
                    <p className="text-[12px] text-body">{item.modelAnswer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={onDashboard}>대시보드로</Button>
        <Button variant="primary" onClick={onRetry}>다시 면접 보기</Button>
      </div>
    </div>
  )
}
