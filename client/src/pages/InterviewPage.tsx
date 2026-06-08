import { EmptyState } from '@/components/ui/EmptyState'

export function InterviewPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <EmptyState
        icon="mic"
        title="면접 기록이 없어요"
        description="오늘의 면접을 시작해보세요!"
        action={{ label: '면접 시작', onClick: () => {} }}
      />
    </div>
  )
}
