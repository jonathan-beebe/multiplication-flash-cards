import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { UpdateBanner } from '@/components/UpdateBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Home from '@/pages/Home.tsx'
import ForParents from '@/pages/ForParents.tsx'
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

import DesignSystem from '@/pages/DesignSystem.tsx'
import DivisionMenu from '@/pages/DivisionMenu.tsx'
import DivisionPractice from '@/components/division/areaMode/DivisionPractice.tsx'
import StandardAlgorithmPractice from '@/pages/division/StandardAlgorithmPractice.tsx'
import PartialQuotientsPractice from '@/pages/division/PartialQuotientsPractice.tsx'

/**
 * Stamps id/tabindex on <main> after each route renders so the skip link
 * resolves, and moves keyboard focus to <main> on every navigation so
 * screen reader users land at the top of new page content (WCAG 2.4.3).
 */
function RouteFocusManager() {
  const location = useLocation();
  const isFirstRender = useRef(true);
  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main');
    if (!main) return;
    main.id = 'main-content';
    main.setAttribute('tabindex', '-1');
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    main.focus({ preventScroll: false });
  }, [location.pathname]);
  return null;
}

export function AppRoutes() {
  return (
    <>
      <UpdateBanner />
      <a href="#main-content" className="skip-nav-link">
        Skip to main content
      </a>
      <RouteFocusManager />
      <ErrorBoundary>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/for-parents" element={<ForParents />} />

      {/* Addition */}
      <Route path="/addition" element={<Navigate to="/addition/ones" replace />} />
      <Route path="/addition/:level" element={<AdditionMenu />} />
      <Route path="/addition/:level/practice/multiple-choice" element={<AdditionPractice />} />
      <Route path="/addition/:level/practice/hard-mode" element={<AdditionHardMode />} />
      <Route path="/addition/:level/1-minute-drill" element={<AdditionDrill durationMinutes={1} />} />
      <Route path="/addition/:level/1-minute-drill/success" element={<DrillComplete />} />
      <Route path="/addition/:level/3-minute-drill" element={<AdditionDrill durationMinutes={3} />} />
      <Route path="/addition/:level/3-minute-drill/success" element={<DrillComplete />} />
      <Route path="/addition/:level/5-minute-drill" element={<AdditionDrill durationMinutes={5} />} />
      <Route path="/addition/:level/5-minute-drill/success" element={<DrillComplete />} />

      {/* Subtraction */}
      <Route path="/subtraction" element={<Navigate to="/subtraction/ones" replace />} />
      <Route path="/subtraction/:level" element={<SubtractionMenu />} />
      <Route path="/subtraction/:level/practice/multiple-choice" element={<SubtractionPractice />} />
      <Route path="/subtraction/:level/practice/hard-mode" element={<SubtractionHardMode />} />
      <Route path="/subtraction/:level/1-minute-drill" element={<SubtractionDrill durationMinutes={1} />} />
      <Route path="/subtraction/:level/1-minute-drill/success" element={<DrillComplete />} />
      <Route path="/subtraction/:level/3-minute-drill" element={<SubtractionDrill durationMinutes={3} />} />
      <Route path="/subtraction/:level/3-minute-drill/success" element={<DrillComplete />} />
      <Route path="/subtraction/:level/5-minute-drill" element={<SubtractionDrill durationMinutes={5} />} />
      <Route path="/subtraction/:level/5-minute-drill/success" element={<DrillComplete />} />

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
      <Route path="/division" element={<DivisionMenu />} />
      <Route path="/division/standard-algorithm" element={<StandardAlgorithmPractice />} />
      <Route path="/division/partial-quotients" element={<PartialQuotientsPractice />} />
      <Route path="/division-practice" element={<Navigate to="/division-practice/level-1" replace />} />
      <Route path="/division-practice/:level" element={<DivisionPractice />} />

      {/* Design system / component playground */}
      <Route path="/design-system" element={<DesignSystem />} />

    </Routes>
      </ErrorBoundary>
    </>
  )
}
