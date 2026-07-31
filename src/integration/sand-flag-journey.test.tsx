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
  it('answers a question and advances through the sand dismissal', async () => {
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

    // 300 ms correct-answer pause, then the dismissal starts.
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(document.querySelector('.card-slide-out')).toBeNull()
    expect(answerButtons().every((b) => b.disabled)).toBe(true)

    // The fallback completes dismissal on a timeout; settling promotes the
    // next question and re-enables the choices.
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(answerButtons().some((b) => !b.disabled)).toBe(true)
    expect(readQuestion()).toBeTruthy()
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
