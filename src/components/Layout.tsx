import { NavLink, useLocation, useOutlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { useReminderNotifications } from '../hooks/useReminders'
import { useReduceMotion } from '../hooks/useReduceMotion'
import { pageVariants } from '../lib/motion'
import { BrandMark } from './BrandMark'

// Each tab: route path, label, and a small inline icon (kept minimal/tasteful).
type NavItem = { to: string; label: string; icon: ReactNode }

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    to: '/income',
    label: 'Income',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    ),
  },
  {
    to: '/expenses',
    label: 'Expenses',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    ),
  },
  {
    to: '/investments',
    label: 'Investments',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
      </svg>
    ),
  },
  {
    to: '/liabilities',
    label: 'Liabilities',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 7 9 13 13 9 21 17" />
        <polyline points="21 10 21 17 14 17" />
      </svg>
    ),
  },
  {
    to: '/customize',
    label: 'Customize',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.4-.16-.76-.4-1.02-.24-.27-.4-.62-.4-1.02 0-.83.67-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-4.97-4.5-9-10-9z" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

function navLinkClasses(isActive: boolean): string {
  const base =
    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors'
  return isActive
    ? `${base} bg-primary text-primary-fg`
    : `${base} text-muted hover:bg-border/40 hover:text-fg`
}

// The routed page, wrapped so each navigation cross-fades. With the data router
// (`createBrowserRouter`), `<Outlet />` doesn't expose the current location, so
// we read it ourselves: `useOutlet()` gives the active page element and
// `useLocation()` gives a key that changes on every route. AnimatePresence keeps
// the outgoing page mounted just long enough to animate it out (`mode="wait"`
// = finish exit before the next page enters).
function AnimatedOutlet() {
  const location = useLocation()
  const outlet = useOutlet()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}

export function Layout() {
  // Fire any due browser notifications on app open (best-effort; no-op without
  // permission). Lives here so it runs regardless of the landing page.
  useReminderNotifications()

  // When reduce-motion is on (OS or the Customize toggle), `MotionConfig` with
  // reducedMotion="always" makes every motion component below skip transforms
  // and only fade — so nothing moves, app-wide, from one switch.
  const reduce = useReduceMotion()

  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'user'}>
    <div className="min-h-full bg-bg text-fg">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <BrandMark />
          <span className="font-display text-lg font-semibold tracking-tight">Solo Ledger</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => navLinkClasses(isActive)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content. Padding leaves room for the sidebar (desktop) and the
          bottom nav (mobile). */}
      <main className="px-5 pb-24 pt-7 md:ml-60 md:px-10 md:pb-12">
        <div className="mx-auto w-full max-w-5xl">
          <AnimatedOutlet />
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-border bg-surface px-2 py-2 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
    </MotionConfig>
  )
}
