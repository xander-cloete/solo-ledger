import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'autoUpdate' = when you ship a new version, the app updates itself
      // silently in the background. This delivers the "updates automatically"
      // requirement from the brief.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sl-icon.svg'],
      manifest: {
        name: 'Solo Ledger',
        short_name: 'Solo Ledger',
        description:
          'Private, local-first personal finance. Your data never leaves your device.',
        theme_color: '#4f6f52',
        background_color: '#f5f3ee',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'sl-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      // Let us test "install as an app" while running the dev server.
      devOptions: { enabled: true },
    }),
  ],
})
