---
id: FEAT-001
type: feature
status: resolved
created: 2026-07-05
---

# FEAT-001: multiplication difficulty levels

## Problem

Multiplication offers no difficulty progression. Its routes have no `:level`
segment (`AppRoutes.tsx:89-98`) and `multiplicationGenerator` draws from one
fixed factor range, while addition and subtraction each offer four levels
(ones → thousands) with a level-aware menu, per-level ranges
(`src/lib/engine/operationLevels.ts`), and per-level practice/hard-mode/drill
routes.

## Goal

Multiplication offers the same difficulty progression experience as the other
operations.

## Outcome

From the multiplication menu a student can choose a difficulty level, and
multiplication practice, hard mode, and drills draw problems from that level's
range. Level selection looks and behaves the same across addition,
subtraction, and multiplication.

## Why it matters

Students who master the basic tables have nowhere harder to go, and the
operation menus behave inconsistently — two operations ask for a level, one
doesn't — which is confusing for grade-school users and their parents.

## Discovery notes

- The level ranges themselves are a product decision. Advisory starting point:
  mirror the `OPERATION_LEVELS` labels (Easy/Med/Hard/Master) with
  multiplication-appropriate ranges, e.g. single-digit tables → 2-digit ×
  1-digit → larger — the maker should sanity-check against grade-school
  curriculum expectations.
- Existing multiplication URLs (`/multiplication/practice/multiple-choice`,
  drills, etc.) are live PWA bookmarks; addition already models the redirect
  pattern (`/addition` → `/addition/ones`).
- This is best done with or after [[ARCH-001]] so levels are added once to the
  unified operation shape rather than triplicating the existing addition code
  a fourth time.

## Related work

- [[ARCH-001]] — unify per-operation quiz feature (this feature slots into
  that shape)
- [[BUG-008]] — established that level descriptions must match actual ranges

## Working

**2026-07-05:** Landed on top of ARCH-001's unified operation shape.

Tests first: updated the multiplication rows of the operation-screens
characterization suite to the level-scoped expectations, and added
`src/integration/multiplication-levels.test.tsx` (menu redirect, four levels,
level switching, level-scoped back navigation, legacy-URL redirects) plus an
asymmetric-range unit test for the generator factory — all red before
implementation, green after.

Level ranges chosen (`MULTIPLICATION_LEVEL_RANGES`), constrained by BUG-008's
rule that the shared digit-count tooltips must not overstate:

| Level | Range | Tooltip check |
| ----- | ----- | ------------- |
| ones (Easy) | 3–9 × 3–9 | "Single digits" ✓ |
| tens (Med) | 3–99 × 3–9 | "Up to two digits" ✓ |
| hundreds (Hard) | 3–999 × 3–9 | "Up to three digits" ✓ |
| thousands (Master) | 3–9999 × 3–12 | "Up to four digits" ✓ |

Factors start at 3 (matching the old generator's floor). **Product-call note
for review:** the old single mode was tables 3–12; ones is now 3–9, so the
×10–×12 facts live in tens+ (as the large factor) and both-large facts like
11×12 in thousands. Ranges are one constant table if this needs tuning.

Implementation: the adaptive-weighting generator became
`createMultiplicationGenerator(aMin, aMax, bMin, bMax)` (pool precomputed per
instance, commutative dedup, adjacent-answer distractors generalized to the
range bounds); the singleton export is gone. Rather than mint a third clone of
the Addition/Subtraction menu pages, extracted the shared `OperationMenu` into
`components/operations/` driven by `OperationConfig` (which gained `color` and
lost `hasLevels` — every operation now has levels), and deleted all three menu
pages. Multiplication routes mirror addition's (`/multiplication` →
`/multiplication/ones`, `:level`-scoped practice/hard-mode/drills) with
redirect routes preserving the five legacy pre-level URLs. Three multiplication
journeys in app-journeys were updated to the new back-to-menu navigation —
deliberate spec change, matching the addition/subtraction journeys.

289/289 tests green; typecheck, lint, format, and production PWA build clean.
