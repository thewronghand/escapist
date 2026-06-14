# Escapist

Claude CLI 세션 기반 면접 준비 앱. 질문 등록 → 답변 평가 → 꼬리질문으로 깊이를 파고드는 학습 도구.

> 기획서: `docs/PLAN.md` · 디자인 명세: `DESIGN.md` · 제품 전략: `PRODUCT.md`

---

## Critical Rules

- **`any` 타입 금지** — `unknown` 또는 구체적 타입 사용
- **import 경로는 절대 경로 `@/`** — 상대 경로 금지 (client 내)
- **커밋 메시지는 제목 한 줄만** — body, Co-Authored-By 등 포함 금지
- **main 브랜치에 직접 force push 금지**
- **Claude 응답은 반드시 `parseClaudeJson()`으로 파싱** — JSON이 마크다운 코드블록으로 감싸져 올 수 있음
- **서버 데이터는 SQLite** — fs JSON 직접 읽기/쓰기 금지 (store.ts 경유)
- **Tailwind 클래스에서 디자인 토큰 사용** — 하드코딩 색상/간격 지양, `bg-canvas`, `text-ink`, `border-hairline` 등 사용
- **새 UI 컴포넌트는 `@thewrong/ui` 우선** — 기존 자체 구현(Button, Modal, Toast 등)은 유지하되, 새로 필요한 컴포넌트는 `@thewrong/ui`에서 가져오기
- **WS 이벤트 격리** — `session:loaded` 등 공유 이벤트는 세션 ID prefix로 필터 (`s_` = learn, `sb_` = sandbox)

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트엔드 | React + Vite + TypeScript + Tailwind CSS v4 |
| 라우팅 | TanStack Router (코드 기반, View Transitions) |
| 서버 상태 | TanStack Query |
| 클라이언트 상태 | jotai (atoms) |
| 서버 | Node.js + Express + WebSocket (ws) |
| AI | Claude CLI (`claude -p`, `--resume`) via child_process |
| DB | SQLite (better-sqlite3) — `server/data/escapist.db` |
| 차트 | Recharts |
| 다이어그램 | Mermaid.js + React Flow (@xyflow/react) |
| 마크다운 | react-markdown + remark-gfm + react-syntax-highlighter (oneDark) |
| UI 라이브러리 | @thewrong/ui (새 컴포넌트 추가 시 우선 사용) |
| 디자인 | Raycast 기반 다크 테마 (tokens.css → Tailwind @theme) |

---

## 아키텍처

```
[React :5180] ←WebSocket→ [Express :8888] ←child_process→ [Claude CLI]
                                ↕
                        [SQLite escapist.db]
```

- **프론트 → 서버**: WebSocket으로 채팅/힌트/샌드박스/채점, REST로 CRUD/통계
- **서버 → Claude CLI**: `claude -p "..." --system-prompt "..." --output-format json`
- **세션 이어가기**: `claude --resume $SESSION_ID -p "..."`
- **REST API**: `/api/questions`, `/api/sessions`, `/api/stats`, `/api/profile`
- **Vite proxy**: `/api` → :8888, `/ws` → ws://:8888

### 레이어 의존 규칙

```
pages → components, hooks, stores
hooks → lib (ws.ts, api.ts, utils.ts)
stores → (jotai atoms, TanStack Query)
components → lib, types
lib → (외부 의존성만)
```

---

## 주요 디렉토리

