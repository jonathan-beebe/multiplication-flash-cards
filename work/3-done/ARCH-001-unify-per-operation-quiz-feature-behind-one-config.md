---
id: ARCH-001
type: architecture
status: resolved
created: 2026-07-05
---

# ARCH-001: unify per-operation quiz feature behind one operation config

## Problem

The three quiz-style operations are implemented as parallel, near-identical
stacks. `src/components/addition/{Practice,HardModePractice,Drill}.tsx` and
`src/components/subtraction/{Practice,HardModePractice,Drill}.tsx` are
line-for-line clones except for the operation symbol, screen-reader phrasing,
generator import, page title, and route prefix (verified by diff);
multiplication carries the same trio in an older shape. Each operation also has
a ~6-line hook wrapper (`useAdditionGameEngine` / `useSubtractionGameEngine` /
`useMultiplicationGameEngine`) and a generator that re-implements the same
choice-generation offsets and Fisher-Yates shuffle. `DrillComplete` is used by
every operation's drill-success route (`AppRoutes.tsx:71-98`) yet lives in
`components/multiplication/`. Any shared behavior change must be applied in
triplicate.

## Goal

One operation-agnostic quiz feature that each operation merely configures, so
shared behavior has exactly one home.

## Outcome

Adding or changing a quiz-style operation touches only that operation's
config/generator and the composition root; all existing routes render identical
behavior (the integration suite passes unchanged); no practice/hard-mode/drill
component or engine hook exists in triplicate; `DrillComplete` is owned by the
shared quiz feature rather than multiplication.

## Why it matters

The repo's own history shows the cost of this duplication — BUG-003 and BUG-009
fixed the same timer bug at multiple cloned sites, and the RFCTR-002 draft
exists because "the repetition is the bug." Duplication also lets patterns
drift: multiplication has already diverged (unprefixed `Question` type,
module-level singleton generator, no levels).

## Discovery notes

Current vs target shape:

```mermaid
flowchart TB
  subgraph current [Current — three cloned stacks]
    AP[addition/Practice+HardMode+Drill] --> AG[additionGenerator]
    SP[subtraction/Practice+HardMode+Drill] --> SG[subtractionGenerator]
    MP[multiplication/Practice+HardMode+Drill] --> MG[multiplicationGenerator]
    AP & SP & MP --> QB[quiz/QuizBoard + HardModeQuizBoard + DrillTimerBar]
    AG & SG & MG --> GE[lib/engine/gameEngine]
  end
```

```mermaid
flowchart TB
  subgraph target [Target — one feature, three configs]
    CFG[OperationConfig per operation: name, symbol, sr phrasing, generator factory, level ranges, route base, color] --> GEN[generic Practice / HardModePractice / Drill]
    GEN --> QB2[quiz components]
    GEN --> GE2[lib/engine core]
    ROOT[AppRoutes composition root] --> CFG
  end
```

Advisory only: an `OperationConfig` object consumed by generic components is
one shape; the maker chooses the exact contract and folder placement (a
feature-first folder such as an `operations/` or `features/` module would also
make the deletability test pass — today each operation is smeared across
`components/`, `lib/`, and `AppRoutes`). The duplicated choice-offset +
shuffle logic in the three generators is a candidate for the shared engine
core. Multiplication's missing levels are deliberately NOT in scope here —
that product gap is filed separately as a feature; this ticket only ensures
the unified shape can host it.

## Related work

- [[RFCTR-002]] (draft — same repetition-is-the-bug motif)
- [[BUG-003]], [[BUG-009]] — same timer bug fixed at multiple cloned sites
- [[BUG-008]] — level ranges
- `src/lib/engine/` (`gameEngine.ts`, `useOperationGameEngine.ts`,
  `operationLevels.ts`) — the core extraction is done; this ticket finishes the
  job at the component layer

## Working

**2026-07-05:** Landed the unified module at `src/components/operations/`.

Tests first: wrote `src/integration/operation-screens.test.tsx` (9
characterization tests) pinning, for every operation × screen, the document
title, spoken question text (`plus`/`minus`/`times` sr text), and back
navigation — green against the old clones before any refactor.

Shape landed (matches the target diagram):

- `operationConfig.tsx` — the `OperationConfig<Q>` contract (`name`,
  `routeBase`, `hasLevels`, `makeGenerator`, `renderQuestion`), a
  `backNavProps` helper, and `makeStackedCardRenderer` for the two-row card
  layout shared by addition/subtraction.
- `OperationPractice.tsx`, `OperationHardModePractice.tsx`,
  `OperationDrill.tsx` — the three generic screens, generic over question
  type `Q`, level-aware via `parseOperationLevel` (levelless operations fall
  through to the default level and ignore it).
- `additionConfig.tsx`, `subtractionConfig.tsx`, `multiplicationConfig.tsx` —
  each operation reduced to one ~15-line config. Multiplication keeps its
  singleton adaptive generator (`hasLevels: false`, noted for FEAT-001).
- `DrillComplete.tsx` moved here from `components/multiplication/` with its
  test; drill-routing test moved as `OperationDrill.test.tsx`.

Deleted the nine cloned screen components (`components/{addition,subtraction,
multiplication}/{Practice,HardModePractice,Drill}.tsx`) and the three 6-line
hook wrappers (`use{Addition,Subtraction,Multiplication}GameEngine.ts`); the
generic screens call `useOperationGameEngine` directly. Also took the advisory
generator cleanup: duplicated choice-offset + Fisher-Yates logic extracted to
`src/lib/engine/offsetChoices.ts` (with unit tests); both generators now
delegate. Multiplication's `generateChoices` differs by design (adjacent-fact
distractors) and was left alone.

Outcome check: `components/addition/` and `components/subtraction/` are gone
entirely — an operation is now its config + its `lib/<op>/` generator + route
lines in `AppRoutes`. Suite grew 271 → 282 (9 characterization + 2 unit), all
green; the pre-existing integration suite passed without modification.
Typecheck, lint, format clean.
