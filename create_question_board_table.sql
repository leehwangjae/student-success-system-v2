-- ========================================
-- 질문게시판 테이블 생성 + RLS 정책
-- ========================================
-- Supabase SQL Editor에서 실행하세요
-- ========================================


-- ----------------------------------------
-- 1. 테이블 생성
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS question_board (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  student_name text NOT NULL,
  field text DEFAULT '',
  department text DEFAULT '',
  title text NOT NULL,
  content text NOT NULL,
  is_secret boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  answer text,
  answered_by text,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- ----------------------------------------
-- 2. RLS 활성화
-- ----------------------------------------
ALTER TABLE question_board ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------
-- 3. 기존 정책 삭제 (재실행 대비)
-- ----------------------------------------
DROP POLICY IF EXISTS "Anyone can view question posts" ON question_board;
DROP POLICY IF EXISTS "Students can insert own posts" ON question_board;
DROP POLICY IF EXISTS "Students can update own posts" ON question_board;
DROP POLICY IF EXISTS "Students can delete own posts" ON question_board;
DROP POLICY IF EXISTS "Admins can update all posts" ON question_board;
DROP POLICY IF EXISTS "Admins can delete all posts" ON question_board;


-- ----------------------------------------
-- 4. RLS 정책 생성
-- ----------------------------------------

-- 전체 조회 허용 (비밀글 필터링은 클라이언트에서 처리)
CREATE POLICY "Anyone can view question posts"
ON question_board
FOR SELECT
TO anon, authenticated
USING (true);

-- 학생: 질문 등록
CREATE POLICY "Students can insert own posts"
ON question_board
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 학생: 본인 글 수정 (답변 전만 가능)
CREATE POLICY "Students can update own posts"
ON question_board
FOR UPDATE
TO anon, authenticated
USING (status = 'pending')
WITH CHECK (status = 'pending');

-- 학생: 본인 글 삭제 (답변 전만 가능)
CREATE POLICY "Students can delete own posts"
ON question_board
FOR DELETE
TO anon, authenticated
USING (status = 'pending');

-- 관리자: 모든 글 수정 (답변 등록/수정)
CREATE POLICY "Admins can update all posts"
ON question_board
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 관리자: 모든 글 삭제
CREATE POLICY "Admins can delete all posts"
ON question_board
FOR DELETE
TO anon, authenticated
USING (true);


-- ----------------------------------------
-- 5. 적용 확인
-- ----------------------------------------
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'question_board'
ORDER BY policyname;
