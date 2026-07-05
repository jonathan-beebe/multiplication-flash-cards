---
id: FEAT-001
type: feature
status: open
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