```
client/src/
  components/
    layout/         # AppShell, NavRail, BottomNav, Header
    ui/             # Button, Icon, Modal, ScoreRing, Markdown, MermaidDiagram, Toast, Segmented, CategoryPicker, ColoredScore 등
    chat/           # ChatBubble, ChatInput, EvaluationCard, HintPopover, AgentSelector, FollowUpTree, FollowUpButtons
    learn/          # QuestionSelect, QuestionCard, QuestionFormModal, QuestionGenerateModal, LearnSidebar
    interview/      # InterviewSetup, InterviewProgress, InterviewResult
    endless/        # EndlessStart, EndlessProgress, GameOverScreen
    sandbox/        # SandboxOverlay, SandboxChat, SandboxInput
  contexts/         # AppContext (레거시, 점진적 제거 예정)
  hooks/            # useChat, useHints, useQuestions, useSandbox, useInterview, useStats, useProfile, useQuestionGenerator
  layouts/          # RootLayout (AppShell + Outlet + SandboxOverlay)
  lib/
    ws.ts           # WebSocket 클라이언트 (connect, send, subscribe, 연결 전 큐잉)
    api.ts          # REST fetch 래퍼
    utils.ts        # parseClaudeJson, scoreColor, gradeFor, cn, timeAgo
  pages/            # DashboardPage, LearnPage, InterviewPage, EndlessPage, SandboxPage, SettingsPage + Wrapper들
  stores/
    chat.ts         # jotai atoms (chatMessages, chatTyping, chatSessionId, chatAgent, learnView)
    queries.ts      # TanStack Query 정의 (questions, sessions, stats, profile)
  types/index.ts    # 타입 + 상수 (InterviewType, AGENTS, CATEGORIES, CAT_ACCENT, UserProfile)
  router.tsx        # TanStack Router 라우트 정의
  tokens.css        # 디자인 토큰 + View Transitions 애니메이션
  index.css         # Tailwind @theme 연동

server/src/
  claude/
    cli.ts          # startSession(), resumeSession()
    prompts.ts      # 에이전트별 프롬프트 (면접관, 인성, 의견, 튜터, 리서처, 다이어그래머, 힌트, 샌드박스, 질문생성) + buildGeneratorPrompt(profile)
  data/
    db.ts           # SQLite 초기화 (questions, sessions, user_profile 테이블)
    store.ts        # CRUD 유틸 (SQLite, snake↔camel 자동 변환)
  routes/
    questions.ts    # CRUD /api/questions
    sessions.ts     # GET /api/sessions?mode=, DELETE /api/sessions/:id
    stats.ts        # GET /api/stats (SQL 집계)
    profile.ts      # GET/PUT /api/profile
  ws/
    handler.ts      # WS 라우팅 (chat, hint, sandbox, interview, questions:generate)
```

---

## 라우팅

TanStack Router 기반. View Transitions API로 페이지 전환 애니메이션.

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | DashboardPage | 홈 (통계, 약한 질문, 차트) |
| `/learn` | LearnPage | 질문 목록 / 세션 탭 + 학습 채팅 |
| `/interview` | InterviewPage | 면접 설정 → 진행 → 결과 |
| `/endless` | EndlessPage | 무한 모드 |
| `/sandbox` | SandboxPage | 자유 질문 (전체 페이지) |
| `/settings` | SettingsPage | 프로필 설정 |

- 데스크톱: 컨텐츠만 페이드+슬라이드 (헤더/NavRail 고정)
- 모바일(<640px): 가로 슬라이드
- NavRail: 데스크톱 세로 메뉴 / BottomNav: 모바일 하단 탭바

---

## 개발 환경

```bash
npm run dev                     # client(:5180) + server(:8888) 동시 실행
```

### 검증 명령어

```bash
cd client && npx tsc --noEmit   # 클라이언트 타입 체크
cd client && npm run build      # 프로덕션 빌드
cd server && npx tsc --noEmit   # 서버 타입 체크
```

**작업 완료 후 반드시 클라이언트 빌드 확인.**

### GitHub CLI 인증

개인 계정(thewronghand)으로 push:
```bash
source .envrc && git push
```

### Git 설정

이 프로젝트는 `penfreak77@gmail.com` (thewronghand 개인 계정).

---

## Claude CLI 연동 주의사항

### 응답 파싱
- `--output-format json`이어도 `result`에 마크다운 코드블록으로 JSON 감싸져 올 수 있음
- **항상 `parseClaudeJson()` 사용** — 코드블록 제거 + JSON 추출 + fallback
- Markdown 컴포넌트: mermaid → MermaidDiagram, 코드블록 → react-syntax-highlighter

