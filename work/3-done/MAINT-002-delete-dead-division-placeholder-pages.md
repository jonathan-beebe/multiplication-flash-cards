---
id: MAINT-002
type: maintenance
status: resolved
created: 2026-07-05
---

# MAINT-002: delete dead division placeholder pages

## Problem

`src/pages/division/StandardAlgorithmPlaceholder.tsx` and
`src/pages/division/PartialQuotientsPlaceholder.tsx` are imported nowhere in
the codebase (verified by grep across `src/`). They were superseded when the
real practice pages (`StandardAlgorithmPractice.tsx`,
`PartialQuotientsPractice.tsx`) landed, but were never removed.

## Goal

`src/pages/division/` contains only pages the app actually routes to.

## Outcome

The two placeholder files are gone; typecheck, lint, and the full test suite
pass; no route or import references them.

## Why it matters

Dead pages mislead anyone (human or agent) surveying `src/pages/division/` into
thinking these are live routes, and they inflate the surface that refactors
like RFCTR-003 must reason about.

## Discovery notes

Straight deletion — no consumers exist. If `git log` shows they were kept
deliberately (e.g. as templates), surface that before deleting; nothing in the
current tree suggests it.

## Related work

- [[RFCTR-003]] — division alignment refactor that would otherwise have to
  account for these files

## Working

**2026-07-05:** Re-validated: grep confirms no imports outside the files
themselves; `git log --follow` shows they were scaffolding from the original
division menu (61e97a1) superseded by the real practice pages — no deliberate
retention. Deleted both files. Typecheck, lint, and full suite (271/271) green.
No new test written: the change removes unreferenced files, so the existing
suite passing is the protection.
