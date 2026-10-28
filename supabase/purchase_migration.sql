-- ============================================================
-- 구매지원 시스템 DB 마이그레이션
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- 주의: 기존 SSI 데이터는 건드리지 않음
-- ============================================================

-- 1. users 테이블에 교수 역할 및 프로필 컬럼 추가
-- ============================================================
ALTER TABLE users_2025_11_27_07_17
  ADD COLUMN IF NOT EXISTS faculty    TEXT,
  ADD COLUMN IF NOT EXISTS "position" TEXT,
  ADD COLUMN IF NOT EXISTS lab_name   TEXT;

-- account_type / role 체크 제약에 'professor' 추가
-- (기존 제약명을 모르는 경우 DROP CONSTRAINT IF EXISTS 로 처리)
DO $$
BEGIN
  -- account_type constraint
  BEGIN
    ALTER TABLE users_2025_11_27_07_17
      DROP CONSTRAINT IF EXISTS users_2025_11_27_07_17_account_type_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER TABLE users_2025_11_27_07_17
      DROP CONSTRAINT IF EXISTS users_account_type_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  ALTER TABLE users_2025_11_27_07_17
    ADD CONSTRAINT users_account_type_check
    CHECK (account_type IN ('student','admin','professor'));

  -- role constraint
  BEGIN
    ALTER TABLE users_2025_11_27_07_17
      DROP CONSTRAINT IF EXISTS users_2025_11_27_07_17_role_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER TABLE users_2025_11_27_07_17
      DROP CONSTRAINT IF EXISTS users_role_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  ALTER TABLE users_2025_11_27_07_17
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('student','admin','master','professor'));
END $$;


-- 2. 사업연도·학과 설정 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_settings_2025_11_27_07_17 (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year          TEXT        NOT NULL,          -- 예: '2026'
  department_name      TEXT        NOT NULL,          -- 학과명
  allocated_amount     BIGINT      NOT NULL DEFAULT 0, -- 배정액 (원)
  application_start_at TIMESTAMPTZ,
  application_end_at   TIMESTAMPTZ,
  is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fiscal_year, department_name)
);


