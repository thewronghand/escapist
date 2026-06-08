import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChatMessage, AgentId } from '@/types'
import { connect, send, subscribe } from '@/lib/ws'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typing, setTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [agent, setAgent] = useState<AgentId>('interviewer')
  const questionRef = useRef<{ id: string; text: string } | null>(null)
  const connectedRef = useRef(false)

  useEffect(() => {
    if (!connectedRef.current) {
      connect()
      connectedRef.current = true
    }

    const unsub = subscribe((data) => {
      switch (data.type) {
        case 'chat:typing':
          setTyping(true)
          break
        case 'chat:response':
          setTyping(false)
          setMessages((prev) => [...prev, data.message as ChatMessage])
          break
        case 'session:created':
          setSessionId(data.sessionId as string)
          break
        case 'chat:error':
          setTyping(false)
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'system',
              text: `Error: ${data.error}`,
              timestamp: new Date().toISOString(),
            },
          ])
          break
      }
    })

    return unsub
  }, [])

  const startChat = useCallback((questionId: string, questionText: string) => {
    setMessages([])
    setSessionId(null)
    questionRef.current = { id: questionId, text: questionText }
  }, [])

  const sendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    if (!sessionId && questionRef.current) {
      // 첫 답변 → 새 세션 생성
      send({
        type: 'chat:send',
        questionId: questionRef.current.id,
        questionText: questionRef.current.text,
        message: text,
        agent,
      })
    } else {
      // 이어가기
      send({
        type: 'chat:send',
        sessionId,
        message: text,
        agent,
      })
    }
  }, [sessionId, agent])

  return {
    messages,
    typing,
    sessionId,
    agent,
    setAgent,
    startChat,
    sendMessage,
  }
}
