import type { AccountBalance, CategoryBreakdown, CashflowSummary, DashboardData, NetWorthPoint } from '../types'

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

// Google Sheets stores dates as serial numbers (days since Dec 30 1899).
// This matches Excel's 1900 date system.
function serialToDate(n: number): Date {
  // Serial → UTC midnight; then shift to local midnight to avoid day-boundary issues
  const utcMs = (n - 25569) * 86400 * 1000
  const utc = new Date(utcMs)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

// "YYYY-MM-DD" in local time — consistent key for all date maps
function localISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Strip "$", commas, etc. so text-formatted amounts parse correctly
function parseAmount(raw: unknown): number {
  if (typeof raw === 'number') return raw
  const n = Number(String(raw).replace(/[$,\s]/g, ''))
  return isNaN(n) ? NaN : n
}

function parseDate(raw: unknown): Date | null {
  if (raw == null || raw === '') return null
  if (typeof raw === 'number') {
    const d = serialToDate(raw)
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(raw).trim()
  // "M/D/YYYY" or "MM/DD/YYYY" — construct as local date to avoid UTC day-shift
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    return new Date(Number(slashMatch[3]), Number(slashMatch[1]) - 1, Number(slashMatch[2]))
  }
  // "YYYY-MM-DD" — also force local midnight
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

async function fetchRange(
  spreadsheetId: string,
  range: string,
  token: string,
): Promise<unknown[][]> {
  const url =
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}` +
    `?valueRenderOption=UNFORMATTED_VALUE`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = (body as { error?: { message?: string } }).error?.message ?? res.statusText
    throw new Error(msg)
  }
  const data = (await res.json()) as { values?: unknown[][] }
  return data.values ?? []
}

// ─── Tiller standard column indices ──────────────────────────────────────────
// Transactions sheet: A=Date B=Description C=Category D=Amount
// Balance History:    A=Date B=Time C=Account D=Account# E=Institution F=Balance G=AccountID

export async function loadDashboardData(
  spreadsheetId: string,
  token: string,
): Promise<DashboardData> {
  const [txRows, balRows] = await Promise.all([
    fetchRange(spreadsheetId, 'Transactions!A:D', token),
    fetchRange(spreadsheetId, 'Balance History!A:G', token),
  ])

  // ── Cashflow: last 30 days ───────────────────────────────────────────────
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  cutoff.setHours(0, 0, 0, 0)

  // Build a map keyed by local date string for the last 30 days, initialised to 0
  const dailyMap = new Map<string, { income: number; expenses: number }>()
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    dailyMap.set(localISODate(d), { income: 0, expenses: 0 })
  }

  let totalIncome = 0
  let totalExpenses = 0
  const categoryMap = new Map<string, number>()

  for (const row of txRows.slice(1)) {
    if (!Array.isArray(row) || row.length < 4) continue
    const date = parseDate(row[0])
    if (!date || date < cutoff) continue
    const amount = parseAmount(row[3])
    if (isNaN(amount) || amount === 0) continue

    const key = localISODate(date)
    if (!dailyMap.has(key)) continue

    const slot = dailyMap.get(key)!
    if (amount > 0) {
      slot.income += amount
      totalIncome += amount
    } else {
      slot.expenses += Math.abs(amount)
      totalExpenses += Math.abs(amount)

      // Track category spending (expenses only)
      const cat = String(row[2] ?? '').trim() || 'Uncategorized'
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Math.abs(amount))
    }
  }

  const categories: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  const dailyData = Array.from(dailyMap.entries()).map(([iso, v]) => {
    const [, mm, dd] = iso.split('-')
    return {
      date: `${mm}/${dd}`,
      income: round2(v.income),
      expenses: round2(v.expenses),
      net: round2(v.income - v.expenses),
    }
  })

  const cashflow: CashflowSummary = {
    income: round2(totalIncome),
    expenses: round2(totalExpenses),
    net: round2(totalIncome - totalExpenses),
    dailyData,
    categories,
  }

  // ── Balances: most recent entry per account ──────────────────────────────
  const accountMap = new Map<
    string,
    { account: string; institution: string; balance: number; date: Date }
  >()

  for (const row of balRows.slice(1)) {
    if (!Array.isArray(row) || row.length < 6) continue
    const date = parseDate(row[0])
    if (!date) continue
    const balance = parseAmount(row[5])
    if (isNaN(balance)) continue

    // Use Account ID (col G) if present, else fall back to Account+Institution
    const accountId =
      String(row[6] ?? '').trim() || `${String(row[2] ?? '')}_${String(row[4] ?? '')}`

    const existing = accountMap.get(accountId)
    if (!existing || date > existing.date) {
      accountMap.set(accountId, {
        account: String(row[2] ?? ''),
        institution: String(row[4] ?? ''),
        balance: round2(balance),
        date,
      })
    }
  }

  const balances: AccountBalance[] = Array.from(accountMap.entries())
    .map(([accountId, v]) => ({
      accountId,
      account: v.account,
      institution: v.institution,
      balance: v.balance,
    }))
    .sort((a, b) => b.balance - a.balance)

  const netWorth = round2(balances.reduce((s, b) => s + b.balance, 0))

  // ── Net worth trend: last 90 days ────────────────────────────────────────
  // Group balance entries by accountId, sorted ascending by date
  type BalEntry = { date: Date; balance: number }
  const byAccount = new Map<string, BalEntry[]>()

  for (const row of balRows.slice(1)) {
    if (!Array.isArray(row) || row.length < 6) continue
    const date = parseDate(row[0])
    if (!date) continue
    const balance = parseAmount(row[5])
    if (isNaN(balance)) continue
    const accountId =
      String(row[6] ?? '').trim() || `${String(row[2] ?? '')}_${String(row[4] ?? '')}`
    const arr = byAccount.get(accountId) ?? []
    arr.push({ date, balance })
    byAccount.set(accountId, arr)
  }

  // Sort each account's history ascending
  for (const arr of byAccount.values()) {
    arr.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const trendDays = 90
  const netWorthTrend: NetWorthPoint[] = []

  for (let i = 0; i < trendDays; i++) {
    const day = new Date()
    day.setDate(day.getDate() - (trendDays - 1 - i))
    day.setHours(23, 59, 59, 999)

    const [, mm, dd] = localISODate(day).split('-')
    let dayNetWorth = 0
    let hasAny = false

    for (const entries of byAccount.values()) {
      // Binary search for the last entry <= day
      let lo = 0, hi = entries.length - 1, best: BalEntry | null = null
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        if (entries[mid].date <= day) { best = entries[mid]; lo = mid + 1 }
        else hi = mid - 1
      }
      if (best) { dayNetWorth += best.balance; hasAny = true }
    }

    if (hasAny) {
      netWorthTrend.push({ date: `${mm}/${dd}`, value: round2(dayNetWorth) })
    }
  }

  return { netWorth, balances, cashflow, netWorthTrend, asOf: new Date() }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
