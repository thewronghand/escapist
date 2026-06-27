# Escapist

Claude CLI 세션 기반 면접 준비 앱.

질문을 등록하고, Claude가 면접관이 되어 답변을 평가하고 꼬리질문으로 깊이를 파고든다.

**배포 URL**: https://escapist.onrender.com

## 주요 기능

- **학습 모드** — 질문 선택 → 답변 → Claude 면접관이 평가(점수/개선점/모범답안) → 꼬리질문 분기
- **힌트 시스템** — 질문별 5단계 점진적 힌트 (키워드 → 방향 → 설명 → 비교 → 상세답안)
- **멀티 에이전트** — 면접관, CS 튜터, 리서처(웹 검색), 다이어그래머(Mermaid)
- **샌드박스** — 부담 없이 자유롭게 물어보는 플로팅 채팅
- **세션 유지** — Claude CLI `--resume`으로 껐다 켜도 대화 이어가기

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트엔드 | React, Vite, TypeScript, Tailwind CSS v4, tRPC |
| 서버 | Node.js, Fastify v5, tRPC, WebSocket |
| AI | Claude CLI (`claude -p`, `--resume`) via cli-worker |
| 데이터 | Turso (SQLite 호환 클라우드 DB) |
| 배포 | Render (서버 + 프론트) + 맥북 PM2 (cli-worker) |

## 배포 아키텍처

```
[폰/브라우저]
    ↓ HTTPS
[Render 클라우드]
  ├── Fastify API + tRPC      (:8888)
  ├── React 정적 파일 서빙
  └── Turso DB
          ↕ WebSocket (/worker)
[맥북 (홈)]
  └── cli-worker (PM2)
        └── Claude CLI (child_process)
```

- 맥북 꺼지면: 앱 동작, 질문/세션/대시보드 정상 접근, Claude 기능만 "오프라인" 표시
- 맥북 켜지면: cli-worker 자동 재연결, Claude 기능 복구

## 로컬 개발

### 사전 요구사항

- Node.js 22+
- pnpm 10+
- [Claude Code CLI](https://claude.ai/download) 설치 및 로그인

### 설치 및 실행

```bash
git clone https://github.com/thewronghand/escapist.git
cd escapist
pnpm install
pnpm dev
```

- 프론트엔드: http://localhost:5180
- 서버: http://localhost:8888
- cli-worker: 서버에 WS 자동 연결 (별도 포트 없음)

## 배포

### 1. Turso DB 생성

```bash
turso db create escapist
turso db show escapist           # TURSO_DATABASE_URL 확인
turso db tokens create escapist  # TURSO_AUTH_TOKEN 발급
```

### 2. Render 배포

1. [render.com](https://render.com) → New Web Service → GitHub 레포 연결
2. Build Command: `npm install --no-save pnpm@10.12.4 && ./node_modules/.bin/pnpm install --frozen-lockfile && ./node_modules/.bin/pnpm build`
3. Start Command: `npx pnpm@10.12.4 --filter @escapist/server exec tsx src/index.ts`
4. 환경변수 설정 (`.env.example` 참조):
   - `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `ALLOWED_EMAIL`
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - `CLI_WORKER_SECRET`

### 3. 맥북 cli-worker 실행

`packages/cli-worker/SETUP.md` 참조.

## 환경변수

`.env.example` 파일 참조.

## 라이선스

MIT
