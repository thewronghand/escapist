// 모든 타입은 @escapist/shared에서 관리됩니다
export type {
  InterviewType,
  QuestionStatus,
  Question,
  Evaluation,
  ChatMessage,
  FollowUpNode,
  SessionSummary,
  Session,
  AgentId,
  Agent,
  UserProfile,
  MessageEntry,
  HintEntry,
  StoredSession,
  ClientMessage,
  QuestionRecord,
} from '@escapist/shared'

export {
  AGENTS,
  TECHNICAL_CATEGORIES,
  BEHAVIORAL_CATEGORIES,
  OPINION_CATEGORIES,
  CATEGORIES,
  CAT_ACCENT,
  BEHAVIORAL_CATEGORIES_SET,
  OPINION_CATEGORIES_SET,
  ClientEvent,
  ServerEvent,
} from '@escapist/shared'

export type { ClientEventType, ServerEventType } from '@escapist/shared'
