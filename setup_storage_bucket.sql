-- =============================================
-- Supabase Storage 버킷 설정
-- Supabase 대시보드 SQL Editor에서 실행하세요
-- 기존 버킷이 있어도 설정을 업데이트합니다
-- =============================================

-- 1. 버킷 생성 또는 설정 업데이트 (public: 파일 URL로 직접 접근 가능)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-submissions',
  'student-submissions',
  true,
  10485760,  -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS 정책 설정 (anon/authenticated 모두 허용 - 앱 레벨에서 인증 처리)
-- 기존 정책이 있으면 삭제 후 재생성
DROP POLICY IF EXISTS "Allow uploads"    ON storage.objects;
DROP POLICY IF EXISTS "Allow downloads"  ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes"    ON storage.objects;

CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'student-submissions');

CREATE POLICY "Allow downloads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'student-submissions');

CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'student-submissions');
