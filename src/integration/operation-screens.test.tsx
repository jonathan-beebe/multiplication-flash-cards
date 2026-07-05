import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/AppRoutes'

// Characterization tests for the per-operation quiz screens (ARCH-001).
// Each operation must present the same screen shell with operation-specific
// content: document title, spoken question text, and back navigation.

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

const operations = [
  {
    name: 'Addition',
    practicePath: '/addition/ones/practice/multiple-choice',
    hardModePath: '/addition/ones/practice/hard-mode',
    drillPath: '/addition/ones/1-minute-drill',
    srQuestion: /\d+ plus \d+/,
    backLink: /back to addition/i,
  },
  {
    name: 'Subtraction',
    practicePath: '/subtraction/ones/practice/multiple-choice',
    hardModePath: '/subtraction/ones/practice/hard-mode',
    drillPath: '/subtraction/ones/1-minute-drill',
    srQuestion: /\d+ minus \d+/,
    backLink: /back to subtraction/i,
  },
  {
    name: 'Multiplication',
    practicePath: '/multiplication/ones/practice/multiple-choice',
    hardModePath: '/multiplication/ones/practice/hard-mode',
    drillPath: '/multiplication/ones/1-minute-drill',
    srQuestion: /\d+ times \d+/,
    backLink: /back to multiplication/i,
  },
]

describe.each(operations)('$name screens', ({ name, practicePath, hardModePath, drillPath, srQuestion, backLink }) => {
  it('practice renders a question, title, and back navigation', () => {
    renderAt(practicePath)

    expect(document.title).toBe(`Practice — ${name} Flash Cards`)
    expect(screen.getAllByText(srQuestion).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: backLink })).toBeInTheDocument()
  })

  it('hard mode renders a question and title', () => {
    renderAt(hardModePath)

    expect(document.title).toBe(`Hard Mode — ${name} Flash Cards`)
    expect(screen.getAllByText(srQuestion).length).toBeGreaterThan(0)
  })

  it('drill renders a question, timer, title, and back navigation', () => {
    renderAt(drillPath)

    expect(document.title).toBe(`1 Minute Drill — ${name} Flash Cards`)
    expect(screen.getAllByText(srQuestion).length).toBeGreaterThan(0)
    expect(screen.getByText(/time remaining/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: backLink })).toBeInTheDocument()
  })
})
