import { useRouter } from '@tanstack/react-router'
import { SettingsPage } from '@/pages/SettingsPage'

export function SettingsPageWrapper() {
  const router = useRouter()
  return (
    <SettingsPage
      onBack={() => router.history.back()}
      onAdmin={() => router.navigate({ to: '/admin' })}
    />
  )
}
