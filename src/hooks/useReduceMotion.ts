import { useSyncExternalStore } from 'react'
import { useSettings } from './useSettings'

/*
  Should animations be suppressed right now?

  Two sources, OR'd together:
   1. The user's in-app "Reduce motion" switch (settings.reduceMotion).
   2. The operating system's "prefers-reduced-motion" accessibility setting.

  We read the OS setting via a media query. `useSyncExternalStore` is the React
  way to subscribe to a value that lives *outside* React (here, the browser's
  media-query state) and re-render when it changes — so toggling reduce-motion
  in the OS updates the app live, without a refresh.
*/

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

// Server-side / no-window fallback (this is a PWA, but keeps the hook safe).
function getServerSnapshot(): boolean {
  return false
}

export function useReduceMotion(): boolean {
  const settings = useSettings()
  const osPrefersReduced = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
  return settings.reduceMotion === true || osPrefersReduced
}
