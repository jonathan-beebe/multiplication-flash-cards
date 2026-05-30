---
id: IMPRV-001
type: improvement
status: discarded
created: 2026-05-30
---

# IMPRV-001: Auto-reset local input state on problem change

## Problem

In
`src/components/division/standardAlgorithm/StandardAlgorithmProblem.tsx:111-116`,
`handleNext` manually resets `inputValue`, `inputError`, and `hintsOpen`
alongside dispatching `NEXT`. Any new local `useState` added inside this
component will be silently retained across problems unless the author
remembers to add it to this reset list — a maintenance hazard the type system
does not catch.

## Outcome

- `handleNext` contains no `setInputValue` / `setInputError` / `setHintsOpen`
  calls; it only dispatches `NEXT`.
- After clicking "Next problem", `inputValue` is empty, `inputError` is null,
  and `hintsOpen` is false on the new problem — verified by an integration
  test.
- Adding a new `useState` inside the per-problem subtree in the future
  requires no change to `handleNext` for it to reset on problem change.
- The `aria-live` announcer, problem heading, and "Next problem" button
  retain identity across problems (i.e. the `key` boundary is scoped, not
  applied at the component root).

## Why it matters

Removes a silent foot-gun in the most user-facing component of the
standard-algorithm flow. Completes the work started by `1c56fed` (atomic reset
of session state via reducer) — that commit handled session state; this one
handles local state.

## Discovery notes

Care needed in choosing the `key=` boundary. Wrapping the entire component
would unmount the `aria-live` announcer and the `nextButtonRef` focus target —
both should survive across problems. The reporter's recommended boundary
("the element wrapping the input + hints section", currently the two sibling
blocks at `StandardAlgorithmProblem.tsx:146-212`) keeps the announcer,
heading, `LongDivisionDisplay`, sr-only summary, and Done block outside.

Also: increment `sessionId` by +1 on `NEXT` rather than resetting to 0;
otherwise alternating problems would share a key and React would reuse the
subtree, defeating the purpose.

## Recommendation

1. Extend `SessionState` with `sessionId: number`. `createSession` initializes
   `sessionId: 0`. The `NEXT` case in `sessionReducer` increments rather than
   resets:
   `{ ...createSession(action.level), sessionId: state.sessionId + 1 }`.
2. Wrap the "Step prompt" and "Helpful facts" sibling blocks (currently lines
   146–212) in a single keyed parent — `<div key={session.sessionId}>` or
   `<Fragment key={…}>`.
3. Delete the three manual `setInputValue("")` / `setInputError(null)` /
   `setHintsOpen(false)` calls from `handleNext`.
4. Add an integration test: type a value into the input, open hints, simulate
   a correct-completion path to reveal "Next problem", click it, assert the
   input is empty and hints are closed on the new problem.

## Related work

- `1c56fed` — refactor(standard-algorithm): colocate session state in a
  reducer for atomic reset

## Working

**2026-05-30:** Discarded by the human at /work-start time.

While starting implementation, surfaced a flaw in the recommendation: `key=`
on a JSX `<div>` unmounts/remounts DOM children but does **not** reset the
parent's `useState` slots. The four state slots in question (`inputValue`,
`inputError`, `hintsOpen`, `isShaking`) all live in
`StandardAlgorithmProblem`'s function body, not inside the JSX subtree. The
recommendation's step 3 ("delete the three manual resets from handleNext")
would have broken the existing reset behaviour without a deeper change.

Three options were presented to the human:

1. Extract a `ProblemPanel` sub-component so the `useState` calls move into
   the keyed subtree (the only path that genuinely achieves the
   "auto-reset-on-future-useState" guarantee in the OUTCOME).
2. Use `sessionId` + a parent `useEffect` to manually reset on change
   (smaller, same observable behaviour, loses the future-proof guarantee).
3. Pause and re-scope.

The human chose to discard the ticket rather than pursue any of these. The
current manual-reset implementation in `handleNext` is fine as-is; the
"future foot-gun" framing didn't justify the structural change once it was
clear the structural change was the only path to deliver it.

If this concern resurfaces, a follow-up could reframe it as an architecture
or refactor ticket around component decomposition rather than an
improvement.
