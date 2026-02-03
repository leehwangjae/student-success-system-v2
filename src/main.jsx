import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // ← 이 줄이 있어야 합니다!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)