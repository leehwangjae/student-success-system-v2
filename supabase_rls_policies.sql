-- ========================================
-- Supabase Row Level Security (RLS) 정책
-- Student Success System
-- ========================================
--
-- 사용 방법:
-- 1. Supabase 대시보드 접속 (https://supabase.com)
-- 2. 프로젝트 선택
-- 3. SQL Editor 메뉴 클릭
-- 4. 이 파일의 내용을 복사하여 붙여넣기
-- 5. "RUN" 버튼 클릭하여 실행
--
-- ⚠️ 주의: 이 스크립트는 기존 정책을 삭제하고 새로 생성합니다.
-- ========================================

-- ========================================
-- 1. RLS 활성화
-- ========================================

-- users 테이블 RLS 활성화
ALTER TABLE users_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;

-- core_courses_submissions 테이블 RLS 활성화
ALTER TABLE core_courses_submissions_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;

-- non_curricular_submissions 테이블 RLS 활성화 (테이블 이름 확인 필요)
-- ALTER TABLE non_curricular_submissions_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;

-- programs 테이블 RLS 활성화
ALTER TABLE programs_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;

-- core_courses 테이블 RLS 활성화
ALTER TABLE core_courses_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;

-- non_curricular_programs 테이블 RLS 활성화
ALTER TABLE non_curricular_programs_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;


-- ========================================
-- 2. 기존 정책 삭제 (있다면)
-- ========================================

-- users 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users_2025_11_27_07_17;
DROP POLICY IF EXISTS "Users can update own data" ON users_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can view all users" ON users_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can update all users" ON users_2025_11_27_07_17;
DROP POLICY IF EXISTS "Public can insert pending users" ON users_2025_11_27_07_17;
DROP POLICY IF EXISTS "Public can view approved users for login" ON users_2025_11_27_07_17;

-- core_courses_submissions 정책 삭제
DROP POLICY IF EXISTS "Students can view own submissions" ON core_courses_submissions_2025_11_27_07_17;
DROP POLICY IF EXISTS "Students can insert own submissions" ON core_courses_submissions_2025_11_27_07_17;
DROP POLICY IF EXISTS "Students can update own submissions" ON core_courses_submissions_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can view all submissions" ON core_courses_submissions_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can update all submissions" ON core_courses_submissions_2025_11_27_07_17;


-- ========================================
-- 3. users 테이블 정책
-- ========================================

-- 회원가입: 누구나 pending 상태로 사용자 생성 가능
CREATE POLICY "Public can insert pending users"
ON users_2025_11_27_07_17
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending');

-- 로그인: 승인된 사용자 정보는 누구나 조회 가능 (로그인용)
-- ⚠️ 보안 경고: 현재 비밀번호가 평문이므로 이 정책이 필요함
-- 비밀번호 해싱 후에는 이 정책을 제거하고 서버사이드 인증으로 전환해야 함
CREATE POLICY "Public can view approved users for login"
ON users_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- 학생: 자신의 데이터 업데이트 가능 (지급정보, 개인정보 등)
-- 주의: 현재 인증 시스템이 없어서 username 기반으로 제한
-- 추후 Supabase Auth 도입 시 auth.uid() 사용 권장
CREATE POLICY "Students can update own data"
ON users_2025_11_27_07_17
FOR UPDATE
TO anon, authenticated
USING (true)  -- 임시: 인증 시스템 없어서 모든 업데이트 허용
WITH CHECK (true);


-- ========================================
-- 4. core_courses_submissions 테이블 정책
-- ========================================

-- 학생: 자신의 제출 조회
CREATE POLICY "Students can view own submissions"
ON core_courses_submissions_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);  -- 임시: 클라이언트에서 필터링

-- 학생: 자신의 제출 생성
CREATE POLICY "Students can insert own submissions"
ON core_courses_submissions_2025_11_27_07_17
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 학생: 자신의 제출 수정 (승인 전)
CREATE POLICY "Students can update own submissions"
ON core_courses_submissions_2025_11_27_07_17
FOR UPDATE
TO anon, authenticated
USING (status != 'approved')  -- 승인되지 않은 제출만 수정 가능
WITH CHECK (status != 'approved');


-- ========================================
-- 5. programs 테이블 정책
-- ========================================

-- 모든 사용자: 프로그램 조회 가능
CREATE POLICY "Everyone can view programs"
ON programs_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);

-- 관리자만 프로그램 생성/수정/삭제 가능 (클라이언트에서 제어)
CREATE POLICY "Admins can manage programs"
ON programs_2025_11_27_07_17
FOR ALL
TO anon, authenticated
USING (true)  -- 임시: 클라이언트에서 관리자 권한 확인
WITH CHECK (true);


-- ========================================
-- 6. core_courses 테이블 정책
-- ========================================

-- 모든 사용자: 핵심 교과목 조회 가능
CREATE POLICY "Everyone can view core courses"
ON core_courses_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);

-- 관리자만 교과목 관리 가능 (클라이언트에서 제어)
CREATE POLICY "Admins can manage core courses"
ON core_courses_2025_11_27_07_17
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ========================================
-- 7. non_curricular_programs 테이블 정책
-- ========================================

-- 모든 사용자: 비교과 프로그램 조회 가능
CREATE POLICY "Everyone can view non curricular programs"
ON non_curricular_programs_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);

-- 관리자만 프로그램 관리 가능
CREATE POLICY "Admins can manage non curricular programs"
ON non_curricular_programs_2025_11_27_07_17
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ========================================
-- 8. 정책 확인 쿼리
-- ========================================

-- 적용된 RLS 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ========================================
-- 참고사항 및 향후 개선
-- ========================================

-- ⚠️ 현재 한계점:
-- 1. Supabase Auth 미사용으로 진짜 사용자 인증 불가
-- 2. auth.uid() 사용 불가 → 현재는 클라이언트에서 필터링
-- 3. 비밀번호 평문 저장으로 인한 보안 취약점
-- 4. anon role이 모든 데이터 접근 가능

-- 🔐 향후 개선 방안 (Step 4에서 진행):
-- 1. Supabase Auth 도입 또는 서버사이드 인증 구현
-- 2. 비밀번호 해싱 (bcrypt)
-- 3. JWT 토큰 기반 인증
-- 4. RLS 정책을 auth.uid() 기반으로 강화
-- 5. 관리자 role을 Supabase에서 관리

-- 📌 임시 해결책:
-- - 클라이언트에서 studentId 기반 필터링 유지
-- - RLS는 기본적인 제약만 적용 (승인된 제출은 수정 불가 등)
-- - 민감한 작업은 클라이언트 권한 확인 후 수행
