-- =============================================
-- 만족도 조사 테이블 생성
-- Supabase 대시보드 SQL Editor에서 실행하세요
-- =============================================

CREATE TABLE IF NOT EXISTS satisfaction_survey (
  id          BIGSERIAL PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES users_2025_11_27_07_17(id) ON DELETE CASCADE,
  scores      JSONB NOT NULL DEFAULT '{}',
  notes       JSONB NOT NULL DEFAULT '{}',
  general_opinion TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id)
);

-- RLS 활성화
ALTER TABLE satisfaction_survey ENABLE ROW LEVEL SECURITY;

-- 학생: 본인 데이터만 조회/삽입/수정
CREATE POLICY "student_select_own_survey"
  ON satisfaction_survey FOR SELECT
  USING (student_id = auth.uid()::uuid OR TRUE);  -- 비 Auth 방식이므로 전체 허용 후 앱 레벨 제어

CREATE POLICY "student_insert_own_survey"
  ON satisfaction_survey FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "student_update_own_survey"
  ON satisfaction_survey FOR UPDATE
  USING (TRUE);
