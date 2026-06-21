import { motion } from 'framer-motion'
import { NetWorthChart } from '../components/NetWorthChart'
import { RemindersBanner } from '../components/RemindersBanner'
import { GamificationPanel } from '../components/GamificationPanel'
import { CountUp } from '../components/CountUp'
import { ThemeSignature } from '../components/ThemeSignature'
import { Eyebrow, hoverLift } from '../components/ui'
import { useDashboard } from '../hooks/useDashboard'
import { useSettings } from '../hooks/useSettings'
import { formatMoney } from '../lib/format'
import { staggerContainer, fadeItem } from '../lib/motion'
import { currentMonthKey, formatMonthLabel } from '../lib/month'
import type { ReactNode } from 'react'

/*
  Dashboard — the flagship page of the design overhaul.

  Aesthetic: editorial + refined-fintech. A quiet uppercase "eyebrow" label sits
  over a very large display-font figure (the net-worth hero), with a faint
  theme-tinted glow for depth. Everything below is a calm grid of panels with
  hairline borders that lift gently on hover. All colour comes from CSS theme
  variables (so it adapts across all 10 themes) and `color-mix` tints, so the
  same layout reads as Japandi, neon, terminal, or sepia depending on the theme.
  This page stores nothing — it's a live mirror of the ledger + investment maths.
*/
export function Dashboard() {
  const d = useDashboard()
  const settings = useSettings()
  const sym = d.sym
  const monthNet = d.monthIncome - d.monthExpenses

  return (
    <div>
      {/* Masthead — small, editorial. The page's real headline is the number. */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Overview
        </h1>
        <span className="text-xs tracking-wide text-muted">
          {formatMonthLabel(currentMonthKey())}
        </span>
      </div>

      {/* Upcoming yearly-expense reminders, shown on open. */}
      <RemindersBanner />

      {!d.hasAnyData ? (
        <p className="mt-8 rounded-card border border-border bg-surface p-6 text-sm text-muted">
          Nothing to show yet. Add income, expenses, or an investment and your net
          worth and growth chart will appear here.
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="enter"
          className="mt-4 space-y-4"
        >
          {/* Hero: net worth */}
          <motion.section
            variants={fadeItem}
            className="dash-hero relative overflow-hidden rounded-card border border-border p-6 sm:p-8"
            style={{
              backgroundImage:
                'linear-gradient(150deg, color-mix(in srgb, var(--primary) 7%, var(--surface)) 0%, var(--surface) 60%)',
            }}
          >
            {/* Per-theme decorative signature (Japandi: a brushed ensō; others:
                a soft theme-tinted glow). */}
            <ThemeSignature />
            <div className="relative">
              <Eyebrow>Net worth</Eyebrow>
              <CountUp
                value={d.netWorth}
                format={(n) => formatMoney(n, sym)}
                className="mt-2 block font-display text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl"
              />
              <p className="mt-2 text-sm text-muted">
                Liquid balance plus the value of every investment.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetricPanel label="Liquid balance" caption="in your rolling budget">
                  <CountUp
                    value={d.liquid}
                    format={(n) => formatMoney(n, sym)}
                    className="font-display text-2xl font-semibold tabular-nums"
                  />
                </MetricPanel>
                <MetricPanel
                  label="Investments"
                  caption={
                    <>
                      <span className={growthColor(d.investmentsGain)}>
                        {formatSigned(d.investmentsGain, sym)}
                        {d.investmentsGainPct != null &&
                          ` (${d.investmentsGainPct >= 0 ? '+' : ''}${d.investmentsGainPct.toFixed(1)}%)`}
                      </span>{' '}
                      all-time
                    </>
                  }
                >
                  <CountUp
                    value={d.investmentsValue}
                    format={(n) => formatMoney(n, sym)}
                    className="font-display text-2xl font-semibold tabular-nums"
                  />
                </MetricPanel>
              </div>
            </div>
          </motion.section>

          {/* Quiet progress layer (Phase 9) — only when enabled in Customize. */}
          {settings.gamification !== false && (
            <motion.div variants={fadeItem}>
              <GamificationPanel />
            </motion.div>
          )}

          {/* Growth chart + forward projection */}
          <motion.section
            variants={fadeItem}
            className="rounded-card border border-border bg-surface p-5 sm:p-6"
          >
            <div className="mb-4 flex items-baseline justify-between">
              <Eyebrow>Net worth over time</Eyebrow>
              <span className="text-xs text-muted">
                {d.projection ? 'history + projection' : 'last 12 months'}
              </span>
            </div>
            <NetWorthChart
              series={d.series}
              sym={sym}
              projection={d.projection?.series}
            />
            {d.projection && (
              <>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {d.projection.horizons.map((h) => (
                    <div
                      key={h.months}
                      className="rounded-lg border border-border bg-bg/70 px-3 py-3"
                    >
                      <Eyebrow>In {h.label}</Eyebrow>
                      <div className="mt-1 font-display text-lg font-semibold tabular-nums sm:text-xl">
                        {formatMoney(h.value, sym)}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted">
                  Projected from each portfolio's growth so far (or your set rate),
                  with liquid balance held flat. An estimate, not a guarantee.
                </p>
              </>
            )}
          </motion.section>

          {/* This month */}
          <motion.section variants={fadeItem}>
            <Eyebrow className="mb-2">This month</Eyebrow>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Income"
                value={`+ ${formatMoney(d.monthIncome, sym)}`}
                tone="positive"
              />
              <StatCard
                label="Expenses"
                value={`− ${formatMoney(d.monthExpenses, sym)}`}
                tone="negative"
              />
              <StatCard
                label="Net this month"
                value={formatMoney(monthNet, sym)}
                tone={monthNet < 0 ? 'negative' : 'positive'}
                caption="income minus expenses"
              />
            </div>
          </motion.section>
        </motion.div>
      )}
    </div>
  )
}

// --- Small presentational helpers ------------------------------------------

function growthColor(amount: number): string {
  if (amount > 0) return 'text-positive'
  if (amount < 0) return 'text-negative'
  return 'text-muted'
}

function formatSigned(amount: number, sym: string): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${formatMoney(Math.abs(amount), sym)}`
}

// A panel inside the hero (Liquid / Investments). Gentle hover lift; the lift is
// a transform, so reduce-motion disables it automatically via MotionConfig.
function MetricPanel({
  label,
  caption,
  children,
}: {
  label: string
  caption: ReactNode
  children: ReactNode
}) {
  return (
    <motion.div
      {...hoverLift}
      className="rounded-lg border border-border bg-bg/70 px-4 py-3 backdrop-blur-sm"
    >
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1">{children}</div>
      <div className="mt-1 text-[11px] text-muted">{caption}</div>
    </motion.div>
  )
}

// A flat stat card for the "this month" row.
function StatCard({
  label,
  value,
  tone = 'fg',
  caption,
}: {
  label: string
  value: string
  tone?: 'fg' | 'positive' | 'negative'
  caption?: string
}) {
  const valueClass =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : 'text-fg'
  return (
    <motion.div
      {...hoverLift}
      className="rounded-card border border-border bg-surface px-4 py-4"
    >
      <Eyebrow>{label}</Eyebrow>
      <div
        className={`mt-1 font-display text-xl font-semibold tabular-nums ${valueClass}`}
      >
        {value}
      </div>
      {caption && <div className="mt-1 text-[11px] text-muted">{caption}</div>}
    </motion.div>
  )
}
