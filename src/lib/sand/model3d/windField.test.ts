import { describe, expect, it } from 'vitest'
import { computeWindVector, createWindField } from './windField'
import type { SpawnTarget, WindSource } from './sandModel'

describe('computeWindVector', () => {
  it('is deterministic for a given time', () => {
    expect(computeWindVector(3.7)).toEqual(computeWindVector(3.7))
  })

  it('scales linearly with speedScale', () => {
    const base = computeWindVector(2.4, 1)
    const scaled = computeWindVector(2.4, 2)
    expect(scaled.wx).toBeCloseTo(base.wx * 2, 10)
    expect(scaled.wy).toBeCloseTo(base.wy * 2, 10)
    expect(scaled.wz).toBeCloseTo(base.wz * 2, 10)
  })

  it('never reverses: horizontal flow stays downwind (+x) through a gust cycle', () => {
    // Gust troughs are clamped to a 0.2 floor, and the direction wobble is small
    // enough (±0.2 rad) that cos stays positive — so wx must never go <= 0.
    for (let t = 0; t < 200; t += 0.05) {
      expect(computeWindVector(t).wx).toBeGreaterThan(0)
    }
  })

  it('produces finite components', () => {
    for (let t = 0; t < 50; t += 1.3) {
      const { wx, wy, wz } = computeWindVector(t)
      expect(Number.isFinite(wx)).toBe(true)
      expect(Number.isFinite(wy)).toBe(true)
      expect(Number.isFinite(wz)).toBe(true)
    }
  })
})

