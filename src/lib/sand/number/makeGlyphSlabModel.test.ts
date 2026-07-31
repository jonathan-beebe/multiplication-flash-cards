// Characterization of the slab's blow-away dismissal wiring (FEAT-024;
// IMPRV-016: the display stays live mid-flight — plan changes keep landing). A
// fake GlyphMetrics with null profiles rides sampleSlot's unit-disc
// fallback, so the slab runs without canvas rasterization or a GL context.

import { describe, expect, it, vi } from 'vitest'
import { DISMISS_EXIT_X } from './dismissal'
import type { GlyphMetrics } from './glyphMetrics'
import { SLAB_PARTICLE_COUNT, makeGlyphSlabModel, type SlotPlan } from './makeGlyphSlabModel'
import type { RegionChange, ValueTransition } from './valueTransition'

const fakeMetrics: GlyphMetrics = {
  profileOf: () => null,
  norm: 1,
  widthOf: () => 2,
  areaOf: () => 1,
}

const singleSlot = (): SlotPlan[] => [{ glyph: '0', x: 0, count: SLAB_PARTICLE_COUNT }]

function positionsOf(model: ReturnType<typeof makeGlyphSlabModel>): Float32Array {
  const points = model.objects[0] as unknown as {
    geometry: { attributes: { position: { array: Float32Array } } }
  }
  return points.geometry.attributes.position.array
}

const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(resolve))

