// The numbers configurator: a value 0-999 as a sandy point cloud, the first
// model whose transition is driven by data (`setValue`) instead of pointer
// state. Digits sit in the digitField's fixed odometer columns at one shared
// scale; the glyph slab shell owns sampling, morphing, and wind. The particle
// pool is fixed: multi-digit values spread the same grains over more glyphs.

import type { SandModel } from '../model3d/sandModel'
import type { DismissOptions } from './makeGlyphSlabModel'
import { MAX_DIGITS, activeCount, clampValue, columnAdvance, grainDensity, slotLayout, splitEvenly } from './digitField'
import type { GradientStop } from './gradientPalette'
import { prepareGlyphMetrics } from './glyphMetrics'
import { GLYPH_SCALE, SLAB_PARTICLE_COUNT, makeGlyphSlabModel, type SlotPlan } from './makeGlyphSlabModel'
import type { ValueTransitionFactory } from './valueTransition'

// Column width as a multiple of the widest digit, leaving an inter-digit gap.
// At GLYPH_SCALE 1.0 the full 3-digit field stays inside the default camera
// frame at the demo stage's 16:10 aspect.
const COLUMN_GAP = 1.15

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export interface NumberModel extends SandModel {
  /** Aim the cloud at a value; inputs floor and clamp into 0-999 (never a silent mod). A call mid-morph redirects in flight. */
  setValue(value: number): void
  /** The value the cloud is showing or morphing toward. */
  getValue(): number
  /** Complete any in-flight morph — or dismissal — instantly, for static (reduced-motion) frames. */
  snap(): void
  /** Blow all the sand off downwind; `onComplete` fires once it is completely gone (FEAT-024). One-shot — reset by swapping in a fresh model. `setValue` keeps landing mid-flight, so the value can keep counting as it departs (IMPRV-016). */
  dismiss(options?: DismissOptions): void
}

/**
 * A 3D sand number 0-999, counting under the caller's control via `setValue`.
 * An optional `gradient` (ordered stops, bottom → top) colors the grains by
 * vertical position; omitted, the warm-sand default applies. An optional
 * `transition` chooses the value-change style (RFCTR-007); omitted, the
 * classic damped morph applies.
 */
export function makeNumberModel(
  initialValue = 0,
  gradient?: readonly GradientStop[],
  transition?: ValueTransitionFactory,
): NumberModel {
  const metrics = prepareGlyphMetrics(DIGITS, GLYPH_SCALE)
  const advance = columnAdvance(DIGITS.map(metrics.widthOf), COLUMN_GAP)

  // One density for every value the counter can show, anchored at the
  // worst-case frame (MAX_DIGITS of the heaviest digit), so grains-per-ink
  // stays constant across ALL ticks — including 9→10, where the old even
  // split made a lone digit MAX_DIGITS× denser than each of three. A slot's
  // surplus grains park on the glyph (see SlotPlan.active).
  const maxDigitArea = DIGITS.reduce((max, d) => Math.max(max, metrics.areaOf(d)), 0)
  const density = grainDensity(SLAB_PARTICLE_COUNT, Array(MAX_DIGITS).fill(maxDigitArea))

  function planFor(value: number): SlotPlan[] {
    const layout = slotLayout(value, advance)
    const counts = splitEvenly(SLAB_PARTICLE_COUNT, layout.length)
    return layout.map((slot, i) => {
      const glyph = String(slot.digit)
      return { glyph, x: slot.x, count: counts[i], active: activeCount(density, metrics.areaOf(glyph), counts[i]) }
    })
  }

  let value = clampValue(initialValue)
  const slab = makeGlyphSlabModel(metrics, planFor(value), gradient, transition)

  return {
    ...slab,
    setValue(next: number) {
      const clamped = clampValue(next)
      if (clamped === value) return
      value = clamped
      slab.setPlan(planFor(clamped))
    },
    getValue() {
      return value
    },
    getAccessibleText() {
      return String(value)
    },
  }
}
