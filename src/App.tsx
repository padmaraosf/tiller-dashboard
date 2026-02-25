import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import Settings from './components/Settings'
import Dashboard from './components/Dashboard'

type Screen = 'login' | 'settings' | 'dashboard'

export default function App() {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('g_token'),
  )
  const [spreadsheetId, setSpreadsheetId] = useState<string>(
    () => localStorage.getItem('spreadsheetId') ?? '',
  )
  const [screen, setScreen] = useState<Screen>(() => {
    if (!sessionStorage.getItem('g_token')) return 'login'
    if (!localStorage.getItem('spreadsheetId')) return 'settings'
    return 'dashboard'
  })

  useEffect(() => {
    if (!token) { setScreen('login'); return }
    if (!spreadsheetId) { setScreen('settings'); return }
    setScreen('dashboard')
  }, [token, spreadsheetId])

  const handleLogin = (accessToken: string) => {
    sessionStorage.setItem('g_token', accessToken)
    setToken(accessToken)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('g_token')
    setToken(null)
  }

  const handleSaveSettings = (id: string) => {
    localStorage.setItem('spreadsheetId', id)
    setSpreadsheetId(id)
  }

  if (screen === 'login') {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (screen === 'settings') {
    return (
      <Settings
        initialId={spreadsheetId}
        onSave={handleSaveSettings}
        onBack={spreadsheetId ? () => setScreen('dashboard') : undefined}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <Dashboard
      spreadsheetId={spreadsheetId}
      accessToken={token!}
      onSettings={() => setScreen('settings')}
      onLogout={handleLogout}
    />
  )
}
