export type InterviewType = 'technical' | 'behavioral' | 'opinion'

export type QuestionStatus = 'unlearned' | 'learning' | 'weak' | 'master'

export interface Question {
  id: string
  question: string
  category: string
  interviewType: InterviewType
  tags: string[]
  difficulty: number
  status: QuestionStatus
  bestScore: number | null
  averageScore: number | null
  attempts: number
  createdAt: string
  lastAttemptAt: string | null
}

export interface Evaluation {
  score: number
  feedback: string
  improvements: string[]
  modelAnswer: string
  breakdown: Record<string, number>
  followUpQuestions: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'interviewer' | 'tutor' | 'researcher' | 'diagrammer' | 'system' | 'skip'
  text: string
  evaluation?: Evaluation
  diagram?: string
  timestamp: string
}

export interface FollowUpNode {
  id: string
  question: string
  answer?: string
  score?: number
  status: 'answered' | 'unanswered' | 'current'
  children: FollowUpNode[]
}

export interface SessionSummary {
  id: string
  questionId: string
  questionText: string
  mode: string
  agent: string
  createdAt: string
  lastActivityAt?: string
  messageCount: number
}

export interface Session {
  id: string
  claudeSessionId: string
  questionId: string
  questionText: string
  mode: string
  agent: string
  messages: ChatMessage[]
  createdAt: string
  lastActivityAt?: string
}

export type AgentId = 'interviewer' | 'tutor' | 'researcher' | 'diagrammer'

export interface Agent {
  id: AgentId
  name: string
  accent: string
  icon: string
  description: string
}

export interface UserProfile {
  jobRole: string
  experienceLevel: string
  techStack: string[]
  interestStack: string[]
  aiTools: string[]
  memo: string
}

// server ws/handler.ts 로컬 타입들
export interface MessageEntry {
  id: string
  role: string
  text: string
  agent?: string
  timestamp: string
}

export interface HintEntry {
  level: number
  content: string
  createdAt: string
}

export interface StoredSession {
  id: string
  claudeSessionId: string
  questionId: string
  questionText: string
  mode: string
  agent: string
  messages?: MessageEntry[]
  hints?: HintEntry[]
  hintSessionId?: string
  createdAt: string
  lastActivityAt?: string
}

export interface ClientMessage {
  type: string
  sessionId?: string
  questionId?: string
  questionText?: string
  message?: string
  agent?: string
  hintLevel?: number
  sandboxId?: string
  questionForEval?: string
  answerForEval?: string
  interviewData?: Record<string, unknown>
  interviewType?: string
  generateType?: string
  generateCount?: number
}

export interface WeakQuestion {
  id: string
  question: string
  category: string
  averageScore: number
  attempts: number
}

export interface CategoryStat {
  category: string
  count: number
  avg: number
}

export interface ScoreTrendPoint {
  day: string
  score: number
}

export interface ActivityItem {
  mode: string
  title: string
  score?: number
  grade?: string
  streak?: number
  time: string
}

export interface Stats {
  totalQuestions: number
  mastered: number
  avgScore: number
  todayLearned: number
  bestStreak: number
  weakQuestions: WeakQuestion[]
  categoryStats: CategoryStat[]
  scoreTrend: ScoreTrendPoint[]
  recentActivity: ActivityItem[]
}

export interface QuestionRecord {
  id: string
  bestScore: number | null
  averageScore: number | null
  attempts: number
  status: string
  lastAttemptAt: string | null
}
