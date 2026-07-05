import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/AppRoutes'

// MAINT-003: end-to-end journeys for the two division modes that had none —
// navigate from Home, solve a full problem, and see the app's feedback.
// The problem is pinned to 72 ÷ 3 = 24 so the journeys are deterministic.

vi.mock('@/lib/division/divisionProblem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/division/divisionProblem')>()
  return {
    ...actual,
    generateProblem: vi.fn().mockReturnValue({ dividend: 72, divisor: 3, quotient: 24 }),
  }
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderHome() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

function submitAnswer(inputName: RegExp, value: string, buttonName: RegExp) {
  fireEvent.change(screen.getByRole('textbox', { name: inputName }), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: buttonName }))
}

describe('Standard algorithm journey', () => {
  it('Home → Division → Standard Algorithm → solve 72 ÷ 3 step by step → next problem', () => {
    renderHome()

    fireEvent.click(screen.getByRole('link', { name: /division/i }))
    fireEvent.click(screen.getByRole('link', { name: /standard algorithm/i }))
    expect(screen.getByText(/standard algorithm/i)).toBeInTheDocument()
    expect(screen.getByText(/72/)).toBeInTheDocument()

    // Step 1: 3 into 7 — a wrong digit is rejected with feedback
    submitAnswer(/go into 7/i, '9', /check/i)
    expect(screen.getByText(/not quite — how many times does the divisor fit/i)).toBeInTheDocument()

    // Correct digit advances to the next step (3 into 12)
    submitAnswer(/go into 7/i, '2', /check/i)
    expect(screen.getByRole('textbox', { name: /go into 12/i })).toBeInTheDocument()

    // Step 2 completes the problem
    submitAnswer(/go into 12/i, '4', /check/i)
    expect(screen.getByText(/72 ÷ 3 = 24 ✓/)).toBeInTheDocument()

    // Next problem starts over at step 1
    fireEvent.click(screen.getByRole('button', { name: /next problem/i }))
    expect(screen.getByRole('textbox', { name: /go into 7/i })).toBeInTheDocument()
  })
})

describe('Partial quotients journey', () => {
  it('Home → Division → Partial Quotients → build, sum, and finish 72 ÷ 3', () => {
    renderHome()

    fireEvent.click(screen.getByRole('link', { name: /division/i }))
    fireEvent.click(screen.getByRole('link', { name: /partial quotients/i }))
    expect(screen.getByText(/partial quotients method/i)).toBeInTheDocument()

    // Building phase: an oversized partial quotient is rejected with feedback
    submitAnswer(/enter a partial quotient/i, '100', /subtract/i)
    expect(screen.getByText(/too big — only 72 remaining/i)).toBeInTheDocument()

    // Subtract 20 threes (60), leaving 12
    submitAnswer(/enter a partial quotient/i, '20', /subtract/i)
    expect(screen.getAllByText(/^12$/).length).toBeGreaterThan(0)

    // Subtract 4 threes — remainder 0 moves to the summing phase
    submitAnswer(/enter a partial quotient/i, '4', /subtract/i)
    expect(screen.getByText(/20 \+ 4 = \?/)).toBeInTheDocument()

    // A wrong sum is rejected with feedback
    submitAnswer(/enter the sum of partial quotients/i, '25', /check/i)
    expect(screen.getByText(/not quite — check your addition/i)).toBeInTheDocument()

    // The correct sum finishes the problem
    submitAnswer(/enter the sum of partial quotients/i, '24', /check/i)
    expect(screen.getByText(/72 ÷ 3 = 24 ✓/)).toBeInTheDocument()

    // Next problem returns to the building phase
    fireEvent.click(screen.getByRole('button', { name: /next problem/i }))
    expect(screen.getByRole('textbox', { name: /enter a partial quotient/i })).toBeInTheDocument()
  })
})
