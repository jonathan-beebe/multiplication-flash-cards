---
id: BUG-009
type: bug
status: resolved
created: 2026-05-30
---

# BUG-009: Uncleaned setTimeout in StandardAlgorithmProblem.triggerShake can fire after unmount

## Problem

`src/components/division/standardAlgorithm/StandardAlgorithmProblem.tsx:83-86`
schedules a bare `setTimeout(..., 400)` in `triggerShake` with no cleanup:

```ts
function triggerShake() {
  setIsShaking(true)
  setTimeout(() => setIsShaking(false), 400)
}
```

If the component unmounts within 400 ms of an incorrect answer (e.g. the user
navigates away mid-shake), the callback runs `setIsShaking(false)` on an
unmounted component. This is the same antipattern resolved by `BUG-003` in
two other files; `BUG-003`'s body explicitly named "the `triggerShake` helper
at lines 37-39" in `HardModeQuizBoard.tsx` — the identically-named helper in
this file was missed.

## Outcome

- `triggerShake`'s timer is cleared on unmount and does not fire
  `setIsShaking` on a gone component.
- A second incorrect answer mid-shake clears the prior timer before
  scheduling a new one (no stacked timers prematurely snapping the shake off).
- A test triggers an incorrect answer, unmounts the component, advances fake
  timers past 400 ms, and verifies no React `act` warning / no
  setter-on-unmounted-component warning.

## Why it matters

React 19 currently no-ops state updates on unmounted components, but the
practice produces dev console warnings and depends on undocumented forgiveness
that could change. `BUG-003` was filed and fixed for exactly this reason
elsewhere in the app; leaving this site unfixed is inconsistent and will
resurface as a regression if React's behavior tightens.

## Discovery notes

The fix shape is the same as `BUG-003` (ref + cleanup effect). While here,
grep `src/components/` and `src/lib/` for any other bare `setTimeout` calls
without companion cleanup — if any exist, file them separately rather than
expanding this ticket's scope.

## Recommendation

Match `BUG-003`'s pattern, with clear-before-set so back-to-back wrong answers
don't stack:

```ts
const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  return () => {
    if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current)
  }
}, [])

function triggerShake() {
  setIsShaking(true)
  if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current)
  shakeTimerRef.current = setTimeout(() => setIsShaking(false), 400)
}
```

Add a test mirroring `BUG-003`'s: render, submit wrong answer, unmount,
advance fake timers past 400 ms, assert no setter ran.

## Related work

- `BUG-003` (resolved, PR #4, `cef47a4`) — fixed the same pattern in
  `useQuizAnimation.ts` and `HardModeQuizBoard.tsx`; this site was on the
  pattern's "search list" but slipped through.

## Working

**2026-05-30:** Confirmed and fixed.

- Applied the recommended ref + cleanup pattern in
  `StandardAlgorithmProblem.tsx`: `shakeTimerRef` ref, mount-only cleanup
  `useEffect`, and clear-before-set inside `triggerShake` so back-to-back
  wrong answers don't stack timers.
- TDD: wrote two tests in a new `StandardAlgorithmProblem.test.tsx` first;
  both failed against the unfixed code, both pass after the fix.
  - **Unmount test** uses a baseline-vs-after-submit comparison via
    `vi.getTimerCount()` to detect that the shake timer is the *added* timer
    and gets cleared on unmount. This sidesteps an unrelated background timer
    in the test environment without weakening the assertion.
  - **Stacked-timers test** asserts the `.shake` class is still applied at
    t=550ms after two wrong answers at t=50 and t=350. Without the fix, the
    first 400ms timer would have fired and cleared the class prematurely.
- Pattern sweep per discovery notes turned up two more uncleaned sites with
  the identical antipattern:
  - `src/components/division/partialQuotients/PartialQuotientsProblem.tsx:45-48`
  - `src/components/division/areaMode/AreaModelProblem.tsx:47-50`
  Filed `RFCTR-002` (draft, in `0-refine/`) to track extracting a shared
  hook rather than copy-pasting the fix for the fourth and fifth time. The
  human can refine that draft and decide whether to fix the two sites inline
  first or wait for the abstraction.
- 271/271 tests pass; typecheck clean.
