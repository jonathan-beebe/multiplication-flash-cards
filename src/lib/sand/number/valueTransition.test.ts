// Characterization of the default damped-morph transition strategy
// (RFCTR-007): the behavior the slab shell drove inline before the seam —
// damped settling, mid-flight rebasing, reduced-motion snap, and the
// per-frame-churn catch-up settle (IMPRV-013) — now behind ValueTransition.

import { describe, expect, it } from 'vitest'
import { makeMorphTransition } from './valueTransition'

const grains = (...points: number[][]) => Float32Array.from(points.flat())

const wholeRegion = (grainCount: number, sinceLast: number) => [{ startGrain: 0, grainCount, sinceLast }]

describe('makeMorphTransition', () => {
  it('starts settled on the initial targets', () => {
    const t = makeMorphTransition(grains([1, 2, 3], [4, 5, 6]))
    const out = new Float32Array(6)
    expect(Array.from(t.advance(0, out))).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('damps toward a retargeted position without overshooting', () => {
    const t = makeMorphTransition(grains([0, 0, 0]))
    t.retarget(grains([10, 0, 0]), wholeRegion(1, Infinity))
    const out = new Float32Array(3)
    t.advance(0.1, out)
    const early = out[0]
    expect(early).toBeGreaterThan(0)
    expect(early).toBeLessThan(10)
    t.advance(0.5, out)
    expect(out[0]).toBeGreaterThan(early)
    expect(out[0]).toBeLessThanOrEqual(10)
    t.advance(5, out)
    expect(out[0]).toBeCloseTo(10, 3)
  })

  it('a mid-flight retarget departs from the current interpolated position, not the old source', () => {
    const t = makeMorphTransition(grains([0, 0, 0]))
    const out = new Float32Array(3)
    t.retarget(grains([10, 0, 0]), wholeRegion(1, Infinity))
    t.advance(0.2, out)
    const midFlight = out[0]
    expect(midFlight).toBeGreaterThan(0)
    // A slow cadence (≳0.4s at λ=6) earns no catch-up top-up, so the repaint
    // right after the retarget shows the cloud exactly where it was.
    t.retarget(grains([-10, 0, 0]), wholeRegion(1, 0.5))
    t.advance(0, out)
    expect(out[0]).toBeCloseTo(midFlight, 6)
  })

  it('a rapidly-churning region settles most of the way onto each fresh target (IMPRV-013)', () => {
    const t = makeMorphTransition(grains([0, 0, 0]))
    const out = new Float32Array(3)
    // Per-frame cadence: the catch-up closes ~1 − (1 − R)·e^(λ·Δ) ≈ 0.89 of
    // the journey immediately, so the grain lands near the fresh sample
    // instead of collapsing toward the mean of successive samples.
    t.retarget(grains([10, 0, 0]), wholeRegion(1, 1 / 60))
    t.advance(0, out)
    expect(out[0]).toBeGreaterThan(8)
  })

  it('the catch-up settle touches only the regions reported as changed', () => {
    const t = makeMorphTransition(grains([0, 0, 0], [0, 0, 0]))
    const out = new Float32Array(6)
    t.retarget(grains([10, 0, 0], [20, 0, 0]), [{ startGrain: 1, grainCount: 1, sinceLast: 1 / 60 }])
    t.advance(0, out)
    expect(out[0]).toBe(0)
    expect(out[3]).toBeGreaterThan(15)
  })

  it('snap lands every grain exactly on target', () => {
    const t = makeMorphTransition(grains([0, 0, 0]))
    t.retarget(grains([10, -4, 2]), wholeRegion(1, Infinity))
    t.snap()
    const out = new Float32Array(3)
    expect(Array.from(t.advance(0, out))).toEqual([10, -4, 2])
  })

  it("copies, never aliases, the caller's arrays", () => {
    const initial = grains([1, 1, 1])
    const t = makeMorphTransition(initial)
    initial[0] = 99
    const target = grains([5, 5, 5])
    t.retarget(target, wholeRegion(1, Infinity))
    target.fill(99)
    t.snap()
    const out = new Float32Array(3)
    t.advance(0, out)
    expect(out[0]).toBe(5)
  })
})
