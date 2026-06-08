# Escapist

## 프로젝트 개요
Claude CLI 세션 기반 면접 준비 앱. 질문 등록 → 답변 평가 → 꼬리질문으로 깊이를 파고드는 학습 도구.

### 핵심 기능
- 학습 모드: 질문 선택 → 답변 → Claude 면접관이 평가 + 꼬리질문
- 힌트 시스템: 질문별 5단계 점진적 힌트 (튜터 에이전트)
- 멀티 에이전트: 면접관, CS 튜터, 리서처, 다이어그래머
- 샌드박스: 자유 질문 플로팅 채팅 패널
- (예정) 오늘의 면접, 무한 모드, 대시보드

### 기술 스택
- **프론트**: React + Vite + TypeScript + Tailwind CSS v4
- **서버**: Node.js + Express + WebSocket
- **AI**: Claude CLI (`claude -p`, `--resume`)로 세션 관리
- **데이터**: fs 기반 JSON (server/data/)
- **디자인**: Raycast 기반 다크 테마 (tokens.css)
- **마크다운**: react-markdown

## 아키텍처

```
[React 프론트엔드 :5180] ←WebSocket→ [Node 서버 :8888] ←child_process→ [Claude CLI]
                                            ↕
                                     [fs 기반 JSON]
```

- 프론트 → 서버: WebSocket으로 메시지 전송
- 서버 → Claude CLI: `claude -p "..." --system-prompt "..." --output-format json`
- 세션 이어가기: `claude --resume $SESSION_ID -p "..."`
- Vite proxy: `/api` → 8888, `/ws` → ws://8888

## 주요 디렉토리

```
client/
  src/
    components/
      layout/       # AppShell, NavRail, Header, SidebarShell
      ui/           # Button, Icon, Modal, ScoreRing, Markdown 등
      chat/         # ChatBubble, ChatInput, EvaluationCard, HintPopover
      learn/        # QuestionSelect, QuestionCard, QuestionFormModal
      sandbox/      # SandboxPanel
    hooks/          # useChat, useHints, useQuestions, useSandbox
    lib/            # ws.ts, api.ts, utils.ts (parseClaudeJson, scoreColor)
    pages/          # DashboardPage, LearnPage, InterviewPage, EndlessPage
    types/          # 타입 정의, 에이전트/카테고리 상수
    tokens.css      # Raycast 기반 디자인 토큰
    index.css       # Tailwind @theme 연동
server/
  src/
    claude/         # cli.ts (spawn/resume), prompts.ts (에이전트별 시스템 프롬프트)
    data/           # store.ts (fs JSON 읽기/쓰기)
    routes/         # questions.ts (CRUD API)
    ws/             # handler.ts (WS 메시지 라우팅)
  data/
    questions/      # {id}.json
    sessions/       # {id}.json
docs/
  PLAN.md           # 전체 기획서
DESIGN.md           # Raycast 디자인 시스템 명세
Escapist-design/    # 디자인 레퍼런스 (JSX + 스크린샷, .gitignore됨)
```

## 개발 환경

```bash
npm run dev           # client(5180) + server(8888) 동시 실행
```

### GitHub CLI 인증
개인 계정(thewronghand)으로 push할 때:
```bash
source .envrc && gh repo create ...
source .envrc && gh pr create ...
```

## 커밋/PR 규칙
- 커밋 메시지는 제목만 작성 (본문 없이)
- Co-Authored-By 등 자동 추가 문구 포함하지 말 것

## Claude 응답 파싱
- Claude가 마크다운 코드블록(```json ```)으로 JSON을 감쌀 수 있음
- `parseClaudeJson()` (lib/utils.ts)으로 코드블록 제거 후 파싱
- 프론트 전체에서 마크다운 렌더링 (`Markdown` 컴포넌트)

## 디자인 레퍼런스
- `Escapist-design/` 폴더에 JSX 레퍼런스 + 스크린샷 9장
- 인라인 스타일 → Tailwind 클래스로 변환하여 구현
- CSS 변수는 tokens.css에 정의, Tailwind @theme으로 매핑

## 구현 상태

### Phase 1 (완료)
- [x] 프로젝트 초기화 (Vite + Express + WS)
- [x] Claude CLI 연동 (spawn, resume, JSON 파싱)
- [x] 질문 CRUD API + fs 저장
- [x] 기본 채팅 UI + 학습 플로우
- [x] 레이아웃 (NavRail + Sidebar + Main)
- [x] 힌트 시스템 (5단계, 서버 저장)
- [x] 샌드박스 (자유 질문 채팅)
- [x] 마크다운 렌더링

### Phase 2 (예정)
- [ ] 세션 관리 (사이드바 목록, 이력 로딩, resume)
- [ ] 꼬리질문 트리 시각화 (React Flow)
- [ ] 에이전트 전환 UI (@튜터, @리서처, @다이어그램)
- [ ] Mermaid 다이어그램 렌더링

### Phase 3 (예정)
- [ ] 오늘의 면접 (설정 → 진행 → 결과)
- [ ] 무한 모드 (스트릭 + 게임오버)
- [ ] 대시보드 (통계, 차트, Recharts)
