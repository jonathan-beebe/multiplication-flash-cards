// The string display configurator: a formatted digit string — digits plus
// ':' '.' separators, arithmetic operators and spaces ("14:03:57.123",
// "7 × 8") — as a sandy point cloud.
// The library-level contract is the string; deriving a time or score from
// data and any zero-padding stay caller-side. Slots sit in fixed per-format
// columns (symbols narrower than digits) at the alphabet's one shared
// scale, grain regions are sized per glyph type with the active grains per
// slot proportional to the shown glyph's ink area (uniform density, surplus
// parked on-glyph), the '.' is anchored down to the digits' baseline
// (bbox centering would float it to mid-column height), and a slot whose
// glyph is unchanged — every colon, tick to tick — keeps its exact grain
// targets and stands steady while neighbors morph.

import type { SandModel } from '../model3d/sandModel'
import type { DismissOptions } from './makeGlyphSlabModel'
import {
  activeCount,
  baselineOffsetY,
  columnAdvance,
  glyphsOf,
  grainDensity,
  splitByWeightSparse,
  stringSlotLayout,
} from './digitField'
import type { GradientStop } from './gradientPalette'
import { prepareGlyphMetrics } from './glyphMetrics'
import { GLYPH_SCALE, SLAB_PARTICLE_COUNT, makeGlyphSlabModel, type SlotPlan } from './makeGlyphSlabModel'
import type { ValueTransitionFactory } from './valueTransition'

// Column width as a multiple of the glyph type's width. Matches the number
// model's inter-digit gap.
const COLUMN_GAP = 1.15

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
// Non-digit glyphs each get their own narrow column: the ':' '.' separators
// plus the arithmetic operators (local modification — upstream has only the
// separators).
const SYMBOLS = [':', '.', '×', '+', '−', '÷']
const DOT = '.'
// Space is layout-only: it never rasterizes and owns zero grains.
const SPACE = ' '

export interface DigitStringModel extends SandModel {
  /** Aim the cloud at a display string (0-9, ':', '.', '×', '+', '−', '÷', space). Throws on other characters. A call mid-morph redirects in flight. */
  setText(text: string): void
  /** The string the cloud is showing or morphing toward. */
  getText(): string
  /** Complete any in-flight morph — or dismissal — instantly, for static (reduced-motion) frames. */
  snap(): void
  /** Blow all the sand off downwind; `onComplete` fires once it is completely gone (FEAT-024). One-shot — reset by swapping in a fresh model. `setText` keeps landing mid-flight, so the text can keep ticking as it departs (IMPRV-016). */
  dismiss(options?: DismissOptions): void
}

/**
 * A 3D sand display of a digit string, driven by the caller via `setText`.
 * An optional `gradient` (ordered stops, bottom → top) colors the grains by
 * vertical position; omitted, the warm-sand default applies. An optional
 * `transition` chooses the value-change style (RFCTR-007); omitted, the
 * classic damped morph applies.
 */
export function makeDigitStringModel(
  initialText: string,
  gradient?: readonly GradientStop[],
  transition?: ValueTransitionFactory,
): DigitStringModel {
  const metrics = prepareGlyphMetrics([...DIGITS, ...SYMBOLS], GLYPH_SCALE)
  const digitAdvance = columnAdvance(DIGITS.map(metrics.widthOf), COLUMN_GAP)
  // Each symbol gets its own narrow column, as wide as its glyph alone.
  const symbolAdvance = new Map(SYMBOLS.map((s) => [s, columnAdvance([metrics.widthOf(s)], COLUMN_GAP)]))
  // A half-digit column reads like a normal word space.
  const spaceAdvance = digitAdvance / 2
  const advanceOf = (glyph: string) => (glyph === SPACE ? spaceAdvance : (symbolAdvance.get(glyph) ?? digitAdvance))

  // Region capacities are per glyph *type*, not per glyph — a digit slot is
  // sized for the heaviest digit it can show — so a value change never
  // shifts the slot regions and unchanged slots stay reusable. Within a
  // region, only density × ink-area grains carry the current glyph; the
  // surplus parks on it (IMPRV-012).
  const maxDigitArea = DIGITS.reduce((max, d) => Math.max(max, metrics.areaOf(d)), 0)
  const capacityAreaOf = (glyph: string) =>
    glyph === SPACE ? 0 : symbolAdvance.has(glyph) ? metrics.areaOf(glyph) : maxDigitArea

  // The '.' sits on the digits' baseline: anchor it against the digit row's
  // mean bbox center instead of its own. Digits and ':' keep today's
  // row-centered placement (offset 0).
  const digitCys = DIGITS.map(metrics.profileOf)
    .filter((p) => p !== null)
    .map((p) => p.cy)
  const digitRowCy = digitCys.length > 0 ? digitCys.reduce((a, b) => a + b, 0) / digitCys.length : 0
  const dotProfile = metrics.profileOf(DOT)
  const dotOffsetY = dotProfile ? baselineOffsetY(digitRowCy, dotProfile.cy, metrics.norm) : 0
  const offsetYOf = (glyph: string) => (glyph === DOT ? dotOffsetY : 0)

  function planFor(text: string): SlotPlan[] {
    const glyphs = glyphsOf(text)
    const layout = stringSlotLayout(glyphs, advanceOf)
    const capacities = glyphs.map(capacityAreaOf)
    const counts = splitByWeightSparse(SLAB_PARTICLE_COUNT, capacities)
    // Density is per format (the pool over this format's capacity): constant
    // tick to tick while the format holds, which is all a display shows.
    const density = grainDensity(SLAB_PARTICLE_COUNT, capacities)
    return layout.map((slot, i) => ({
      glyph: slot.glyph,
      x: slot.x,
      y: offsetYOf(slot.glyph),
      count: counts[i],
      active: slot.glyph === SPACE ? 0 : activeCount(density, metrics.areaOf(slot.glyph), counts[i]),
    }))
  }

  let text = initialText
  const slab = makeGlyphSlabModel(metrics, planFor(initialText), gradient, transition)

  return {
    ...slab,
    setText(next: string) {
      if (next === text) return
      const plan = planFor(next)
      text = next
      slab.setPlan(plan)
    },
    getText() {
      return text
    },
    getAccessibleText() {
      return text
    },
  }
}
