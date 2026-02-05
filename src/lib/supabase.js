import { createClient } from '@supabase/supabase-js';

// StackBlitz 환경을 위한 설정: 환경변수가 없으면 하드코딩된 값 사용
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zlqymozoffivgelrrqbd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscXltb3pvZmZpdmdlbHJycWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjgyNjYsImV4cCI6MjA3OTgwNDI2Nn0.s1Phd4KYC5XDbEeZKoxGcfnRF6QPYql8McVG-HCSEbo';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL과 Key가 설정되지 않았습니다.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);