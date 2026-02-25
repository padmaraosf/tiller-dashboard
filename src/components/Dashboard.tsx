import { useState, useEffect, useCallback } from 'react'
import { loadDashboardData } from '../services/sheets'
import type { DashboardData, AccountBalance } from '../types'
import CashflowChart from './CashflowChart'
import SpendingBreakdown from './SpendingBreakdown'
import NetWorthChart from './NetWorthChart'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

interface Props {
  spreadsheetId: string
  accessToken: string
  onSettings: () => void
  onLogout: () => void
}

export default function Dashboard({ spreadsheetId, accessToken, onSettings, onLogout }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await loadDashboardData(spreadsheetId, accessToken)
      setData(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.toLowerCase().includes('invalid_token') || msg.toLowerCase().includes('401')) {
        setError('SESSION_EXPIRED')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [spreadsheetId, accessToken])

  useEffect(() => { load() }, [load])

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

  if (loading) {
    return (
      <div className="screen-center">
        <div className="spinner" />
        <p className="loading-text">Loading your Tiller data…</p>
      </div>
    )
  }

  if (error === 'SESSION_EXPIRED') {
    return (
      <div className="screen-center">
        <p className="error-text">Session expired. Please sign in again.</p>
        <button className="primary-btn" onClick={onLogout}>Sign In Again</button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen-center">
        <p className="error-text">{error}</p>
        <button className="primary-btn" style={{ marginTop: 16 }} onClick={load}>Retry</button>
        <button className="ghost-btn" style={{ marginTop: 8 }} onClick={onSettings}>Change Sheet</button>
      </div>
    )
  }

  if (!data) return null

  const { netWorth, balances, cashflow, netWorthTrend, asOf } = data
  const assets = balances.filter((b) => b.balance > 0)
  const liabilities = balances.filter((b) => b.balance < 0)

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <span className="dash-title">Tiller Dashboard</span>
        <div className="dash-actions">
          <button className="icon-btn" onClick={load} title="Refresh" aria-label="Refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={onSettings} title="Settings" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="dash-body">

        {/* Net Worth */}
        <div className="card net-worth-card">
          <p className="card-label">Net Worth</p>
          <p className={`net-worth-value ${netWorth >= 0 ? 'positive' : 'negative'}`}>
            {usd(netWorth)}
          </p>
          {netWorthTrend.length >= 2 && (() => {
            const delta = netWorth - netWorthTrend[0].value
            return (
              <p className={`nw-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
                {delta >= 0 ? '▲' : '▼'} {usd(Math.abs(delta))} past 90 days
              </p>
            )
          })()}
          {netWorthTrend.length >= 2 && (
            <div style={{ marginTop: 12 }}>
              <NetWorthChart data={netWorthTrend} />
            </div>
          )}
          <p className="card-sub">Updated {asOf.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Cashflow */}
        <div className="card">
          <p className="card-label">Cash Flow — Last 30 Days</p>
          <div className="cf-row">
            <div className="cf-item">
              <span className="cf-dot income-dot" />
              <span className="cf-label">Income</span>
              <span className="cf-amount income">{usd(cashflow.income)}</span>
            </div>
            <div className="cf-item">
              <span className="cf-dot expense-dot" />
              <span className="cf-label">Expenses</span>
              <span className="cf-amount expense">{usd(cashflow.expenses)}</span>
            </div>
            <div className="cf-item cf-net">
              <span className="cf-label">Net</span>
              <span className={`cf-amount ${cashflow.net >= 0 ? 'income' : 'expense'}`}>
                {usd(cashflow.net)}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <CashflowChart data={cashflow.dailyData} />
          </div>
          <p className="chart-hint">Each bar = daily net (↑ income − ↓ expenses)</p>
        </div>

        {/* Spending by Category */}
        {cashflow.categories.length > 0 && (
          <div className="card">
            <p className="card-label">Top Spending — Last 30 Days</p>
            <SpendingBreakdown categories={cashflow.categories} />
          </div>
        )}

        {/* Asset Accounts */}
        {assets.length > 0 && (
          <div className="card">
            <p className="card-label">Assets ({assets.length})</p>
            <BalanceList accounts={assets} />
          </div>
        )}

        {/* Liability Accounts */}
        {liabilities.length > 0 && (
          <div className="card">
            <p className="card-label">Liabilities ({liabilities.length})</p>
            <BalanceList accounts={liabilities} />
          </div>
        )}

        {/* Fill Button */}
        <a
          className="fill-btn"
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Open Sheet &amp; Fill Tiller
        </a>
        <p className="fill-hint">Opens your sheet → click Tiller &gt; Fill All Sheets</p>

        <button className="ghost-btn logout-btn" onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  )
}

function BalanceList({ accounts }: { accounts: AccountBalance[] }) {
  return (
    <ul className="balance-list">
      {accounts.map((a) => (
        <li key={a.accountId} className="balance-item">
          <div className="balance-info">
            <span className="balance-name">{a.account}</span>
            <span className="balance-inst">{a.institution}</span>
          </div>
          <span className={`balance-amount ${a.balance >= 0 ? 'positive' : 'negative'}`}>
            {usd(a.balance)}
          </span>
        </li>
      ))}
    </ul>
  )
}
