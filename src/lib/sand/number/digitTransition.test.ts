import { describe, expect, it } from 'vitest'
import {
  advanceMorph,
  catchUpSettle,
  createDigitTransition,
  elapsedDelta,
  retarget,
  settleRegion,
  writePositions,
} from './digitTransition'

// Two-particle clouds, xyz-interleaved.
const A = Float32Array.from([0, 0, 0, 1, 1, 1])
const B = Float32Array.from([2, 2, 2, 3, 3, 3])
const C = Float32Array.from([10, 10, 10, 20, 20, 20])

describe('createDigitTransition', () => {
  it('starts settled on the initial cloud', () => {
    const state = createDigitTransition(A)
    expect(state.morph).toBe(1)
    const out = writePositions(state, new Float32Array(A.length))
    expect(Array.from(out)).toEqual(Array.from(A))
  })

  it('copies the initial cloud instead of aliasing it', () => {
    const initial = A.slice()
    const state = createDigitTransition(initial)
    initial[0] = 99
    const out = writePositions(state, new Float32Array(initial.length))
    expect(out[0]).toBe(0)
  })
})

describe('retarget', () => {
  it('from settled: holds the current cloud and aims at the next', () => {
    const state = createDigitTransition(A)
    retarget(state, B)
    expect(state.morph).toBe(0)
    // The cloud must not jump when the transition starts.
    const out = writePositions(state, new Float32Array(A.length))
    expect(Array.from(out)).toEqual(Array.from(A))
    expect(Array.from(state.target)).toEqual(Array.from(B))
  })

  it('mid-flight: rebases the source to the interpolated positions', () => {
    const state = createDigitTransition(A)
    retarget(state, B)
    state.morph = 0.5
    const midpoint = writePositions(state, new Float32Array(A.length))
    retarget(state, C)
    expect(state.morph).toBe(0)
    // The redirected transition departs from where the cloud is right now.
    const out = writePositions(state, new Float32Array(A.length))
    expect(Array.from(out)).toEqual(Array.from(midpoint))
    expect(Array.from(state.target)).toEqual(Array.from(C))
  })

  it('copies the next target instead of aliasing the caller scratch', () => {
    const state = createDigitTransition(A)
    const scratch = B.slice()
    retarget(state, scratch)
    scratch[0] = 99
    expect(state.target[0]).toBe(2)
  })
})

describe('advanceMorph', () => {
  it('damps toward 1 without overshooting', () => {
    const state = createDigitTransition(A)
    retarget(state, B)
    let prev = state.morph
    for (let i = 0; i < 200; i++) {
      advanceMorph(state, 6, 0.016)
      expect(state.morph).toBeGreaterThan(prev)
      expect(state.morph).toBeLessThanOrEqual(1)
      prev = state.morph
    }
    expect(state.morph).toBeCloseTo(1, 5)
  })

  it('is a no-op at delta 0', () => {
    const state = createDigitTransition(A)
    retarget(state, B)
    state.morph = 0.3
    advanceMorph(state, 6, 0)
    expect(state.morph).toBeCloseTo(0.3, 12)
  })
})

describe('writePositions', () => {
  it('lerps source → target by the morph factor', () => {
    const state = createDigitTransition(A)
    retarget(state, B)
    state.morph = 0.25
    const out = writePositions(state, new Float32Array(A.length))
    expect(out[0]).toBeCloseTo(0.5)
    expect(out[3]).toBeCloseTo(1.5)
  })
})

describe('catchUpSettle', () => {
  const LAMBDA = 6
  const REACH = 0.9

  it('is 0 for slots that change slower than the morph settles (a 1s clock tick)', () => {
    expect(catchUpSettle(LAMBDA, 1, REACH)).toBe(0)
  })

  it('is 0 for a slot that has never changed before (infinite interval)', () => {
    expect(catchUpSettle(LAMBDA, Infinity, REACH)).toBe(0)
  })

  it('is the full reach for back-to-back changes (zero interval)', () => {
    expect(catchUpSettle(LAMBDA, 0, REACH)).toBeCloseTo(REACH, 12)
  })

  it('tops up a per-frame churn so the combined step reaches the target reach', () => {
    const dt = 1 / 60
    const f = catchUpSettle(LAMBDA, dt, REACH)
    // Immediate settle f, then the natural morph over one frame: together
    // they must close exactly `reach` of the distance.
    const combined = 1 - (1 - f) * Math.exp(-LAMBDA * dt)
    expect(combined).toBeCloseTo(REACH, 12)
  })

  it('decreases monotonically as the change interval grows', () => {
    const intervals = [0, 0.016, 0.05, 0.1, 0.2, 0.4, 1]
    const fractions = intervals.map((dt) => catchUpSettle(LAMBDA, dt, REACH))
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]).toBeLessThanOrEqual(fractions[i - 1])
    }
    expect(fractions[0]).toBeCloseTo(REACH, 12)
    expect(fractions[fractions.length - 1]).toBe(0)
  })
})

