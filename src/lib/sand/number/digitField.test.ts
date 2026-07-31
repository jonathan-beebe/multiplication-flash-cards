import { describe, expect, it } from 'vitest'
import type { GlyphProfile } from '../model3d/glyphSampler'
import {
  MAX_DIGITS,
  MAX_VALUE,
  activeCount,
  baselineOffsetY,
  clampValue,
  grainDensity,
  parkSurplus,
  columnAdvance,
  columnX,
  digitsOf,
  glyphsOf,
  nextValue,
  profileWidthPx,
  sampleSlot,
  sharedNorm,
  slotLayout,
  splitByWeight,
  splitByWeightSparse,
  splitEvenly,
  stringSlotLayout,
} from './digitField'

describe('clampValue', () => {
  it('floors fractional values', () => {
    expect(clampValue(7.9)).toBe(7)
  })

  it('clamps below to 0 and above to MAX_VALUE', () => {
    expect(clampValue(-3)).toBe(0)
    expect(clampValue(1000)).toBe(MAX_VALUE)
    expect(clampValue(999)).toBe(999)
  })

  it('never folds values mod 10 the way the old wrap did', () => {
    expect(clampValue(10)).toBe(10)
    expect(clampValue(42)).toBe(42)
  })

  it('treats non-finite input as 0', () => {
    expect(clampValue(Number.NaN)).toBe(0)
    expect(clampValue(Number.POSITIVE_INFINITY)).toBe(MAX_VALUE)
    expect(clampValue(Number.NEGATIVE_INFINITY)).toBe(0)
  })
})

describe('nextValue', () => {
  it('counts up by one', () => {
    expect(nextValue(0)).toBe(1)
    expect(nextValue(8)).toBe(9)
  })

  it('counts past 9 instead of wrapping to 0', () => {
    expect(nextValue(9)).toBe(10)
    expect(nextValue(99)).toBe(100)
  })

  it('wraps to 0 only at the library bound', () => {
    expect(nextValue(MAX_VALUE)).toBe(0)
  })
})

describe('digitsOf', () => {
  it('renders a single digit for 0-9', () => {
    expect(digitsOf(0)).toEqual([0])
    expect(digitsOf(9)).toEqual([9])
  })

  it('splits multi-digit values most-significant first', () => {
    expect(digitsOf(10)).toEqual([1, 0])
    expect(digitsOf(42)).toEqual([4, 2])
    expect(digitsOf(999)).toEqual([9, 9, 9])
  })

  it('emits no leading zeros', () => {
    expect(digitsOf(100)).toEqual([1, 0, 0])
    expect(digitsOf(7)).toEqual([7])
  })
})

describe('columnX', () => {
  const advance = 1.5

  it('is a pure function of the place value alone', () => {
    // Same place, same x — nothing else feeds in.
    expect(columnX(0, advance)).toBe(columnX(0, advance))
  })

  it('puts the ones column rightmost and higher places leftward', () => {
    expect(columnX(0, advance)).toBeGreaterThan(columnX(1, advance))
    expect(columnX(1, advance)).toBeGreaterThan(columnX(2, advance))
  })

  it('spaces adjacent columns exactly one advance apart', () => {
    expect(columnX(0, advance) - columnX(1, advance)).toBeCloseTo(advance)
    expect(columnX(1, advance) - columnX(2, advance)).toBeCloseTo(advance)
  })

  it('centers the fixed MAX_DIGITS-wide field on the origin', () => {
    let sum = 0
    for (let place = 0; place < MAX_DIGITS; place++) sum += columnX(place, advance)
    expect(sum).toBeCloseTo(0)
  })
})

describe('sharedNorm', () => {
  it('derives one scale from the largest half-extent', () => {
    expect(sharedNorm([50, 100, 80], 1.2)).toBeCloseTo(1.2 / 100)
  })

  it('falls back to the scale itself when no extents are known', () => {
    expect(sharedNorm([], 1.2)).toBe(1.2)
  })
})

describe('columnAdvance', () => {
  it('is the widest glyph width padded by the gap factor', () => {
    expect(columnAdvance([0.8, 1.2, 1.0], 1.25)).toBeCloseTo(1.5)
  })
})

describe('splitEvenly', () => {
  it('splits an exact multiple into equal parts', () => {
    expect(splitEvenly(9, 3)).toEqual([3, 3, 3])
  })

  it('spreads the remainder so parts differ by at most one and sum to the total', () => {
    const parts = splitEvenly(10, 3)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10)
    expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1)
  })

  it('handles a single part', () => {
    expect(splitEvenly(4200, 1)).toEqual([4200])
  })
})

