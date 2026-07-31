// The multi-digit layout core for the numbers model: a fixed field of
// MAX_DIGITS odometer-style columns centered on the origin, with the number
// right-aligned so the ones column never moves as the digit count changes.
// Every column x is a pure function of the place value alone, and all ten
// digits share one normalization scale so relative widths read correctly.
// Pure data + functions — the three.js wiring lives in makeNumberModel.

import type { GlyphProfile } from '../model3d/glyphSampler'

/** The widest value the fixed particle pool renders legibly. */
export const MAX_DIGITS = 3
/** The library bound: values 0..MAX_VALUE, no silent folding. */
export const MAX_VALUE = 10 ** MAX_DIGITS - 1

/** Fold any input into the supported range: floor, then clamp into 0..MAX_VALUE. */
export function clampValue(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(MAX_VALUE, Math.max(0, Math.floor(value)))
}

/** The counting order: 0 → 1 → … → MAX_VALUE → 0. */
export function nextValue(value: number): number {
  const current = clampValue(value)
  return current >= MAX_VALUE ? 0 : current + 1
}

/** Decompose a value into its digits, most significant first, no leading zeros. */
export function digitsOf(value: number): number[] {
  const clamped = clampValue(value)
  const digits: number[] = []
  let rest = clamped
  do {
    digits.unshift(rest % 10)
    rest = Math.floor(rest / 10)
  } while (rest > 0)
  return digits
}

/**
 * The x-center of a place value's column — a function of the place alone,
 * so an unchanged digit never shifts as its neighbors or the digit count
 * change. Place 0 (ones) sits rightmost; the fixed MAX_DIGITS-wide field
 * is centered on the origin.
 */
export function columnX(place: number, advance: number): number {
  return advance * ((MAX_DIGITS - 1) / 2 - place)
}

/** One rendered digit slot: which digit, at which place value, at which column x. */
export interface DigitSlot {
  digit: number
  place: number
  x: number
}

/**
 * Lay a value out in the fixed field: one slot per rendered digit, most
 * significant first, each pinned to its place value's column. The tabular
 * invariant lives here — a slot's x depends on its place alone, never on
 * the value around it or the number of digits shown.
 */
export function slotLayout(value: number, advance: number): DigitSlot[] {
  const digits = digitsOf(value)
  return digits.map((digit, i) => {
    const place = digits.length - 1 - i
    return { digit, place, x: columnX(place, advance) }
  })
}

/**
 * One normalization for all digits, derived from the largest half-extent
 * (in raster pixels) so a "1" renders narrower than an "8" instead of each
 * glyph stretching to fill its own bounding box.
 */
export function sharedNorm(halfExtentsPx: number[], scale: number): number {
  const max = halfExtentsPx.reduce((a, b) => Math.max(a, b), 0)
  return max > 0 ? scale / max : scale
}

/** Column width: the widest rendered glyph padded by the gap factor. */
export function columnAdvance(glyphWidths: number[], gapFactor: number): number {
  return glyphWidths.reduce((a, b) => Math.max(a, b), 0) * gapFactor
}

/** The opaque-pixel bounding-box width of a glyph profile, in raster pixels. */
export function profileWidthPx(profile: GlyphProfile): number {
  const { opaqueX } = profile
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < opaqueX.length; i++) {
    const x = opaqueX[i]
    if (x < min) min = x
    if (x > max) max = x
  }
  return max >= min ? max - min : 0
}

/**
 * The characters the sand display can render: digits, the ':' and '.'
 * separators, the arithmetic operators '×' '+' '−' '÷', the feedback marks
 * '✓' '✗', and space. Local modification — upstream stops at [0-9:.].
 */
const DISPLAY_ALPHABET = /^[0-9:.×+−÷✓✗ ]+$/

/**
 * Split a display string ("14:03:57.123", "7 × 8") into its glyphs, rejecting
 * anything outside the display alphabet so a bad string fails loudly at the
 * API instead of rendering a fallback blob.
 */
export function glyphsOf(text: string): string[] {
  if (!DISPLAY_ALPHABET.test(text)) {
    throw new Error(
      `Sand display strings use only 0-9, ':', '.', '×', '+', '−', '÷', '✓', '✗' and space — got "${text}"`,
    )
  }
  return [...text]
}

/**
 * The world-y slot offset that undoes per-glyph bbox centering and restores
 * a glyph's true typographic height relative to a reference bbox center (the
 * digit row's). Valid because every profile rasterizes against the same
 * font-metric baseline in the same canvas, so canvas-y values are comparable
 * across glyphs. Canvas y grows downward: a baseline glyph like '.' has a
 * center below the reference (glyphCy > refCy), yielding a negative
 * (downward) world offset.
 */
export function baselineOffsetY(refCy: number, glyphCy: number, norm: number): number {
  return (refCy - glyphCy) * norm
}

/** One glyph of a laid-out display string, pinned to its column x. */
export interface StringSlot {
  glyph: string
  x: number
}

/**
 * Lay a glyph string out in fixed columns, each as wide as its glyph type's
 * advance (colons narrower than digits), with the composed whole centered on
 * the origin. Slot x depends only on the format — same-shaped strings share
 * every column, so a per-second clock never jiggles.
 */
