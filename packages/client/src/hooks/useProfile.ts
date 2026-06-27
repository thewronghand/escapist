import { useState, useEffect, useCallback } from 'react'
import type { UserProfile } from '@/types'

const DEFAULT_PROFILE: UserProfile = {
  jobRole: 'frontend',
  experienceLevel: 'junior',
  techStack: [],
  interestStack: [],
  aiTools: [],
  memo: '',
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json() as UserProfile
        setProfile(data)
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (data: UserProfile) => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const saved = await res.json() as UserProfile
        setProfile(saved)
        return true
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
    return false
  }, [])

  return { profile, loading, saving, save, reload: load }
}
