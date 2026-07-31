import * as THREE from 'three'
import { shuffledRange } from '../mathUtils'
import type { SpawnTarget, WindSource } from './sandModel'

const POOL_FRACTION = 0.04
const POOL_MIN = 200
const POOL_MAX = 2000

// Wind blows along world +x. Gust modulates speed; direction wobble veers it
// gently around the Y axis; vertical wobble lifts/dips it. Wind is one global
// field — every source sees the same vector, so sand from one model drifts
// past the next.
const WIND_BASE_SPEED = 0.32
const WIND_GUST_FREQ = 0.7
const WIND_GUST_AMP = 0.4
const WIND_GUST_FREQ_2 = 1.31
const WIND_GUST_AMP_2 = 0.18
const WIND_DIR_FREQ = 0.13
const WIND_DIR_AMP = 0.2
const WIND_VERTICAL_FREQ = 0.09
const WIND_VERTICAL_AMP = 0.07

const LIFESPAN_MIN = 1.5
const LIFESPAN_MAX = 5.0
const VEL_JITTER_X = 0.18
const VEL_JITTER_Y = 0.1
const VEL_JITTER_Z = 0.1
const FADE_IN = 0.1
// Tail exponent < 1 gives a soft, long fade-out: rapid drop at first, then a
// slow asymptote toward zero — sparse grains drifting into the distance.
const FADE_TAIL_EXP = 0.55
// Reject downwind spawns this fraction of the time, retrying up to MAX_ATTEMPTS.
// Net effect: ~80% of grains lift from the windward face.
const UPWIND_BIAS = 0.7
const MAX_ATTEMPTS = 4

const DRIFT_POINT_SIZE = 1.1

// Fraction of wind grains painted white instead of base color — bright glints
// in the trailing dust. Boost is fixed per slot (variety, no flicker);
// respawns rotate the visible sparkles over time.
const SPARKLE_FRACTION = 0.05

export interface WindVector {
  wx: number
  wy: number
  wz: number
}

/**
 * The global wind vector at time `t`. Pure — extracted so the gust/direction
 * model can be unit-tested without a WebGL context.
 */
export function computeWindVector(t: number, speedScale = 1): WindVector {
  const dirAngle = Math.sin(t * WIND_DIR_FREQ) * WIND_DIR_AMP
  const gust = 1 + WIND_GUST_AMP * Math.sin(t * WIND_GUST_FREQ) + WIND_GUST_AMP_2 * Math.sin(t * WIND_GUST_FREQ_2 + 1.7)
  const vertical = Math.sin(t * WIND_VERTICAL_FREQ + 1.3) * WIND_VERTICAL_AMP
  // Clamp so a deep gust trough doesn't reverse the wind.
  const speed = WIND_BASE_SPEED * Math.max(0.2, gust) * speedScale
  return {
    wx: Math.cos(dirAngle) * speed,
    wy: vertical * speed,
    wz: Math.sin(dirAngle) * speed,
  }
}

function fade(p: number) {
  if (p < FADE_IN) return p / FADE_IN
  const u = (p - FADE_IN) / (1 - FADE_IN)
  return Math.max(0, 1 - Math.pow(u, FADE_TAIL_EXP))
}

type Pool = {
  positions: Float32Array
  colors: Float32Array
  baseColors: Float32Array
  velJitter: Float32Array
  life: Float32Array
  lifespan: Float32Array
  isSparkle: Uint8Array
  sparkleBoost: Float32Array
}

