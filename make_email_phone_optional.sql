-- 이메일과 전화번호를 선택 항목으로 변경
-- users_2025_11_27_07_17 테이블의 email, phone 컬럼을 nullable로 변경

-- 1. email 컬럼을 nullable로 변경
ALTER TABLE users_2025_11_27_07_17
ALTER COLUMN email DROP NOT NULL;

-- 2. phone 컬럼을 nullable로 변경
ALTER TABLE users_2025_11_27_07_17
ALTER COLUMN phone DROP NOT NULL;

-- 3. 변경사항 확인
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'users_2025_11_27_07_17'
    AND column_name IN ('email', 'phone');