describe('createWindField — model-agnostic engine', () => {
  // A trivial, non-planet source: every grain lifts from a fixed windward point
  // (x <= 0 so the upwind bias never rejects it) with a fixed color. Proves the
  // field sheds sand from anything conforming to WindSource — no planet vocab.
  function trivialSource(): WindSource & { prepareCount: number; spawnCount: number } {
    return {
      prepareCount: 0,
      spawnCount: 0,
      weight: 1000,
      prepare() {
        this.prepareCount++
      },
      sampleSpawn(out: SpawnTarget) {
        this.spawnCount++
        out.position.set(-1, 0, 0)
        out.color[0] = 0.5
        out.color[1] = 0.6
        out.color[2] = 0.7
      },
    }
  }

  it('sheds grains from a trivial source: colors and positions populate over time', () => {
    const source = trivialSource()
    const field = createWindField([source])

    // Advance well past the startup-delay window (lifespanMax = 5s) so every
    // slot has emerged, respawned from the source, and been painted.
    for (let i = 1; i <= 150; i++) field.update(i * 0.1, 0.1)

    expect(source.spawnCount).toBeGreaterThan(0)
    expect(source.prepareCount).toBe(150)

    const colors = field.points.geometry.attributes.color.array as Float32Array
    const positions = field.points.geometry.attributes.position.array as Float32Array
    expect(colors.some((c) => c > 0)).toBe(true)
    expect(positions.every((p) => Number.isFinite(p))).toBe(true)

    field.dispose()
  })

  it('spawns drift downwind (+x) from the windward spawn point', () => {
    const source = trivialSource()
    const field = createWindField([source])
    for (let i = 1; i <= 150; i++) field.update(i * 0.1, 0.1)

    const positions = field.points.geometry.attributes.position.array as Float32Array
    // Grains spawn at x = -1 and drift along +x; at least one live grain should
    // have advanced past its spawn x.
    let maxX = -Infinity
    for (let i = 0; i < positions.length; i += 3) maxX = Math.max(maxX, positions[i])
    expect(maxX).toBeGreaterThan(-1)

    field.dispose()
  })

  it('produces a non-culled additive points cloud', () => {
    const field = createWindField([trivialSource()])
    expect(field.points.frustumCulled).toBe(false)
    field.dispose()
  })

  describe('setBlowing (FEAT-010 — trail when the wind is off)', () => {
    // Mean x of every grain. trivialSource spawns at x = -1; with wind the
    // grains blow toward +x, without wind they settle near the spawn point.
    const meanX = (field: ReturnType<typeof createWindField>) => {
      const p = field.points.geometry.attributes.position.array as Float32Array
      let sum = 0
      let n = 0
      for (let i = 0; i < p.length; i += 3) {
        sum += p[i]
        n++
      }
      return sum / n
    }

    it('keeps the cloud visible whether or not the wind blows', () => {
      const field = createWindField([trivialSource()])
      expect(field.points.visible).toBe(true)
      field.setBlowing(false)
      expect(field.points.visible).toBe(true)
      field.dispose()
    })

    it('with wind off, grains still shed but settle near where the body emitted them (a trail, not a plume)', () => {
      const source = trivialSource()
      const field = createWindField([source])
      field.setBlowing(false)

      for (let i = 1; i <= 150; i++) field.update(i * 0.1, 0.1)

      // The field keeps working: sources are still prepared and sampled...
      expect(source.prepareCount).toBe(150)
      expect(source.spawnCount).toBeGreaterThan(0)
      // ...but the grains stay clustered around the spawn point (x = -1), not
      // blown downwind — so a moving body would leave a trail behind it.
      expect(meanX(field)).toBeLessThan(-0.75)

      field.dispose()
    })

    it('with wind on, grains are carried downwind well past the spawn point', () => {
      const field = createWindField([trivialSource()])
      for (let i = 1; i <= 150; i++) field.update(i * 0.1, 0.1)
      expect(meanX(field)).toBeGreaterThan(-0.7)
      field.dispose()
    })

    it('toggling the wind back on resumes downwind drift', () => {
      const field = createWindField([trivialSource()])
      field.setBlowing(false)
      for (let i = 1; i <= 150; i++) field.update(i * 0.1, 0.1)
      const calmX = meanX(field)

      field.setBlowing(true)
      for (let i = 151; i <= 300; i++) field.update(i * 0.1, 0.1)
      expect(meanX(field)).toBeGreaterThan(calmX)

      field.dispose()
    })
  })

  // Local modification: refreshColors — a live recolor of the source display
  // carries into dust already in the air, not only into future spawns.
  describe('refreshColors', () => {
    it('recolors airborne grains from the source without moving them', () => {
      let tint: [number, number, number] = [1, 0, 0]
      const source: WindSource = {
        weight: 7200,
        sampleSpawn(out: SpawnTarget) {
          out.position.set(0, 0, 0)
          out.color[0] = tint[0]
          out.color[1] = tint[1]
          out.color[2] = tint[2]
        },
      }
      const field = createWindField([source])
      const colors = field.points.geometry.attributes.color.array as Float32Array
      const positions = field.points.geometry.attributes.position.array as Float32Array
      const grains = colors.length / 3
      // Sparkle grains paint white (equal channels), so channel dominance
      // holds for the ~95% non-sparkle rest.
      const dominantFraction = (channel: 0 | 1) => {
        let count = 0
        for (let i = 0; i < grains; i++) {
          if (colors[i * 3 + channel] > colors[i * 3 + (1 - channel)]) count++
        }
        return count / grains
      }

      // One big tick clears every startup delay (respawn), then a normal
      // tick puts the whole pool airborne with rendered colors.
      field.update(0, 6)
      field.update(6, 0.5)
      expect(dominantFraction(0)).toBeGreaterThan(0.9)

      // A tint change alone reaches only future spawns — the air stays red.
      tint = [0, 1, 0]
      field.update(6.5, 0.01)
      expect(dominantFraction(0)).toBeGreaterThan(0.9)

      const held = positions.slice()
      field.refreshColors()
      expect(positions).toEqual(held)
      field.update(6.51, 0.01)
      expect(dominantFraction(1)).toBeGreaterThan(0.9)
      field.dispose()
    })
  })

  // Local modification: recall — straggling dust latches onto live source
  // grains and glides back, riding a value morph into the display.
  describe('recall', () => {
    it('glides airborne grains onto the source point and dissolves them soon after', () => {
      const home: [number, number, number] = [5, 5, 0]
      const source: WindSource = {
        weight: 7200,
        sampleSpawn(out: SpawnTarget) {
          out.position.set(-1, 0, 0)
          out.color[0] = 1
          out.color[1] = 1
          out.color[2] = 1
        },
        samplePoint(_index, out) {
          out.set(home[0], home[1], home[2])
        },
      }
      const field = createWindField([source])
      const positions = field.points.geometry.attributes.position.array as Float32Array
      const grains = positions.length / 3
      const meanDistToHome = () => {
        let sum = 0
        for (let i = 0; i < grains; i++) {
          sum += Math.hypot(positions[i * 3] - home[0], positions[i * 3 + 1] - home[1], positions[i * 3 + 2] - home[2])
        }
        return sum / grains
      }

      // Everyone airborne, drifted for a while off the spawn point.
      field.update(0, 6)
      field.update(6, 0.5)
      const before = meanDistToHome()

      // One second of recall at the morph's damping closes most of the gap.
      field.recall()
      for (let i = 1; i <= 60; i++) field.update(6.5 + i / 60, 1 / 60)
      expect(meanDistToHome()).toBeLessThan(before * 0.2)

      // Recalled grains dissolve and respawn as fresh shed off the source —
      // after their capped lifetime (and the sweep window closing) the pool
      // drifts near the spawn point, not parked at the recall target.
      for (let i = 1; i <= 120; i++) field.update(7.5 + i / 60, 1 / 60)
      expect(meanDistToHome()).toBeGreaterThan(4)
      field.dispose()
    })

    it('keeps sweeping through the window: grains that respawn mid-transition are latched too', () => {
      const home: [number, number, number] = [5, 5, 0]
      const makeSource = (): WindSource => ({
        weight: 7200,
        sampleSpawn(out: SpawnTarget) {
          out.position.set(-1, 0, 0)
          out.color[0] = 1
          out.color[1] = 1
          out.color[2] = 1
        },
        samplePoint(_index, out) {
          out.set(home[0], home[1], home[2])
        },
      })
      const meanDistToHome = (field: ReturnType<typeof createWindField>) => {
        const p = field.points.geometry.attributes.position.array as Float32Array
        let sum = 0
        for (let i = 0; i < p.length; i += 3) {
          sum += Math.hypot(p[i] - home[0], p[i + 1] - home[1], p[i + 2] - home[2])
        }
        return sum / (p.length / 3)
      }

      // Tiny lifespans (0.15–0.5 s): the pool churns fast, so within the
      // sweep window every originally latched grain dies and respawns.
      const swept = createWindField([makeSource()], { lifespanScale: 0.1 })
      const control = createWindField([makeSource()], { lifespanScale: 0.1 })
      swept.update(0, 6)
      control.update(0, 6)

      swept.recall()
      // 0.6 s > the longest scaled lifespan: only the open window re-latching
      // respawned grains can keep the pool pulled toward the display.
      for (let i = 1; i <= 36; i++) {
        swept.update(6 + i / 60, 1 / 60)
        control.update(6 + i / 60, 1 / 60)
      }
      expect(meanDistToHome(control)).toBeGreaterThan(6.5)
      expect(meanDistToHome(swept)).toBeLessThan(4.5)
      swept.dispose()
      control.dispose()
    })
  })
})