// FEAT-020 string display: digits plus ':' as a laid-out glyph string.
describe('glyphsOf', () => {
  it('splits a clock string into its glyphs', () => {
    expect(glyphsOf('14:03:57')).toEqual(['1', '4', ':', '0', '3', ':', '5', '7'])
  })

  it('accepts plain digit strings and scores', () => {
    expect(glyphsOf('42')).toEqual(['4', '2'])
    expect(glyphsOf('3:2')).toEqual(['3', ':', '2'])
  })

  // FEAT-021: '.' joins the alphabet — decimals and the clock's ms separator.
  it('accepts dots for decimals and ms readouts', () => {
    expect(glyphsOf('1.5')).toEqual(['1', '.', '5'])
    expect(glyphsOf('14:03:57.123')).toEqual(['1', '4', ':', '0', '3', ':', '5', '7', '.', '1', '2', '3'])
  })

  // Local modification: operators and space join the alphabet for the
  // flash-card question strings.
  it('accepts arithmetic operators and spaces', () => {
    expect(glyphsOf('7 × 8')).toEqual(['7', ' ', '×', ' ', '8'])
    expect(glyphsOf('3 + 4')).toEqual(['3', ' ', '+', ' ', '4'])
    expect(glyphsOf('9 − 5')).toEqual(['9', ' ', '−', ' ', '5'])
    expect(glyphsOf('12 ÷ 4')).toEqual(['1', '2', ' ', '÷', ' ', '4'])
  })

  it('rejects characters outside the display alphabet', () => {
    expect(() => glyphsOf('12:3a')).toThrow(/12:3a/)
    expect(() => glyphsOf('')).toThrow()
    expect(() => glyphsOf('1,5')).toThrow()
    // ASCII hyphen-minus and letter x are not the typographic operators.
    expect(() => glyphsOf('9 - 5')).toThrow()
    expect(() => glyphsOf('7 x 8')).toThrow()
  })
})

describe('stringSlotLayout', () => {
  const advanceOf = (glyph: string) => (glyph === ':' ? 0.5 : 1.5)

  it('centers the composed string on the origin', () => {
    const slots = stringSlotLayout(glyphsOf('1:2'), advanceOf)
    // Total width 1.5 + 0.5 + 1.5 = 3.5 → extents ±1.75.
    expect(slots[0].x).toBeCloseTo(-1.75 + 0.75)
    expect(slots[1].x).toBeCloseTo(-1.75 + 1.5 + 0.25)
    expect(slots[2].x).toBeCloseTo(1.75 - 0.75)
  })

  it('gives colons their own narrow column between the digit groups', () => {
    const slots = stringSlotLayout(glyphsOf('11:11'), advanceOf)
    const gapAroundColon = slots[3].x - slots[1].x
    // Two half digit-advances plus one colon advance — narrower than two digit columns.
    expect(gapAroundColon).toBeCloseTo(1.5 + 0.5)
  })

  it('keeps every slot x fixed across same-format strings (no jiggle tick to tick)', () => {
    const a = stringSlotLayout(glyphsOf('14:03:57'), advanceOf)
    const b = stringSlotLayout(glyphsOf('14:03:58'), advanceOf)
    const c = stringSlotLayout(glyphsOf('23:59:59'), advanceOf)
    expect(a.map((s) => s.x)).toEqual(b.map((s) => s.x))
    expect(a.map((s) => s.x)).toEqual(c.map((s) => s.x))
  })

  it('pairs each slot with its glyph in order', () => {
    expect(stringSlotLayout(glyphsOf('3:2'), advanceOf).map((s) => s.glyph)).toEqual(['3', ':', '2'])
  })
})

describe('splitByWeight', () => {
  it('splits proportionally when the weights divide evenly', () => {
    expect(splitByWeight(100, [3, 1])).toEqual([75, 25])
  })

  it('always sums to the total, spreading fractional remainders deterministically', () => {
    const parts = splitByWeight(4200, [7, 7, 1, 7, 7, 1, 7, 7])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(4200)
    expect(splitByWeight(4200, [7, 7, 1, 7, 7, 1, 7, 7])).toEqual(parts)
  })

  it('gives lighter slots fewer grains so digit density holds', () => {
    const [digit, colon] = splitByWeight(1000, [10, 2])
    expect(colon).toBeLessThan(digit)
    expect(colon).toBeGreaterThan(0)
  })

  it('matches splitEvenly under equal weights', () => {
    expect(splitByWeight(10, [1, 1, 1])).toEqual(splitEvenly(10, 3))
  })
})

