import { registerSW } from 'virtual:pwa-register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRoutes } from '@/AppRoutes'

registerSW({
  immediate: true,
  onRegistered(registration) {
    if (registration) {
      const interval = Number(import.meta.env.VITE_SW_UPDATE_INTERVAL_MS) || 60 * 60 * 1000
      setInterval(() => registration.update(), interval)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] New version detected — reloading.')
      })
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
