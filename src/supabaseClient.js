import { createClient } from '@supabase/supabase-js';

// 직접 값을 넣어서 테스트
const supabaseUrl = 'https://xmsjvncgdajccobyulpo.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtc2p2bmNnZGFqY2NvYnl1bHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzAzMDUsImV4cCI6MjA3Njk0NjMwNX0.MikyYnD8T47CUW-wuHRgMx47xVBZUntmkUBMFJwNn70';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
