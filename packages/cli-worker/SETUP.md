# Escapist CLI Worker 설정 가이드

이 맥북에서 Claude CLI를 실행해서 Escapist 앱과 연결하는 가이드입니다.

## 사전 요구사항

- Claude Code CLI 설치 및 로그인 (`claude` 명령어 동작 확인)
- Node.js 22+ 설치
- pnpm 설치

## 설치 절차

### 1. pnpm 설치 (없으면)
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.zshrc
```

### 2. 레포 클론
```bash
git clone git@github.com:thewronghand/escapist.git
cd escapist
```

### 3. 의존성 설치
```bash
pnpm install
```

### 4. 환경변수 설정
```bash
cd packages/cli-worker
cp .env.example .env
```

`.env` 파일을 열어서 아래 두 값을 채우세요:
```
WS_SERVER_URL=wss://escapist.onrender.com/worker
CLI_WORKER_SECRET=<의현님에게 직접 받기>
```

### 5. Claude CLI 로그인 확인
```bash
claude --version
claude  # 로그인 안 됐으면 진행
```

### 6. PM2로 실행
```bash
npx pm2 start ecosystem.config.cjs
npx pm2 save
npx pm2 startup  # 출력된 명령어를 복사해서 실행 (sudo 포함)
```

### 7. 동작 확인
https://escapist.onrender.com 접속 → 헤더에 **"Claude CLI 연결됨"** 표시 확인

## 재시작 / 관리

```bash
npx pm2 status                    # 상태 확인
npx pm2 logs escapist-worker      # 로그 확인
npx pm2 restart escapist-worker   # 재시작
npx pm2 stop escapist-worker      # 중지
```

## 맥북 잠자기 방지 (선택)

앱 사용 중 맥북이 잠들면 Claude 기능이 끊깁니다.
- **Amphetamine** 앱 설치 (App Store, 무료) 권장
- 또는 터미널에서: `caffeinate -i &`
