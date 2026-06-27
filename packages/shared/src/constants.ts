export const AGENTS = [
  { id: 'interviewer' as const, name: '면접관', accent: 'red', icon: 'mic', description: '답변 평가 + 꼬리질문' },
  { id: 'tutor' as const, name: 'CS 튜터', accent: 'green', icon: 'book', description: '개념 설명 + 보충' },
  { id: 'researcher' as const, name: '리서처', accent: 'blue', icon: 'search', description: '공식문서 검색' },
  { id: 'diagrammer' as const, name: '다이어그래머', accent: 'purple', icon: 'diagram', description: '개념 시각화' },
]

export const TECHNICAL_CATEGORIES = [
  'JavaScript', 'TypeScript', 'React', 'CSS', 'HTML',
  '네트워크', '브라우저', 'CS 기초', '자료구조',
  '알고리즘', '운영체제', '데이터베이스',
] as const

export const BEHAVIORAL_CATEGORIES = [
  '협업', '문제 해결', '경험', '동기', '성장', '리더십', '갈등 관리',
] as const

export const OPINION_CATEGORIES = [
  '기술 선택', '개발 철학', '협업 방식', '커리어', 'AI 활용',
] as const

export const CATEGORIES = [
  ...TECHNICAL_CATEGORIES,
  ...BEHAVIORAL_CATEGORIES,
  ...OPINION_CATEGORIES,
] as const

export const CAT_ACCENT: Record<string, string> = {
  JavaScript: 'blue', TypeScript: 'yellow', React: 'blue',
  CSS: 'purple', HTML: 'red', '네트워크': 'green',
  '브라우저': 'green', 'CS 기초': 'purple', '자료구조': 'blue',
  '알고리즘': 'red', '운영체제': 'yellow', '데이터베이스': 'green',
  '협업': 'green', '문제 해결': 'red', '경험': 'blue',
  '동기': 'yellow', '성장': 'green', '리더십': 'purple', '갈등 관리': 'red',
  '기술 선택': 'blue', '개발 철학': 'purple', '협업 방식': 'green',
  '커리어': 'yellow', 'AI 활용': 'red',
}

export const BEHAVIORAL_CATEGORIES_SET = new Set<string>(BEHAVIORAL_CATEGORIES)
export const OPINION_CATEGORIES_SET = new Set<string>(OPINION_CATEGORIES)

// Client → Server WebSocket 이벤트
export const ClientEvent = {
  CHAT_SEND: 'chat:send',
  SESSION_LOAD: 'session:load',
  HINT_REQUEST: 'hint:request',
  HINT_LOAD: 'hint:load',
  SANDBOX_SEND: 'sandbox:send',
  INTERVIEW_EVAL: 'interview:eval',
  INTERVIEW_SUMMARY: 'interview:summary',
  INTERVIEW_SAVE: 'interview:save',
  QUESTIONS_GENERATE: 'questions:generate',
} as const

export type ClientEventType = typeof ClientEvent[keyof typeof ClientEvent]

// Server → Client WebSocket 이벤트
export const ServerEvent = {
  CHAT_TYPING: 'chat:typing',
  CHAT_RESPONSE: 'chat:response',
  CHAT_ERROR: 'chat:error',
  SESSION_CREATED: 'session:created',
  SESSION_LOADED: 'session:loaded',
  HINT_LOADING: 'hint:loading',
  HINT_RESPONSE: 'hint:response',
  HINT_LOADED: 'hint:loaded',
  SANDBOX_TYPING: 'sandbox:typing',
  SANDBOX_CREATED: 'sandbox:created',
  SANDBOX_RESPONSE: 'sandbox:response',
  INTERVIEW_EVALUATING: 'interview:evaluating',
  INTERVIEW_EVAL_RESULT: 'interview:evalResult',
  INTERVIEW_SUMMARIZING: 'interview:summarizing',
  INTERVIEW_SUMMARY_RESULT: 'interview:summaryResult',
  INTERVIEW_SAVED: 'interview:saved',
  QUESTIONS_GENERATING: 'questions:generating',
  QUESTIONS_GENERATED: 'questions:generated',
} as const

export type ServerEventType = typeof ServerEvent[keyof typeof ServerEvent]
