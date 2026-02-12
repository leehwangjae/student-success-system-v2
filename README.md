# Student Success System - React + Vite

학생성공지수 관리 시스템

인천대학교 LINC3.0 학생성공지수 관리를 위한 웹 애플리케이션입니다.

## 🚀 시작하기

### 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경변수를 설정하세요:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`.env.example` 파일을 복사하여 시작할 수 있습니다:
```bash
cp .env.example .env
```

### Vercel 배포 시 환경변수 설정

1. Vercel 프로젝트 대시보드 접속
2. Settings → Environment Variables 메뉴
3. 다음 환경변수 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Production, Preview, Development 모두 체크
5. Save 클릭

### 로컬 개발 환경

```bash
npm install
npm run dev
```

## 📦 기술 스택

- React 18
- Vite
- Supabase
- TailwindCSS

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# Deployment timestamp: 2026년 02월 12일 목 오후  1:23:14
