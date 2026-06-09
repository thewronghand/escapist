# Escapist

Claude CLI 세션 기반 면접 준비 앱. 질문 등록 → 답변 평가 → 꼬리질문으로 깊이를 파고드는 학습 도구.

> 기획서: `docs/PLAN.md` · 디자인 명세: `DESIGN.md` · 디자인 레퍼런스: `Escapist-design/` (.gitignore됨)

---

## Critical Rules

- **`any` 타입 금지** — `unknown` 또는 구체적 타입 사용
- **import 경로는 절대 경로 `@/`** — 상대 경로 금지 (client 내)
- **커밋 메시지는 제목 한 줄만** — body, Co-Authored-By 등 포함 금지
- **main 브랜치에 직접 force push 금지**
- **Claude 응답은 반드시 `parseClaudeJson()`으로 파싱** — JSON이 마크다운 코드블록으로 감싸져 올 수 있음
- **서버 데이터는 SQLite** — fs JSON 직접 읽기/쓰기 금지 (store.ts 경유)
- **Tailwind 클래스에서 디자인 토큰 사용** — 하드코딩 색상/간격 지양, `bg-canvas`, `text-ink`, `border-hairline` 등 사용

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트엔드 | React + Vite + TypeScript + Tailwind CSS v4 |
| 서버 | Node.js + Express + WebSocket (ws) |
| AI | Claude CLI (`claude -p`, `--resume`) via child_process |
| DB | SQLite (better-sqlite3) — `server/data/escapist.db` |
| 차트 | Recharts |
| 다이어그램 | Mermaid.js + React Flow (@xyflow/react) |
| 마크다운 | react-markdown |
| 디자인 | Raycast 기반 다크 테마 (tokens.css → Tailwind @theme) |

---

## 아키텍처

```
[React :5180] ←WebSocket→ [Express :8888] ←child_process→ [Claude CLI]
                                ↕
                        [SQLite escapist.db]
```

- **프론트 → 서버**: WebSocket으로 메시지 전송 (채팅, 힌트, 샌드박스, 채점)
- **서버 → Claude CLI**: `claude -p "..." --system-prompt "..." --output-format json`
- **세션 이어가기**: `claude --resume $SESSION_ID -p "..."`
- **REST API**: `/api/questions` (CRUD), `/api/stats` (통계 집계)
- **Vite proxy**: `/api` → :8888, `/ws` → ws://:8888

### 레이어 의존 규칙

```
pages → components, hooks
hooks → lib (ws.ts, api.ts, utils.ts)
components → lib, types
lib → (외부 의존성만)
```

- `hooks/` → WebSocket/REST 통신 담당, 상태 관리
- `lib/` → 순수 유틸, 외부 통신 래퍼 (hooks 이외에서 직접 `send()` 호출 금지)
- `components/` → UI만, 비즈니스 로직 최소화
- `pages/` → hooks 조합 + 컴포넌트 배치

---

## 주요 디렉토리

```
client/src/
  components/
    layout/         # AppShell, NavRail, Header, SidebarShell
    ui/             # Button, Icon, Modal, ScoreRing, Markdown, MermaidDiagram 등
    chat/           # ChatBubble, ChatInput, EvaluationCard, HintPopover, AgentSelector, FollowUpTree
    learn/          # QuestionSelect, QuestionCard, QuestionFormModal, QuestionGenerateModal, LearnSidebar
    interview/      # InterviewSetup, InterviewProgress, InterviewResult
    endless/        # EndlessStart, EndlessProgress, GameOverScreen
    sandbox/        # SandboxPanel
  hooks/            # useChat, useHints, useQuestions, useSessions, useInterview, useStats, useSandbox, useQuestionGenerator
  lib/
    ws.ts           # WebSocket 클라이언트 (connect, send, subscribe)
    api.ts          # REST fetch 래퍼
    utils.ts        # parseClaudeJson, scoreColor, gradeFor, cn
  pages/            # DashboardPage, LearnPage, InterviewPage, EndlessPage
  types/index.ts    # 타입 정의 + 상수 (AGENTS, CATEGORIES, CAT_ACCENT)
  tokens.css        # 디자인 토큰 (CSS 변수)
  index.css         # Tailwind @theme 연동

server/src/
  claude/
    cli.ts          # startSession(), resumeSession() — Claude CLI spawn 래퍼
    prompts.ts      # 에이전트별 시스템 프롬프트 (면접관, 인성면접관, 튜터, 리서처, 다이어그래머, 힌트, 샌드박스, 질문생성)
  data/
    db.ts           # SQLite 초기화 + 테이블 생성
    store.ts        # readAll, readOne, writeOne, deleteOne (SQLite 기반, snake↔camel 자동 변환)
  routes/
    questions.ts    # GET/POST/PUT/DELETE /api/questions
    stats.ts        # GET /api/stats (SQL 집계)
  ws/
    handler.ts      # WS 메시지 라우팅 (chat, session, hint, sandbox, interview, questions:generate)
  data/
    escapist.db     # SQLite DB 파일 (.gitignore됨)
```

---

## 개발 환경

