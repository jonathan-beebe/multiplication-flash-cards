---
id: DSGN-001
type: design
status: draft
created: 2026-07-05
---

# DSGN-001 (DRAFT): decide the fate of the inline long-division display

> Auto-filed during the 2026-07-05 architecture audit to close the loop
> RSRCH-001 left open. Needs a human's visual judgment before promotion to
> `1-inbox/` — the decision itself cannot be delegated.

## Problem

RSRCH-001 delivered
`src/components/division/standardAlgorithmInline/LongDivisionDisplayInline.tsx`
and a four-stage design-system fixture (3192 ÷ 7) for side-by-side comparison
with the existing `LongDivisionDisplay`. Its exit criterion — "the team can
judge whether the layout is worth pursuing," followed by a feature ticket (if
yes) or a removal ticket (if no) — was never exercised. The component now sits
in the tree as a one-file module consumed only by `DesignSystem.tsx`, in
neither the product nor the trash.

## Goal

The RSRCH-001 exploration reaches its decision and the codebase stops carrying
an undecided artifact.

## Outcome

A human has viewed the design-system comparison and recorded a verdict, and the
corresponding follow-up ticket exists: either a feature ticket (props parity,
sr-only text alternative per A11Y-002's pattern, integration into
`StandardAlgorithmProblem`) or a maintenance ticket (remove the component and
its fixture).

## Why it matters

Undecided exploration code is drift waiting to happen: it shows up in audits,
must be carried through refactors like RFCTR-003, and its `aria-hidden`
visual-only shape must not accidentally ship to students without the
accessibility work.

## How to decide

View both layouts side by side at `/design-system` (the fixtures render the
same problem in both styles) and judge which reads more clearly at this app's
typography scale for a grade-school student.

## Related work

- [[RSRCH-001]] — the exploration this closes (see its "Working" section for
  the decision framing)
- [[A11Y-002]] — the text-alternative pattern the "adopt" path must follow
- [[RFCTR-003]] — division alignment refactor that must carry this component
  while it remains undecided