describe('settleRegion', () => {
  it('moves only its grain range toward the target, by the given fraction', () => {
    const state = createDigitTransition(A)
    retarget(state, B)
    // Settle the second grain (grain index 1) by half; the first stays put.
    settleRegion(state, 1, 1, 0.5)
    const out = writePositions(state, new Float32Array(A.length))
    expect(Array.from(out.subarray(0, 3))).toEqual([0, 0, 0])
    // Grain 1 was at (1,1,1) headed for (3,3,3): half settled → (2,2,2).
    expect(Array.from(out.subarray(3, 6))).toEqual([2, 2, 2])
  })

  it('leaves the morph factor and target untouched', () => {
    const state = createDigitTransition(A)
    retarget(state, B)
    settleRegion(state, 0, 2, 0.75)
    expect(state.morph).toBe(0)
    expect(Array.from(state.target)).toEqual(Array.from(B))
  })
})

// The clump this ticket exists for (IMPRV-013): grains chasing a target that
// is resampled every frame converge to the sample mean, collapsing the cloud.
// The catch-up settle must keep the churning cloud spread comparable to the
// spread of the samples themselves.
describe('per-frame retargeting spread', () => {
  const LAMBDA = 6
  const DT = 1 / 60
  const GRAINS = 500
  const FRAMES = 300

  function makeLcg(seed: number) {
    let s = seed >>> 0
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 2 ** 32
    }
  }

  function stddev(values: ArrayLike<number>) {
    let mean = 0
    for (let i = 0; i < values.length; i++) mean += values[i]
    mean /= values.length
    let variance = 0
    for (let i = 0; i < values.length; i++) variance += (values[i] - mean) ** 2
    return Math.sqrt(variance / values.length)
  }

  function xSpreadAfterChurn(settleReach: number | null) {
    const rand = makeLcg(42)
    const target = new Float32Array(GRAINS * 3)
    const state = createDigitTransition(new Float32Array(GRAINS * 3))
    for (let frame = 0; frame < FRAMES; frame++) {
      for (let i = 0; i < target.length; i++) target[i] = rand() * 2 - 1
      retarget(state, target)
      if (settleReach !== null) {
        settleRegion(state, 0, GRAINS, catchUpSettle(LAMBDA, DT, settleReach))
      }
      advanceMorph(state, LAMBDA, DT)
    }
    const positions = writePositions(state, new Float32Array(GRAINS * 3))
    const xs = Array.from({ length: GRAINS }, (_, i) => positions[i * 3])
    const targetXs = Array.from({ length: GRAINS }, (_, i) => target[i * 3])
    return stddev(xs) / stddev(targetXs)
  }

  it('collapses toward the sample mean without the catch-up settle (the bug)', () => {
    expect(xSpreadAfterChurn(null)).toBeLessThan(0.4)
  })

  it('keeps the cloud spread near the sample spread with the catch-up settle', () => {
    expect(xSpreadAfterChurn(0.9)).toBeGreaterThan(0.8)
  })
})

describe('elapsedDelta', () => {
  it('measures the time between consecutive clock samples', () => {
    expect(elapsedDelta(5, 5.016)).toBeCloseTo(0.016)
  })

  it('is 0 on the first sample', () => {
    expect(elapsedDelta(null, 42)).toBe(0)
  })

  it('is 0 when the clock restarts (a motion-mode rebuild resets the timer)', () => {
    expect(elapsedDelta(100, 0.008)).toBe(0)
  })
})
