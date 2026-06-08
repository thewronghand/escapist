import { EmptyState } from '@/components/ui/EmptyState'

export function EndlessPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <EmptyState
        icon="infinity"
        title="무한 모드"
        description="질문이 떨어질 때까지 도전하세요!"
        action={{ label: '도전 시작', onClick: () => {} }}
      />
    </div>
  )
}
