export function DashboardPage() {
  return (
    <div className="p-10 max-w-[1180px] mx-auto">
      <div className="relative overflow-hidden rounded-xl p-8 mb-8" style={{ minHeight: 140 }}>
        <div className="esc-stripe-band" />
        <div className="relative">
          <p className="text-mute text-[13px] mb-2">면접까지 함께 달려요</p>
          <h1 className="text-ink text-[32px] font-semibold tracking-tight leading-tight">
            오늘도 한 발 더,<br />
            기초를 단단하게.
          </h1>
        </div>
      </div>
      <p className="text-mute text-[14px]">대시보드는 Phase 3에서 구현됩니다.</p>
    </div>
  )
}
