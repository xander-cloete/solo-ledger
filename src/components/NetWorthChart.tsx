import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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

  When a `projection` is passed, we append it as a second, dashed line that picks
  up exactly where history ends — so the past reads solid and the future reads
  "estimated". A faint vertical marker labels the "now" boundary.
*/

// A future point on the projected line: a month and its projected value.
export interface ProjectionSeriesPoint {
  month: string
  label: string
  projected: number
}

// One row fed to the chart. History rows carry `netWorth`; future rows carry
// `projected`. The single boundary row ("today") carries both so the solid and
// dashed lines meet with no gap.
interface ChartRow {
  month: string
  label: string
  netWorth: number | null
  projected: number | null
}

// Compact axis numbers so they fit: 1500 -> '1.5k', 2_000_000 -> '2M'.
function abbreviate(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${Math.round(n / 1000)}k`
  return String(Math.round(n))
}

// A small themed tooltip. We drive it ourselves (rather than the default) so a
// hovered point reads as one clean line and is correctly labelled "Net worth"
// for history vs "Projected" for the future.
function ChartTooltip({
  active,
  payload,
  sym,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
  sym: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const isProjected = row.netWorth == null
  const value = isProjected ? row.projected : row.netWorth
  if (value == null) return null
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        padding: '0.5rem 0.625rem',
        fontSize: '0.8rem',
        color: 'var(--fg)',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
        {formatMonthLabel(row.month)}
      </div>
      <div>
        {formatMoney(value, sym)}{' '}
        <span style={{ color: 'var(--muted)' }}>
          · {isProjected ? 'Projected' : 'Net worth'}
        </span>
      </div>
    </div>
  )
}

export function NetWorthChart({
  series,
  sym,
  projection,
}: {
  series: NetWorthPoint[]
  sym: string
  projection?: ProjectionSeriesPoint[]
}) {
  // Show at most the last 12 months of history so the axis stays readable.
  const history = series.slice(-12)

  // Build the combined rows. With no projection it's just history.
  let data: ChartRow[]
  let boundaryLabel: string | null = null
  if (projection && projection.length) {
    const hist: ChartRow[] = history.map((p) => ({
      month: p.month,
      label: p.label,
      netWorth: p.netWorth,
      projected: null,
    }))
    // Seed the dashed line at the last real point so the two lines join up.
    if (hist.length) {
      hist[hist.length - 1].projected = hist[hist.length - 1].netWorth
      boundaryLabel = hist[hist.length - 1].label
    }
    const future: ChartRow[] = projection.map((p) => ({
      month: p.month,
      label: p.label,
      netWorth: null,
      projected: p.projected,
    }))
    data = [...hist, ...future]
  } else {
    data = history.map((p) => ({
      month: p.month,
      label: p.label,
      netWorth: p.netWorth,
      projected: null,
    }))
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        {/* A top-to-bottom fade for the shaded area, in the theme's primary colour. */}
        <defs>
          <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="nw-proj-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.1} />
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
          content={<ChartTooltip sym={sym} />}
          cursor={{ stroke: 'var(--border)' }}
        />
        {/* "Now" divider between the solid past and the dashed future. */}
        {boundaryLabel && (
          <ReferenceLine
            x={boundaryLabel}
            stroke="var(--border)"
            strokeDasharray="2 2"
            label={{
              value: 'now',
              position: 'insideTopRight',
              fill: 'var(--muted)',
              fontSize: 10,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#nw-fill)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--primary)' }}
          connectNulls={false}
        />
        {projection && projection.length > 0 && (
          <Area
            type="monotone"
            dataKey="projected"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeOpacity={0.7}
            fill="url(#nw-proj-fill)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--primary)' }}
            connectNulls={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
