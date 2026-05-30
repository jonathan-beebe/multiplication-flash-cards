---
id: RFCTR-002
type: refactor
status: draft
created: 2026-05-30
---

# RFCTR-002 (DRAFT): Shared `useShake` hook to retire the recurring uncleaned-setTimeout antipattern

> Auto-filed during BUG-009 per the bug type's "category-bug" guidance. Needs
> human refinement before promotion to `1-inbox/`.

## Problem

The same uncleaned-`setTimeout` antipattern has now surfaced five times in
this repo's per-problem components and animation hooks:

| Site | Status |
| ---- | ------ |
| `src/lib/useQuizAnimation.ts` | fixed by BUG-003 |
| `src/components/quiz/HardModeQuizBoard.tsx` (`triggerShake`) | fixed by BUG-003 |
| `src/components/division/standardAlgorithm/StandardAlgorithmProblem.tsx` (`triggerShake`) | fixed by BUG-009 |
| `src/components/division/partialQuotients/PartialQuotientsProblem.tsx:45-48` (`triggerShake`) | **still unfixed** |
| `src/components/division/areaMode/AreaModelProblem.tsx:47-50` (`triggerShake`) | **still unfixed** |

Three of the `triggerShake` instances are mechanical copies of each other:
same name, same 400ms, same body. Every fix is the same five lines (ref, mount
cleanup, clear-before-set). The repetition is the bug.

## Outcome

- A single tested abstraction lives somewhere under `src/lib/` (e.g.
  `useShake()` returning `{ isShaking, triggerShake }`, or a lower-level
  `useTimeoutRef()` primitive) and handles the timer ref + cleanup once.
- All five sites consume the abstraction; no production component or hook
  contains a bare `setTimeout` with a hand-rolled ref and cleanup effect.
- The two currently-unfixed sites are no longer vulnerable to the BUG-009
  failure mode.

## Why it matters

This category keeps recurring because every per-problem component
independently re-derives the same wrong solution (bare setTimeout). A shared
hook makes the correct shape the default, retires the antipattern, and
eliminates a class of "we missed this site" regressions — five fixes done
piecewise vs. one abstraction done once.

## Discovery notes

- Two remaining unfixed sites identified during BUG-009:
  `PartialQuotientsProblem.tsx:45-48` and `AreaModelProblem.tsx:47-50`. The
  human refining this draft could either: (a) file a quick BUG ticket to fix
  both inline now (matching the BUG-009 pattern), then collapse all sites
  into the abstraction later; or (b) wait for the abstraction to land and
  adopt it directly at each site in the same PR. Option (a) limits
  regression window if this lingers in `0-refine`; option (b) avoids churn.
- `src/lib/useAnnouncement.ts` already uses a ref + cleanup pattern
  correctly — small in-house precedent worth mimicking in the abstraction's
  shape.
- If the shared hook also subsumes `useQuizAnimation`'s timer (delayMs-based,
  not 400ms), the design pressure may push toward a lower-level
  `useTimeoutRef`/`useScheduledCallback` primitive rather than a
  shake-specific hook. Pick the level that keeps both call sites simple.

## Related work

- `BUG-003` (resolved, PR #4, `cef47a4`) — first two fixes; established the
  ref + cleanup pattern.
- `BUG-009` (resolved, commit `83cb058`) — third fix; surfaced the remaining
  two sites and motivated this draft.
