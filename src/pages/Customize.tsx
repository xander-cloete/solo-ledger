import { useSettings, updateSettings } from '../hooks/useSettings'
import { THEMES, type ThemeDef } from '../theme/themes'

/*
  The Customization page — a theme switcher. It lists every theme from the
  registry as a preview card; clicking one saves it to settings. Because the
  ThemeProvider watches settings.activeTheme, the whole app restyles the instant
  you pick — no reload, no apply button.
*/
export function Customize() {
  const settings = useSettings()

  async function pick(id: string) {
    await updateSettings({ activeTheme: id })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Customize</h1>
      <p className="mt-1 text-sm text-muted">
        Pick a theme. It applies instantly across the whole app and is saved on
        this device.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            active={settings.activeTheme === theme.id}
            onSelect={() => pick(theme.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ThemeCard({
  theme,
  active,
  onSelect,
}: {
  theme: ThemeDef
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-card border p-4 text-left transition-colors ${
        active
          ? 'border-primary ring-2 ring-primary/40'
          : 'border-border hover:border-primary/60'
      }`}
    >
      {/* A mini mock of the theme: a coloured panel with a couple of swatches,
          painted from the registry's swatch hexes (not the live CSS vars, so it
          previews each theme regardless of which one is currently applied). */}
      <div
        className="flex h-20 items-center gap-2 rounded-lg border p-3"
        style={{ background: theme.swatch.bg, borderColor: theme.swatch.surface }}
      >
        <span
          className="h-9 w-9 rounded-md"
          style={{ background: theme.swatch.surface }}
        />
        <span
          className="h-9 flex-1 rounded-md"
          style={{ background: theme.swatch.primary }}
        />
        <span
          className="text-lg font-semibold"
          style={{ color: theme.swatch.fg }}
        >
          Aa
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-medium">{theme.label}</span>
        {active && <span className="text-xs text-primary">Active ✓</span>}
      </div>
      <p className="mt-0.5 text-xs text-muted">{theme.description}</p>
    </button>
  )
}
