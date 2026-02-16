import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './Home.tsx'
import Practice from './Practice.tsx'
import Drill from './Drill.tsx'
import About from './About.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/multiplication-flash-cards">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/1-minute-drill" element={<Drill durationMinutes={1} />} />
        <Route path="/3-minute-drill" element={<Drill durationMinutes={3} />} />
        <Route path="/5-minute-drill" element={<Drill durationMinutes={5} />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
