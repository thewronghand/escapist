import { trpc } from '@/lib/trpc'
import { useToast } from '@/components/ui/Toast'
import type { AdminCommandType } from '@escapist/shared'

export function useAdmin() {
  const { toast } = useToast()

  const statusQuery = trpc.admin.status.useQuery(undefined, {
    refetchInterval: 10_000,
  })

  const logsQuery = trpc.admin.getLogs.useQuery({ limit: 200 })

  const recentCommandsQuery = trpc.admin.getRecentCommands.useQuery({ limit: 20 }, {
    refetchInterval: 5_000,
  })

  const sendCommandMutation = trpc.admin.sendCommand.useMutation({
    onSuccess: () => {
      void recentCommandsQuery.refetch()
    },
    onError: (err) => {
      toast(err.message, 'error')
    },
  })

  const sendCommand = (command: AdminCommandType, payload?: string) => {
    sendCommandMutation.mutate({ command, payload })
  }

  return {
    adminSessionConnected: statusQuery.data?.adminSessionConnected ?? false,
    statusLoading: statusQuery.isLoading,
    logs: logsQuery.data?.lines ?? [],
    logsLoading: logsQuery.isLoading,
    recentCommands: recentCommandsQuery.data ?? [],
    sendCommand,
    isSending: sendCommandMutation.isPending,
    refetchLogs: logsQuery.refetch,
  }
}
