import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/AppRoutes'

/**
 * Helper: parse the displayed multiplication question and return { a, b, correct }.
 * Cards render "a × b" — we grab the first match visible in the document.
 */
function readQuestion(): { a: number; b: number; correct: number } {
  const cards = screen.getAllByText(/\d+\s*×\s*\d+/)
  const match = cards[0].textContent!.match(/(\d+)\s*×\s*(\d+)/)
  const a = Number(match![1])
  const b = Number(match![2])
  return { a, b, correct: a * b }
}

/**
 * Helper: click the correct (or a wrong) answer button.
 * Returns the value that was clicked.
 */
function clickAnswer(correct: number, pickWrong = false): number {
  const buttons = screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent!))
  if (pickWrong) {
    const wrongBtn = buttons.find((b) => Number(b.textContent) !== correct)!
    fireEvent.click(wrongBtn)
    return Number(wrongBtn.textContent)
  }
  const correctBtn = buttons.find((b) => Number(b.textContent) === correct)!
  fireEvent.click(correctBtn)
  return correct
}

/**
 * Helper: advance past the card transition animation after a correct answer.
 * 1. Advance 300ms for the setTimeout that triggers the slide-out.
 * 2. Fire transitionEnd on the front card (the one with card-slide-out).
 */
function advanceCardTransition() {
  act(() => {
    vi.advanceTimersByTime(300)
  })
  const slidingCard = document.querySelector('.card-slide-out')
  if (slidingCard) {
    fireEvent.transitionEnd(slidingCard, { propertyName: 'transform' })
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('App user journeys', () => {
  // ─── 1. Home screen ────────────────────────────────────────────────
  describe('Home screen', () => {
    it('renders heading and all operation buttons', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: /math flash\s*cards/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /addition/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /subtraction/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /multiplication/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /division/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /for parents/i })).toBeInTheDocument()
    })
  })

  // ─── 2. Practice flow ──────────────────────────────────────────────
  describe('Practice flow', () => {
    it('Home → Multiplication → Practice → answer questions → Home', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      // Navigate to the multiplication menu
      fireEvent.click(screen.getByRole('link', { name: /multiplication/i }))
      expect(screen.getByRole('heading', { name: /multiplication/i })).toBeInTheDocument()

      // Navigate to practice (multiple choice)
      fireEvent.click(screen.getByRole('link', { name: /multiple choice/i }))

      // A multiplication question should be visible
      const q1 = readQuestion()
      expect(q1.a).toBeGreaterThanOrEqual(3)
      expect(q1.b).toBeGreaterThanOrEqual(3)

      // Click the correct answer
      clickAnswer(q1.correct)
      advanceCardTransition()

      // A new question should be visible (could be different)
      const q2 = readQuestion()
      expect(q2.a).toBeGreaterThanOrEqual(3)

      // Navigate back to the multiplication menu, then home via NavBar
      fireEvent.click(screen.getByRole('link', { name: /back to multiplication/i }))
      expect(screen.getByRole('heading', { name: /multiplication/i })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('link', { name: /home/i }))
      expect(screen.getByRole('heading', { name: /math flash\s*cards/i })).toBeInTheDocument()
    })
  })

  // ─── 3. Drill full flow ────────────────────────────────────────────
  describe('Drill full flow', () => {
    it('Home → Multiplication → Drill → answer → timer expires → DrillComplete → Restart → Drill → Home', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      // Navigate to the multiplication menu then drill
      fireEvent.click(screen.getByRole('link', { name: /multiplication/i }))
      fireEvent.click(screen.getByRole('link', { name: /1 min/i }))

      // Drill UI: question visible, timer bar visible
      const q1 = readQuestion()
      expect(document.querySelector("[style*='drill-timer']")).toBeInTheDocument()

      // Click one correct answer
      clickAnswer(q1.correct)
      advanceCardTransition()

      // Click one wrong answer on the next question
      const q2 = readQuestion()
      clickAnswer(q2.correct, true) // pick wrong

      // Advance timer to expiration (60s minus the ~300ms already advanced)
      act(() => {
        vi.advanceTimersByTime(60_000)
      })

      // DrillComplete screen
      expect(screen.getByRole('heading', { name: /drill complete/i })).toBeInTheDocument()
      // Verify the results section rendered (correct/wrong/attempted labels)
      expect(screen.getByText(/correct/)).toBeInTheDocument()
      expect(screen.getByText(/wrong/)).toBeInTheDocument()
      expect(screen.getByText(/attempted/)).toBeInTheDocument()

      // Restart → back to drill
      fireEvent.click(screen.getByRole('button', { name: /restart/i }))
      expect(screen.getAllByText(/\d+\s*×\s*\d+/).length).toBeGreaterThan(0)
      expect(screen.queryByText(/drill complete/i)).not.toBeInTheDocument()

      // Navigate back to the multiplication menu, then home via NavBar
      fireEvent.click(screen.getByRole('link', { name: /back to multiplication/i }))
      fireEvent.click(screen.getByRole('link', { name: /home/i }))
      expect(screen.getByRole('heading', { name: /math flash\s*cards/i })).toBeInTheDocument()
    })
  })

  // ─── 4. Drill early exit ───────────────────────────────────────────
  describe('Drill early exit', () => {
    it('Home → Multiplication → Drill → NavBar Home (no completion screen)', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      // Navigate to multiplication then drill
      fireEvent.click(screen.getByRole('link', { name: /multiplication/i }))
      fireEvent.click(screen.getByRole('link', { name: /1 min/i }))
      expect(screen.getAllByText(/\d+\s*×\s*\d+/).length).toBeGreaterThan(0)

      // Leave early via NavBar
      fireEvent.click(screen.getByRole('link', { name: /back to multiplication/i }))
      fireEvent.click(screen.getByRole('link', { name: /home/i }))

      // Should be on Home, not DrillComplete
      expect(screen.getByRole('heading', { name: /math flash\s*cards/i })).toBeInTheDocument()
      expect(screen.queryByText(/drill complete/i)).not.toBeInTheDocument()
    })
  })

  // ─── 5. Addition flow ──────────────────────────────────────────────
  describe('Addition flow', () => {
    it('Home → Addition menu → Practice → Back → menu → Home', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      // Navigate to addition menu
      fireEvent.click(screen.getByRole('link', { name: /addition/i }))
      expect(screen.getByRole('heading', { name: /addition/i })).toBeInTheDocument()

      // Navigate to practice (multiple choice)
      fireEvent.click(screen.getByRole('link', { name: /multiple choice/i }))
      const numericButtons = screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent!))
      expect(numericButtons.length).toBeGreaterThan(0)

      // Click Back → returns to AdditionMenu
      fireEvent.click(screen.getByRole('link', { name: /back/i }))
      expect(screen.getByRole('heading', { name: /addition/i })).toBeInTheDocument()

      // Click Home → returns to home screen
      fireEvent.click(screen.getByRole('link', { name: /home/i }))
      expect(screen.getByRole('heading', { name: /math flash\s*cards/i })).toBeInTheDocument()
    })
  })

  // ─── 6. Subtraction flow ───────────────────────────────────────────
  describe('Subtraction flow', () => {
    it('Home → Subtraction menu → Practice → Back → menu → Home', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      // Navigate to subtraction menu
      fireEvent.click(screen.getByRole('link', { name: /subtraction/i }))
      expect(screen.getByRole('heading', { name: /subtraction/i })).toBeInTheDocument()

      // Navigate to practice (multiple choice)
      fireEvent.click(screen.getByRole('link', { name: /multiple choice/i }))
      const numericButtons = screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent!))
      expect(numericButtons.length).toBeGreaterThan(0)

      // Click Back → returns to SubtractionMenu
      fireEvent.click(screen.getByRole('link', { name: /back/i }))
      expect(screen.getByRole('heading', { name: /subtraction/i })).toBeInTheDocument()

      // Click Home → returns to home screen
      fireEvent.click(screen.getByRole('link', { name: /home/i }))
      expect(screen.getByRole('heading', { name: /math flash\s*cards/i })).toBeInTheDocument()
    })
  })

  // ─── 7. Division practice flow ─────────────────────────────────────
  describe('Division practice flow', () => {
    it('Home → Division → division menu screen', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      fireEvent.click(screen.getByRole('link', { name: /division/i }))
      expect(screen.getByRole('heading', { name: /^division$/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /area model/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /standard algorithm/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /partial quotients/i })).toBeInTheDocument()
    })

    it('/division-practice redirects to /division-practice/level-1', () => {
      render(
        <MemoryRouter initialEntries={['/division-practice']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: /division practice/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /level 1/i })).toHaveAttribute('aria-current', 'page')
    })

    it('/division-practice/level-3 renders with Level 3 selected', () => {
      render(
        <MemoryRouter initialEntries={['/division-practice/level-3']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      expect(screen.getByRole('link', { name: /level 3/i })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /level 1/i })).not.toHaveAttribute('aria-current')
    })

    it('clicking a level link updates the selected level', () => {
      render(
        <MemoryRouter initialEntries={['/division-practice/level-1']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      expect(screen.getByRole('link', { name: /level 1/i })).toHaveAttribute('aria-current', 'page')

      fireEvent.click(screen.getByRole('link', { name: /level 2/i }))

      expect(screen.getByRole('link', { name: /level 2/i })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /level 1/i })).not.toHaveAttribute('aria-current')
    })

    it('division practice → Division menu via NavBar back', () => {
      render(
        <MemoryRouter initialEntries={['/division-practice/level-1']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: /division practice/i })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('link', { name: /back/i }))
      expect(screen.getByRole('heading', { name: /^division$/i })).toBeInTheDocument()
    })
  })

  // ─── 8. For Parents flow ───────────────────────────────────────────
  describe('For Parents flow', () => {
    it('Home → For Parents → Home', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>,
      )

      // Navigate to For Parents
      fireEvent.click(screen.getByRole('link', { name: /for parents/i }))

      // For Parents page content
      expect(screen.getByRole('heading', { name: /for parents/i })).toBeInTheDocument()
      expect(screen.getByText(/flash card app/i)).toBeInTheDocument()

      // Navigate home via NavBar
      fireEvent.click(screen.getByRole('link', { name: /home/i }))
      expect(screen.getByRole('heading', { name: /math flash\s*cards/i })).toBeInTheDocument()
    })
  })
})
