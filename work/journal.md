# Work Journal

## Next ticket numbers

- RSRCH: 1
- DSGN: 1
- ARCH: 1
- FEAT: 1
- IMPRV: 1
- MAINT: 2
- A11Y: 3
- RFCTR: 1
- BUG: 9

## Log

- 2026-05-30:17:11:41 — MAINT-001 — done: 8 commits, latest across all deps incl. ts 6 / vite 8 / eslint 10 (fd3c06c)
- 2026-05-30:17:05:02 — MAINT-001 — started
- 2026-05-30:17:04:44 — BUG-008 — done: replace operation-symbol descriptions with generic digit-count labels (175cf75)
- 2026-05-30:17:03:44 — BUG-008 — started
- 2026-05-30:17:02:57 — BUG-007 — done: read BASE_URL in Go home click handler (3d2d7fb)
- 2026-05-30:15:34:55 — BUG-007 — started
- 2026-05-30:15:34:41 — BUG-006 — done: add componentDidCatch logging to ErrorBoundary (65740fe)
- 2026-05-30:15:30:18 — BUG-006 — started
- 2026-05-30:15:28:12 — MAINT-001 — defined: upgrade all npm dependencies to
  latest, including majors
- 2026-03-29:09:07:11 — A11Y-002 — done: add sr-only text alternatives to
  division displays (PR #8, f837f0d)
- 2026-03-29:09:06:00 — A11Y-002 — defined: division displays hidden from screen
  readers without text alternative
- 2026-03-29:09:06:00 — A11Y-001 — defined: SecondaryText fails minimum contrast
  ratio for small text
- 2026-03-29:09:01:59 — A11Y-001 — done: bump SecondaryText to text-slate-600 in
  light mode (PR #7, 12beacf)
- 2026-03-29:08:46:13 — BUG-005 — done: validate digits-only before parseInt in
  all answer inputs (PR #6, f3d19fe)
- 2026-03-29:08:27:37 — BUG-004 — done: use ref for getNextQuestion to avoid
  stale closure (PR #5, f20173f)
- 2026-03-29:08:16:23 — BUG-001 — done: decouple factor order from question
  selection (PR #2, 9d18cf4)
- 2026-03-29:08:13:41 — BUG-002 — done: create drill timer interval once instead
  of recreating every tick (PR #3, e902146)
- 2026-03-29:08:12:44 — BUG-003 — done: clear pending timeouts on unmount in
  quiz animation hooks (PR #4, cef47a4)
- 2026-03-29:08:02:00 — BUG-008 — defined: level picker tooltip descriptions
  don't match actual ranges
- 2026-03-29:08:02:00 — BUG-007 — defined: ErrorBoundary "Go home" navigates to
  wrong base path
- 2026-03-29:08:02:00 — BUG-006 — defined: ErrorBoundary catches errors but
  never logs them
- 2026-03-29:08:02:00 — BUG-005 — defined: parseInt silently truncates decimal
  and partial-numeric input
- 2026-03-29:08:02:00 — BUG-004 — defined: next question selection uses stale
  game state
- 2026-03-29:08:02:00 — BUG-003 — defined: uncleaned setTimeout in
  useQuizAnimation can fire after unmount
- 2026-03-29:08:02:00 — BUG-002 — defined: drill timer recreates interval every
  second, causing timing drift
- 2026-03-29:08:02:00 — BUG-001 — defined: biased factor order in multiplication
  question presentation
