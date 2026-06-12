import { useEffect, type ReactNode } from 'react'
import { useSettings } from '../hooks/useSettings'
import { DEFAULT_THEME, isKnownTheme } from './themes'

/*
  Reads the active theme from settings and writes it onto the <html> element as
  data-theme="...". Our CSS in index.css reacts to that attribute and swaps the
  colour variables, restyling the whole app instantly. If the saved id isn't one
  we ship (e.g. a theme was removed), we fall back to the default so the app is
  never left unstyled. The picker lives on the Customization page (Phase 8).
*/
export function ThemeProvider({ children }: { children: ReactNode }) {
  const settings = useSettings()
  const theme = isKnownTheme(settings.activeTheme)
    ? settings.activeTheme
    : DEFAULT_THEME

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return <>{children}</>
}
