import { registerSW } from 'virtual:pwa-register'
import { scheduleUpdate } from '@/lib/engine/updateScheduler'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRoutes } from '@/AppRoutes'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version available — scheduling update.')
    scheduleUpdate(() => {
      console.log('[PWA] Applying update now.')
      updateSW(true)
    })
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
