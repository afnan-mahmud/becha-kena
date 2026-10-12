import React from 'react'
import ReactDOM from 'react-dom/client'
// Global styles first so component/page CSS can override them
import './styles/global.css'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
