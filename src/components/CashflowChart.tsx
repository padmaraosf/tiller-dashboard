import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { DailyNetFlow } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

interface TooltipPayload {
  value?: number
  payload?: DailyNetFlow
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DailyNetFlow
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{label}</p>
      <p className="chart-tooltip-row income">↑ {fmt(d.income)}</p>
      <p className="chart-tooltip-row expense">↓ {fmt(d.expenses)}</p>
      <p className="chart-tooltip-row net" style={{ color: d.net >= 0 ? '#16a34a' : '#dc2626' }}>
        Net {fmt(d.net)}
      </p>
    </div>
  )
}

export default function CashflowChart({ data }: { data: DailyNetFlow[] }) {
  // Show every 5th label so it doesn't crowd on mobile
  const tickFormatter = (_: string, i: number) => (i % 5 === 0 ? data[i]?.date ?? '' : '')

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barSize={6}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={tickFormatter}
        />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
        <Bar dataKey="net" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={entry.net >= 0 ? '#16a34a' : '#dc2626'}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
