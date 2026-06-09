import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChatMessage, AgentId, Session } from '@/types'
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
        case 'session:loaded': {
          const session = data.session as Session
          setSessionId(session.id)
          setMessages(session.messages ?? [])
          questionRef.current = { id: session.questionId, text: session.questionText }
          break
        }
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

  const loadSession = useCallback((id: string) => {
    setMessages([])
    setTyping(false)
    send({ type: 'session:load', sessionId: id })
  }, [])

  const sendMessage = useCallback((text: string, agentOverride?: AgentId) => {
    const isSkip = text === '__SKIP__'
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: isSkip ? 'system' : 'user',
      text: isSkip ? '모르겠다' : text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    const effectiveAgent = agentOverride ?? agent

    if (!sessionId && questionRef.current) {
      send({
        type: 'chat:send',
        questionId: questionRef.current.id,
        questionText: questionRef.current.text,
        message: text,
        agent: effectiveAgent,
      })
    } else {
      send({
        type: 'chat:send',
        sessionId,
        message: text,
        agent: effectiveAgent,
      })
    }
  }, [sessionId, agent])

  const activeQuestion = questionRef.current

  return {
    messages,
    typing,
    sessionId,
    agent,
    setAgent,
    startChat,
    loadSession,
    sendMessage,
    activeQuestion,
  }
}