-- 3. 구매 신청서 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_requests_2025_11_27_07_17 (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no       TEXT    UNIQUE NOT NULL,           -- 신청번호 (자동생성)
  fiscal_year      TEXT    NOT NULL,
  applicant_id     UUID    NOT NULL REFERENCES users_2025_11_27_07_17(id),
  department_name  TEXT    NOT NULL,
  lab_name         TEXT    NOT NULL,
  professor_name   TEXT    NOT NULL,
  title            TEXT    NOT NULL,
  purpose          TEXT    NOT NULL,                  -- 활용 목적
  delivery_name    TEXT    NOT NULL,                  -- 수령인
  delivery_phone   TEXT    NOT NULL,
  delivery_address TEXT    NOT NULL,
  total_amount     BIGINT  NOT NULL DEFAULT 0,        -- 서버에서 재계산
  approved_amount  BIGINT,                            -- 승인금액
  purchased_amount BIGINT  NOT NULL DEFAULT 0,        -- 실제 구매액 합계
  status           TEXT    NOT NULL DEFAULT 'draft',
    CONSTRAINT purchase_requests_status_check
    CHECK (status IN (
      'draft','submitted','reviewing','needs_revision',
      'approved','purchasing','awaiting_receipt',
      'receipt_review','closed','rejected','cancelled'
    )),
  rejection_reason TEXT,
  revision_reason  TEXT,
  admin_memo       TEXT,
  submitted_at     TIMESTAMPTZ,
  reviewed_at      TIMESTAMPTZ,
  closed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_applicant
  ON purchase_requests_2025_11_27_07_17(applicant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status
  ON purchase_requests_2025_11_27_07_17(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_fiscal
  ON purchase_requests_2025_11_27_07_17(fiscal_year, department_name);


-- 4. 신청 품목 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_request_items_2025_11_27_07_17 (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID    NOT NULL
    REFERENCES purchase_requests_2025_11_27_07_17(id) ON DELETE CASCADE,
  item_name    TEXT    NOT NULL,
  specification TEXT,
  quantity     INTEGER NOT NULL DEFAULT 1,
  unit         TEXT    NOT NULL DEFAULT '개',
  unit_price   BIGINT  NOT NULL,
  total_price  BIGINT  NOT NULL,  -- quantity * unit_price
  supplier_url TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. 구매 실행 기록 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders_2025_11_27_07_17 (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID    NOT NULL
    REFERENCES purchase_requests_2025_11_27_07_17(id),
  supplier     TEXT,
  order_no     TEXT,
  purchased_at DATE,
  shipping_fee BIGINT  NOT NULL DEFAULT 0,
  amount       BIGINT  NOT NULL,  -- 구매금액
  is_closed    BOOLEAN NOT NULL DEFAULT FALSE,
  memo         TEXT,
  admin_id     UUID    REFERENCES users_2025_11_27_07_17(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 6. 수령 보고 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_receipts_2025_11_27_07_17 (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID    NOT NULL
    REFERENCES purchase_orders_2025_11_27_07_17(id),
  request_id    UUID    NOT NULL
    REFERENCES purchase_requests_2025_11_27_07_17(id),
  reporter_id   UUID    NOT NULL REFERENCES users_2025_11_27_07_17(id),
  received_at   DATE,
  notes         TEXT,
  review_status TEXT    NOT NULL DEFAULT 'pending',
    CONSTRAINT purchase_receipts_review_status_check
    CHECK (review_status IN ('pending','confirmed','needs_revision')),
  reviewer_id   UUID    REFERENCES users_2025_11_27_07_17(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 7. 첨부파일 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_attachments_2025_11_27_07_17 (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID    REFERENCES purchase_requests_2025_11_27_07_17(id),
  order_id        UUID    REFERENCES purchase_orders_2025_11_27_07_17(id),
  receipt_id      UUID    REFERENCES purchase_receipts_2025_11_27_07_17(id),
  attachment_type TEXT    NOT NULL,
    CONSTRAINT purchase_attachments_type_check
    CHECK (attachment_type IN ('estimate','purchase_proof','receipt_photo')),
  file_name       TEXT    NOT NULL,
  file_size       BIGINT,
  storage_path    TEXT    NOT NULL,  -- Supabase Storage 경로
  mime_type       TEXT,
  uploader_id     UUID    NOT NULL REFERENCES users_2025_11_27_07_17(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 8. 처리 이력 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_history_2025_11_27_07_17 (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     UUID    NOT NULL
    REFERENCES purchase_requests_2025_11_27_07_17(id),
  actor_id       UUID    REFERENCES users_2025_11_27_07_17(id),
  actor_name     TEXT,
  action         TEXT    NOT NULL,
  before_status  TEXT,
  after_status   TEXT,
  reason         TEXT,
  extra_data     JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 9. 신청번호 자동 채번 함수
-- ============================================================
CREATE OR REPLACE FUNCTION generate_purchase_request_no(p_fiscal_year TEXT)
RETURNS TEXT AS $$
DECLARE
  v_seq   INTEGER;
  v_no    TEXT;
BEGIN
  SELECT COUNT(*) + 1
    INTO v_seq
    FROM purchase_requests_2025_11_27_07_17
   WHERE fiscal_year = p_fiscal_year;

  v_no := 'PUR-' || p_fiscal_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_no;
END;
$$ LANGUAGE plpgsql;


-- 10. Supabase Storage bucket (purchase-files) 생성
-- ============================================================
-- 대시보드 Storage 탭에서 직접 생성하거나 아래 실행
INSERT INTO storage.buckets (id, name, public)
  VALUES ('purchase-files', 'purchase-files', FALSE)
  ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 업로더는 자신이 업로드한 파일에 접근
-- (RLS는 현재 Supabase anon key 환경에서는 별도 설정 필요)


-- 11. RLS 활성화 (권장)
-- ============================================================
ALTER TABLE purchase_settings_2025_11_27_07_17   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests_2025_11_27_07_17   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders_2025_11_27_07_17     ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts_2025_11_27_07_17   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_attachments_2025_11_27_07_17 ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history_2025_11_27_07_17    ENABLE ROW LEVEL SECURITY;

-- ※ 현재 시스템은 anon key + 애플리케이션 레벨 권한 검증 방식을 사용하므로
--   아래 정책은 전체 허용(anon)으로 설정. 추후 service_role 분리 가능.
CREATE POLICY IF NOT EXISTS "allow_all_purchase_settings"
  ON purchase_settings_2025_11_27_07_17 FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY IF NOT EXISTS "allow_all_purchase_requests"
  ON purchase_requests_2025_11_27_07_17 FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY IF NOT EXISTS "allow_all_purchase_request_items"
  ON purchase_request_items_2025_11_27_07_17 FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY IF NOT EXISTS "allow_all_purchase_orders"
  ON purchase_orders_2025_11_27_07_17 FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY IF NOT EXISTS "allow_all_purchase_receipts"
  ON purchase_receipts_2025_11_27_07_17 FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY IF NOT EXISTS "allow_all_purchase_attachments"
  ON purchase_attachments_2025_11_27_07_17 FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY IF NOT EXISTS "allow_all_purchase_history"
  ON purchase_history_2025_11_27_07_17 FOR ALL USING (TRUE) WITH CHECK (TRUE);