function makePool(size: number, lifespanMin: number, lifespanMax: number): Pool {
  const positions = new Float32Array(size * 3)
  const colors = new Float32Array(size * 3)
  const baseColors = new Float32Array(size * 3)
  const velJitter = new Float32Array(size * 3)
  const life = new Float32Array(size)
  const lifespan = new Float32Array(size)
  const isSparkle = new Uint8Array(size)
  const sparkleBoost = new Float32Array(size)
  for (let i = 0; i < size; i++) {
    lifespan[i] = lifespanMin + Math.random() * (lifespanMax - lifespanMin)
    // Negative life = startup delay, uniformly spread across lifespanMax.
    // Without it, every slot is "expired" on frame 1 and they all respawn
    // simultaneously — a visible burst. Staggered delays let the wind trickle
    // on as if it's picking up.
    life[i] = -Math.random() * lifespanMax
    velJitter[i * 3 + 0] = (Math.random() - 0.5) * VEL_JITTER_X
    velJitter[i * 3 + 1] = (Math.random() - 0.5) * VEL_JITTER_Y
    velJitter[i * 3 + 2] = (Math.random() - 0.5) * VEL_JITTER_Z
  }

  // Tag exactly SPARKLE_FRACTION of slots as sparkle. Shuffled-range pick
  // guarantees an exact count (vs. per-particle rng() drift).
  const sparkleCount = Math.round(size * SPARKLE_FRACTION)
  const order = shuffledRange(size, Math.random)
  for (let k = 0; k < sparkleCount; k++) {
    const idx = order[k]
    isSparkle[idx] = 1
    sparkleBoost[idx] = Math.random()
  }

  return { positions, colors, baseColors, velJitter, life, lifespan, isSparkle, sparkleBoost }
}

export interface WindFieldOptions {
  /** Multiplier on global wind speed. Default 1. */
  speedScale?: number
  /** Multiplier on each grain's lifespan (and startup stagger). Default 1. */
  lifespanScale?: number
}

export interface WindField {
  points: THREE.Points
  update(t: number, delta: number): void
  /**
   * Turn the wind on/off. The grains keep shedding from each body either way —
   * when off, the global wind vector is zero and the windward (upwind) spawn
   * bias is dropped, so grains lift evenly and stay where they're emitted
   * instead of being blown downwind. A moving body therefore leaves a trail of
   * sand along its path rather than a downwind plume. Default on.
   */
  setBlowing(on: boolean): void
  dispose(): void
}

/**
 * The global wind field: a fixed pool of grains that lift from each source's
 * windward face, drift along the wind vector, fade, and respawn. Model-
 * agnostic — every shape-, color-, and morph-specific decision lives behind
 * `WindSource.sampleSpawn`; the field owns only the drift/lifespan/fade engine
 * and the upwind-bias retry.
 */
