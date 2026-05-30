---
id: BUG-004
type: bug
status: resolved
created: 2026-03-29
---

# BUG-004: Next question selection uses stale game state (misses just-recorded answer)

## Problem

In `src/lib/engine/useOperationGameEngine.ts:48-53` and
`src/lib/useQuizAnimation.ts:34-35`, on a correct answer the flow (per
`QuizBoard.tsx:46-51`) is:

1. `engine.recordResult(question, correct, durationMs)` — queues a state update.
2. `triggerCorrect()` — captured in a closure with the _current_
   `getNextQuestion`.
3. Inside `triggerCorrect`, after a 300ms delay:
   `setNextQuestion(getNextQuestion())`.

`getNextQuestion` is a `useCallback` whose dependencies include `[state, …]`.
When the scheduled timeout fires, it uses the `getNextQuestion` captured when
`triggerCorrect` was last created — which may not yet reflect the state update
from step 1. The adaptive weighting (which prioritizes questions the student
struggles with) doesn't account for the most recent answer when picking the next
question.

## Outcome

The next question selection always reflects the most recent result, so the
adaptive weighting sees every answer when choosing the next question.

## Why it matters

The adaptive weighting misses one data point per question transition. In
practice the effect is small — the weighting uses full history, and the recorded
result _is_ in state, just not visible to that one selection call — but it makes
adaptive behavior subtly wrong and harder to reason about.

## Recommendation

Pass accumulated results directly to `getNextQuestion` rather than reading from
state inside it:

```typescript
const nextQuestion = useCallback(
  (previousResults?: readonly QuestionResult<Q>[]) => {
    const results = previousResults ?? allResults(state)
    return generator.getNextQuestion(results, random())
  },
  [state, random, generator],
)
```

The hook already supports this signature. The fix is in the call site —
`QuizBoard` and `HardModeQuizBoard` need to pass the updated results list
directly.

## Working

**2026-03-29:** Confirmed.

Used a ref pattern for `getNextQuestion` (matching the existing `onSettledRef`
approach) in both `useQuizAnimation.ts` and `HardModeQuizBoard.tsx`. Ref is kept
in sync via `useEffect`; the timeout reads `getNextQuestionRef.current()`
instead of the closure-captured function.

New test in `useQuizAnimation.test.ts` — triggers `triggerCorrect` with one
getter, re-renders with a different getter, fires the timeout, verifies the
fresh getter is used. All 245 tests pass.

Resolved by PR #5 (commit `f20173f`).
