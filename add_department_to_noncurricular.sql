-- 비교과 프로그램 테이블에 department 컬럼 추가
ALTER TABLE non_curricular_programs_2025_11_27_07_17
ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '생명공학과';

-- 기존 데이터의 department를 분야별 첫 번째 전공으로 업데이트
UPDATE non_curricular_programs_2025_11_27_07_17
SET department = CASE
  WHEN field = '바이오' THEN '생명공학과'
  WHEN field = '반도체' THEN '전자공학과'
  WHEN field = '물류' THEN '동북아국제통상학부'
  ELSE '생명공학과'
END
WHERE department = '생명공학과';

-- department 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_non_curricular_programs_department
  ON non_curricular_programs_2025_11_27_07_17(department);

COMMENT ON COLUMN non_curricular_programs_2025_11_27_07_17.department IS '전공/학과명';
