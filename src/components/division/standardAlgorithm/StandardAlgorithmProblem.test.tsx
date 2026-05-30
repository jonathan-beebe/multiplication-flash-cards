import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import StandardAlgorithmProblem from './StandardAlgorithmProblem'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Read the current step from the input's aria-label and compute the correct quotient digit. */
function readCurrentStep() {
  const input = screen.getByLabelText(/How many times does/i)
  const label = input.getAttribute('aria-label')!
  const match = label.match(/does (\d+) go into (\d+)/)!
  const divisor = Number(match[1])
  const workingNumber = Number(match[2])
  return { input, divisor, workingNumber, correctDigit: Math.floor(workingNumber / divisor) }
}

function submitWrongAnswer() {
  const { input, correctDigit } = readCurrentStep()
  const wrong = (correctDigit + 1) % 10
  fireEvent.change(input, { target: { value: String(wrong) } })
  fireEvent.click(screen.getByRole('button', { name: /check/i }))
}

describe('StandardAlgorithmProblem — shake timer lifecycle (BUG-009)', () => {
  it('clears the pending shake timer on unmount so no setter fires after teardown', () => {
    const { unmount } = render(<StandardAlgorithmProblem level={1} />)
    // Resolve the 50ms focus timer so only the shake timer remains pending after the wrong answer.
    act(() => {
      vi.advanceTimersByTime(50)
    })

    const baseline = vi.getTimerCount()
    submitWrongAnswer()
    const afterSubmit = vi.getTimerCount()
    expect(afterSubmit).toBeGreaterThan(baseline)

    unmount()

    // After unmount, the shake timer must be cleared (count back to baseline).
    expect(vi.getTimerCount()).toBe(baseline)
  })

  it('keeps shaking through back-to-back wrong answers — does not let an earlier timer prematurely clear the class', () => {
    render(<StandardAlgorithmProblem level={1} />)
    act(() => {
      vi.advanceTimersByTime(50)
    })

    // First wrong answer at t=50 → schedules a shake timer that would fire at t=450.
    submitWrongAnswer()
    expect(document.querySelector('.shake')).not.toBeNull()

    // Advance to t=350 (before first timer expires).
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Second wrong answer at t=350 → must clear the prior shake timer and schedule a new one.
    submitWrongAnswer()
    expect(document.querySelector('.shake')).not.toBeNull()

    // Advance to t=550, past the FIRST timer's expiry (t=450) but before the SECOND (t=750).
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Without the fix, the first timer would have fired and removed the shake class.
    expect(document.querySelector('.shake')).not.toBeNull()
  })
})
