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
  `× + − ÷`, the feedback marks `✓ ✗`, and space; added `splitByWeightSparse` so
  zero-weight slots (spaces) receive exactly zero grains.
- `number/makeDigitStringModel.ts` — operators and feedback marks join the
  separator path (own narrow column, bbox-centered); space renders as a
  half-digit-width gap with no grains. `setGradient` exposed on the model.
- `number/makeGlyphSlabModel.ts` — added `setGradient` (live gradient swap so a
  color change can ride an in-flight morph); grain jitter/offset arrays are
  always allocated to support switching between flat and gradient coloring.
  Added `getBounds` (target-sheet extent in world units — stable mid-morph and
  mid-dismissal), the seam behind the renderer's `fitToView`.
- `model3d/sandModel.ts` — optional `getBounds` on the `SandModel` contract.
- `model3d/createSandRenderer.ts` — added `fitToView` option: a contain-fit
  display scale from the model's `getBounds` and the stage aspect, re-evaluated
  per frame (animated frames glide toward it, static frames snap), so the value
  fills the stage across resizes and value-width changes.
- `number/digitField.test.ts` — coverage for the extended alphabet and
  `splitByWeightSparse`.
- `number/makeGlyphSlabModel.test.ts` — coverage for `setGradient` and
  `getBounds`.
- `model3d/createSandRenderer.test.ts` — coverage for the `fitViewScale` math.
