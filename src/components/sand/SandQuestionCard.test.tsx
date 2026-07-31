import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import SandQuestionCard from './SandQuestionCard'

// jsdom has no WebGL, so these tests exercise the real no-WebGL fallback:
// the phase-driven text (question / ✓) renders as plain text and the
// choreography timers still run.
describe('SandQuestionCard (no-WebGL fallback)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the question text with a screen-reader alternative', () => {
    render(<SandQuestionCard display="7 × 8" srText="7 times 8" phase="idle" />)
    expect(screen.getByText('7 × 8')).toBeInTheDocument()
    expect(screen.getByText('7 × 8')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('7 times 8')).toHaveClass('sr-only')
  })

  it('shows the green checkmark during the correct phase', () => {
    render(<SandQuestionCard display="7 × 8" srText="7 times 8" phase="correct" />)
    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.queryByText('7 × 8')).not.toBeInTheDocument()
  })

  it('calls onAdvanceDone exactly once after the advancing morph window', () => {
    const onAdvanceDone = vi.fn()
    const { rerender } = render(
      <SandQuestionCard display="7 × 8" srText="7 times 8" phase="correct" onAdvanceDone={onAdvanceDone} />,
    )
    rerender(<SandQuestionCard display="3 × 4" srText="3 times 4" phase="advancing" onAdvanceDone={onAdvanceDone} />)
    expect(screen.getByText('3 × 4')).toBeInTheDocument()
    expect(onAdvanceDone).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(onAdvanceDone).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(onAdvanceDone).toHaveBeenCalledTimes(1)
  })
})
