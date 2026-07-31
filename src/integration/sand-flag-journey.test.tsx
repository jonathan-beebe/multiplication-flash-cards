import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/AppRoutes'
import { setSandCardsEnabledForTesting } from '@/lib/featureFlags'

// The #sand experiment end to end, through the no-WebGL fallback (jsdom has
// no WebGL, and the fallback is a real product path): flag on → the sand
// card replaces the two-card CSS stack → a correct answer advances via the
// dismissal completion instead of transitionend.

function readQuestion(): { a: number; b: number; correct: number } {
  const cards = screen.getAllByText(/\d+\s*×\s*\d+/)
  const match = cards[0].textContent!.match(/(\d+)\s*×\s*(\d+)/)
  const a = Number(match![1])
  const b = Number(match![2])
  return { a, b, correct: a * b }
}

function answerButtons(): HTMLButtonElement[] {
  return screen.getAllByRole('button').filter((b): b is HTMLButtonElement => /^\d+$/.test(b.textContent!))
}

beforeEach(() => {
  vi.useFakeTimers()
  setSandCardsEnabledForTesting(true)
})

afterEach(() => {
  setSandCardsEnabledForTesting(false)
  vi.useRealTimers()
})

describe('#sand flag journey', () => {
  it('answers correctly and advances through ✓ → next-question morph', async () => {
    render(
      <MemoryRouter initialEntries={['/multiplication/ones/practice/multiple-choice']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    // Resolve the lazy sand-card chunk (Suspense falls back to the plain card).
    await act(async () => {
      await vi.dynamicImportSettled()
    })

    const { correct } = readQuestion()
    // The sand path replaces the two-card stack: exactly one card, no
    // slide-out CSS seam.
    expect(document.querySelectorAll('.card-stack > *')).toHaveLength(1)

    const correctBtn = answerButtons().find((b) => Number(b.textContent) === correct)!
    fireEvent.click(correctBtn)

    // The cloud reforms into the green checkmark immediately.
    expect(screen.getByText('✓')).toBeInTheDocument()

    // 800 ms ✓ hold, then the morph toward the next question starts.
    act(() => {
      vi.advanceTimersByTime(800)
    })
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
    expect(document.querySelector('.card-slide-out')).toBeNull()
    expect(answerButtons().every((b) => b.disabled)).toBe(true)

    // 700 ms morph window, then the quiz settles: next question live,
    // choices re-enabled.
    await act(async () => {
      vi.advanceTimersByTime(700)
    })
    expect(answerButtons().some((b) => !b.disabled)).toBe(true)
    expect(readQuestion()).toBeTruthy()
  })

  it('flashes ✗ on a wrong answer and returns to the same question', async () => {
    render(
      <MemoryRouter initialEntries={['/multiplication/ones/practice/multiple-choice']}>
        <AppRoutes />
      </MemoryRouter>,
    )
    await act(async () => {
      await vi.dynamicImportSettled()
    })

    const { a, b, correct } = readQuestion()
    const wrongBtn = answerButtons().find((btn) => Number(btn.textContent) !== correct)!
    fireEvent.click(wrongBtn)

    expect(screen.getByText('✗')).toBeInTheDocument()

    // After the flash the same question morphs back; the quiz did not advance.
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.queryByText('✗')).not.toBeInTheDocument()
    expect(readQuestion()).toEqual({ a, b, correct })
    expect(wrongBtn).toBeDisabled()
  })

  it('keeps the CSS two-card stack when the flag is off', async () => {
    setSandCardsEnabledForTesting(false)
    render(
      <MemoryRouter initialEntries={['/multiplication/ones/practice/multiple-choice']}>
        <AppRoutes />
      </MemoryRouter>,
    )
    expect(document.querySelectorAll('.card-stack > *')).toHaveLength(2)
  })
})