describe('makeGlyphSlabModel dismissal', () => {
  it('carries every grain past the exit distance and fires onComplete exactly once', async () => {
    const model = makeGlyphSlabModel(fakeMetrics, singleSlot())
    const onComplete = vi.fn()
    model.update(1.0, 0.016)
    model.dismiss({ duration: 0.5, onComplete })

    // Mid-flight: not complete yet, and some grains have started moving.
    model.update(1.1, 0.016)
    model.update(1.3, 0.016)
    expect(onComplete).not.toHaveBeenCalled()

    // Past the duration: every grain is beyond the exit distance (grains
    // start within ~±1.5 world units, so exit − 2 is a safe floor).
    model.update(1.7, 0.016)
    const positions = positionsOf(model)
    for (let i = 0; i < SLAB_PARTICLE_COUNT; i++) {
      expect(positions[i * 3]).toBeGreaterThan(DISMISS_EXIT_X - 2)
    }
    await flushMicrotasks()
    expect(onComplete).toHaveBeenCalledTimes(1)

    // Further frames never re-fire it.
    model.update(2.5, 0.016)
    await flushMicrotasks()
    expect(onComplete).toHaveBeenCalledTimes(1)
    model.dispose()
  })

  it('the gust front advances windward-first: left grains lift while right grains still hold (IMPRV-017)', () => {
    const model = makeGlyphSlabModel(fakeMetrics, singleSlot())
    model.update(1.0, 0.016)
    model.dismiss() // default 2s duration → the front crosses in the first 0.5s
    const base = positionsOf(model).slice()

    // Windward-normalized x of each grain at the moment of dismissal.
    let minX = Infinity
    let maxX = -Infinity
    for (let i = 0; i < SLAB_PARTICLE_COUNT; i++) {
      minX = Math.min(minX, base[i * 3])
      maxX = Math.max(maxX, base[i * 3])
    }
    const norm = (i: number) => (base[i * 3] - minX) / (maxX - minX)

    model.update(1.1, 0.016) // first flight frame — starts the dismissal clock
    model.update(1.25, 0.016) // 0.15s in — the front has crossed ~30% of the cloud
    const early = positionsOf(model)
    // The lobed front (IMPRV-019) is ragged, so windward pickup is a strong
    // fraction rather than every grain; far downwind, beyond the lobe + jitter
    // reach, grains must still hold base exactly.
    let leftMoved = 0
    let leftTotal = 0
    let liftedRise = 0
    for (let i = 0; i < SLAB_PARTICLE_COUNT; i++) {
      const p = norm(i)
      if (p < 0.25) {
        leftTotal++
        if (early[i * 3] > base[i * 3]) {
          leftMoved++
          liftedRise += early[i * 3 + 1] - base[i * 3 + 1]
        }
      } else if (p > 0.6) {
        // The front (lobes + jitter included) cannot have reached this far.
        expect(early[i * 3]).toBe(base[i * 3])
      }
    }
    expect(leftTotal).toBeGreaterThan(0)
    expect(leftMoved / leftTotal).toBeGreaterThan(0.4)
    // Freshly lifted sand puffs upward before the carry dominates (IMPRV-019).
    expect(liftedRise / leftMoved).toBeGreaterThan(0.01)

    // Once the front has fully crossed, the whole cloud is in flight.
    model.update(1.8, 0.016) // 0.7s in, past the 0.5s front-crossing time
    const late = positionsOf(model)
    for (let i = 0; i < SLAB_PARTICLE_COUNT; i++) {
      expect(late[i * 3]).toBeGreaterThan(base[i * 3])
    }
    model.dispose()
  })

  it('ignores a second dismiss while dismissing', async () => {
    const model = makeGlyphSlabModel(fakeMetrics, singleSlot())
    const first = vi.fn()
    const second = vi.fn()
    model.update(0, 0.016)
    model.dismiss({ duration: 0.5, onComplete: first })
    model.dismiss({ duration: 0.5, onComplete: second })

    model.update(1.0, 0.016) // first flight frame — starts the dismissal clock
    model.update(1.6, 0.016)
    await flushMicrotasks()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
    model.dispose()
  })

  it('a plan change keeps landing mid-flight — the cloud morphs toward the new column as it flies (IMPRV-016)', () => {
    const model = makeGlyphSlabModel(fakeMetrics, singleSlot())
    model.update(0, 0.016)
    // The morph aims upwind (column x = −3) while every flight offset is ≥ 0
    // (grains only ever fly downwind), so a mean x below −0.5 is reachable
    // only if the plan landed: without it the cloud sits at column 0 plus a
    // non-negative flight drift; with it the settled morph (λ = 6, fully
    // settled by +2s) pulls the mean to −3 plus at most ~1.1 of flight.
    model.dismiss({ duration: 10 })
    model.setPlan([{ glyph: '1', x: -3, count: SLAB_PARTICLE_COUNT }])
    model.update(0.1, 0.016) // first flight frame — starts the dismissal clock
    model.update(2.1, 0.016)

    const positions = positionsOf(model)
    let mean = 0
    for (let i = 0; i < SLAB_PARTICLE_COUNT; i++) mean += positions[i * 3]
    mean /= SLAB_PARTICLE_COUNT
    expect(mean).toBeLessThan(-0.5)
    model.dispose()
  })

  it('a mid-flight plan change never breaks the exit guarantee or the once-only callback (IMPRV-016)', async () => {
    const model = makeGlyphSlabModel(fakeMetrics, singleSlot())
    const onComplete = vi.fn()
    model.update(1.0, 0.016)
    model.dismiss({ duration: 0.5, onComplete })
    model.setPlan([{ glyph: '1', x: 3, count: SLAB_PARTICLE_COUNT }])

    model.update(1.1, 0.016)
    model.update(1.7, 0.016)
    const positions = positionsOf(model)
    for (let i = 0; i < SLAB_PARTICLE_COUNT; i++) {
      expect(positions[i * 3]).toBeGreaterThan(DISMISS_EXIT_X - 2)
    }
    await flushMicrotasks()
    expect(onComplete).toHaveBeenCalledTimes(1)
    model.dispose()
  })

  it('snap() completes the sweep instantly for reduced motion', async () => {
    const model = makeGlyphSlabModel(fakeMetrics, singleSlot())
    const onComplete = vi.fn()
    model.update(0, 0.016)
    model.dismiss({ onComplete })
    model.snap()

    const positions = positionsOf(model)
    for (let i = 0; i < SLAB_PARTICLE_COUNT; i++) {
      expect(positions[i * 3]).toBeGreaterThan(DISMISS_EXIT_X - 2)
    }
    await flushMicrotasks()
    expect(onComplete).toHaveBeenCalledTimes(1)

    // A later static repaint keeps the display empty and the callback fired once.
    model.update(5, 0)
    await flushMicrotasks()
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(positionsOf(model)[0]).toBeGreaterThan(DISMISS_EXIT_X - 2)
    model.dispose()
  })

  it('a substitute transition strategy drives the cloud through construction, updates, and plan changes (RFCTR-007)', () => {
    const half = SLAB_PARTICLE_COUNT / 2
    const twoSlots = (second: string): SlotPlan[] => [
      { glyph: '0', x: 0, count: half },
      { glyph: second, x: 2, count: half },
    ]
    const retargets: { targets: Float32Array; changes: readonly RegionChange[] }[] = []
    let advanced = 0
    const stubFactory = (initial: Float32Array): ValueTransition => {
      const held = initial.slice()
      return {
        retarget(targets, changes) {
          retargets.push({ targets: targets.slice(), changes })
        },
        advance(_delta, out) {
          advanced++
          out.set(held)
          out[0] = 42
          return out
        },
        snap() {},
      }
    }

    const model = makeGlyphSlabModel(fakeMetrics, twoSlots('1'), undefined, stubFactory)
    model.update(0, 0.016)
    expect(advanced).toBeGreaterThan(0)
    // The stub, not the built-in morph, wrote the rendered cloud.
    expect(positionsOf(model)[0]).toBe(42)

    // Changing only the second slot reports exactly that grain region, with
    // its never-changed-before cadence.
    model.setPlan(twoSlots('2'))
    expect(retargets).toHaveLength(1)
    expect(retargets[0].changes).toEqual([{ startGrain: half, grainCount: half, sinceLast: Infinity }])
    model.dispose()
  })

  it('a display that never dismisses morphs exactly as before', () => {
    const model = makeGlyphSlabModel(fakeMetrics, singleSlot())
    model.update(0, 0.016)
    const before = positionsOf(model).slice(0, 30)
    model.setPlan([{ glyph: '1', x: 3, count: SLAB_PARTICLE_COUNT }])
    model.update(2, 0.016) // damped morph has effectively settled by +2s
    const after = positionsOf(model)
    // The cloud followed the plan toward the new column, x = 3.
    let mean = 0
    for (let i = 0; i < SLAB_PARTICLE_COUNT; i++) mean += after[i * 3]
    mean /= SLAB_PARTICLE_COUNT
    expect(mean).toBeGreaterThan(2)
    expect(after.slice(0, 30)).not.toEqual(before)
    model.dispose()
  })
})
