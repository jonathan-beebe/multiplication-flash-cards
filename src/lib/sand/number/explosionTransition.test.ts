// Characterization of the explosion value-change transition (FEAT-026):
// changed regions burst outward before converging onto the new value, calm
// grains hold still, retargets depart from wherever the cloud is (never a
// jump — residual burst included), per-frame churn gets no meaningful burst,
// and snap lands exactly for reduced motion.

import { describe, expect, it } from 'vitest'
import { BURST_PEAK_TIME, makeExplosionTransition, makeFullBlastTransition } from './explosionTransition'

const grains = (...points: number[][]) => Float32Array.from(points.flat())

const wholeRegion = (grainCount: number, sinceLast: number) => [{ startGrain: 0, grainCount, sinceLast }]

const distance = (out: Float32Array, i: number, target: number[]) =>
  Math.hypot(out[i * 3] - target[0], out[i * 3 + 1] - target[1], out[i * 3 + 2] - target[2])

describe('makeExplosionTransition', () => {
  it('starts settled on the initial targets', () => {
    const t = makeExplosionTransition(grains([1, 2, 3], [4, 5, 6]))
    const out = new Float32Array(6)
    expect(Array.from(t.advance(0, out))).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('a calm-cadence change bursts outward well beyond the direct path before settling', () => {
    const t = makeExplosionTransition(grains([0, 0, 0]))
    const target = [0.4, 0, 0]
    t.retarget(grains(target), wholeRegion(1, Infinity))
    const out = new Float32Array(3)

    // The burst starts from rest — a repaint right at the change shows the
    // grain still at its departure point.
    t.advance(0, out)
    expect(distance(out, 0, [0, 0, 0])).toBeCloseTo(0, 6)

    // At the envelope peak the grain is far outside the 0.4-unit direct
    // path: the burst magnitude dwarfs the value's own displacement.
    t.advance(BURST_PEAK_TIME, out)
    expect(distance(out, 0, target)).toBeGreaterThan(0.6)

    // And the scatter is transient: the grain converges onto the target.
    t.advance(5, out)
    expect(distance(out, 0, target)).toBeLessThan(0.01)
  })

  it('a retarget mid-burst departs exactly from the rendered position — residual burst folded in, no jump', () => {
    const t = makeExplosionTransition(grains([0, 0, 0]))
    const out = new Float32Array(3)
    t.retarget(grains([1, 0, 0]), wholeRegion(1, Infinity))
    t.advance(BURST_PEAK_TIME, out)
    const midBurst = [out[0], out[1], out[2]]

    t.retarget(grains([-1, 0, 0]), wholeRegion(1, 1))
    t.advance(0, out)
    expect(out[0]).toBeCloseTo(midBurst[0], 5)
    expect(out[1]).toBeCloseTo(midBurst[1], 5)
    expect(out[2]).toBeCloseTo(midBurst[2], 5)
  })

  it('per-frame churn earns no meaningful burst and lands near each fresh target (IMPRV-013)', () => {
    const calm = makeExplosionTransition(grains([0, 0, 0]))
    const churn = makeExplosionTransition(grains([0, 0, 0]))
    const target = [1, 0, 0]
    calm.retarget(grains(target), wholeRegion(1, Infinity))
    churn.retarget(grains(target), wholeRegion(1, 1 / 60))
    const out = new Float32Array(3)

    // The churn-cadence change settles most of the way immediately…
    churn.advance(0, out)
    expect(out[0]).toBeGreaterThan(0.8)

    // …and never strays anywhere near the calm change's scatter.
    churn.advance(BURST_PEAK_TIME, out)
    const churnExcursion = distance(out, 0, target)
    calm.advance(BURST_PEAK_TIME, out)
    const calmExcursion = distance(out, 0, target)
    expect(churnExcursion).toBeLessThan(0.3)
    expect(calmExcursion).toBeGreaterThan(0.6)
  })

  it('regions not reported as changed hold perfectly still through the blast', () => {
    const t = makeExplosionTransition(grains([1, 2, 0], [5, 0, 0]))
    const out = new Float32Array(6)
    t.retarget(grains([1, 2, 0], [8, 0, 0]), [{ startGrain: 1, grainCount: 1, sinceLast: Infinity }])
    for (const step of [0, 0.1, 0.1, 0.3, 1]) {
      t.advance(step, out)
      expect(out[0]).toBe(1)
      expect(out[1]).toBe(2)
      expect(out[2]).toBe(0)
    }
  })

  it('snap lands every grain exactly on target with no residual scatter', () => {
    const t = makeExplosionTransition(grains([0, 0, 0]))
    const out = new Float32Array(3)
    t.retarget(grains([3, -2, 0]), wholeRegion(1, Infinity))
    t.advance(BURST_PEAK_TIME, out)
    t.snap()
    expect(Array.from(t.advance(0, out))).toEqual([3, -2, 0])
    // A later frame stays put — the burst is fully cleared, not paused.
    expect(Array.from(t.advance(0.5, out))).toEqual([3, -2, 0])
  })

  it("copies, never aliases, the caller's arrays", () => {
    const initial = grains([1, 1, 1])
    const t = makeExplosionTransition(initial)
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

describe('makeFullBlastTransition', () => {
  it('any change blasts the whole field — grains outside the reported region scatter and re-form (FEAT-027)', () => {
    const t = makeFullBlastTransition(grains([1, 2, 0], [5, 0, 0]))
    const out = new Float32Array(6)
    // Only grain 1's region is reported changed, at a churn-fast cadence…
    t.retarget(grains([1, 2, 0], [6, 0, 0]), [{ startGrain: 1, grainCount: 1, sinceLast: 0.01 }])
    // …yet at the blast peak both grains have scattered far off their
    // targets — the unchanged grain and the cadence notwithstanding.
    t.advance(BURST_PEAK_TIME, out)
    expect(distance(out, 0, [1, 2, 0])).toBeGreaterThan(0.6)
    expect(distance(out, 1, [6, 0, 0])).toBeGreaterThan(0.6)
    // The boom is transient: everything re-forms.
    t.advance(5, out)
    expect(distance(out, 0, [1, 2, 0])).toBeLessThan(0.01)
    expect(distance(out, 1, [6, 0, 0])).toBeLessThan(0.01)
  })

  it('starts settled and departs from rest at the change — no jump, no catch-up skip', () => {
    const t = makeFullBlastTransition(grains([1, 2, 0]))
    const out = new Float32Array(3)
    expect(Array.from(t.advance(0, out))).toEqual([1, 2, 0])
    t.retarget(grains([-3, 0, 0]), [{ startGrain: 0, grainCount: 1, sinceLast: 0.01 }])
    t.advance(0, out)
    expect(out[0]).toBeCloseTo(1, 6)
    expect(out[1]).toBeCloseTo(2, 6)
  })

  it('snap lands the whole field exactly (reduced motion)', () => {
    const t = makeFullBlastTransition(grains([1, 2, 0], [5, 0, 0]))
    const out = new Float32Array(6)
    t.retarget(grains([0, 0, 0], [6, 0, 0]), [{ startGrain: 0, grainCount: 2, sinceLast: 1 }])
    t.advance(BURST_PEAK_TIME, out)
    t.snap()
    expect(Array.from(t.advance(0, out))).toEqual([0, 0, 0, 6, 0, 0])
  })
})
