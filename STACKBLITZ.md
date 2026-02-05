# StackBlitz에서 실행하기

## 환경 변수 설정

StackBlitz에서 프로젝트를 실행하려면 환경 변수를 설정해야 합니다.

### 방법 1: StackBlitz UI에서 설정

1. StackBlitz 프로젝트를 엽니다
2. 좌측 파일 탐색기에서 `.env` 파일을 생성합니다
3. 다음 내용을 추가합니다:

```env
VITE_SUPABASE_URL=https://zlqymozoffivgelrrqbd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscXltb3pvZmZpdmdlbHJycWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjgyNjYsImV4cCI6MjA3OTgwNDI2Nn0.s1Phd4KYC5XDbEeZKoxGcfnRF6QPYql8McVG-HCSEbo
```

### 방법 2: StackBlitz 터미널에서 설정

StackBlitz 터미널을 열고 다음 명령어를 실행:

```bash
cp .env.example .env
# 그런 다음 .env 파일을 편집하여 실제 값을 입력
```

## 프로젝트 실행

환경 변수를 설정한 후:

```bash
npm install
npm run dev
```

## 문제 해결

### WebSocket 연결 오류
- 브라우저를 새로고침 (Ctrl + Shift + R)
- Dev Server 재시작

### Supabase URL 오류
- `.env` 파일이 제대로 생성되었는지 확인
- 환경 변수 값이 올바른지 확인

### favicon 404 오류
- 이 오류는 무시해도 됩니다 (앱 동작에 영향 없음)
