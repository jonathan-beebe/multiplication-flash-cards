---
id: BUG-003
type: bug
status: resolved
created: 2026-03-29
---

# BUG-003: Uncleaned setTimeout in useQuizAnimation can fire after unmount

## Problem

`src/lib/useQuizAnimation.ts:34-39` schedules a `setTimeout` (300ms default)
that is never cleaned up:

```typescript
const triggerCorrect = useCallback(() => {
  setShowCorrect(true)
  setTimeout(() => {
    // no cleanup
    setNextQuestion(getNextQuestion())
    setSlideRotation(Math.random() * 70 - 35)
    setIsAnimating(true)
    setShowCorrect(false)
  }, delayMs)
}, [getNextQuestion, delayMs])
```

If the component unmounts during that window (e.g. user navigates away
mid-animation), the timeout fires and calls state setters on an unmounted
component. The same pattern exists in `HardModeQuizBoard.tsx:60-65` and in the
`triggerShake` helper at lines 37-39.

## Outcome

Pending timeouts in `useQuizAnimation` and `HardModeQuizBoard` are cleared on
unmount and do not fire state setters after the component is gone.

## Why it matters

React 19 gracefully ignores state updates on unmounted components (no crash), so
practical impact is minimal today. But it produces dev console warnings and
relies on a behavior that could change in future React versions.

## Recommendation

Store the timeout ID in a ref and clear it on cleanup:

```typescript
const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

const triggerCorrect = useCallback(() => {
  setShowCorrect(true)
  timeoutRef.current = setTimeout(() => {
    // …
  }, delayMs)
}, [getNextQuestion, delayMs])

useEffect(() => () => clearTimeout(timeoutRef.current), [])
```

## Working

**2026-03-29:** Confirmed.

- `useQuizAnimation.ts`: added `timeoutRef` and a cleanup effect.
- `HardModeQuizBoard.tsx`: added `shakeTimeoutRef` and `correctTimeoutRef` for
  the two uncleaned timeouts, with a cleanup effect for both.

New test in `useQuizAnimation.test.ts` — triggers `triggerCorrect`, unmounts
immediately, advances timers past the delay, verifies `getNextQuestion` was not
called again. All 245 tests pass.

Resolved by PR #4 (commit `cef47a4`).
