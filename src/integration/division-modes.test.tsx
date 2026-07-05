import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/AppRoutes'

// RFCTR-003: all three division modes live under one /division/<mode>/:level
// route family with the level in the URL, and previously published URLs
// still resolve via redirects.

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

function selectedLevel() {
  const current = screen
    .getAllByRole('link', { name: /level \d/i })
    .filter((el) => el.getAttribute('aria-current') === 'page')
  expect(current).toHaveLength(1)
  return current[0]
}

describe('Division route family', () => {
  it('menu links reach all three modes under /division', () => {
    renderAt('/division')

    for (const [name, subtitle] of [
      [/area model/i, /area model method/i],
      [/standard algorithm/i, /standard algorithm/i],
      [/partial quotients/i, /partial quotients method/i],
    ] as const) {
      fireEvent.click(screen.getByRole('link', { name }))
      expect(screen.getByRole('heading', { name: /division practice/i })).toBeInTheDocument()
      expect(screen.getAllByText(subtitle).length).toBeGreaterThan(0)
      expect(selectedLevel()).toHaveTextContent(/level 1/i)
      fireEvent.click(screen.getByRole('link', { name: /back/i }))
    }
  })

  it('each mode renders the level from the URL', () => {
    renderAt('/division/standard-algorithm/level-2')
    expect(selectedLevel()).toHaveTextContent(/level 2/i)
  })

  it('level selection is link-based and updates the selected level', () => {
    renderAt('/division/partial-quotients/level-1')

    fireEvent.click(screen.getByRole('link', { name: /level 3/i }))
    expect(selectedLevel()).toHaveTextContent(/level 3/i)
  })

  it('bare mode URLs redirect to level-1', () => {
    renderAt('/division/standard-algorithm')
    expect(selectedLevel()).toHaveTextContent(/level 1/i)

    fireEvent.click(screen.getByRole('link', { name: /level 4/i }))
    expect(selectedLevel()).toHaveTextContent(/level 4/i)
  })

  it('legacy /division-practice redirects to area model level-1', () => {
    renderAt('/division-practice')

    expect(screen.getByText(/area model method/i)).toBeInTheDocument()
    expect(selectedLevel()).toHaveTextContent(/level 1/i)
  })

  it('legacy /division-practice/:level preserves the level', () => {
    renderAt('/division-practice/level-3')

    expect(screen.getByText(/area model method/i)).toBeInTheDocument()
    expect(selectedLevel()).toHaveTextContent(/level 3/i)
  })
})