export function createWindField(sources: WindSource[], options: WindFieldOptions = {}): WindField {
  const speedScale = options.speedScale ?? 1
  const lifespanScale = options.lifespanScale ?? 1
  const lifespanMin = LIFESPAN_MIN * lifespanScale
  const lifespanMax = LIFESPAN_MAX * lifespanScale

  // Cumulative weights for sampling sources proportional to their particle count.
  const cumWeights = new Float32Array(sources.length)
  let totalWeight = 0
  for (let i = 0; i < sources.length; i++) {
    totalWeight += sources[i].weight
    cumWeights[i] = totalWeight
  }

  const poolSize = Math.max(POOL_MIN, Math.min(POOL_MAX, Math.round(totalWeight * POOL_FRACTION)))
  const pool = makePool(poolSize, lifespanMin, lifespanMax)
  const tmp = new THREE.Vector3()
  // Reused spawn target — sampleSpawn writes into this every attempt, so the
  // hot respawn loop stays allocation-free.
  const spawnOut: SpawnTarget = { position: tmp, color: [0, 0, 0] }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pool.positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(pool.colors, 3))
  const material = new THREE.PointsMaterial({
    size: DRIFT_POINT_SIZE,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geometry, material)
  // frustumCulled=false: positions are mutated every frame in world space and
  // the cached bounding sphere goes stale, which would cull the entire pool.
  points.frustumCulled = false

  // When off, grains still shed from each (moving) body but the wind vector is
  // zero, so they stay where emitted and the body leaves a trail (FEAT-010).
  let blowing = true

  function update(t: number, delta: number) {
    // Let each source refresh its world transform so spawns read current
    // matrices even if this field is driven before the host updates the scene.
    for (const source of sources) source.prepare?.()

    // No wind → zero vector: grains drift only by their small per-grain jitter,
    // settling near where the body shed them rather than blowing downwind.
    const { wx, wy, wz } = blowing ? computeWindVector(t, speedScale) : { wx: 0, wy: 0, wz: 0 }

    for (let i = 0; i < poolSize; i++) {
      const prevLife = pool.life[i]
      const li = prevLife + delta
      const ls = pool.lifespan[i]
      if (li >= ls) {
        respawn(i)
      } else if (li < 0) {
        // Still in startup delay — tick life, paint transparent (additive).
        pool.life[i] = li
        pool.colors[i * 3 + 0] = 0
        pool.colors[i * 3 + 1] = 0
        pool.colors[i * 3 + 2] = 0
      } else if (prevLife < 0) {
        // Just emerged from delay — respawn so it lifts from a real source
        // instead of drifting from its uninitialized origin.
        respawn(i)
      } else {
        pool.life[i] = li
        const vx = wx + pool.velJitter[i * 3 + 0]
        const vy = wy + pool.velJitter[i * 3 + 1]
        const vz = wz + pool.velJitter[i * 3 + 2]
        pool.positions[i * 3 + 0] += vx * delta
        pool.positions[i * 3 + 1] += vy * delta
        pool.positions[i * 3 + 2] += vz * delta
        const a = fade(li / ls)
        if (pool.isSparkle[i]) {
          // Sparkle: white with a per-particle boost so each glint has its own
          // stable peak brightness. Brightness lerps from the grain's current
          // life alpha up to that ceiling, so it still fades with its life curve.
          const boost = a + (1 - a) * pool.sparkleBoost[i]
          pool.colors[i * 3 + 0] = boost
          pool.colors[i * 3 + 1] = boost
          pool.colors[i * 3 + 2] = boost
        } else {
          pool.colors[i * 3 + 0] = pool.baseColors[i * 3 + 0] * a
          pool.colors[i * 3 + 1] = pool.baseColors[i * 3 + 1] * a
          pool.colors[i * 3 + 2] = pool.baseColors[i * 3 + 2] * a
        }
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
  }

  function pickSourceIndex(): number {
    const r = Math.random() * totalWeight
    for (let i = 0; i < cumWeights.length; i++) {
      if (r < cumWeights[i]) return i
    }
    return cumWeights.length - 1
  }

  function respawn(i: number) {
    if (totalWeight <= 0) {
      pool.life[i] = pool.lifespan[i]
      return
    }

    let sampled = false
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      sources[pickSourceIndex()].sampleSpawn(spawnOut)
      sampled = true
      // Upwind bias: prefer windward (world -x) spawns. Reject downwind samples
      // most of the time, retrying with a fresh source pick. Skipped when the
      // wind is off — with no wind there's no windward face, so grains should
      // shed evenly over the body to form a symmetric trail, not a -x cluster.
      if (!blowing || tmp.x <= 0 || Math.random() > UPWIND_BIAS) break
    }

    if (!sampled) {
      pool.life[i] = pool.lifespan[i]
      return
    }

    pool.positions[i * 3 + 0] = tmp.x
    pool.positions[i * 3 + 1] = tmp.y
    pool.positions[i * 3 + 2] = tmp.z
    pool.baseColors[i * 3 + 0] = spawnOut.color[0]
    pool.baseColors[i * 3 + 1] = spawnOut.color[1]
    pool.baseColors[i * 3 + 2] = spawnOut.color[2]
    pool.colors[i * 3 + 0] = 0
    pool.colors[i * 3 + 1] = 0
    pool.colors[i * 3 + 2] = 0
    pool.life[i] = 0
    pool.lifespan[i] = lifespanMin + Math.random() * (lifespanMax - lifespanMin)
  }

  function setBlowing(on: boolean) {
    blowing = on
  }

  function dispose() {
    geometry.dispose()
    material.dispose()
  }

  return { points, update, setBlowing, dispose }
}
