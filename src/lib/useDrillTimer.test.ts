import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDrillTimer } from '@/lib/useDrillTimer'

describe('useDrillTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down each second', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useDrillTimer(1, { onComplete }))

    expect(result.current.timeRemaining).toBe(60)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.timeRemaining).toBe(59)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.timeRemaining).toBe(58)
  })

  it('calls onComplete when time reaches zero', () => {
    const onComplete = vi.fn()
    renderHook(() => useDrillTimer(1, { onComplete }))

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(onComplete).toHaveBeenCalledWith(0, 0)
  })

  it('does not recreate the interval on every tick', () => {
    const onComplete = vi.fn()
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    renderHook(() => useDrillTimer(1, { onComplete }))

    const initialCallCount = setIntervalSpy.mock.calls.length

    // Advance 10 seconds — the interval should NOT be recreated each tick
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    // If the bug exists, setInterval would be called once per tick (10 more times).
    // With the fix, it should only be called once total (the initial setup).
    expect(setIntervalSpy.mock.calls.length).toBe(initialCallCount)

    setIntervalSpy.mockRestore()
  })

  it('tracks correct and wrong counts', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useDrillTimer(1, { onComplete }))

    act(() => {
      result.current.recordCorrect()
      result.current.recordCorrect()
      result.current.recordWrong()
    })

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(onComplete).toHaveBeenCalledWith(2, 1)
  })

  it('announces at 1 minute, 30 seconds, and 10 seconds remaining', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useDrillTimer(2, { onComplete }))

    // At 2 minutes, no announcement
    expect(result.current.timerAnnouncement).toBe('')

    // Advance to 60 seconds remaining
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(result.current.timerAnnouncement).toBe('1 minute remaining')

    // Advance to 30 seconds remaining
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(result.current.timerAnnouncement).toBe('30 seconds remaining')

    // Advance to 10 seconds remaining
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(result.current.timerAnnouncement).toBe('10 seconds remaining')
  })
})
