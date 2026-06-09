import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useStats } from '@/hooks/useStats'
import { Icon } from '@/components/ui/Icon'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { Button } from '@/components/ui/Button'
import { scoreColor } from '@/lib/utils'

interface DashboardPageProps {
  onNavigate?: (nav: string) => void
}

function StatCard({ icon, label, accent, children }: {
  icon: string; label: string; accent: string; children: React.ReactNode
}) {
  const bgClass: Record<string, string> = {
    blue: 'bg-accent-blue-soft', green: 'bg-accent-green-soft',
    yellow: 'bg-accent-yellow-soft', red: 'bg-accent-red-soft',
  }
  const fgClass: Record<string, string> = {
    blue: 'text-accent-blue', green: 'text-accent-green',
    yellow: 'text-accent-yellow', red: 'text-accent-red',
  }
  return (
    <div className="bg-surface border border-hairline rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${bgClass[accent] ?? ''}`}>
          <Icon name={icon} size={14} stroke={`var(--accent-${accent})`} />
        </div>
        <span className="text-[13px] text-mute">{label}</span>
      </div>
      <div className={fgClass[accent] ?? ''}>{children}</div>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  return `${Math.floor(hrs / 24)}일 전`
}

const MODE_ICON: Record<string, { icon: string; accent: string }> = {
  learn: { icon: 'book', accent: 'blue' },
  interview: { icon: 'mic', accent: 'red' },
  endless: { icon: 'infinity', accent: 'yellow' },
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { stats, loading } = useStats()

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-mute text-[14px]">로딩 중...</span>
      </div>
    )
  }

  return (
    <div className="max-w-[1180px] mx-auto px-10 py-8 overflow-auto">
      {/* 히어로 */}
      <div className="relative overflow-hidden rounded-xl p-8 mb-8" style={{ minHeight: 140 }}>
        <div className="esc-stripe-band" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-mute text-[13px] mb-2">면접까지 함께 달려요</p>
            <h1 className="text-ink text-[32px] font-semibold tracking-tight leading-tight">
              오늘도 한 발 더,<br />기초를 단단하게.
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="tertiary" icon="infinity" onClick={() => onNavigate?.('endless')}>무한 모드</Button>
            <Button variant="primary" icon="mic" onClick={() => onNavigate?.('interview')}>오늘의 면접 시작</Button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon="list" label="총 질문 수" accent="blue">
          <p className="text-ink text-[28px] font-bold">{stats.totalQuestions}</p>
        </StatCard>
        <StatCard icon="trophy" label="마스터한 질문" accent="green">
          <p className="text-ink text-[28px] font-bold">{stats.mastered}<span className="text-mute text-[16px]"> / {stats.totalQuestions}</span></p>
          <div className="h-1.5 rounded-full bg-surface-card mt-2">
            <div
              className="h-full rounded-full bg-accent-green transition-all"
              style={{ width: `${stats.totalQuestions > 0 ? (stats.mastered / stats.totalQuestions) * 100 : 0}%` }}
            />
          </div>
        </StatCard>
        <StatCard icon="target" label="평균 점수" accent="yellow">
          <p className="text-[28px] font-bold" style={{ color: scoreColor(stats.avgScore) }}>
            {stats.avgScore}<span className="text-mute text-[16px]">/10</span>
          </p>
        </StatCard>
        <StatCard icon="flame" label="오늘 학습 / 최고 스트릭" accent="red">
          <div className="flex items-baseline gap-3">
            <span className="text-ink text-[28px] font-bold">{stats.todayLearned}</span>
            <span className="text-accent-red text-[20px] font-bold">🔥 {stats.bestStreak}</span>
          </div>
        </StatCard>
      </div>

      {/* 약한 질문 + 카테고리 */}
      <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: '1.15fr 1fr' }}>
        {/* 약한 질문 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-ink text-[18px] font-semibold">약한 질문</h2>
            <span className="text-[12px] text-mute">점수 낮은 순</span>
          </div>
          {stats.weakQuestions.length === 0 ? (
            <p className="text-[13px] text-stone py-4">약한 질문이 없어요!</p>
          ) : (
            <div className="flex flex-col gap-1">
              {stats.weakQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => onNavigate?.('learn')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-hairline bg-surface hover:bg-surface-elevated transition-colors text-left"
                >
                  <ScoreRing score={q.averageScore} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-ink truncate">{q.question}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CategoryTag category={q.category} />
                      <span className="text-[11px] text-stone">{q.attempts}회 시도</span>
                    </div>
                  </div>
                  <Icon name="chevright" size={14} className="text-ash" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 카테고리별 현황 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-ink text-[18px] font-semibold">카테고리별 현황</h2>
            <span className="text-[12px] text-mute">평균 점수 낮은 순</span>
          </div>
          <div className="flex flex-col gap-2">
            {stats.categoryStats.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-[13px] text-mute w-[84px] shrink-0 truncate">{cat.category}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-card">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.avg * 10}%`, background: scoreColor(cat.avg) }}
                  />
                </div>
                <span className="text-[13px] font-medium w-8 text-right" style={{ color: scoreColor(cat.avg) }}>
                  {cat.avg}
                </span>
                <span className="text-[11px] text-stone w-10 text-right">{cat.count}문제</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 점수 추이 */}
      {stats.scoreTrend.length > 0 && (
        <div className="mb-8">
          <h2 className="text-ink text-[18px] font-semibold mb-3">면접 점수 추이</h2>
          <div className="bg-surface border border-hairline rounded-lg p-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.scoreTrend}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--stone)" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="var(--stone)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: 'var(--mute)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#ffffff" strokeWidth={2} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 최근 활동 */}
      {stats.recentActivity.length > 0 && (
        <div>
          <h2 className="text-ink text-[18px] font-semibold mb-3">최근 활동</h2>
          <div className="flex flex-col gap-1">
            {stats.recentActivity.map((act, i) => {
              const mode = MODE_ICON[act.mode] ?? MODE_ICON.learn
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-hairline last:border-0">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-accent-${mode.accent}-soft`}>
                    <Icon name={mode.icon} size={14} stroke={`var(--accent-${mode.accent})`} />
                  </div>
                  <span className="text-[14px] text-body flex-1 truncate">{act.title}</span>
                  <span className="text-[12px] text-mute">{timeAgo(act.time)}</span>
                  {act.grade && (
                    <span className="text-[14px] font-bold" style={{ color: scoreColor(act.score ?? 0, 100) }}>
                      {act.grade}
                    </span>
                  )}
                  {act.score != null && !act.grade && (
                    <span className="text-[14px] font-medium" style={{ color: scoreColor(act.score) }}>
                      {act.score}
                    </span>
                  )}
                  {act.streak != null && (
                    <span className="text-accent-red text-[14px] font-medium">🔥{act.streak}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
