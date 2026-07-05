---
id: MAINT-003
type: maintenance
status: open
created: 2026-07-05
---

# MAINT-003: integration coverage for standard-algorithm and partial-quotients journeys

## Problem

The integration suite (`src/integration/app-journeys.test.tsx`) covers the
area-model division journeys but contains no journey for
`/division/standard-algorithm` or `/division/partial-quotients`. The
partial-quotients components (`PartialQuotientsDisplay.tsx`,
`PartialQuotientsProblem.tsx`) have no tests at any level. Two primary
user-facing division flows are unprotected against regression, which violates
the project principle "test what matters — end-to-end flows and core logic."

## Goal

Every division mode's primary user journey is protected by the integration
suite.

## Outcome

For each of the two modes there is an integration journey that navigates from
Home → Division → the mode, works through at least one problem interaction,
and observes the app's feedback; the full suite passes.

## Why it matters

These flows are core user value. BUG-009 (a shake-timer leak in
`StandardAlgorithmProblem`) shipped in exactly this untested surface, and one
of its sibling sites (`PartialQuotientsProblem.tsx`, flagged in RFCTR-002) is
still unfixed and untested.

## Discovery notes

- Follow the shape of the existing "Division practice flow" describe block
  (`app-journeys.test.tsx:239-306`) — render `AppRoutes` in a `MemoryRouter`
  and drive with `fireEvent`.
- Problem generation is random and the suite does not seed `Math.random` (it
  only fakes timers, `app-journeys.test.tsx:50`); the existing quiz journeys
  cope by asserting structure/roles rather than specific numbers. Either follow
  that style or read the rendered problem from the DOM and compute the expected
  answer from it.
- If RFCTR-003 lands first, write the journeys against the new route family.

## Related work

- [[BUG-009]] — regression that shipped in this untested surface
- [[RFCTR-002]] — flags the still-unfixed timer site in
  `PartialQuotientsProblem.tsx`
- [[RFCTR-003]] — may change the routes these journeys assert
