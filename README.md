# Escapist

Claude CLI 세션 기반 면접 준비 앱.

질문을 등록하고, Claude가 면접관이 되어 답변을 평가하고 꼬리질문으로 깊이를 파고든다.

## 주요 기능

- **학습 모드** — 질문 선택 → 답변 → Claude 면접관이 평가(점수/개선점/모범답안) → 꼬리질문 분기
- **힌트 시스템** — 질문별 5단계 점진적 힌트 (키워드 → 방향 → 설명 → 비교 → 상세답안)
- **멀티 에이전트** — 면접관, CS 튜터, 리서처(웹 검색), 다이어그래머(Mermaid)
- **샌드박스** — "이거 뭐야?" 부담 없이 자유롭게 물어보는 플로팅 채팅
- **세션 유지** — Claude CLI `--resume`으로 껐다 켜도 대화 이어가기

### 예정

- 오늘의 면접 (랜덤 질문 모의 면접 + 종합 리포트)
- 무한 모드 (질문 소진까지 연속 도전)
- 대시보드 (약한 질문, 카테고리별 현황, 점수 추이)
- 꼬리질문 트리 시각화 (React Flow)

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트엔드 | React, Vite, TypeScript, Tailwind CSS v4 |
| 서버 | Node.js, Express, WebSocket |
| AI | Claude CLI (`claude -p`, `--resume`) |
| 데이터 | fs 기반 JSON |
| 디자인 | Raycast 기반 다크 테마 |

## 아키텍처

```
React :5180 ←WebSocket→ Express :8888 ←child_process→ Claude CLI
                              ↕
                        fs JSON 저장
```

API 키 없이 Claude Code 구독만으로 동작한다.

## 시작하기

### 사전 요구사항

- Node.js 20+
- [Claude Code CLI](https://claude.ai/download) 설치 및 로그인

### 설치

```bash
git clone https://github.com/thewronghand/escapist.git
cd escapist
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 실행

```bash
npm run dev
```

- 프론트엔드: http://localhost:5180
- 서버: http://localhost:8888

## 사용법

1. **학습** 탭에서 **새 질문 등록** (예: "이벤트 루프가 뭔가요?")
2. 질문 클릭 → 답변 입력 → Claude가 평가 + 꼬리질문 제시
3. 모르겠으면 💡 **힌트** 버튼으로 단계별 도움
4. 우하단 **샌드박스** 버튼으로 자유 질문

## 라이선스

MIT
