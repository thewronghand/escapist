import { trpc } from '@/lib/trpc'
import type { Stats } from '@/types'

export type { Stats }

export function useStats() {
  const { data: stats = null, isLoading: loading, error: queryError, refetch } = trpc.stats.get.useQuery()

  return {
    stats,
    loading,
    error: queryError ? (queryError instanceof Error ? queryError.message : '통계를 불러올 수 없습니다') : null,
    reload: refetch,
  }
}
