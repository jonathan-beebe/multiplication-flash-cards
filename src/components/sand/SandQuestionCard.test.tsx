import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SandQuestionCard from './SandQuestionCard'

// jsdom has no WebGL, so these tests exercise the real no-WebGL fallback:
// plain text plus the timeout-based dismissal completion.
describe('SandQuestionCard (no-WebGL fallback)', () => {
  it('renders the question text with a screen-reader alternative', () => {
    render(<SandQuestionCard display="7 × 8" srText="7 times 8" dismissing={false} />)
    expect(screen.getByText('7 × 8')).toBeInTheDocument()
    expect(screen.getByText('7 × 8')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('7 times 8')).toHaveClass('sr-only')
  })

  it('fires onDismissComplete exactly once per dismissal', async () => {
    const onDismissComplete = vi.fn()
    const { rerender } = render(
      <SandQuestionCard display="7 × 8" srText="7 times 8" dismissing={false} onDismissComplete={onDismissComplete} />,
    )
    expect(onDismissComplete).not.toHaveBeenCalled()

    rerender(
      <SandQuestionCard display="7 × 8" srText="7 times 8" dismissing={true} onDismissComplete={onDismissComplete} />,
    )
    await vi.waitFor(() => expect(onDismissComplete).toHaveBeenCalledTimes(1))

    // A re-render while still dismissing must not fire again.
    rerender(
      <SandQuestionCard display="7 × 8" srText="7 times 8" dismissing={true} onDismissComplete={onDismissComplete} />,
    )
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(onDismissComplete).toHaveBeenCalledTimes(1)
  })
})
