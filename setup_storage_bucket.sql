-- =============================================
-- Supabase Storage 버킷 설정
-- Supabase 대시보드 SQL Editor에서 실행하세요
-- =============================================

-- 1. 버킷 생성 (public: 파일 URL로 직접 접근 가능)
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
ON CONFLICT (id) DO NOTHING;

-- 2. RLS 정책 설정 (anon/authenticated 모두 허용 - 앱 레벨에서 인증 처리)
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'student-submissions');

CREATE POLICY "Allow downloads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'student-submissions');

CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'student-submissions');
