import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL과 Key가 환경 변수에 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);