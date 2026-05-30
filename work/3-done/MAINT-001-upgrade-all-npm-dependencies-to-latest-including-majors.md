---
id: MAINT-001
type: maintenance
status: resolved
created: 2026-05-30
resolved: 2026-05-30
---

# MAINT-001: upgrade all npm dependencies to latest, including majors

## Problem

20 npm packages in this project are behind latest. Within-semver bumps account
for ~15 (e.g. react 19.2.4→19.2.6, eslint 9.39.2→9.39.4, vite 7.3.1→7.3.3); the
rest are major-version stragglers requiring package.json edits and potentially
code changes: typescript 5.9→6.0, eslint 9→10, @eslint/js 9→10, vite 7→8,
@vitejs/plugin-react 5→6, jsdom 28→29, @types/node 24→25, globals 16→17,
eslint-plugin-react-refresh 0.4→0.5. Source of truth: `npm outdated` (see
Discovery notes).

## Outcome

- `npm outdated` reports no out-of-date direct dependencies (Current = Wanted =
  Latest for all packages listed in package.json).
- `npm run ci` (lint + typecheck + build + test) passes on the upgraded
  lockfile.
- A manual smoke of `npm run dev` and `npm run build && npm run preview` clicks
  through addition, subtraction, multiplication, and division flows without
  runtime errors, and the built PWA still installs/registers a service worker.

## Why it matters

This is the first dependency-upgrade ticket in the project's history (no prior
bump tickets in `work/3-done/` or git log). Doing it now establishes a baseline
so future upgrades stay small and incremental. Several majors (eslint 10,
typescript 6, vite 8) introduce breaking changes that are easier to absorb
one-by-one in a fresh codebase than after months of stacking; the longer they
sit, the more code rests on the older APIs.

## Discovery notes

- `npm outdated` output (captured 2026-05-30):
  - Within-semver (`npm update` handles): @eslint/js, @tailwindcss/vite,
    @types/node (within 24.x), @types/react, eslint, eslint-plugin-react-hooks,
    prettier, react, react-dom, react-router-dom, tailwindcss,
    typescript-eslint, vite-plugin-pwa, vitest, @vitejs/plugin-react (within
    5.x).
  - Major bumps requiring package.json edit:
    - typescript 5.9.3 → 6.0.3
    - eslint 9.39.2 → 10.4.1 (with @eslint/js 9 → 10)
    - vite 7.3.1 → 8.0.14
    - @vitejs/plugin-react 5.1.4 → 6.0.2
    - jsdom 28.1.0 → 29.1.1
    - @types/node 24 → 25.9.1
    - globals 16.5.0 → 17.6.0
    - eslint-plugin-react-refresh 0.4.26 → 0.5.2
- Likely breaking-change hotspots to read changelogs for first: typescript 6
  (new strictness defaults, possible deprecations), eslint 10 (config schema /
  rule renames), vite 8 (plugin API, build defaults), @vitejs/plugin-react 6
  (often tracks vite majors).
- Lockfile is npm (`package-lock.json`); no pnpm/yarn.

## Recommendation

1. Bump within-semver first: `npm update`, run `npm run ci`, commit. Establishes
   a clean baseline so any later test failures are attributable to a specific
   major.
2. Take majors one at a time, in this suggested order (least → most blast
   radius): @types/node, globals, jsdom, eslint-plugin-react-refresh,
   @vitejs/plugin-react, vite, eslint + @eslint/js together, typescript. After
   each: run `npm run ci`, fix what breaks, commit with the package name in the
   message (e.g. `chore(deps): vite 7 → 8`). Skip to the next on green.
3. After all bumps, do the manual smoke (dev + built PWA, walk every operation)
   before marking done.
4. If a major upgrade reveals non-trivial code churn (more than a few lines),
   pause and surface to the human — that major may warrant its own ticket rather
   than riding along here.

## Working

Executed in 8 commits:

1. `9b889af` — `npm update` within-semver bumps (baseline).
2. `0207ee1` — `@types/node` 24 → 25.
3. `ac7472b` — `globals` 16 → 17.
4. `5eceae9` — `jsdom` 28 → 29.
5. `dd380b9` — `eslint-plugin-react-refresh` 0.4 → 0.5.
6. `dde633b` — `vite` 7 → 8 + `@vitejs/plugin-react` 5 → 6 (bumped together; plugin-react@6 declares vite@^8 as a peer). Strict `tsc -b` in the production build caught an implicit-any in the BUG-006 test that the CI `typecheck` script missed; typed the callback parameter to clear it.
7. `5f5e771` — `eslint` 9 → 10 + `@eslint/js` 9 → 10. New `no-useless-assignment` rule flagged a discarded reassignment in the `gameEngine` immutability test; removed the unused reassignment and `before` alias.
8. `fd3c06c` — `typescript` 5 → 6.

Verification: `npm run ci` green after each commit. `npm outdated` exits clean. `npm run build` produces the PWA with `sw.js`. `npm run preview` serves the app at the correct base path and the SW registers (HTTP 200, 1413 bytes).

**Smoke gap to surface:** the headless integration tests (`src/integration/app-journeys.test.tsx`, 12 tests across addition/subtraction/multiplication/division) all pass and the built preview serves correctly, but a live browser clickthrough wasn't performed. If you want that confirmed before merging, run `npm run preview` and walk each operation.

**Follow-up worth scoping:** the CI `typecheck` script (`tsc --noEmit` from the root tsconfig) does not catch what `npm run build` (`tsc -b`) catches in test files. Worth a small ticket to align them so future type errors don't slip past CI.
