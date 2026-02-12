import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // ← 이 줄이 있어야 합니다!

// 🔥 VERSION: 3.4.1 (2026-02-12)
// ✨ NEW: 지급 정보 입력 필드 추가 (CoreCoursesCheckPage)
console.log('🚀 학생성공지수 관리시스템 v3.4.1 시작');
console.log('📌 빌드 타임: 2026-02-12 11:15:00');
console.log('✅ 캐시 무효화 및 강제 재배포');
console.log('✅ 지급 정보 입력 필드 활성화됨');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
