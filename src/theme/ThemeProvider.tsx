import { useEffect, type ReactNode } from 'react'
import { useSettings } from '../hooks/useSettings'

/*
  Reads the active theme from settings and writes it onto the <html> element as
  data-theme="...". Our CSS in index.css reacts to that attribute and swaps the
  colour variables, restyling the whole app. Right now there's only one theme
  ('clean'), but the wiring is ready for the full theme switcher in Phase 8.
*/
export function ThemeProvider({ children }: { children: ReactNode }) {
  const settings = useSettings()

  useEffect(() => {
    document.documentElement.dataset.theme = settings.activeTheme
  }, [settings.activeTheme])

  return <>{children}</>
}