// Local modification: sparse split so space slots own exactly zero grains.
describe('splitByWeightSparse', () => {
  it('matches splitByWeight when every weight is positive', () => {
    expect(splitByWeightSparse(100, [3, 1])).toEqual(splitByWeight(100, [3, 1]))
  })

  it('gives zero-weight slots exactly zero grains and still sums to the total', () => {
    const parts = splitByWeightSparse(7200, [10, 0, 2, 0, 10])
    expect(parts[1]).toBe(0)
    expect(parts[3]).toBe(0)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(7200)
  })

  it('splits the positive slots as if the zero slots were absent', () => {
    const sparse = splitByWeightSparse(1000, [7, 0, 3])
    const dense = splitByWeight(1000, [7, 3])
    expect([sparse[0], sparse[2]]).toEqual(dense)
  })

  it('returns all zeros when no weight is positive', () => {
    expect(splitByWeightSparse(100, [0, 0])).toEqual([0, 0])
  })
})

// IMPRV-011 tabular invariants: fixed columns, positional invariance across
// values and digit counts, one shared scale, no column overlap.
describe('slotLayout (tabular invariants)', () => {
  const advance = 1.5

  it('assigns each digit its place value, ones last', () => {
    expect(slotLayout(407, advance)).toEqual([
      { digit: 4, place: 2, x: columnX(2, advance) },
      { digit: 0, place: 1, x: columnX(1, advance) },
      { digit: 7, place: 0, x: columnX(0, advance) },
    ])
  })

  it('keeps a column x a pure function of the place across every value 0-999', () => {
    const xsByPlace = new Map<number, Set<number>>()
    for (let value = 0; value <= MAX_VALUE; value++) {
      for (const slot of slotLayout(value, advance)) {
        let xs = xsByPlace.get(slot.place)
        if (!xs) xsByPlace.set(slot.place, (xs = new Set()))
        xs.add(slot.x)
      }
    }
    expect(xsByPlace.size).toBe(MAX_DIGITS)
    for (const xs of xsByPlace.values()) expect(xs.size).toBe(1)
  })

  it('gives the same digit at the same place the same x regardless of neighbors', () => {
    const onesOf = (value: number) => slotLayout(value, advance).at(-1)
    expect(onesOf(9)).toEqual(onesOf(19))
    expect(onesOf(9)).toEqual(onesOf(909))
  })

  it('holds the ones column still at 8→9, 9→10, and 99→100', () => {
    const onesX = (value: number) => slotLayout(value, advance).at(-1)?.x
    expect(onesX(9)).toBe(onesX(8))
    expect(onesX(10)).toBe(onesX(9))
    expect(onesX(100)).toBe(onesX(99))
  })

  it('holds the tens column still when the hundreds digit appears at 99→100', () => {
    const tensX = (value: number) => slotLayout(value, advance).find((s) => s.place === 1)?.x
    expect(tensX(100)).toBe(tensX(99))
  })
})

