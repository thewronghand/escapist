import { useState, useEffect, useCallback, useRef } from 'react'
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
      }
    })

    return unsub
  }, [])

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

  const reset = useCallback(() => {
    setMessages([])
    setSandboxId(null)
  }, [])

  return { messages, typing, sendMessage, reset }
}
