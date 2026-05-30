---
id: RFCTR-001
type: refactor
status: resolved
created: 2026-05-30
---

# RFCTR-001: Simplify LongDivisionDisplay StepRow — separation of concerns

## Problem

`src/components/division/standardAlgorithm/longDivisionDisplay.utils.ts:1-4`
re-exports `LongDivisionStep` (type) and `computeRightCols` (function) from
`@/lib/division/standardAlgorithm/longDivision`, blurring the boundary between
domain logic and display utilities.

Separately, `StepRow` in
`src/components/division/standardAlgorithm/LongDivisionDisplay.tsx:81-120`
accepts 8 props and derives 5+ values (`rightCol`, `wLen`, `ruleLeft`,
subtract-slot data, next-step/final-done flags) internally by indexing into the
full `steps` and `rightCols` arrays — a leaf display component reaching into
its siblings.

## Outcome

- `longDivisionDisplay.utils.ts` does not re-export `LongDivisionStep` or
  `computeRightCols`; consumers import both directly from
  `@/lib/division/standardAlgorithm/longDivision`.
- `StepRow` accepts 3 props (`data: StepRowData`, `divW`, `divisor`) and
  contains no derivation logic — no `steps`/`rightCols` indexing, no
  `buildSubtractSlots`/`buildValueSlots`/`computeRightCols` calls inside it.
- A pure function
  `buildStepRows(steps, rightCols, N, completedCount): StepRowData[]` lives in
  `longDivisionDisplay.utils.ts` and is unit-tested.
- Rendered output of `LongDivisionDisplay` is unchanged across all existing
  tests; new tests cover `buildStepRows` directly.

## Why it matters

Tightens the functional-core / imperative-shell separation called out in
`CLAUDE.md` — pushing derivation into a unit-testable pure function and leaving
the component as a thin renderer. Reduces friction in the most-edited part of
the standard-algorithm UI (5+ prior refactors in this area, listed under
Related work).

## Discovery notes

- There are two natural seams in this work: (a) stripping the re-exports has
  no behaviour change and no consumer impact beyond the import path, and
  (b) the `StepRow` API simplification is a pure refactor against the existing
  test surface. Sequencing (a) before (b) keeps each diff small and reviewable.
- `LongDivisionDisplay.test.ts` already imports `computeRightCols` from the lib
  directly, so seam (a) does not require a test change.
- Cases the current `StepRow` handles that any replacement must preserve:
  single-step problems (e.g. 9 ÷ 3), multi-step mid-progress (the row's
  `nextSlots` shows the bring-down), the final completed step (which renders a
  `FinalRemainderRow` with value 0), and cases where the minus sign spills
  outside the digit grid (`signCol < 0`, returned as `signChar = '−'`).
- If the work surfaces a deeper architectural smell — e.g. the slot/column
  model itself feels strained — route the deeper question to a research or
  architecture ticket rather than expanding this one.

## Related work

- `957fb06` — refactor(division): simplify LongDivisionDisplay API and
  separate concerns
- `4a5f4a1` — refactor(long-division-display): move to standardAlgorithm/ and
  split utils into separate file
- `784f2fc` — refactor(long-division): extract computeRightCols to lib as O(n)
  pure function
- `1c56fed` — refactor(standard-algorithm): colocate session state in a
  reducer for atomic reset

## Working

**2026-05-30:** Landed in two commits matching the discovery-notes seams.

- Seam (a) `da60fb3` — `longDivisionDisplay.utils.ts` no longer re-exports
  `LongDivisionStep` / `computeRightCols`; `LongDivisionDisplay.tsx` imports
  both directly from `@/lib/division/standardAlgorithm/longDivision`. No
  behaviour change; test file already imported from the lib.
- Seam (b) — added `StepRowData` interface and `buildStepRows` pure function
  in `longDivisionDisplay.utils.ts`. `StepRow` reduced from 8 props to 3
  (`data`, `divW`, `divisor`) with no derivation logic. `LongDivisionDisplay`
  calls `buildStepRows(steps, rightCols, N, completedCount)` once and maps.
- New unit tests cover the four cases called out in the discovery notes:
  single-step (9÷3), multi-step mid-progress (657÷3, cc=1), multi-step fully
  completed (cc=3), and sign-spills-outside (27÷9). 269/269 pass; typecheck
  clean.
- Refreshed the `LongDivisionDisplay` JSDoc to name `buildStepRows` in place
  of the now-internal `buildSubtractSlots`/`buildValueSlots` calls.

Visual rendering is not covered by automated tests in this tree. Pure-function
outputs are unchanged by construction (verified by trace + new unit tests),
but a manual browser pass against the standard-algorithm flow is recommended
before merging the PR.
