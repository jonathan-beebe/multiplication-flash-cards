import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuizAnimation } from '@/lib/useQuizAnimation'

describe('useQuizAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no animation state', () => {
    const { result } = renderHook(() => useQuizAnimation({ getNextQuestion: () => 'q2', onSettled: vi.fn() }))
    expect(result.current.showCorrect).toBe(false)
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.nextQuestion).toBeNull()
  })

  it('sets showCorrect immediately after triggerCorrect', () => {
    const { result } = renderHook(() => useQuizAnimation({ getNextQuestion: () => 'q2', onSettled: vi.fn() }))
    act(() => {
      result.current.triggerCorrect()
    })
    expect(result.current.showCorrect).toBe(true)
    expect(result.current.isAnimating).toBe(false)
  })

  it('starts animation after delayMs and clears showCorrect', () => {
    const { result } = renderHook(() =>
      useQuizAnimation({ getNextQuestion: () => 'q2', onSettled: vi.fn(), delayMs: 300 }),
    )
    act(() => {
      result.current.triggerCorrect()
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isAnimating).toBe(true)
    expect(result.current.showCorrect).toBe(false)
    expect(result.current.nextQuestion).toBe('q2')
  })

  it('does not animate before delayMs elapses', () => {
    const { result } = renderHook(() =>
      useQuizAnimation({ getNextQuestion: () => 'q2', onSettled: vi.fn(), delayMs: 300 }),
    )
    act(() => {
      result.current.triggerCorrect()
    })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current.isAnimating).toBe(false)
  })

  it('calls onSettled with nextQuestion after handleTransitionEnd (transform)', () => {
    const onSettled = vi.fn()
    const { result } = renderHook(() => useQuizAnimation({ getNextQuestion: () => 'q2', onSettled, delayMs: 0 }))
    act(() => {
      result.current.triggerCorrect()
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })
    act(() => {
      result.current.frontCardProps.onTransitionEnd?.({
        propertyName: 'transform',
      } as React.TransitionEvent<HTMLDivElement>)
    })
    expect(onSettled).toHaveBeenCalledWith('q2')
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.nextQuestion).toBeNull()
  })

  it('ignores transitionEnd for non-transform properties', () => {
    const onSettled = vi.fn()
    const { result } = renderHook(() => useQuizAnimation({ getNextQuestion: () => 'q2', onSettled, delayMs: 0 }))
    act(() => {
      result.current.triggerCorrect()
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })
    act(() => {
      result.current.frontCardProps.onTransitionEnd?.({
        propertyName: 'opacity',
      } as React.TransitionEvent<HTMLDivElement>)
    })
    expect(onSettled).not.toHaveBeenCalled()
    expect(result.current.isAnimating).toBe(true)
  })

  it('frontCardProps has slide-out class and transform style when animating', () => {
    const { result } = renderHook(() =>
      useQuizAnimation({ getNextQuestion: () => 'q2', onSettled: vi.fn(), delayMs: 0 }),
    )
    act(() => {
      result.current.triggerCorrect()
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current.frontCardProps.className).toBe('card-slide-out')
    expect(result.current.frontCardProps.style?.transform).toMatch(/translateX/)
  })

  it('backCardProps has zoom-in class and no explicit transform when animating', () => {
    const { result } = renderHook(() =>
      useQuizAnimation({ getNextQuestion: () => 'q2', onSettled: vi.fn(), delayMs: 0 }),
    )
    act(() => {
      result.current.triggerCorrect()
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current.backCardProps.className).toBe('card-zoom-in')
    expect(result.current.backCardProps.style?.transform).toBeUndefined()
  })

  it('uses the latest getNextQuestion when the timeout fires, not a stale closure', () => {
    const staleGetter = () => 'stale'
    const freshGetter = () => 'fresh'

    const { result, rerender } = renderHook(
      ({ getter }) => useQuizAnimation({ getNextQuestion: getter, onSettled: vi.fn(), delayMs: 300 }),
      { initialProps: { getter: staleGetter } },
    )

    // Trigger the correct animation (captures staleGetter in the closure)
    act(() => {
      result.current.triggerCorrect()
    })

    // Simulate state update: parent re-renders with a new getNextQuestion
    rerender({ getter: freshGetter })

    // Fire the timeout — should use freshGetter, not the stale one
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.nextQuestion).toBe('fresh')
  })
})
