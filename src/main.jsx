import React from 'react'
import ReactDOM from 'react-dom/client'
import { initSentry } from '@/lib/sentry'
import App from '@/App.jsx'
import '@/index.css'

// Must be called before ReactDOM.createRoot so Sentry wraps the full render lifecycle
initSentry()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
