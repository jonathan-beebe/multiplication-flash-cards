# Vendored: sand-effect number display

WebGL sand-particle number display, vendored from the local playground repo.

- **Upstream:** `~/source/personal/sand-effect` at commit `2611145`
- **Vendored:** 2026-07-30, subtree `src/sand/` (number module closure only —
  `number/`, `model3d/{sandModel,glyphSampler,createSandRenderer,windField}`,
  `glyphRaster`, `mathUtils`, `motionMode`, with colocated tests)
- **Runtime dependency:** `three`

## Boundary

`lib/sand` is a vendored library: a pure functional core (`number/*` layout,
transitions, dismissal kinematics) plus its own imperative shell
(`makeGlyphSlabModel`, `createSandRenderer` — three.js/DOM adapters). It never
imports from `components/` or `pages/`. Only `src/components/sand/` may import
from this folder.

## Local modifications

Diff against the upstream commit before re-syncing. Changes from upstream:

- Prettier reformat to this repo's style (cosmetic).
- `number/digitField.ts` — display alphabet extended from `[0-9:.]` to include
  `× + − ÷` and space; added `splitByWeightSparse` so zero-weight slots (spaces)
  receive exactly zero grains.
- `number/makeDigitStringModel.ts` — operators join the separator path (own
  narrow column, bbox-centered); space renders as a half-digit-width gap with no
  grains.
- `number/digitField.test.ts` — coverage for the extended alphabet and
  `splitByWeightSparse`.
