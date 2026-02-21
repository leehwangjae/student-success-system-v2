import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // ← 이 줄이 있어야 합니다!

// 🔥 VERSION: 3.4.2 (2026-02-21)
// ✨ FIX: Storage 파일 업로드 contentType 명시 (PDF, JPG, DOCX 400 에러 수정)
console.log('🚀 학생성공지수 관리시스템 v3.4.2 시작');
console.log('📌 빌드 타임: 2026-02-21 00:00:00');
console.log('✅ 파일 업로드 MIME 타입 오류 수정 (PDF, JPG, DOCX)');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
