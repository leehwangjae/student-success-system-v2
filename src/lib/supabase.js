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
    '로컬: .env.local 파일에 설정'
  );
}

// 재시도 대상 HTTP 상태 코드 (Cloudflare/서버 일시 장애)
const RETRYABLE_STATUSES = new Set([522, 524, 502, 503, 504]);
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

const fetchWithRetry = async (url, options = {}, attempt = 0) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.warn(`[Supabase] ${response.status} 응답 - ${delay}ms 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, attempt + 1);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    const isTimeout = error.name === 'AbortError';
    if ((isTimeout || error.name === 'TypeError') && attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`[Supabase] 연결 오류(${error.name}) - ${delay}ms 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, attempt + 1);
    }

    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithRetry,
  },
  db: {
    schema: 'public',
  },
});