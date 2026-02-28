import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home.tsx'
import About from '@/pages/About.tsx'
import AdditionMenu from '@/pages/AdditionMenu.tsx'
import SubtractionMenu from '@/pages/SubtractionMenu.tsx'
import MultiplicationMenu from '@/pages/MultiplicationMenu.tsx'

import AdditionPractice from '@/components/addition/Practice.tsx'
import AdditionHardMode from '@/components/addition/HardModePractice.tsx'
import AdditionDrill from '@/components/addition/Drill.tsx'

import SubtractionPractice from '@/components/subtraction/Practice.tsx'
import SubtractionHardMode from '@/components/subtraction/HardModePractice.tsx'
import SubtractionDrill from '@/components/subtraction/Drill.tsx'

import MultiplicationPractice from '@/components/multiplication/Practice.tsx'
import MultiplicationHardMode from '@/components/multiplication/HardModePractice.tsx'
import MultiplicationDrill from '@/components/multiplication/Drill.tsx'
import DrillComplete from '@/components/multiplication/DrillComplete.tsx'

import DivisionPractice from '@/components/division/DivisionPractice.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />

      {/* Addition */}
      <Route path="/addition" element={<AdditionMenu />} />
      <Route path="/addition/practice/multiple-choice" element={<AdditionPractice />} />
      <Route path="/addition/practice/hard-mode" element={<AdditionHardMode />} />
      <Route path="/addition/1-minute-drill" element={<AdditionDrill durationMinutes={1} />} />
      <Route path="/addition/1-minute-drill/success" element={<DrillComplete />} />
      <Route path="/addition/3-minute-drill" element={<AdditionDrill durationMinutes={3} />} />
      <Route path="/addition/3-minute-drill/success" element={<DrillComplete />} />
      <Route path="/addition/5-minute-drill" element={<AdditionDrill durationMinutes={5} />} />
      <Route path="/addition/5-minute-drill/success" element={<DrillComplete />} />

      {/* Subtraction */}
      <Route path="/subtraction" element={<SubtractionMenu />} />
      <Route path="/subtraction/practice/multiple-choice" element={<SubtractionPractice />} />
      <Route path="/subtraction/practice/hard-mode" element={<SubtractionHardMode />} />
      <Route path="/subtraction/1-minute-drill" element={<SubtractionDrill durationMinutes={1} />} />
      <Route path="/subtraction/1-minute-drill/success" element={<DrillComplete />} />
      <Route path="/subtraction/3-minute-drill" element={<SubtractionDrill durationMinutes={3} />} />
      <Route path="/subtraction/3-minute-drill/success" element={<DrillComplete />} />
      <Route path="/subtraction/5-minute-drill" element={<SubtractionDrill durationMinutes={5} />} />
      <Route path="/subtraction/5-minute-drill/success" element={<DrillComplete />} />

      {/* Multiplication */}
      <Route path="/multiplication" element={<MultiplicationMenu />} />
      <Route path="/multiplication/practice/multiple-choice" element={<MultiplicationPractice />} />
      <Route path="/multiplication/practice/hard-mode" element={<MultiplicationHardMode />} />
      <Route path="/multiplication/1-minute-drill" element={<MultiplicationDrill durationMinutes={1} />} />
      <Route path="/multiplication/1-minute-drill/success" element={<DrillComplete />} />
      <Route path="/multiplication/3-minute-drill" element={<MultiplicationDrill durationMinutes={3} />} />
      <Route path="/multiplication/3-minute-drill/success" element={<DrillComplete />} />
      <Route path="/multiplication/5-minute-drill" element={<MultiplicationDrill durationMinutes={5} />} />
      <Route path="/multiplication/5-minute-drill/success" element={<DrillComplete />} />

      {/* Division */}
      <Route path="/division" element={<Navigate to="/division-practice/level-1" replace />} />
      <Route path="/division-practice" element={<Navigate to="/division-practice/level-1" replace />} />
      <Route path="/division-practice/:level" element={<DivisionPractice />} />

      {/* Demo */}
      <Route path="/demo/drill-complete" element={<DrillComplete correctCount={42} wrongCount={8} />} />
    </Routes>
  )
}
