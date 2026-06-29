# Escapist CLI Worker 설정 가이드

이 맥북에서 Claude CLI를 실행해서 Escapist 앱과 연결하는 가이드입니다.

## 사전 요구사항

- Claude Code CLI 설치 및 로그인 (`claude` 명령어 동작 확인)
- Node.js 22+ 설치
- pnpm 설치
- **GnuPG 설치 필수** (`brew install gnupg`) — `update` 명령이 GPG 서명을 검증함. 미설치 시 update 전면 차단됨

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

`.env` 파일을 열어서 아래 값을 채우세요:
```
# CLI Worker (필수)
WS_SERVER_URL=wss://escapist.onrender.com/worker
CLI_WORKER_SECRET=<Render 환경변수와 동일한 값>

# Admin Session (필수 — Render 환경변수 ADMIN_SESSION_SECRET과 동일한 값)
ADMIN_SESSION_SECRET=<랜덤 시크릿, 예: openssl rand -hex 32>

# Admin Session (선택 — 기본값: https://escapist.onrender.com)
# ADMIN_SERVER_URL=https://escapist.onrender.com

# Admin Session (선택 — git pull 실행 위치, 기본값: 스크립트 실행 디렉토리)
# WORKER_CWD=/path/to/escapist
```

### 5. GPG 공개키 등록 (update 명령 서명 검증용)

회사 맥북에서 공개키 파일(`escapist-gpg-pub.asc`)을 에어드롭 등으로 받은 뒤:

```bash
brew install gnupg   # 미설치 시
gpg --import ~/Downloads/escapist-gpg-pub.asc
gpg --edit-key 8D0F8A054C395458
# gpg 프롬프트에서:
#   trust → 5 (ultimate) → y → quit
```

핑거프린트로 무결성 확인:
```bash
gpg --fingerprint 8D0F8A054C395458
# 출력: 89FC AE9B C0AF 1153 6C1E  3ECA 8D0F 8A05 4C39 5458
```

### 6. Claude CLI 로그인 확인
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

두 개의 프로세스가 실행됩니다:
- `escapist-worker` — Claude CLI 실행 워커
- `escapist-admin` — 원격 관리 세션 (SSE로 서버 명령 대기)

### 7. 동작 확인
- https://escapist.onrender.com 접속 → 헤더에 **"Claude CLI 연결됨"** 표시 확인
- https://escapist.onrender.com/admin → **"관리 세션 연결됨"** 표시 확인

## 재시작 / 관리

```bash
npx pm2 status                    # 상태 확인
npx pm2 logs escapist-worker      # CLI Worker 로그
npx pm2 logs escapist-admin       # 관리 세션 로그
npx pm2 restart escapist-worker   # CLI Worker 재시작
npx pm2 restart escapist-admin    # 관리 세션 재시작
npx pm2 stop all                  # 전체 중지
```

## 원격 관리 (회사에서)

https://escapist.onrender.com/admin 페이지에서:
- CLI Worker / 관리 세션 연결 상태 확인
- `Restart` 버튼 → escapist-worker 재시작
- `Update` 버튼 → git pull + pnpm install + 재시작
- 커스텀 명령 입력 → 맥북에어에서 실행
- PM2 로그 조회 (CLI Worker 재연결 시 자동 전송)

## 트러블슈팅

### CLI Worker가 오프라인으로 표시될 때

1. **맥북에어에서 직접 확인**
   ```bash
   npx pm2 status
   npx pm2 logs escapist-worker --lines 50
   ```

2. **재시작**
   ```bash
   npx pm2 restart escapist-worker
   ```
   또는 회사 맥북에서 `/admin` 페이지 → `Restart` 버튼

3. **자주 죽는 경우** — 로그에서 원인 파악
   - `Claude CLI exited with code` → Claude CLI 세션 만료. `claude` 실행 후 재인증
   - `spawn claude ENOENT` → PATH 문제. `which claude` 확인, PM2 재시작
   - `timed out` → Claude 응답 지연. 정상 동작, 재시작 불필요

### 관리 세션(escapist-admin)이 오프라인일 때

1. `ADMIN_SESSION_SECRET`이 Render 환경변수와 일치하는지 확인
2. ```bash
   npx pm2 logs escapist-admin --lines 30
   npx pm2 restart escapist-admin
   ```
3. Render 서버가 sleep 상태면 SSE 연결 자체가 안 됨 → escapist.onrender.com 접속해서 깨우기

### 코드 업데이트 절차

**회사에서 (원격)**
1. `/admin` 페이지 → `Update (git pull + restart)` 버튼
2. 잠시 후 결과 확인 (CLI Worker 재시작까지 10~30초)

**맥북에어에서 직접**
```bash
cd ~/path/to/escapist
git pull
pnpm install --frozen-lockfile
npx pm2 restart all
```

### ADMIN_SESSION_SECRET 시크릿 발급

```bash
openssl rand -hex 32
```

생성된 값을 Render 환경변수 `ADMIN_SESSION_SECRET`과 맥북에어 `.env` 양쪽에 동일하게 설정.

## 맥북 잠자기 방지 (선택)

앱 사용 중 맥북이 잠들면 Claude 기능이 끊깁니다.
- **Amphetamine** 앱 설치 (App Store, 무료) 권장
- 또는 터미널에서: `caffeinate -i &`
