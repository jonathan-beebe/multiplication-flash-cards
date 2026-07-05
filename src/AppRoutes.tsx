import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { UpdateBanner } from '@/components/UpdateBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Home from '@/pages/Home.tsx'
import ForParents from '@/pages/ForParents.tsx'

import OperationMenu from '@/components/operations/OperationMenu.tsx'
import OperationPractice from '@/components/operations/OperationPractice.tsx'
import OperationHardModePractice from '@/components/operations/OperationHardModePractice.tsx'
import OperationDrill from '@/components/operations/OperationDrill.tsx'
import DrillComplete from '@/components/operations/DrillComplete.tsx'
import { additionConfig } from '@/components/operations/additionConfig.tsx'
import { subtractionConfig } from '@/components/operations/subtractionConfig.tsx'
import { multiplicationConfig } from '@/components/operations/multiplicationConfig.tsx'

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
  const location = useLocation()
  const isFirstRender = useRef(true)
  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main')
    if (!main) return
    main.id = 'main-content'
    main.setAttribute('tabindex', '-1')
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    main.focus({ preventScroll: false })
  }, [location.pathname])
  return null
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
          <Route path="/addition/:level" element={<OperationMenu config={additionConfig} />} />
          <Route
            path="/addition/:level/practice/multiple-choice"
            element={<OperationPractice config={additionConfig} />}
          />
          <Route
            path="/addition/:level/practice/hard-mode"
            element={<OperationHardModePractice config={additionConfig} />}
          />
          <Route
            path="/addition/:level/1-minute-drill"
            element={<OperationDrill config={additionConfig} durationMinutes={1} />}
          />
          <Route path="/addition/:level/1-minute-drill/success" element={<DrillComplete />} />
          <Route
            path="/addition/:level/3-minute-drill"
            element={<OperationDrill config={additionConfig} durationMinutes={3} />}
          />
          <Route path="/addition/:level/3-minute-drill/success" element={<DrillComplete />} />
          <Route
            path="/addition/:level/5-minute-drill"
            element={<OperationDrill config={additionConfig} durationMinutes={5} />}
          />
          <Route path="/addition/:level/5-minute-drill/success" element={<DrillComplete />} />

          {/* Subtraction */}
          <Route path="/subtraction" element={<Navigate to="/subtraction/ones" replace />} />
          <Route path="/subtraction/:level" element={<OperationMenu config={subtractionConfig} />} />
          <Route
            path="/subtraction/:level/practice/multiple-choice"
            element={<OperationPractice config={subtractionConfig} />}
          />
          <Route
            path="/subtraction/:level/practice/hard-mode"
            element={<OperationHardModePractice config={subtractionConfig} />}
          />
          <Route
            path="/subtraction/:level/1-minute-drill"
            element={<OperationDrill config={subtractionConfig} durationMinutes={1} />}
          />
          <Route path="/subtraction/:level/1-minute-drill/success" element={<DrillComplete />} />
          <Route
            path="/subtraction/:level/3-minute-drill"
            element={<OperationDrill config={subtractionConfig} durationMinutes={3} />}
          />
          <Route path="/subtraction/:level/3-minute-drill/success" element={<DrillComplete />} />
          <Route
            path="/subtraction/:level/5-minute-drill"
            element={<OperationDrill config={subtractionConfig} durationMinutes={5} />}
          />
          <Route path="/subtraction/:level/5-minute-drill/success" element={<DrillComplete />} />

          {/* Multiplication */}
          <Route path="/multiplication" element={<Navigate to="/multiplication/ones" replace />} />
          <Route path="/multiplication/:level" element={<OperationMenu config={multiplicationConfig} />} />
          <Route
            path="/multiplication/:level/practice/multiple-choice"
            element={<OperationPractice config={multiplicationConfig} />}
          />
          <Route
            path="/multiplication/:level/practice/hard-mode"
            element={<OperationHardModePractice config={multiplicationConfig} />}
          />
          <Route
            path="/multiplication/:level/1-minute-drill"
            element={<OperationDrill config={multiplicationConfig} durationMinutes={1} />}
          />
          <Route path="/multiplication/:level/1-minute-drill/success" element={<DrillComplete />} />
          <Route
            path="/multiplication/:level/3-minute-drill"
            element={<OperationDrill config={multiplicationConfig} durationMinutes={3} />}
          />
          <Route path="/multiplication/:level/3-minute-drill/success" element={<DrillComplete />} />
          <Route
            path="/multiplication/:level/5-minute-drill"
            element={<OperationDrill config={multiplicationConfig} durationMinutes={5} />}
          />
          <Route path="/multiplication/:level/5-minute-drill/success" element={<DrillComplete />} />

          {/* Legacy pre-level multiplication URLs (published PWA bookmarks) */}
          <Route
            path="/multiplication/practice/multiple-choice"
            element={<Navigate to="/multiplication/ones/practice/multiple-choice" replace />}
          />
          <Route
            path="/multiplication/practice/hard-mode"
            element={<Navigate to="/multiplication/ones/practice/hard-mode" replace />}
          />
          {['1', '3', '5'].map((m) => (
            <Route
              key={m}
              path={`/multiplication/${m}-minute-drill`}
              element={<Navigate to={`/multiplication/ones/${m}-minute-drill`} replace />}
            />
          ))}

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
