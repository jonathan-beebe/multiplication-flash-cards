---
id: ARCH-002
type: architecture
status: resolved
created: 2026-07-05
---

# ARCH-002: document system architecture with diagrams

## Problem

No document records how this system is organized. `docs/` holds only
screenshots, and is not code docs but instead meant for display in the 
readme; neither `README.md` nor anything else states the layer rules the
code actually follows (pure core in `src/lib`, view components in
`src/components`, pages, composition root in `src/main.tsx`/`AppRoutes.tsx`),
the route map, or where a new module belongs. The drift found in the 2026-07-05
architecture audit — multiplication diverging from the operation pattern,
division modes reaching into `areaMode/` internals, a stray
`/division-practice` route family — accumulated precisely because there is no
stated canon to check changes against.

## Goal

The architecture is written down where maintainers and agents look, so
alignment is checkable instead of tribal.

## Outcome

An architecture document exists in the repo containing diagrams of the system
shape, the layer structure with its dependency rules, and the route map; it is
linked from README.md or CLAUDE.md; a reader can determine where a new module
or route belongs without reverse-engineering the tree.

## Why it matters

Every misalignment ticket filed from this audit (ARCH-001, RFCTR-003, FEAT-001)
is a case of code drifting with no canon to drift from. A small written
architecture makes future review mechanical and gives coding agents a source of
truth.

## Discovery notes

- Use Mermaid, per the `diagramming` skill: a flowchart for the layer diagram
  (core → adapters/components → pages → composition root, dependencies pointing
  inward only) and a tree/flowchart for the route map.
- Keep it small — one doc, a few diagrams. Simplicity first: this is a map, not
  a specification. Note the update trigger (new feature folder or route family)
  in the doc itself.
- Write it to reflect the *target* structure agreed in [[ARCH-001]] and
  [[RFCTR-003]] if those land first; otherwise document today's structure and
  mark the known exceptions.

## Related work

- 2026-07-05 architecture audit (this ticket's source)
- [[ARCH-001]], [[RFCTR-003]], [[FEAT-001]] — the drift this canon would have
  caught

## Working

**2026-07-05:** Landed `architecture.md` at the repo root (per the diagramming
skill, a system-level doc lives at the top of the tree it captures; `docs/` is
README imagery per the refined problem statement). Written against the
post-ARCH-001/RFCTR-003/FEAT-001 structure, so it documents the target shape
with no "known exceptions" markers needed.

Contents: three Mermaid diagrams, each answering one question — system shape
(one static deployable: GitHub Pages → SPA + service worker), layer diagram
(composition root → pages → components → coordination hooks → pure core,
inward-only), and the route map (operation and division route families plus
legacy redirects, marked "never link to them"). Between diagrams: the four
binding layer rules, the two config-driven feature patterns with their
deletability test, and a "where new code belongs" decision list. The
update-in-the-same-change trigger is stated in the doc's own intro.

All three diagrams verified with the mermaid parser (3/3 parse OK). Linked
from README.md (new Development section) and CLAUDE.md (new Architecture
section instructing structural changes be checked against the canon). No
runtime surface — CI (format/typecheck/lint/tests) green.
