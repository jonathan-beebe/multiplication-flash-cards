---
id: RSRCH-001
type: research
status: resolved
created: 2026-05-31
---

# RSRCH-001: explore inline long-division display

## Problem

There is no inline-style long-division display in the app today.
`src/components/division/standardAlgorithm/LongDivisionDisplay.tsx` renders the
traditional bracket layout that grows vertically — each step adds a subtraction
row, an underline, and a bring-down row. An alternative layout (seen in a
YouTube video) renders the remainder from each step as a small prefix glued to
the next dividend digit, so the work expands horizontally inside the bracket.
We don't know how this reads at the typography scale this app uses, or whether
it's actually clearer for a grade-school student.

## Outcome

A new component at `src/components/division/standardAlgorithmInline/` renders,
for a chosen sample problem, each progressive stage of the inline layout —
quotient digit placed above its column, remainder shown as a small prefix glued
to the next dividend digit (omitted when remainder is 0), no stacked
subtraction rows. The design system page showcases each stage from "new
problem" through fully solved, alongside the existing `LongDivisionDisplay`
fixture for direct comparison.

## Why it matters

The inline layout is more horizontally compact and may be easier for students
to follow because the bring-down is visually merged into the next digit rather
than separated into its own row. Evaluating it as a static visual first —
before wiring it into the live `StandardAlgorithmProblem` flow — keeps the
cost of exploration low.

## Discovery notes

- `computeLongDivisionSteps` in `src/lib/division/standardAlgorithm/longDivision.ts`
  is reusable as-is. Each step's `remainder` is what would render as the inline
  prefix on the next step's column; `quotientDigit` is what renders above the
  column. `product` (the subtraction value) is not needed by this layout at all.
- The existing display uses a 1ch-wide slot grid. The inline layout will likely
  need a wider slot per dividend digit (to accommodate the small prefix), or it
  can let the prefix extend leftward into the inter-digit gap. This is a
  rendering decision the maker will face.
- Zero-remainder rendering is decided up front: when a step's remainder is 0,
  the next column shows the dividend digit alone with no leading "0" prefix.
- Fixture-shape precedent: `LongDivisionDisplayFixtures` in
  `src/pages/DesignSystem.tsx` renders three stages (new / in-progress /
  completed) for a single sample problem; the new component can follow the
  same shape so the two layouts sit side-by-side in the design system for
  direct comparison.
- Sample problems that exercise the interesting visual cases: 132 ÷ 3 forces
  a leading "0" in the quotient (because 3 doesn't go into 1), and 612 ÷ 3
  produces a zero-remainder mid-step (6 ÷ 3 = 2 r 0) so the "no prefix on next
  digit" case is visible.
- Out-of-scope for this research: interactive walkthroughs, integration into
  `StandardAlgorithmProblem`, props parity with `LongDivisionDisplay`, and
  `sr-only` text alternatives (A11Y-002's pattern would be revisited if/when
  this ships).
- Exit criterion: when the design system fixtures render the inline layout
  across the cases above, the team can judge whether the layout is worth
  pursuing. A follow-up ticket — feature (if yes) or component removal (if no)
  — closes the loop.

## Related work

- [[RFCTR-001]] — recent refactor that established `buildStepRows` and the
  slot/column model in `longDivisionDisplay.utils.ts`
- [[A11Y-002]] — established the pattern of pairing visual division displays
  with `sr-only` text alternatives
- `src/lib/division/standardAlgorithm/longDivision.ts` — `computeLongDivisionSteps`
  already yields exactly the shape this layout needs (`workingNumber`,
  `quotientDigit`, `product`, `remainder` per step)

## Working

**2026-05-31:** Landed
`src/components/division/standardAlgorithmInline/LongDivisionDisplayInline.tsx`
and wired it into the design system. Reuses `computeLongDivisionSteps` and
`computeRightCols`; no algorithm duplication.

Layout: every dividend column is `2ch` wide and right-aligned. Quotient digits
sit above the bracket line; dividend digits sit inside, with the prior step's
remainder rendered as a small (`text-xs`, `leading-none`) superscript prefix
glued to the top-left of the next digit. The prefix is fully opaque while its
column's quotient is still unsolved ("active") and fades to `opacity-30` once
that column's digit has been solved — a `transition-opacity duration-300`
smooths the change for future animated use. Unsolved step columns render `_`
above the bracket (mirroring `LongDivisionDisplay`); leading "skipped" columns
(e.g. col 0 of `3192 ÷ 7`) render blank.

Iterated visually in the design system through several refinements: switched
prefix from baseline to top-aligned superscript, widened columns from `1.5ch`
→ `2ch`, swapped center alignment for right alignment so the quotient stacks
over the dividend digit's right edge, added the active-prefix fade, and
dropped the leading-`0` placeholder in favor of blank cols + `_` placeholders
matching the existing display.

Final fixture is a single 4-digit problem, `3192 ÷ 7 = 456`, rendered across
four `completedCount` stages (0..3). The example exercises a leading-skipped
column, two non-zero remainder prefixes (3, 4), and three distinct quotient
digits (4, 5, 6). Two earlier candidate fixtures (`132 ÷ 3`, `612 ÷ 3`) were
folded into this one example after they were judged too narrow.

Component is `aria-hidden="true"` and visual-only; no unit tests, no
integration into `StandardAlgorithmProblem`, no `sr-only` text alternative —
all explicitly out-of-scope for this research. Typecheck clean, 271/271 tests
pass. Visual evaluation completed in the browser at
`/multiplication-flash-cards/design-system`.

Outcome to evaluate next: whether the inline carry layout is clearer / more
compact than the existing stacked `LongDivisionDisplay` for grade-school
students. Decision-time follow-up is one of:

- **If yes** → feature ticket for props parity (`steps`, named state shape),
  accessibility (sr-only text alternative per A11Y-002's pattern), and
  integration into `StandardAlgorithmProblem` as an alternate display.
- **If no** → maintenance ticket to remove the component and its design-system
  fixture.