describe('shared scale (tabular invariants)', () => {
  // Two fake glyphs sharing a pixel height: a narrow "1" and a wide "8".
  const narrowWidthPx = 40
  const wideWidthPx = 110
  const heightPx = 140
  const halfExtents = [heightPx / 2, heightPx / 2]
  const scale = 1.2

  // A rectangle-outline profile whose per-glyph norm is deliberately wrong,
  // so any leak of per-glyph normalization into sampling shows up.
  const rectProfile = (widthPx: number): GlyphProfile => ({
    opaqueX: Int16Array.from([0, widthPx, 0, widthPx]),
    opaqueY: Int16Array.from([0, 0, heightPx, heightPx]),
    cx: widthPx / 2,
    cy: heightPx / 2,
    norm: 999,
    scale,
  })

  // Sample every opaque pixel once (rng walks the index range) and measure
  // the rendered x/y extents.
  const renderedExtents = (profile: GlyphProfile, norm: number) => {
    const count = profile.opaqueX.length
    const out = new Float32Array(count * 3)
    let call = 0
    sampleSlot(profile, norm, 0, 0, out, 0, count, () => call++ / count)
    let w = 0
    let h = 0
    for (let i = 0; i < count; i++) {
      w = Math.max(w, Math.abs(out[i * 3 + 0]) * 2)
      h = Math.max(h, Math.abs(out[i * 3 + 1]) * 2)
    }
    return { w, h }
  }

  it('renders equal heights and true relative widths — never stretched to a column', () => {
    const norm = sharedNorm(halfExtents, scale)
    const narrow = renderedExtents(rectProfile(narrowWidthPx), norm)
    const wide = renderedExtents(rectProfile(wideWidthPx), norm)
    expect(narrow.h).toBeCloseTo(wide.h)
    expect(narrow.w).toBeLessThan(wide.w)
    // The per-glyph normalization this replaces would have stretched both to
    // the same rendered width; the shared norm preserves the true ratio.
    expect(wide.w / narrow.w).toBeCloseTo(wideWidthPx / narrowWidthPx)
  })

  it('keeps adjacent columns from overlapping: the widest glyph fits inside one advance', () => {
    const norm = sharedNorm(halfExtents, scale)
    const widths = [narrowWidthPx * norm, wideWidthPx * norm]
    const advance = columnAdvance(widths, 1.15)
    // A glyph centered in its column spans ±width/2 around columnX; adjacent
    // columns are one advance apart, so no overlap iff the widest width fits.
    expect(Math.max(...widths)).toBeLessThan(advance)
    const left = columnX(1, advance)
    const right = columnX(0, advance)
    expect(left + Math.max(...widths) / 2).toBeLessThan(right - Math.max(...widths) / 2)
  })
})

// A 2×2-pixel L-shaped fake profile: opaque pixels at (0,0), (0,2), (2,2).
const fakeProfile: GlyphProfile = {
  opaqueX: Int16Array.from([0, 0, 2]),
  opaqueY: Int16Array.from([0, 2, 2]),
  cx: 1,
  cy: 1,
  norm: 0.5, // per-glyph norm — sampleSlot must ignore this in favor of the shared norm
  scale: 1.2,
}

describe('profileWidthPx', () => {
  it('measures the opaque-pixel bounding-box width', () => {
    expect(profileWidthPx(fakeProfile)).toBe(2)
  })
})

describe('sampleSlot', () => {
  it('places grains with the shared norm and column offset, ignoring the per-glyph norm', () => {
    const out = new Float32Array(9)
    // rng always 0 → every grain samples opaque pixel 0 at (0,0).
    sampleSlot(fakeProfile, 2, 5, 0, out, 0, 2, () => 0)
    // (0 - cx) * 2 + 5 = 3 ; -(0 - cy) * 2 = 2
    expect(out[0]).toBeCloseTo(3)
    expect(out[1]).toBeCloseTo(2)
    expect(out[2]).toBe(0)
    expect(out[3]).toBeCloseTo(3)
    expect(out[4]).toBeCloseTo(2)
  })

  // FEAT-021: the vertical slot offset that drops a '.' to the baseline.
  it('shifts grains vertically by the slot offset', () => {
    const out = new Float32Array(3)
    sampleSlot(fakeProfile, 2, 5, -1.5, out, 0, 1, () => 0)
    expect(out[0]).toBeCloseTo(3)
    expect(out[1]).toBeCloseTo(2 - 1.5)
  })

  it('writes only its own region of the output array', () => {
    const out = new Float32Array(12).fill(7)
    sampleSlot(fakeProfile, 1, 0, 0, out, 1, 2, () => 0)
    // Particles 1-2 occupy array indices 3..9; particle 0 and beyond stay put.
    expect(out[2]).toBe(7)
    expect(out[3]).not.toBe(7)
    expect(out[6]).not.toBe(7)
    expect(out[9]).toBe(7)
  })

  it('falls back to a unit disc at the offset when the profile is null', () => {
    const out = new Float32Array(30)
    sampleSlot(null, 1, 4, 2, out, 0, 10, () => 0.5)
    for (let i = 0; i < 10; i++) {
      const dx = out[i * 3 + 0] - 4
      const dy = out[i * 3 + 1] - 2
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(1 + 1e-6)
    }
  })
})

