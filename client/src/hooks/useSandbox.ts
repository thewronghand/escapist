import { useState, useEffect, useCallback, useRef } from 'react'
import type { SessionSummary } from '@/types'
import { connect, send, subscribe } from '@/lib/ws'

interface SandboxMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
}

export function useSandbox() {
  const [messages, setMessages] = useState<SandboxMessage[]>([])
  const [typing, setTyping] = useState(false)
  const [sandboxId, setSandboxId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const connectedRef = useRef(false)

  useEffect(() => {
    if (!connectedRef.current) {
      connect()
      connectedRef.current = true
    }

    const unsub = subscribe((data) => {
      switch (data.type) {
        case 'sandbox:typing':
          setTyping(true)
          break
        case 'sandbox:created':
          setSandboxId(data.sandboxId as string)
          break
        case 'sandbox:response': {
          setTyping(false)
          const msg = data.message as { id: string; text: string; timestamp: string }
          setMessages((prev) => [...prev, { ...msg, role: 'assistant' }])
          break
        }
        case 'session:loaded': {
          const session = data.session as { id: string; mode?: string; messages: SandboxMessage[] }
          // 샌드박스 세션만 처리 (학습 세션 무시)
          if (!session.id.startsWith('sb_') && session.mode !== 'sandbox') break
          setSandboxId(session.id)
          setMessages(session.messages ?? [])
          break
        }
      }
    })

    return unsub
  }, [])

  // 세션 목록 조회
  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/sessions?mode=sandbox')
      if (res.ok) {
        const data = await res.json() as SessionSummary[]
        setSessions(data)
      }
    } catch (err) {
      console.error('Failed to load sandbox sessions:', err)
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => { refreshSessions() }, [refreshSessions])

  // 메시지 전송
  const sendMessage = useCallback((text: string) => {
    const userMsg: SandboxMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    send({
      type: 'sandbox:send',
      sandboxId,
      message: text,
    })
  }, [sandboxId])

  // 세션 로드
  const loadSession = useCallback((id: string) => {
    setMessages([])
    setTyping(false)
    send({ type: 'session:load', sessionId: id })
  }, [])

  // 새 대화 시작
  const createSession = useCallback(() => {
    setMessages([])
    setSandboxId(null)
  }, [])

  // 세션 삭제
  const deleteSession = useCallback(async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (sandboxId === id) {
        setMessages([])
        setSandboxId(null)
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }, [sandboxId])

  // 세션 생성/전환 후 목록 갱신
  useEffect(() => {
    if (sandboxId) refreshSessions()
  }, [sandboxId, refreshSessions])

  return {
    messages,
    typing,
    sandboxId,
    sessions,
    sessionsLoading,
    sendMessage,
    loadSession,
    createSession,
    deleteSession,
    refreshSessions,
  }
}
