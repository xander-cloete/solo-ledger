import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
// Self-hosted variable fonts (bundled, so the PWA still works fully offline).
// "Fraunces" is our editorial display face; "Hanken Grotesk" the body/UI face.
// Themes choose which of these (or a system mono/serif) they wear — see index.css.
import '@fontsource-variable/fraunces/index.css'
import '@fontsource-variable/hanken-grotesk/index.css'
import './index.css'
import { ThemeProvider } from './theme/ThemeProvider'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Income } from './pages/Income'
import { Expenses } from './pages/Expenses'
import { Investments } from './pages/Investments'
import { Liabilities } from './pages/Liabilities'
import { Customize } from './pages/Customize'
import { Settings } from './pages/Settings'
import { ensureSettings } from './db/db'

// The route table. Layout is the shell (nav + outlet); each child renders inside it.
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'income', element: <Income /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'investments', element: <Investments /> },
      { path: 'liabilities', element: <Liabilities /> },
      { path: 'customize', element: <Customize /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

// Make sure the settings row exists before we render, then start the app.
ensureSettings().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>,
  )
})
