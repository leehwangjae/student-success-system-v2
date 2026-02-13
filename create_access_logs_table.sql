-- ========================================
-- 접근 로그 테이블 생성
-- 정보통신망법 제29조에 따른 접근 기록 보관
-- ========================================

-- 1. access_logs 테이블 생성
CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Supabase Auth 사용 시
  user_id_custom INTEGER,  -- 커스텀 users 테이블 참조
  username VARCHAR(100),
  action_type VARCHAR(50) NOT NULL,  -- 'login', 'logout', 'view_personal_info', 'update_personal_info', 'delete_personal_info'
  ip_address VARCHAR(45),  -- IPv6 지원
  user_agent TEXT,
  resource_accessed TEXT,  -- 접근한 리소스 (URL, 데이터 등)
  status VARCHAR(20),  -- 'success', 'failed', 'blocked'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB  -- 추가 정보 (브라우저, OS, 위치 등)
);

-- 2. 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_access_logs_user_id_custom ON access_logs(user_id_custom);
CREATE INDEX idx_access_logs_username ON access_logs(username);
CREATE INDEX idx_access_logs_action_type ON access_logs(action_type);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX idx_access_logs_status ON access_logs(status);

-- 3. 주석 추가
COMMENT ON TABLE access_logs IS '사용자 접근 로그 (정보통신망법 제29조 준수)';
COMMENT ON COLUMN access_logs.action_type IS '행동 유형: login, logout, view_personal_info, update_personal_info, delete_personal_info';
COMMENT ON COLUMN access_logs.created_at IS '로그 생성 시각';

-- 4. 6개월 이상 로그 자동 삭제 함수 생성
CREATE OR REPLACE FUNCTION delete_old_access_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM access_logs
  WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- 5. 자동 삭제 스케줄 설정 (pg_cron 확장 필요)
-- Supabase에서는 별도 설정 필요
-- 매월 1일 자정에 실행
-- SELECT cron.schedule('delete-old-access-logs', '0 0 1 * *', 'SELECT delete_old_access_logs()');

-- 6. RLS 정책 설정
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 로그 조회 가능
CREATE POLICY "Admins can view all logs"
ON access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_2025_11_27_07_17
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);

-- 시스템만 로그 삽입 가능 (누구나)
CREATE POLICY "System can insert logs"
ON access_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 7. 로그 조회 뷰 생성 (최근 1000개)
CREATE OR REPLACE VIEW recent_access_logs AS
SELECT
  id,
  username,
  action_type,
  ip_address,
  status,
  created_at,
  resource_accessed
FROM access_logs
ORDER BY created_at DESC
LIMIT 1000;

-- 8. 로그 통계 뷰 생성
CREATE OR REPLACE VIEW access_log_stats AS
SELECT
  action_type,
  status,
  DATE(created_at) as date,
  COUNT(*) as count
FROM access_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY action_type, status, DATE(created_at)
ORDER BY date DESC, count DESC;

-- ========================================
-- 사용 예시
-- ========================================

-- 로그 삽입
-- INSERT INTO access_logs (user_id_custom, username, action_type, ip_address, status)
-- VALUES (1, 'testuser', 'login', '127.0.0.1', 'success');

-- 최근 로그 조회
-- SELECT * FROM recent_access_logs;

-- 로그 통계 조회
-- SELECT * FROM access_log_stats;

-- 특정 사용자 로그 조회
-- SELECT * FROM access_logs WHERE username = 'testuser' ORDER BY created_at DESC;

-- 6개월 이상 로그 수동 삭제
-- SELECT delete_old_access_logs();

-- ========================================
-- 완료!
-- ========================================
