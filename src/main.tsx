import { registerSW } from 'virtual:pwa-register'
import { notifyUpdateAvailable } from '@/lib/pwa/updateNotifier'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRoutes } from '@/AppRoutes'
import { isSandCardsEnabled } from '@/lib/featureFlags'

// The #sand experiment forces dark mode for the session, browser chrome
// included (the light-scheme theme-color meta would otherwise stay light).
if (isSandCardsEnabled()) {
  document.documentElement.classList.add('dark')
  document.querySelector('meta[name="theme-color"][media*="light"]')?.setAttribute('content', '#0f172a')
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version available.')
    notifyUpdateAvailable(() => updateSW(true))
  },
  onRegistered(registration) {
    if (registration) {
      const interval = Number(import.meta.env.VITE_SW_UPDATE_INTERVAL_MS) || 60 * 60 * 1000
      setInterval(() => registration.update(), interval)
    }
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/multiplication-flash-cards">
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
)
