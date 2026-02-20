import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home.tsx'
import About from '@/pages/About.tsx'
import Practice from '@/components/multiplication/Practice.tsx'
import Drill from '@/components/multiplication/Drill.tsx'
import DrillComplete from '@/components/multiplication/DrillComplete.tsx'
import DivisionPractice from '@/components/division/DivisionPractice.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/1-minute-drill" element={<Drill durationMinutes={1} />} />
      <Route path="/1-minute-drill/success" element={<DrillComplete />} />
      <Route path="/3-minute-drill" element={<Drill durationMinutes={3} />} />
      <Route path="/3-minute-drill/success" element={<DrillComplete />} />
      <Route path="/5-minute-drill" element={<Drill durationMinutes={5} />} />
      <Route path="/5-minute-drill/success" element={<DrillComplete />} />
      <Route path="/division-practice" element={<DivisionPractice />} />
      <Route path="/about" element={<About />} />
      <Route path="/demo/drill-complete" element={<DrillComplete correctCount={42} wrongCount={8} />} />
    </Routes>
  )
}
