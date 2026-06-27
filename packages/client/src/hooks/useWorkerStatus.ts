import { useState, useEffect } from 'react'

export function useWorkerStatus() {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('/api/health')
        if (!res.ok) { setConnected(false); return }
        const data = await res.json() as { cliWorker: boolean }
        if (!cancelled) setConnected(data.cliWorker)
      } catch {
        if (!cancelled) setConnected(false)
      }
    }

    void check()
    const id = setInterval(() => { void check() }, 15_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return connected
}