### 세션 관리
- `claude -p` 세션은 CLI `/resume` 피커에 안 뜸 — 사용자 작업 세션과 충돌 없음
- 세션 ID prefix로 모드 구분: `s_` (learn), `sb_` (sandbox), `h_`/`hints_` (hint), `iv_` (interview/endless)
- `session:loaded` 이벤트는 useChat/useSandbox에서 prefix 체크로 격리

### 특수 메시지 프로토콜
- `__SKIP__` → "모르겠다" (서버에서 explanation 프롬프트로 변환, UI에서 빨간 skip 버블)
- `__FOLLOWUP_ANSWER__{질문}__SEP__{답변}` → 꼬리질문 답변 (면접관 메시지로 표시 후 답변 평가)
- `__EXPLAIN__{질문}` → "알려줘요" (모범답변 즉시 요청)

### WS 메시지 프로토콜

| Client → Server | 용도 |
|----------------|------|
| `chat:send` | 학습 채팅 (세션 없으면 자동 생성, interviewType으로 프롬프트 분기) |
| `session:load` | 세션 + 메시지 이력 로드 |
| `hint:request` / `hint:load` | 힌트 요청/로드 (질문별 5단계) |
| `sandbox:send` | 샌드박스 채팅 (메시지 DB 저장) |
| `interview:eval` | 단건 채점 (면접/무한) |
| `interview:summary` | 면접 총평 |
| `interview:save` | 면접/무한 기록 저장 |
| `questions:generate` | 질문 자동 생성 (프로필 기반, 기존 질문 중복 방지) |

---

## 데이터 모델 (SQLite)

### questions
| 컬럼 | 설명 |
|------|------|
| id (TEXT PK) | `q_` prefix |
| interview_type | `'technical'` / `'behavioral'` / `'opinion'` |
| status | `unlearned` / `learning` / `weak` / `master` |
| best_score, average_score | 자동 갱신 (채점 시 서버에서 tryExtractScore → updateQuestionScore) |

### sessions
| 컬럼 | 설명 |
|------|------|
| id (TEXT PK) | prefix로 모드 구분: `s_`, `sb_`, `h_`/`hints_`, `iv_` |
| mode | `learn` / `hint` / `sandbox` / `interview` / `endless` |
| messages (JSON) | 채팅 메시지 배열 (learn, sandbox 모두 저장) |
| question_text | 세션 제목 (학습: 질문 전문, 샌드박스: 첫 메시지 30자) |

### user_profile
| 컬럼 | 설명 |
|------|------|
| id (INTEGER, 고정 1) | 단일 행 |
| job_role, experience_level | 직군, 경력 |
| tech_stack, interest_stack, ai_tools (JSON) | 스택 배열 |
| memo | 자유 메모 |

---

## Git 전략

- 기본적으로 **main에서 직접 작업**
- **대규모 변경이나 회귀 위험 있는 변경**은 서브 브랜치 따서 작업 후 main 머지
- 커밋 메시지: 한국어, 제목 한 줄만

---

## 배포 계획 (Phase 5)

모노레포 (`packages/client`, `server`, `cli-worker`, `shared`) + Fastify + tRPC 전환.

```
[클라우드] API 서버(Fastify+tRPC) + 프론트 + DB(Turso)
    ↕ WebSocket
[맥북 에어] cli-worker → Claude CLI
```

맥북 꺼져도 앱 동작, Claude 기능만 오프라인. 상세: `docs/PLAN.md` Phase 5.

---

## 디자인

- `PRODUCT.md` — 제품 전략 (register: product, 성격: 날카로운/집중/전투적)
- `DESIGN.md` — Raycast 기반 디자인 시스템 명세
- `tokens.css` — CSS 변수 + 애니메이션 키프레임 + View Transitions
- `Escapist-design/` — JSX 레퍼런스 + 스크린샷 (.gitignore됨)
- impeccable 스킬 사용 가능 (`/impeccable critique`, `/impeccable polish` 등)
