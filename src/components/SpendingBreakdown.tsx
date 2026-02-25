import type { CategoryBreakdown } from '../types'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

export default function SpendingBreakdown({ categories }: { categories: CategoryBreakdown[] }) {
  if (categories.length === 0) return null
  const max = categories[0].amount

  return (
    <ul className="cat-list">
      {categories.map((c) => (
        <li key={c.category} className="cat-item">
          <div className="cat-top">
            <span className="cat-name">{c.category}</span>
            <span className="cat-amount expense">{usd(c.amount)}</span>
          </div>
          <div className="cat-bar-track">
            <div
              className="cat-bar-fill"
              style={{ width: `${(c.amount / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
