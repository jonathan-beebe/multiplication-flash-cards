---
id: BUG-002
type: bug
status: resolved
created: 2026-03-29
---

# BUG-002: Drill timer recreates interval every second, causing timing drift

## Problem

`src/lib/useDrillTimer.ts:26-32` has an effect whose dependency array is
`[timeRemaining]`, so the interval is cleared and recreated every tick:

```typescript
useEffect(() => {
  if (timeRemaining <= 0) return
  const timer = setInterval(() => {
    setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1))
  }, 1000)
  return () => clearInterval(timer)
}, [timeRemaining]) // recreates interval on every tick
```

Each second: interval fires → state updates → React re-renders → effect cleanup
clears interval → effect runs and creates a new one. The non-zero gap between
clear and recreate accumulates over multi-minute drills.

## Outcome

A multi-minute drill timer reflects elapsed wall-clock time within an acceptable
margin (no measurable per-tick drift), and the interval is created once per
drill rather than once per second.

## Why it matters

A 3-minute drill could drift ~1–2 seconds (noticeable, though not critical), and
the timer does 180 unnecessary interval create/destroy cycles per 3-minute
drill.

## Recommendation

Create the interval once and stop it when time runs out:

```typescript
const timeRemainingRef = useRef(durationMinutes * 60)

useEffect(() => {
  const timer = setInterval(() => {
    timeRemainingRef.current -= 1
    setTimeRemaining(timeRemainingRef.current)
    if (timeRemainingRef.current <= 0) clearInterval(timer)
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

For better accuracy, track elapsed wall-clock time instead of counting
intervals.

## Working

**2026-03-29:** Confirmed. Changed the effect to use an empty dependency array,
creating the interval once on mount. The interval callback uses
`setTimeRemaining` with a functional updater and calls `clearInterval(timer)`
from inside the callback when time reaches zero — avoids the need for a ref.

Added `src/lib/useDrillTimer.test.ts` with 5 tests, including one that spies on
`setInterval` to verify it's only created once. All 249 tests pass.

Resolved by PR #3 (commit `e902146`).
