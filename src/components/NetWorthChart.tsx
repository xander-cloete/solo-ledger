import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { NetWorthPoint } from '../hooks/useDashboard'
import { formatMoney } from '../lib/format'
import { formatMonthLabel } from '../lib/month'

/*
  NET-WORTH GROWTH CHART (Recharts)
  ---------------------------------
  Recharts draws charts out of SVG. The handy part: SVG colour attributes accept
  CSS variables, so we feed it `var(--primary)` etc. and the chart re-themes for
  free along with the rest of the app — no JS colour wiring needed.

  <ResponsiveContainer> makes the chart fill its parent's width and a fixed
  height. <AreaChart> is a line with the space beneath it shaded.
*/

// Compact axis numbers so they fit: 1500 -> '1.5k', 2_000_000 -> '2M'.
function abbreviate(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${Math.round(n / 1000)}k`
  return String(Math.round(n))
}

export function NetWorthChart({
  series,
  sym,
}: {
  series: NetWorthPoint[]
  sym: string
}) {
  // Show at most the last 12 months so the axis stays readable.
  const data = series.slice(-12)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        {/* A top-to-bottom fade for the shaded area, in the theme's primary colour. */}
        <defs>
          <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--muted)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          minTickGap={16}
        />
        <YAxis
          width={44}
          tick={{ fill: 'var(--muted)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={abbreviate}
        />
        <Tooltip
          // Format the hovered point as "Month Year" + full money value.
          formatter={(value) => [formatMoney(Number(value), sym), 'Net worth']}
          labelFormatter={(_label, payload) =>
            payload?.[0] ? formatMonthLabel(payload[0].payload.month) : ''
          }
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            color: 'var(--fg)',
            fontSize: '0.8rem',
          }}
          labelStyle={{ color: 'var(--muted)' }}
          cursor={{ stroke: 'var(--border)' }}
        />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#nw-fill)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--primary)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
