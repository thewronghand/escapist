export interface Question {
  id: string
  question: string
  category: string
  tags: string[]
  difficulty: number
  status: 'unlearned' | 'learning' | 'weak' | 'master'
  bestScore: number | null
  averageScore: number | null
  attempts: number
  createdAt: string
  lastAttemptAt: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'interviewer' | 'tutor' | 'researcher' | 'diagrammer' | 'system'
  text: string
  evaluation?: Evaluation
  diagram?: string
  timestamp: string
}

export interface Evaluation {
  score: number
  feedback: string
  improvements: string[]
  modelAnswer: string
  breakdown: Record<string, number>
  followUpQuestions: string[]
}

export interface Session {
  id: string
  claudeSessionId: string
  questionId: string
  mode: string
  agent: string
  createdAt: string
}

export type AgentId = 'interviewer' | 'tutor' | 'researcher' | 'diagrammer'

export interface Agent {
  id: AgentId
  name: string
  accent: string
  icon: string
  description: string
}

export const AGENTS: Agent[] = [
  { id: 'interviewer', name: '면접관', accent: 'red', icon: 'mic', description: '답변 평가 + 꼬리질문' },
  { id: 'tutor', name: 'CS 튜터', accent: 'green', icon: 'book', description: '개념 설명 + 보충' },
  { id: 'researcher', name: '리서처', accent: 'blue', icon: 'search', description: '공식문서 검색' },
  { id: 'diagrammer', name: '다이어그래머', accent: 'purple', icon: 'diagram', description: '개념 시각화' },
]

export const CATEGORIES = [
  'JavaScript', 'TypeScript', 'React', 'CSS', 'HTML',
  '네트워크', '브라우저', 'CS 기초', '자료구조',
  '알고리즘', '운영체제', '데이터베이스',
] as const

export const CAT_ACCENT: Record<string, string> = {
  JavaScript: 'blue', TypeScript: 'yellow', React: 'blue',
  CSS: 'purple', HTML: 'red', '네트워크': 'green',
  '브라우저': 'green', 'CS 기초': 'purple', '자료구조': 'blue',
  '알고리즘': 'red', '운영체제': 'yellow', '데이터베이스': 'green',
}
