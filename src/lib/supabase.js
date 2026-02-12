import { createClient } from '@supabase/supabase-js';

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경변수 유효성 검사
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Supabase 환경변수가 설정되지 않았습니다.\n' +
    '다음 환경변수를 설정해주세요:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY\n\n' +
    'Vercel: 프로젝트 설정 → Environment Variables에서 설정\n' +
    '로컬: .env 파일에 설정'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);