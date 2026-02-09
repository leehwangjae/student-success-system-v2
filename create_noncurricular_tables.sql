-- 비교과 프로그램 테이블
CREATE TABLE IF NOT EXISTS non_curricular_programs_2025_11_27_07_17 (
  id BIGSERIAL PRIMARY KEY,
  program_name TEXT NOT NULL,
  category TEXT NOT NULL, -- '취업역량' 또는 '산학협력'
  field TEXT NOT NULL, -- '바이오', '반도체', '물류'
  score INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 비교과 프로그램 제출 테이블
CREATE TABLE IF NOT EXISTS non_curricular_submissions_2025_11_27_07_17 (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users_2025_11_27_07_17(id) ON DELETE CASCADE,
  completed_programs JSONB NOT NULL DEFAULT '[]', -- 선택한 프로그램 목록 [{programId, programName, category, score}]
  certificate_files JSONB NOT NULL DEFAULT '[]', -- 첨부 파일 목록 [{fileName, fileSize, fileData}]
  total_program_count INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_non_curricular_programs_field
  ON non_curricular_programs_2025_11_27_07_17(field);

CREATE INDEX IF NOT EXISTS idx_non_curricular_programs_category
  ON non_curricular_programs_2025_11_27_07_17(category);

CREATE INDEX IF NOT EXISTS idx_non_curricular_submissions_student
  ON non_curricular_submissions_2025_11_27_07_17(student_id);

CREATE INDEX IF NOT EXISTS idx_non_curricular_submissions_status
  ON non_curricular_submissions_2025_11_27_07_17(status);

-- 샘플 데이터 (선택사항)
INSERT INTO non_curricular_programs_2025_11_27_07_17
  (program_name, category, field, score, description)
VALUES
  ('취업 역량 강화 프로그램', '취업역량', '바이오', 10, '이력서 작성 및 면접 스킬 향상'),
  ('산업체 인턴십', '산학협력', '바이오', 15, '바이오 산업체 현장 실습'),
  ('반도체 기술 세미나', '취업역량', '반도체', 10, '최신 반도체 기술 동향 세미나'),
  ('기업 연계 프로젝트', '산학협력', '반도체', 20, '반도체 기업과의 협력 프로젝트'),
  ('물류 현장 체험', '취업역량', '물류', 10, '물류센터 견학 및 체험'),
  ('글로벌 물류 실습', '산학협력', '물류', 15, '국제 물류 업체 실습')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE non_curricular_programs_2025_11_27_07_17 IS '비교과 프로그램 마스터 테이블';
COMMENT ON TABLE non_curricular_submissions_2025_11_27_07_17 IS '학생 비교과 프로그램 제출 내역';