export function stringSlotLayout(glyphs: string[], advanceOf: (glyph: string) => number): StringSlot[] {
  const advances = glyphs.map(advanceOf)
  const total = advances.reduce((a, b) => a + b, 0)
  let left = -total / 2
  return glyphs.map((glyph, i) => {
    const x = left + advances[i] / 2
    left += advances[i]
    return { glyph, x }
  })
}

/**
 * Split `total` grains across slots proportionally to `weights` (largest-
 * remainder rounding, ties to the lower index), so light glyphs like ':'
 * take fewer grains and digit density holds. Deterministic: equal inputs
 * yield equal splits, which is what lets unchanged slots reuse targets.
 */
export function splitByWeight(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const exact = weights.map((w) => (total * w) / sum)
  const counts = exact.map(Math.floor)
  let remaining = total - counts.reduce((a, b) => a + b, 0)
  const order = exact.map((v, i) => ({ frac: v - Math.floor(v), i })).sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (let k = 0; remaining > 0; k++, remaining--) counts[order[k].i]++
  return counts
}

/**
 * The display's uniform grain density — the whole pool spread over the
 * format's capacity areas (each slot counted at the heaviest glyph its type
 * can show), in grains per raster pixel of ink. Sizing regions for the
 * worst case is what lets a digit change vary a slot's *active* grains
 * without ever moving the region boundaries.
 */
export function grainDensity(total: number, capacityAreas: number[]): number {
  const sum = capacityAreas.reduce((a, b) => a + b, 0)
  return sum > 0 ? total / sum : 0
}

/**
 * How many of a slot's grains carry the current glyph at the display
 * density: proportional to the glyph's ink area, at least one so a glyph
 * never vanishes, never more than the slot's region.
 */
export function activeCount(density: number, area: number, region: number): number {
  return Math.min(region, Math.max(1, Math.round(density * area)))
}

/**
 * Park a slot's surplus grains — indices [start+active, start+count) — by
 * duplicating the active prefix's targets cyclically. A parked grain sits
 * exactly on an active grain's ink position, so it adds no visible dot
 * (equal-depth overdraw) yet still morphs with the cloud and still yields a
 * believable on-glyph position when the wind samples it. No-op when the
 * region is fully active or has no active grains to copy.
 */
export function parkSurplus(out: Float32Array, start: number, active: number, count: number): void {
  if (active <= 0 || active >= count) return
  for (let i = active; i < count; i++) {
    const src = (start + (i % active)) * 3
    const dst = (start + i) * 3
    out[dst + 0] = out[src + 0]
    out[dst + 1] = out[src + 1]
    out[dst + 2] = out[src + 2]
  }
}

/**
 * `splitByWeight` with zero-weight slots guaranteed exactly zero grains —
 * a space owns no ink and must own no grains, and largest-remainder rounding
 * over a zero weight could otherwise hand it a remainder grain. Positive
 * weights delegate to `splitByWeight` unchanged.
 */
export function splitByWeightSparse(total: number, weights: number[]): number[] {
  const counts = weights.map(() => 0)
  const positiveIndices = weights.flatMap((w, i) => (w > 0 ? [i] : []))
  if (positiveIndices.length === 0) return counts
  const split = splitByWeight(
    total,
    positiveIndices.map((i) => weights[i]),
  )
  positiveIndices.forEach((slot, k) => {
    counts[slot] = split[k]
  })
  return counts
}

/** Split `total` grains across `parts` slots, remainder spread one-per-slot. */
export function splitEvenly(total: number, parts: number): number[] {
  const base = Math.floor(total / parts)
  const remainder = total - base * parts
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0))
}

/**
 * Sample `count` grains of one digit slot into `out` starting at particle
 * index `start`, using the field's shared `norm` (the profile's own per-glyph
 * norm is deliberately ignored) and the slot's column `offsetX` / vertical
 * `offsetY` (0 for row-centered glyphs; baselineOffsetY for '.'). A null
 * profile (raster unavailable) falls back to a unit disc at the offsets.
 * `rng` is injectable so tests can pin the draws.
 */
export function sampleSlot(
  profile: GlyphProfile | null,
  norm: number,
  offsetX: number,
  offsetY: number,
  out: Float32Array,
  start: number,
  count: number,
  rng: () => number = Math.random,
): void {
  if (!profile) {
    for (let i = start; i < start + count; i++) {
      const angle = rng() * Math.PI * 2
      const r = Math.sqrt(rng())
      out[i * 3 + 0] = offsetX + Math.cos(angle) * r
      out[i * 3 + 1] = offsetY + Math.sin(angle) * r
      out[i * 3 + 2] = 0
    }
    return
  }
  const { opaqueX, opaqueY, cx, cy } = profile
  const len = opaqueX.length
  for (let i = start; i < start + count; i++) {
    const idx = (rng() * len) | 0
    out[i * 3 + 0] = offsetX + (opaqueX[idx] - cx) * norm
    out[i * 3 + 1] = offsetY - (opaqueY[idx] - cy) * norm
    out[i * 3 + 2] = 0
  }
}
