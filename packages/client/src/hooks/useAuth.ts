import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/api'

interface AuthUser {
  email: string
  name: string
  picture: string
}

interface AuthStatus {
  authenticated: boolean
  user?: AuthUser
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: () => request<AuthStatus>('/auth/me'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const logoutMutation = useMutation({
    mutationFn: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(['auth'], { authenticated: false })
      window.location.href = '/login'
    },
  })

  return {
    user: data?.user ?? null,
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    logout: () => logoutMutation.mutate(),
  }
}
