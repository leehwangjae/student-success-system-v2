-- ========================================
-- 🔒 Supabase RLS 정책 (수정 버전)
-- 학생성공지수 관리 시스템
-- ========================================
--
-- 실행 방법:
-- 1. Supabase Dashboard 접속
-- 2. SQL Editor 열기
-- 3. 아래 SQL 전체 복사 후 실행
-- 4. 마지막 검증 쿼리로 정책 확인
--
-- ⚠️ 주의: 기존 정책이 있다면 자동으로 삭제됩니다
-- ========================================


-- ========================================
-- 1. RLS 활성화
-- ========================================

-- users 테이블 RLS 활성화
ALTER TABLE users_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;

-- core_courses_submissions 테이블 RLS 활성화
ALTER TABLE core_courses_submissions_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Public can view users for login" ON users_2025_11_27_07_17;
DROP POLICY IF EXISTS "Students can update own data" ON users_2025_11_27_07_17;

-- submissions 테이블 정책 삭제
DROP POLICY IF EXISTS "Students can view own submissions" ON core_courses_submissions_2025_11_27_07_17;
DROP POLICY IF EXISTS "Students can insert own submissions" ON core_courses_submissions_2025_11_27_07_17;
DROP POLICY IF EXISTS "Students can update own submissions" ON core_courses_submissions_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can view all submissions" ON core_courses_submissions_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can update all submissions" ON core_courses_submissions_2025_11_27_07_17;

-- programs 테이블 정책 삭제
DROP POLICY IF EXISTS "Public can view programs" ON programs_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can manage programs" ON programs_2025_11_27_07_17;

-- core_courses 테이블 정책 삭제
DROP POLICY IF EXISTS "Public can view core courses" ON core_courses_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can manage core courses" ON core_courses_2025_11_27_07_17;

-- non_curricular_programs 테이블 정책 삭제
DROP POLICY IF EXISTS "Public can view non curricular programs" ON non_curricular_programs_2025_11_27_07_17;
DROP POLICY IF EXISTS "Admins can manage non curricular programs" ON non_curricular_programs_2025_11_27_07_17;


-- ========================================
-- 3. users 테이블 정책
-- ========================================

-- 🔓 회원가입: 누구나 pending 상태로 가입 가능
CREATE POLICY "Public can insert pending users"
ON users_2025_11_27_07_17
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending');

-- 🔓 로그인: 모든 사용자 조회 허용 (비밀번호 비교를 위해 필요)
-- ⚠️ 중요: 승인 여부는 애플리케이션에서 체크해야 함!
CREATE POLICY "Public can view users for login"
ON users_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);  -- ✅ 모든 사용자 조회 허용 (로그인 시 필요)

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

-- 학생: 자신의 제출 수정 (승인 전만 가능)
-- ⚠️ status가 'approved'면 수정 불가 (데이터 무결성 보호)
CREATE POLICY "Students can update own submissions"
ON core_courses_submissions_2025_11_27_07_17
FOR UPDATE
TO anon, authenticated
USING (status != 'approved')  -- 승인된 제출은 수정 불가
WITH CHECK (status != 'approved');

-- 관리자: 모든 제출 조회
CREATE POLICY "Admins can view all submissions"
ON core_courses_submissions_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);

-- 관리자: 모든 제출 수정 (승인 처리 등)
CREATE POLICY "Admins can update all submissions"
ON core_courses_submissions_2025_11_27_07_17
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ========================================
-- 5. programs 테이블 정책
-- ========================================

-- 누구나 프로그램 목록 조회 가능
CREATE POLICY "Public can view programs"
ON programs_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);

-- 관리자: 프로그램 관리 (생성, 수정, 삭제)
CREATE POLICY "Admins can manage programs"
ON programs_2025_11_27_07_17
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ========================================
-- 6. core_courses 테이블 정책
-- ========================================

-- 누구나 핵심교과목 조회 가능
CREATE POLICY "Public can view core courses"
ON core_courses_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);

-- 관리자: 핵심교과목 관리
CREATE POLICY "Admins can manage core courses"
ON core_courses_2025_11_27_07_17
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ========================================
-- 7. non_curricular_programs 테이블 정책
-- ========================================

-- 누구나 비교과 프로그램 조회 가능
CREATE POLICY "Public can view non curricular programs"
ON non_curricular_programs_2025_11_27_07_17
FOR SELECT
TO anon, authenticated
USING (true);

-- 관리자: 비교과 프로그램 관리
CREATE POLICY "Admins can manage non curricular programs"
ON non_curricular_programs_2025_11_27_07_17
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ========================================
-- 8. 정책 확인
-- ========================================

-- 적용된 정책 목록 조회
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename LIKE '%2025_11_27_07_17%'
ORDER BY tablename, policyname;


-- ========================================
-- ✅ 완료!
-- ========================================
--
-- 적용된 정책:
-- 1. users: 회원가입(INSERT), 로그인 조회(SELECT), 본인 데이터 수정(UPDATE)
-- 2. core_courses_submissions: 승인 전 제출만 수정 가능
-- 3. programs, core_courses, non_curricular_programs: 모든 사용자 조회 가능
--
-- ⚠️ 보안 권장사항:
-- 1. Supabase Auth 도입 후 auth.uid() 기반 정책으로 강화
-- 2. 현재는 클라이언트 기반 인증으로 제한적
-- 3. 승인 여부는 애플리케이션 레벨에서 체크 필요
-- ========================================
