import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useStats } from '@/hooks/useStats'
import { Icon } from '@/components/ui/Icon'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { Button } from '@/components/ui/Button'
import { scoreColor, timeAgo } from '@/lib/utils'

const MODE_ICON: Record<string, { icon: string; accent: string }> = {
  learn: { icon: 'book', accent: 'blue' },
  interview: { icon: 'mic', accent: 'red' },
  endless: { icon: 'infinity', accent: 'yellow' },
}

interface DashboardPageProps {
  onNavigate?: (nav: string, meta?: { questionId?: string }) => void
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { stats, loading, error, reload } = useStats()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Icon name="refresh" size={20} className="text-ash" />
        <p className="text-mute text-[14px]">통계를 불러올 수 없습니다</p>
        <Button variant="tertiary" size="sm" onClick={reload}>다시 시도</Button>
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-mute"
              style={{ animation: 'esc-blink 1.2s infinite', animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (stats.totalQuestions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Icon name="target" size={28} className="text-ash" />
        <div className="text-center">
          <p className="text-ink text-[16px] font-medium">아직 등록된 질문이 없어요</p>
          <p className="text-mute text-[13px] mt-1">질문을 추가하고 면접 준비를 시작하세요</p>
        </div>
        <Button variant="primary" size="sm" icon="plus" onClick={() => onNavigate?.('learn')}>
          첫 질문 추가하기
        </Button>
      </div>
    )
  }

  const masteredPct = Math.round((stats.mastered / stats.totalQuestions) * 100)
  const hasActivity = stats.recentActivity.length > 0
  const hasTrend = stats.scoreTrend.length > 0

  return (
    <div className="max-w-[1080px] mx-auto px-10 pt-10 pb-16 overflow-auto h-full">

      {/* ─── 상단: 핵심 지표 + 행동 ─── */}
      <div className="esc-noise flex items-center gap-6 mb-12 bg-surface border border-hairline rounded-xl px-6 py-5">
        <ScoreRing score={stats.avgScore} size={88} label="평균" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-ink text-[13px] font-medium">질문 {stats.totalQuestions}</span>
            <span className="text-mute text-[13px]">마스터 {stats.mastered} ({masteredPct}%)</span>
            <span className="text-mute text-[13px]">오늘 {stats.todayLearned}</span>
            {stats.bestStreak > 0 && (
              <span className="text-mute text-[13px] flex items-center gap-1">
                <Icon name="flame" size={12} stroke="var(--accent-red)" />
                {stats.bestStreak}
              </span>
            )}
          </div>
          <p className="text-stone text-[11px] italic">"The only way out is through."</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="tertiary" size="sm" icon="infinity" onClick={() => onNavigate?.('endless')}>무한</Button>
          <Button variant="primary" size="sm" icon="mic" onClick={() => onNavigate?.('interview')}>면접 시작</Button>
        </div>
      </div>

      {/* ─── 중단: 약한 질문 + 카테고리 ─── */}
      <div className="grid grid-cols-[3fr_2fr] gap-10 mb-12">
        <div>
          <h2 className="text-mute text-[12px] font-medium uppercase tracking-wider mb-2">약한 질문</h2>
          {stats.weakQuestions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-stone">약한 질문이 없어요</p>
              <p className="text-[11px] text-stone mt-1">학습을 시작하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {stats.weakQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => onNavigate?.('learn', { questionId: q.id })}
                  className="flex items-center gap-3 px-2 py-2.5 -mx-2 rounded-md hover:bg-surface-elevated focus-visible:outline focus-visible:outline-1 focus-visible:outline-hairline-strong transition-colors text-left"
                >
                  <ScoreRing score={q.averageScore} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-body truncate">{q.question}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CategoryTag category={q.category} />
                      <span className="text-[10px] text-stone">{q.attempts}회</span>
                    </div>
                  </div>
                  <Icon name="chevright" size={12} className="text-stone" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-mute text-[12px] font-medium uppercase tracking-wider mb-2">카테고리</h2>
          {stats.categoryStats.length === 0 ? (
            <p className="text-[13px] text-stone py-8 text-center">질문을 추가하면 카테고리별 현황이 표시됩니다</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.categoryStats.map((cat) => (
                <div key={cat.category} className="flex items-center gap-2">
                  <span className="text-[11px] text-mute w-16 shrink-0 truncate">{cat.category}</span>
                  <div className="flex-1 h-1 rounded-full bg-surface-card">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.avg * 10}%`, background: scoreColor(cat.avg) }}
                    />
                  </div>
                  <span className="text-[11px] font-medium w-5 text-right tabular-nums" style={{ color: scoreColor(cat.avg) }}>
                    {cat.avg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── 하단: 차트 + 활동 ─── */}
      {(hasTrend || hasActivity) && (
        <div className={`grid gap-10 ${hasTrend && hasActivity ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {hasTrend && (
            <div>
              <h2 className="text-mute text-[12px] font-medium uppercase tracking-wider mb-2">면접 추이</h2>
              <div className="bg-surface border border-hairline rounded-lg p-4 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.scoreTrend}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="var(--ink)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="var(--stone)" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="var(--stone)" tick={{ fontSize: 10 }} width={28} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 6, fontSize: 12 }}
                      labelStyle={{ color: 'var(--mute)' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="var(--ink)" strokeWidth={1.5} fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {hasActivity && (
            <div>
              <h2 className="text-mute text-[12px] font-medium uppercase tracking-wider mb-2">최근 활동</h2>
              <div className="flex flex-col">
                {stats.recentActivity.slice(0, 5).map((act, i) => {
                  const mode = MODE_ICON[act.mode] ?? MODE_ICON.learn
                  return (
                    <div key={i} className="flex items-center gap-2.5 py-2 border-b border-hairline-soft last:border-0">
                      <Icon name={mode.icon} size={13} stroke={`var(--accent-${mode.accent})`} />
                      <span className="text-[12px] text-body flex-1 truncate">{act.title}</span>
                      <span className="text-[10px] text-stone tabular-nums">{timeAgo(act.time)}</span>
                      {act.grade && (
                        <span className="text-[12px] font-medium tabular-nums" style={{ color: scoreColor(act.score ?? 0, 100) }}>
                          {act.grade}
                        </span>
                      )}
                      {act.score != null && !act.grade && (
                        <span className="text-[12px] font-medium tabular-nums" style={{ color: scoreColor(act.score) }}>
                          {act.score}
                        </span>
                      )}
                      {act.streak != null && (
                        <span className="text-accent-red text-[12px] font-medium flex items-center gap-0.5 tabular-nums">
                          <Icon name="flame" size={10} stroke="var(--accent-red)" />{act.streak}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!hasTrend && !hasActivity && (
        <div className="py-8 text-center">
          <p className="text-[13px] text-stone">면접이나 학습을 진행하면 여기에 기록이 표시됩니다</p>
        </div>
      )}
    </div>
  )
}
