import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/AppRoutes'

// FEAT-001: multiplication offers the same difficulty-level experience as
// addition and subtraction, and pre-level URLs keep working via redirects.

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

describe('Multiplication levels', () => {
  it('/multiplication redirects to the ones-level menu with Easy selected', () => {
    renderAt('/multiplication')

    expect(screen.getByRole('heading', { name: /^multiplication$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^easy$/i })).toHaveAttribute('aria-current', 'page')
  })

  it('offers the same four levels as the other operations', () => {
    renderAt('/multiplication/ones')

    for (const label of [/^easy$/i, /^med$/i, /^hard$/i, /^master$/i]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('clicking a level link updates the selected level', () => {
    renderAt('/multiplication/ones')

    fireEvent.click(screen.getByRole('link', { name: /^med$/i }))

    expect(screen.getByRole('link', { name: /^med$/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /^easy$/i })).not.toHaveAttribute('aria-current')
  })

  it('practice launched from a level returns to that level via Back', () => {
    renderAt('/multiplication/tens')

    fireEvent.click(screen.getByRole('link', { name: /multiple choice/i }))
    expect(document.title).toBe('Practice — Multiplication Flash Cards')

    fireEvent.click(screen.getByRole('link', { name: /back to multiplication/i }))
    expect(screen.getByRole('link', { name: /^med$/i })).toHaveAttribute('aria-current', 'page')
  })

  it('legacy pre-level practice URL redirects to the ones-level screen', () => {
    renderAt('/multiplication/practice/multiple-choice')

    expect(document.title).toBe('Practice — Multiplication Flash Cards')
    expect(screen.getAllByText(/\d+ times \d+/).length).toBeGreaterThan(0)
  })

  it('legacy pre-level drill URL redirects to the ones-level drill', () => {
    renderAt('/multiplication/1-minute-drill')

    expect(document.title).toBe('1 Minute Drill — Multiplication Flash Cards')
    expect(screen.getByText(/time remaining/i)).toBeInTheDocument()
  })
})
