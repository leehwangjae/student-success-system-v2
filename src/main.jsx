import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // ← 이 줄이 있어야 합니다!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// v3.2 - MyInfo modal fixed
// Build timestamp: 2026-02-11 17:00:00
