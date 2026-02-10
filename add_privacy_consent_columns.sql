-- 개인정보 동의 관련 컬럼 추가
-- users 테이블에 개인정보 수집·이용 동의 여부 및 동의 시각 컬럼 추가

ALTER TABLE users_2025_11_27_07_17
ADD COLUMN IF NOT EXISTS privacy_consented BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS privacy_consented_at TIMESTAMP;

-- 기존 학생 계정은 기본적으로 동의한 것으로 처리 (소급 적용)
UPDATE users_2025_11_27_07_17
SET
  privacy_consented = TRUE,
  privacy_consented_at = created_at
WHERE
  role = 'student'
  AND privacy_consented IS NULL;

-- 인덱스 생성 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_users_privacy_consented
ON users_2025_11_27_07_17(privacy_consented);

-- 확인
SELECT
  username,
  name,
  role,
  privacy_consented,
  privacy_consented_at
FROM users_2025_11_27_07_17
WHERE role = 'student'
ORDER BY created_at DESC
LIMIT 10;
