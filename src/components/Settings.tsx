import { useState } from 'react'

interface Props {
  initialId: string
  onSave: (id: string) => void
  onBack?: () => void
  onLogout: () => void
}

export default function Settings({ initialId, onSave, onBack, onLogout }: Props) {
  const [value, setValue] = useState(initialId)
  const [error, setError] = useState('')

  const handleSave = () => {
    const id = value.trim()
    // Accept either full URL or bare ID
    const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    const finalId = match ? match[1] : id
    if (!finalId) {
      setError('Please enter your spreadsheet ID or URL')
      return
    }
    setError('')
    onSave(finalId)
  }

  return (
    <div className="settings-screen">
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      )}
      <div className="settings-card">
        <h2>Connect Your Tiller Sheet</h2>
        <p className="settings-hint">
          Paste your Tiller Google Sheet URL or just the spreadsheet ID.
        </p>
        <label className="field-label">Spreadsheet URL or ID</label>
        <input
          className="text-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          autoComplete="off"
          spellCheck={false}
        />
        {error && <p className="field-error">{error}</p>}
        <p className="settings-hint small">
          The sheet must use the standard Tiller layout with sheets named
          "Transactions" and "Balance History".
        </p>
        <button className="primary-btn" onClick={handleSave}>
          Save & View Dashboard
        </button>
        <button className="ghost-btn" onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
