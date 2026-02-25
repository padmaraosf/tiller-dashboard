import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './index.css'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

if (!clientId) {
  document.body.innerHTML =
    '<div style="padding:2rem;font-family:sans-serif;color:#dc2626">' +
    '<h2>Missing VITE_GOOGLE_CLIENT_ID</h2>' +
    '<p>Copy <code>.env.example</code> to <code>.env</code> and add your Google OAuth client ID.</p>' +
    '</div>'
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>,
  )
}
