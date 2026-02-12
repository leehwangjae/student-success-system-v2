-- core_courses_submissions 테이블에 필요한 컬럼들 추가
-- 2026-02-12: uploaded_files, payment_info 컬럼 추가

-- 1. uploaded_files 컬럼 추가 (업로드된 파일 정보 저장)
ALTER TABLE core_courses_submissions_2025_11_27_07_17
ADD COLUMN IF NOT EXISTS uploaded_files JSONB DEFAULT '[]'::jsonb;

-- 2. payment_info 컬럼 추가 (지급 정보 저장)
ALTER TABLE core_courses_submissions_2025_11_27_07_17
ADD COLUMN IF NOT EXISTS payment_info JSONB DEFAULT NULL;

-- 컬럼에 주석 추가
COMMENT ON COLUMN core_courses_submissions_2025_11_27_07_17.uploaded_files IS '업로드된 파일 정보 (이수표, 개인정보동의서 등)';
COMMENT ON COLUMN core_courses_submissions_2025_11_27_07_17.payment_info IS '지급 정보 (은행명, 계좌번호, 예금주)';

-- 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'core_courses_submissions_2025_11_27_07_17'
  AND column_name IN ('uploaded_files', 'payment_info')
ORDER BY column_name;
