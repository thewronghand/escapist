import { atom } from 'jotai'
import type { ChatMessage, AgentId } from '@/types'

export const chatMessagesAtom = atom<ChatMessage[]>([])
export const chatTypingAtom = atom(false)
export const chatSessionIdAtom = atom<string | null>(null)
export const chatAgentAtom = atom<AgentId>('interviewer')
export const chatActiveQuestionAtom = atom<{ id: string; text: string } | null>(null)
export const learnViewAtom = atom<'select' | 'session'>('select')
