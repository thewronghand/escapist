import { useState, useEffect, useCallback, useRef } from 'react'
import { send, subscribe } from '@/lib/ws'
import { parseClaudeJson } from '@/lib/utils'

interface HintJson {
  type?: string
  level?: number
  content?: string
}

interface Hint {
  level: number
  content: string
}

const MAX_HINTS = 5

export function useHints() {
  const [hints, setHints] = useState<Hint[]>([])
  const [loading, setLoading] = useState(false)
  const questionRef = useRef<{ id: string; text: string } | null>(null)

  useEffect(() => {
    const unsub = subscribe((data) => {
      switch (data.type) {
        case 'hint:loading':
          setLoading(true)
          break
        case 'hint:response': {
          setLoading(false)

          // 서버에서 전체 힌트 배열을 보내줌 — content 파싱 처리
          const serverHints = data.hints as Array<{ level: number; content: string }>
          if (serverHints) {
            setHints(serverHints.map((h) => {
              const { parsed } = parseClaudeJson<HintJson>(h.content)
              return { level: h.level, content: parsed?.content ?? h.content }
            }))
          }
          break
        }
        case 'hint:loaded': {
          // 기존 힌트 로드
          const loadedHints = data.hints as Array<{ level: number; content: string }>
          if (loadedHints?.length) {
            setHints(loadedHints.map((h) => {
              const { parsed } = parseClaudeJson<HintJson>(h.content)
              return { level: h.level, content: parsed?.content ?? h.content }
            }))
          } else {
            setHints([])
          }
          break
        }
        case 'chat:error':
          setLoading(false)
          break
      }
    })
    return unsub
  }, [])

  const initForQuestion = useCallback((questionId: string, questionText: string) => {
    setHints([])
    questionRef.current = { id: questionId, text: questionText }

    // 서버에서 기존 힌트 로드
    send({
      type: 'hint:load',
      questionId,
    })
  }, [])

  const requestHint = useCallback(() => {
    if (!questionRef.current) return
    if (hints.length >= MAX_HINTS) return
    if (loading) return

    send({
      type: 'hint:request',
      questionId: questionRef.current.id,
      questionText: questionRef.current.text,
    })
  }, [hints.length, loading])

  return {
    hints,
    loading,
    canRequestMore: hints.length < MAX_HINTS,
    remainingHints: MAX_HINTS - hints.length,
    requestHint,
    initForQuestion,
  }
}
