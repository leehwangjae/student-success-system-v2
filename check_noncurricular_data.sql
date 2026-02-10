-- 1. 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'non_curricular_submissions_2025_11_27_07_17'
ORDER BY ordinal_position;

-- 2. 실제 데이터 확인 (모든 컬럼)
SELECT
  id,
  student_id,
  completed_programs,
  certificate_files,
  total_program_count,
  total_score,
  status,
  submitted_at
FROM non_curricular_submissions_2025_11_27_07_17
ORDER BY submitted_at DESC;

-- 3. total_program_count와 total_score가 NULL인 레코드 확인
SELECT
  id,
  student_id,
  total_program_count,
  total_score,
  jsonb_array_length(completed_programs) as calculated_count,
  (
    SELECT COALESCE(SUM((elem->>'score')::numeric), 0)
    FROM jsonb_array_elements(completed_programs) AS elem
  ) as calculated_score
FROM non_curricular_submissions_2025_11_27_07_17
WHERE total_program_count IS NULL OR total_score IS NULL;
