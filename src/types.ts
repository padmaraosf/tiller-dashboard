export interface AccountBalance {
  accountId: string
  account: string
  institution: string
  balance: number
}

export interface DailyNetFlow {
  date: string   // "MM/DD"
  net: number    // income - expenses for that day
  income: number
  expenses: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
}

export interface CashflowSummary {
  income: number
  expenses: number
  net: number
  dailyData: DailyNetFlow[]
  categories: CategoryBreakdown[]
}

export interface NetWorthPoint {
  date: string  // "MM/DD"
  value: number
}

export interface DashboardData {
  netWorth: number
  balances: AccountBalance[]
  cashflow: CashflowSummary
  netWorthTrend: NetWorthPoint[]
  asOf: Date
}