```bash
npm run dev                     # client(:5180) + server(:8888) 동시 실행 (concurrently)
```

### 검증 명령어

```bash
# 클라이언트
cd client && npx tsc --noEmit   # 타입 체크
cd client && npm run build      # 프로덕션 빌드

# 서버
cd server && npx tsc --noEmit   # 타입 체크
```

**작업 완료 후 반드시 클라이언트 빌드 확인.** 서버는 타입 체크만 (빌드 스크립트 없음, tsx로 직접 실행).

### GitHub CLI 인증

개인 계정(thewronghand)으로 push:
```bash
source .envrc && git push
source .envrc && gh pr create ...
```

---

## Claude CLI 연동 주의사항

### 응답 파싱
- Claude는 `--output-format json`으로 호출해도 `result` 필드 안에 마크다운 코드블록(` ```json ... ``` `)으로 JSON을 감쌀 수 있음
- **항상 `parseClaudeJson()` (client/src/lib/utils.ts) 사용** — 코드블록 제거 + JSON 추출 + fallback 처리
- 프론트 전체에서 `Markdown` 컴포넌트로 마크다운 렌더링 (mermaid 코드블록은 자동으로 MermaidDiagram 렌더)

### 세션 관리
- `claude -p`로 만든 세션은 CLI 세션 피커(`/resume`)에 안 뜸 — 사용자의 작업 세션과 충돌 없음
- 세션 데이터는 `~/.claude/projects/.../{sessionId}.jsonl`에 저장, 30일 후 자동 삭제
- 서버의 `sessions` 테이블에 `claude_session_id`를 저장해서 `--resume`에 사용
- 서버 재시작해도 DB의 세션 매핑은 유지됨, Claude CLI 세션도 파일 기반이라 유지

### WS 메시지 프로토콜

| Client → Server | 용도 |
|----------------|------|
| `chat:send` | 학습 채팅 (세션 없으면 자동 생성) |
| `session:list` | 세션 목록 조회 |
| `session:load` | 세션 + 메시지 이력 로드 |
| `hint:request` / `hint:load` | 힌트 요청/로드 |
| `sandbox:send` | 샌드박스 채팅 |
| `interview:eval` | 단건 채점 (면접/무한) |
| `interview:summary` | 면접 총평 생성 |
| `interview:save` | 면접/무한 기록 저장 |
| `questions:generate` | 질문 자동 생성 |

---

## 데이터 모델 (SQLite)

### questions 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | `q_` prefix |
| question | TEXT | 질문 텍스트 |
| category | TEXT | 카테고리 |
| interview_type | TEXT | `'technical'` 또는 `'behavioral'` |
| tags | TEXT (JSON) | 태그 배열 |
| difficulty | INTEGER | 1~5 |
| status | TEXT | `unlearned` / `learning` / `weak` / `master` |
| best_score, average_score | REAL | 점수 |
| attempts | INTEGER | 시도 횟수 |

### sessions 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | prefix로 모드 구분: `s_`(learn), `h_`/`hints_`(hint), `sb_`(sandbox), `iv_`(interview/endless) |
| claude_session_id | TEXT | Claude CLI `--resume`용 |
| mode | TEXT | `learn` / `hint` / `sandbox` / `interview` / `endless` |
| messages | TEXT (JSON) | 채팅 메시지 배열 |
| hints | TEXT (JSON) | 힌트 배열 |
| total_score, grade, streak 등 | 면접/무한 기록용 |

**JSON 필드는 store.ts에서 자동으로 직렬화/파싱됨.** camelCase ↔ snake_case도 자동 변환.

---

## Git 전략

- 기본적으로 **main에서 직접 작업**
- **대규모 변경이나 회귀 위험 있는 변경**은 서브 브랜치 따서 작업 후 main 머지
- 커밋 메시지: 한국어, 제목 한 줄만
- 기능 단위로 커밋

```
# 커밋 예시
데이터 레이어 fs → SQLite 전환 (better-sqlite3)
인성 면접 지원 + 질문 자동 생성
Phase 3: 오늘의 면접, 무한 모드, 대시보드

# 브랜치 예시 (대규모 변경 시)
feat/sqlite-migration
refactor/ws-protocol
```

---

## 배포 계획

로컬 맥북 에어를 홈 서버로 사용:

```
모바일/외부 → Cloudflare Tunnel → 맥북 에어 → Express(:8888) + 빌드된 정적 파일
```

- Claude CLI가 서버에서 돌아야 하므로 클라우드 배포 불가
- `vite build` → Express에서 정적 파일 서빙
- PM2로 프로세스 관리 (재부팅 시 자동 시작)
- `git pull && npm run build && pm2 restart`로 배포

---

## 디자인 레퍼런스

- `Escapist-design/` 폴더에 JSX 레퍼런스 + 스크린샷 9장 (.gitignore됨)
- `tokens.css` — Raycast 기반 다크 테마 디자인 토큰
- `index.css` — Tailwind @theme으로 CSS 변수를 Tailwind 클래스에 매핑
- 새 컴포넌트 추가 시 레퍼런스 JSX 참고 → Tailwind 클래스로 변환
