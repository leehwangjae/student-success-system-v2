# 🔐 보안 설정 가이드

이 문서는 Student Success System의 보안 설정 방법을 안내합니다.

## 📋 목차

1. [Supabase RLS 정책 적용](#1-supabase-rls-정책-적용)
2. [현재 보안 상태](#2-현재-보안-상태)
3. [다음 단계 (Step 4)](#3-다음-단계-step-4)

---

## 1. Supabase RLS 정책 적용

### 🎯 목적
Row Level Security (RLS)를 활성화하여 데이터 접근을 제한합니다.

### 📝 실행 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - 또는 "Database" → "SQL Editor" 이동

3. **SQL 스크립트 실행**
   ```
   프로젝트 루트의 supabase_rls_policies.sql 파일 열기
   → 전체 내용 복사 (Ctrl+A, Ctrl+C)
   → Supabase SQL Editor에 붙여넣기 (Ctrl+V)
   → "RUN" 버튼 클릭
   ```

4. **실행 결과 확인**
   - 화면 하단에 "Success. No rows returned" 표시
   - 오류가 있으면 에러 메시지 확인

5. **정책 적용 확인**
   ```sql
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```
   - 각 테이블에 정책이 생성되었는지 확인

### ✅ 적용되는 보안 정책

#### users 테이블
- ✅ 회원가입: 누구나 pending 상태로 생성 가능
- ✅ 로그인: 승인된 사용자만 조회 가능
- ✅ 업데이트: 자신의 데이터만 수정 가능

#### core_courses_submissions 테이블
- ✅ 조회: 자신의 제출만 조회
- ✅ 생성: 누구나 제출 가능
- ✅ 수정: 승인되지 않은 제출만 수정 가능
- ✅ 삭제: 승인된 제출은 삭제 불가

#### programs, core_courses, non_curricular_programs 테이블
- ✅ 조회: 모든 사용자
- ✅ 관리: 클라이언트에서 관리자 권한 확인

---

## 2. 현재 보안 상태

### ✅ 완료된 보안 개선 (Step 1-3)

#### Step 1: 민감정보 로깅 제거 ✅
- ✅ console.log에서 사용자 객체, 비밀번호, 지급정보 제거
- ✅ 하드코딩된 개발자 이메일 제거
- ✅ 제출 데이터 전체 로깅 제거

#### Step 2: 환경변수 하드코딩 제거 ✅
- ✅ Supabase API 키 fallback 제거
- ✅ 환경변수 미설정 시 명확한 에러 메시지
- ✅ README에 환경변수 설정 가이드 추가

#### Step 3: RLS 정책 SQL 스크립트 제공 ✅
- ✅ 테이블별 접근 제어 정책 정의
- ✅ 승인된 제출 수정 방지
- ✅ 사용자별 데이터 격리 (제한적)

### ⚠️ 여전히 남아있는 보안 취약점

#### CRITICAL 🔴
1. **비밀번호 평문 저장**
   - 현재: DB에 평문 저장
   - 위험: DB 유출 시 모든 비밀번호 노출
   - 해결: Step 4에서 bcrypt 해싱 구현 예정

2. **클라이언트 기반 인증**
   - 현재: localStorage에 사용자 정보 저장
   - 위험: 브라우저 개발자 도구로 조작 가능
   - 해결: Supabase Auth 또는 JWT 토큰 도입 필요

3. **RLS 정책 미흡**
   - 현재: auth.uid() 사용 불가로 제한적 정책
   - 위험: 클라이언트에서 필터링에 의존
   - 해결: 인증 시스템 도입 후 강화 필요

#### HIGH 🟠
4. **Base64 파일 저장**
   - 파일이 암호화되지 않음
   - 권장: Supabase Storage 사용

5. **세션 타임아웃 없음**
   - localStorage 영구 저장
   - 권장: 세션 만료 로직 추가

---

## 3. 다음 단계 (Step 4)

### 🚀 비밀번호 해싱 구현 (예정)

Step 4에서는 다음을 구현할 예정입니다:

1. **bcrypt 설치 및 적용**
   ```bash
   npm install bcryptjs
   ```

2. **회원가입 시 비밀번호 해싱**
   - 평문 비밀번호 → bcrypt 해시
   - Salt rounds: 10

3. **로그인 시 해시 비교**
   - 입력된 비밀번호와 저장된 해시 비교
   - bcrypt.compare() 사용

4. **기존 사용자 마이그레이션**
   - 다음 로그인 시 자동으로 평문 → 해시 변환
   - 투명한 마이그레이션 (사용자 인지 못함)

### 📊 예상 일정

- **Step 4 (비밀번호 해싱)**: 약 20-30분
- **테스트**: 약 10-15분
- **배포**: 약 5분

---

## ❓ 문제 해결

### RLS 정책 실행 오류

**오류**: `relation "users_2025_11_27_07_17" does not exist`
- **원인**: 테이블 이름이 다름
- **해결**: SQL 파일에서 테이블 이름을 실제 이름으로 수정

**오류**: `policy already exists`
- **원인**: 정책이 이미 존재함
- **해결**: DROP POLICY 부분이 실행되었는지 확인

### RLS 활성화 후 데이터 조회 안됨

**증상**: 로그인 후 데이터가 안 보임
- **원인**: RLS 정책이 너무 엄격함
- **임시 해결**:
  ```sql
  ALTER TABLE [테이블명] DISABLE ROW LEVEL SECURITY;
  ```
- **근본 해결**: 정책을 수정하거나 인증 시스템 개선

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. Supabase 대시보드 → Logs에서 에러 확인
2. 브라우저 개발자 도구 → Console에서 에러 확인
3. SQL Editor에서 정책 적용 확인

---

**마지막 업데이트**: 2026-02-12
**작성자**: Claude Sonnet 4.5
