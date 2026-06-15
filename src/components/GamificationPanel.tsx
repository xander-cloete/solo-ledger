import { motion } from 'framer-motion'
import { useGamification } from '../hooks/useGamification'
import { formatMoney } from '../lib/format'
import { EASE } from '../lib/motion'
import { useReduceMotion } from '../hooks/useReduceMotion'

// A quiet "Your progress" card for the Dashboard: level, savings streak, and
// this month's budget. Calm by design — soft tones, no badges flashing.
export function GamificationPanel() {
  const g = useGamification()
  if (!g.hasAnyData) return null

  return (
    <section className="mt-4 rounded-card border border-border bg-surface p-5">
      <h2 className="text-sm font-medium text-muted">Your progress</h2>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Level g={g} />
        <Streak g={g} />
        <Budget g={g} />
      </div>
    </section>
  )
}

type G = ReturnType<typeof useGamification>

function Level({ g }: { g: G }) {
  const { level } = g
  const pct = Math.round(level.progress * 100)
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="flex items-center gap-2">
        {/* Re-keyed by level, so reaching a new tier replays a gentle pop. The
            scale is a transform, so reduce-motion (via MotionConfig) skips it. */}
        <motion.span
          key={level.level}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="text-2xl leading-none"
          aria-hidden
        >
          {level.emoji}
        </motion.span>
        <div>
          <div className="text-xs text-muted">Level {level.level}</div>
          <div className="text-sm font-semibold">{level.title}</div>
        </div>
      </div>

      <Bar pct={pct} />

      <div className="mt-1 text-[11px] text-muted">
        {level.next === null
          ? 'Top tier — incredible 🎉'
          : `${formatMoney(level.toNext, g.sym)} to level up`}
      </div>
    </div>
  )
}

function Streak({ g }: { g: G }) {
  const has = g.streak > 0
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl leading-none" aria-hidden>
          {has ? '🔥' : '🌙'}
        </span>
        <span className="text-2xl font-semibold tabular-nums">{g.streak}</span>
      </div>
      <div className="mt-1 text-sm font-medium">
        {has
          ? `month saving streak${g.streak === 1 ? '' : 's'}`
          : 'No streak yet'}
      </div>
      <div className="mt-1 text-[11px] text-muted">
        {has
          ? `Best: ${g.bestStreak} month${g.bestStreak === 1 ? '' : 's'}`
          : 'Finish a month in the black to start one.'}
      </div>
    </div>
  )
}

function Budget({ g }: { g: G }) {
  const { budget } = g
  // Cap the bar at 100% even when overspent, but keep the real number in text.
  const pct = budget.usedPct === null ? 0 : Math.min(100, Math.round(budget.usedPct))
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">This month</span>
        <span
          className={`text-xs font-medium ${
            budget.onTrack ? 'text-positive' : 'text-negative'
          }`}
        >
          {budget.onTrack ? 'On track' : 'Over budget'}
        </span>
      </div>

      <Bar pct={pct} tone={budget.onTrack ? 'positive' : 'negative'} />

      <div className="mt-1 text-[11px] text-muted">
        {budget.usedPct === null
          ? 'No income logged yet this month.'
          : `${formatMoney(g.monthExpenses, g.sym)} of ${formatMoney(g.monthIncome, g.sym)} income used`}
      </div>
    </div>
  )
}

// A thin progress bar. `tone` picks the fill colour; default is the primary.
// The fill grows to its width on mount and re-animates whenever `pct` changes —
// a calm "live" cue that your progress moved. Width isn't a transform, so we
// honour reduce-motion ourselves by collapsing the duration to zero.
function Bar({ pct, tone }: { pct: number; tone?: 'positive' | 'negative' }) {
  const reduce = useReduceMotion()
  const fill =
    tone === 'positive'
      ? 'bg-positive'
      : tone === 'negative'
        ? 'bg-negative'
        : 'bg-primary'
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
      <motion.div
        className={`h-full rounded-full ${fill}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
      />
    </div>
  )
}