// FEAT-021: every glyph rasterizes against the same font-metric baseline in
// the same canvas, so canvas-y values are comparable across profiles and the
// offset that undoes bbox centering is pure arithmetic on the two centers.
describe('baselineOffsetY', () => {
  it('is zero for a glyph centered like the reference (digits stay put)', () => {
    expect(baselineOffsetY(100, 100, 0.01)).toBe(0)
  })

  it('moves a low glyph like "." downward (negative world y)', () => {
    // Canvas y grows downward: a dot's bbox center sits below the digit
    // row's center (larger cy), so the world offset must be negative.
    expect(baselineOffsetY(100, 180, 0.01)).toBeCloseTo(-0.8)
  })

  it('restores exactly the placement of anchoring at the reference center', () => {
    const refCy = 100
    const glyphCy = 180
    const norm = 0.01
    const py = 190 // any opaque pixel of the glyph
    const anchoredAtRef = -(py - refCy) * norm
    const bboxCentered = -(py - glyphCy) * norm
    expect(bboxCentered + baselineOffsetY(refCy, glyphCy, norm)).toBeCloseTo(anchoredAtRef)
  })
})

// IMPRV-012 area-balanced density: regions stay per-type fixed-capacity, and
// within a region only density × area grains carry the glyph.
describe('grainDensity', () => {
  it('is the pool spread over the capacity areas', () => {
    expect(grainDensity(7200, [6727, 6727, 6727])).toBeCloseTo(7200 / 20181)
  })

  it('is zero for an empty capacity (no divide-by-zero)', () => {
    expect(grainDensity(7200, [])).toBe(0)
  })
})

describe('activeCount', () => {
  const density = 0.35

  it('is proportional to the glyph area within integer rounding', () => {
    const areas = [3718, 3911, 5405, 6272, 6727]
    const counts = areas.map((a) => activeCount(density, a, 10_000))
    for (let i = 0; i < areas.length; i++) {
      expect(counts[i]).toBeCloseTo(density * areas[i], -1)
    }
    // Strictly increasing with area: an "8" carries more grains than a "7".
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1])
  })

  it('never exceeds the slot region', () => {
    expect(activeCount(0.35, 6727, 2400)).toBeLessThanOrEqual(2400)
    expect(activeCount(10, 6727, 2400)).toBe(2400)
  })

  it('fills its region exactly for the heaviest glyph the region was sized for', () => {
    // Region sized as N/3 with density N/(3 × maxArea): active(maxArea) = region.
    const total = 7200
    const maxArea = 6727
    const d = grainDensity(total, [maxArea, maxArea, maxArea])
    expect(activeCount(d, maxArea, total / 3)).toBe(total / 3)
  })

  it('keeps at least one grain alive but never more than the region', () => {
    expect(activeCount(0.001, 5, 100)).toBe(1)
    expect(activeCount(0.001, 5, 0)).toBe(0)
  })

  it('is deterministic: equal inputs, equal counts', () => {
    expect(activeCount(0.35, 5090, 800)).toBe(activeCount(0.35, 5090, 800))
  })
})

describe('parkSurplus', () => {
  // A slot region of 5 grains at start 2, of which 2 are active.
  const filled = () => {
    const out = new Float32Array(10 * 3).fill(-1)
    // Active grains at distinctive positions.
    out.set([10, 11, 12], 2 * 3)
    out.set([20, 21, 22], 3 * 3)
    return out
  }

  it('parks every surplus grain exactly on an active grain of its own slot', () => {
    const out = filled()
    parkSurplus(out, 2, 2, 5)
    expect([...out.subarray(4 * 3, 5 * 3)]).toEqual([10, 11, 12])
    expect([...out.subarray(5 * 3, 6 * 3)]).toEqual([20, 21, 22])
    expect([...out.subarray(6 * 3, 7 * 3)]).toEqual([10, 11, 12])
  })

  it('touches nothing outside the surplus range', () => {
    const out = filled()
    parkSurplus(out, 2, 2, 5)
    expect([...out.subarray(0, 2 * 3)]).toEqual([-1, -1, -1, -1, -1, -1])
    expect([...out.subarray(2 * 3, 3 * 3)]).toEqual([10, 11, 12])
    expect([...out.subarray(3 * 3, 4 * 3)]).toEqual([20, 21, 22])
    expect(out[7 * 3]).toBe(-1)
  })

  it('is a no-op when the whole region is active or nothing is', () => {
    const untouched = filled()
    const fullyActive = filled()
    parkSurplus(fullyActive, 2, 5, 5)
    expect([...fullyActive]).toEqual([...untouched])
    const noneActive = filled()
    parkSurplus(noneActive, 2, 0, 5)
    expect([...noneActive]).toEqual([...untouched])
  })
})
