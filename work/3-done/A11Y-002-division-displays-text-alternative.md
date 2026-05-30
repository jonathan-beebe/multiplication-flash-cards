---
id: A11Y-002
type: a11y
status: resolved
created: 2026-03-29
---

# A11Y-002: Division visual displays hidden from screen readers without text alternative

## Problem

Three division visual display components render mathematical work-in-progress
and are marked `aria-hidden="true"` with no text alternative, so screen reader
users cannot perceive the accumulated work or visual state of the algorithm:

1. **AreaModelRect** — `src/components/division/areaMode/AreaModelRect.tsx:25`.
   A rectangle divided into proportional sections with partial quotient labels,
   filled/unfilled areas, and a dividend total.
2. **PartialQuotientsDisplay** —
   `src/components/division/partialQuotients/PartialQuotientsDisplay.tsx:71`. A
   stacked subtraction layout with each subtraction step, running remainders,
   and a sum of partial quotients.
3. **LongDivisionDisplay** —
   `src/components/division/standardAlgorithm/LongDivisionDisplay.tsx:159`. The
   traditional long division bracket with quotient digits, subtraction steps,
   and working numbers.

## Outcome

Screen reader users can perceive the current state of each division display
(prior steps, partial quotients, remainders), equivalent to what sighted users
see at a glance.

## Why it matters

WCAG 1.1.1 Non-text Content — Level A. Informational visuals must have a text
alternative serving an equivalent purpose. The parent components do provide
step-by-step announcements via `aria-live` regions and contextual text prompts,
so screen reader users can complete the exercises — but `aria-live` only
announces the most recent event; prior announcements are lost. Sighted users can
review all prior steps at a glance; screen reader users cannot.

## Recommendation

Add a visually-hidden (`sr-only`) summary adjacent to each display that
describes the current state of the work, updated as sections are added.
Examples:

- **AreaModelRect** — "3 sections placed: 10 (area 60), 5 (area 30), 2 (area
  12). Remaining: 18 of 120."
- **PartialQuotientsDisplay** — "Steps so far: 120 minus 60 equals 60 (partial
  quotient 10), 60 minus 30 equals 30 (partial quotient 5). Remaining: 30."
- **LongDivisionDisplay** — "Quotient so far: 1\_. Step 1: 7 goes into 11 once,
  subtract 7, bring down 9."

Could be implemented as a prop on each display, or computed in the parent and
rendered in an adjacent `<p className="sr-only">`. The parent already has all
necessary state.

## Working

Resolved by PR #8 (commit `f837f0d`).
