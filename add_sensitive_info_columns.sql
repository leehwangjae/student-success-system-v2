-- 주민등록번호와 계좌정보 컬럼 추가
-- users_2025_11_27_07_17 테이블에 민감정보 필드 추가

-- 1. 주민등록번호 컬럼 추가 (선택 사항)
ALTER TABLE users_2025_11_27_07_17
ADD COLUMN IF NOT EXISTS ssn VARCHAR(14) NULL;

-- 2. 은행명 컬럼 추가 (선택 사항)
ALTER TABLE users_2025_11_27_07_17
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50) NULL;

-- 3. 계좌번호 컬럼 추가 (선택 사항)
ALTER TABLE users_2025_11_27_07_17
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50) NULL;

-- 4. 예금주명 컬럼 추가 (선택 사항)
ALTER TABLE users_2025_11_27_07_17
ADD COLUMN IF NOT EXISTS account_holder VARCHAR(50) NULL;

-- 5. 주민등록번호 컬럼에 코멘트 추가
COMMENT ON COLUMN users_2025_11_27_07_17.ssn IS '주민등록번호 (암호화 권장)';
COMMENT ON COLUMN users_2025_11_27_07_17.bank_name IS '은행명';
COMMENT ON COLUMN users_2025_11_27_07_17.account_number IS '계좌번호 (암호화 권장)';
COMMENT ON COLUMN users_2025_11_27_07_17.account_holder IS '예금주명';

-- 6. 변경사항 확인
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users_2025_11_27_07_17'
    AND column_name IN ('ssn', 'bank_name', 'account_number', 'account_holder')
ORDER BY ordinal_position;
