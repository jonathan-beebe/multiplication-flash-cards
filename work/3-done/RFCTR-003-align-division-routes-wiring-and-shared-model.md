---
id: RFCTR-003
type: refactor
status: resolved
created: 2026-07-05
---

# RFCTR-003: align division routes, wiring, and shared model

## Problem

The division feature is internally inconsistent in three ways:

1. **Routing.** Area-model practice lives at a separate top-level route
   `/division-practice/:level` (`AppRoutes.tsx:104-105`) with `level-1..level-4`
   naming, while its sibling modes live under `/division/standard-algorithm`
   and `/division/partial-quotients`.
2. **Wiring.** Standard-algorithm and partial-quotients are mounted via
   `src/pages/division/*Practice.tsx` wrapper pages, but area model routes
   directly to `src/components/division/areaMode/DivisionPractice.tsx`. The two
   wrapper pages also duplicate the same level-picker UI.
3. **Module boundaries.** The shared division domain model
   (`divisionProblem.ts`, exporting `LEVELS`, `Level`, `generateProblem`,
   `getHelpfulFacts`) lives inside `src/lib/division/areaMode/`, yet the
   standardAlgorithm and partialQuotients components and pages reach into it
   from five import sites — a mode-owned folder is acting as the shared core.

## Goal

Division is one coherent feature: one route family, one wiring pattern, and a
shared model that lives in shared territory.

## Outcome

All three division modes are reachable under a single consistent route family
with consistent level naming; previously published URLs still resolve; no
division mode imports from another mode's folder; deleting one mode's folder
breaks only that mode.

## Why it matters

The stray `/division-practice` route family makes navigation and bookmarks
inconsistent with every other operation. The boundary violation means any
rename or refactor inside `areaMode/` silently breaks the other two modes, and
the duplicated level pickers will drift apart over time.

## Discovery notes

Advisory suggestions only:

- Hoist `divisionProblem.ts` up to `src/lib/division/` —
  `displaySummary.ts` already models the correct shared location there.
- Fold `/division-practice/:level` into the `/division/...` family (e.g.
  `/division/area-model/:level`) with `Navigate` redirects for the old paths,
  matching the redirect pattern already used for `/addition` → `/addition/ones`.
- Extract the duplicated level-picker in the two wrapper pages into one shared
  division component, and give area model the same page-wrapper wiring as its
  siblings.
- The integration suite pins the current URLs
  (`src/integration/app-journeys.test.tsx:254-270`) and must be updated in the
  same change to assert the new routes plus the legacy redirects.

## Related work

- [[RFCTR-001]], [[RSRCH-001]] — recent division display work in the same area
- [[A11Y-002]] — division displays' text-alternative pattern (touches the same
  components)

## Working

**2026-07-05:** All three inconsistencies resolved.

Tests first: added `src/integration/division-modes.test.tsx` (canonical
`/division/<mode>/:level` routes for all three modes, link-based level
selection, bare-mode redirects, legacy `/division-practice` and
`/division-practice/:level` redirects with level preserved) — red before, green
after.

1. **Model hoisted.** `divisionProblem.ts` (+ test) moved from
   `lib/division/areaMode/` up to `lib/division/`, beside `displaySummary.ts`;
   all 14 import sites updated. Grep confirms zero cross-mode imports remain —
   each mode's folder is deletable without breaking its siblings.
2. **One wiring pattern.** The three near-identical practice pages collapsed
   into a shared `components/division/DivisionPracticePage.tsx` (heading,
   URL-driven level picker, `renderProblem(level)` slot) with three thin
   wrappers in `pages/division/` — the same config-driven shape ARCH-001
   established for operations. The old `areaMode/DivisionPractice.tsx` page
   died; its test was ported to `pages/division/AreaModelPractice.test.tsx`.
   Standard-algorithm and partial-quotients level pickers changed from
   `useState` radiogroups to links — the level now lives in the URL for all
   three modes (bookmarkable, survives reload, one owner).
3. **One route family.** `/division/area-model/:level` joins its siblings;
   `/division/<mode>` redirects to `level-1`; legacy `/division-practice[/:level]`
   redirects to the area-model equivalent preserving the level (small
   `LegacyDivisionPracticeRedirect` in the composition root). DivisionMenu now
   links to `/division/area-model`.

Deliberate small changes: mode page titles unified to
`<Method> — Math Flash Cards` (area model previously said
"Division Practice — Multiplication Flash Cards"). The pre-existing
app-journeys division block passed **unchanged** via the legacy redirects,
doubling as legacy-URL regression coverage. 295/295 green; typecheck, lint,
format clean.
