-- 기존 비교과 제출 데이터의 total_program_count와 total_score 업데이트
-- completed_programs JSONB 배열의 길이와 점수 합계를 계산하여 업데이트

UPDATE non_curricular_submissions_2025_11_27_07_17
SET
  total_program_count = jsonb_array_length(completed_programs),
  total_score = (
    SELECT COALESCE(SUM((elem->>'score')::numeric), 0)
    FROM jsonb_array_elements(completed_programs) AS elem
  ),
  updated_at = NOW()
WHERE total_program_count IS NULL OR total_score IS NULL;

-- 결과 확인
SELECT
  id,
  student_id,
  total_program_count,
  total_score,
  status,
  submitted_at
FROM non_curricular_submissions_2025_11_27_07_17
ORDER BY submitted_at DESC;
