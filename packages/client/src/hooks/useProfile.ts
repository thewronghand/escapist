import { useCallback } from 'react'
import type { UserProfile } from '@/types'
import { trpc } from '@/lib/trpc'

const DEFAULT_PROFILE: UserProfile = {
  jobRole: 'frontend',
  experienceLevel: 'junior',
  techStack: [],
  interestStack: [],
  aiTools: [],
  memo: '',
}

export function useProfile() {
  const { data: profile = DEFAULT_PROFILE, isLoading: loading, refetch } = trpc.profile.get.useQuery()
  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => { void refetch() },
  })

  const save = useCallback(async (data: UserProfile) => {
    try {
      await updateMutation.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }, [updateMutation])

  return { profile, loading, saving: updateMutation.isPending, save, reload: () => { void refetch() } }
}
