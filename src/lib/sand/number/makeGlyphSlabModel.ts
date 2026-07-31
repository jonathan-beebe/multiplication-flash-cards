// The shared imperative shell for the sand glyph displays (counter, clock):
// a fixed pool of grains rendered as a flat sheet of glyph slots, animating
// plan→plan through a ValueTransition strategy (RFCTR-007) — the damped
// morph by default. Wrappers own the value semantics and the pure layout
// that turns a value or string into a slot plan; this shell owns sampling,
// target reuse, geometry, color, and wind.
//
// The sheet is geometrically flat (z = 0). Depth is faked per grain with a
// random dimming factor: real z-jitter under the perspective camera smears
// off-center glyphs horizontally (a grain's depth shifts its projected x in
// proportion to |x|), which read as fuzzy edge digits. The dimming was
// always a per-grain uniform draw, so shading is unchanged.

import * as THREE from 'three'
import type { SandModel, SpawnTarget, WindSource } from '../model3d/sandModel'
import { elapsedDelta } from './digitTransition'
import { makeMorphTransition, type RegionChange, type ValueTransitionFactory } from './valueTransition'
import { parkSurplus, sampleSlot } from './digitField'
import {
  DISMISS_DURATION,
  DISMISS_EXIT_X,
  DISMISS_RAMP,
  flightDistance,
  loftOffset,
  planFlight,
  swirlOffset,
  type FlightPlan,
  type SwirlOffset,
} from './dismissal'
import { sampleGradient, type GradientStop } from './gradientPalette'
import type { GlyphMetrics } from './glyphMetrics'

// IMPRV-012: 4200 → 7200 so heavy glyphs gain grains instead of light ones
// thinning — 7200/(3 × area('8')) matches the old 3-digit counter's
// lightest-digit density almost exactly. Fixed at runtime as ever.
/** Grain pool shared by every slab display; plans redistribute it, never resize it. */
export const SLAB_PARTICLE_COUNT = 7200
/** Glyph half-extent in world units — wrappers rasterize their alphabet at this. */
export const GLYPH_SCALE = 1.0

const POINT_SIZE = 1.6

// Warm dune sand, jittered per grain so the slab reads granular.
const SAND_COLOR: [number, number, number] = [0.94, 0.78, 0.52]
const COLOR_JITTER = 0.18

// Stable per-grain offset (±) on a gradient's sample position, so a palette
// ramp reads as granular texture instead of a perfectly smooth print.
const GRADIENT_NOISE = 0.05

// Same twinkle shape as the planet bodies and plants.
const SPARKLE_BASE = 0.55
const SPARKLE_AMP = 0.45
const SPARKLE_FREQ_1 = 1.7
const SPARKLE_FREQ_2 = 2.7
const GLINT_FRACTION = 0.1

// "Front" grains paint at full color; the faux depth dims toward this floor.
const DEPTH_MIN = 0.25

function sparkle(t: number, phase: number) {
  const s1 = Math.sin(t * SPARKLE_FREQ_1 + phase * 1.7)
  const s2 = Math.sin(t * SPARKLE_FREQ_2 + phase * 0.9)
  return SPARKLE_BASE + SPARKLE_AMP * s1 * s2
}

/** One slot of a display plan: which glyph, at which column x, with how many grains. */
export interface SlotPlan {
  glyph: string
  x: number
  /** Vertical slot offset; omitted → 0 (glyph bbox-centered on the row). */
  y?: number
  count: number
  /** Grains that carry the glyph; the rest of the region parks as duplicates. Omitted → all of them. */
  active?: number
}

export interface DismissOptions {
  /** Total transition length, seconds. Default 2. */
  duration?: number
  /** Fires exactly once, on a microtask after the sand is completely gone. */
  onComplete?: () => void
}

export interface GlyphSlabModel extends SandModel {
  /** Aim the cloud at a new plan; counts must sum to SLAB_PARTICLE_COUNT. A call mid-morph redirects in flight. */
  setPlan(plan: SlotPlan[]): void
  /** Complete any in-flight morph — or dismissal — instantly, for static (reduced-motion) frames. */
  snap(): void
  /**
   * Blow every grain of the display off downwind (FEAT-024). One-shot: the
   * display cannot be refilled — hosts reset by swapping in a fresh model
   * after `onComplete`; later calls are ignored. The display stays live as
   * it departs: plan changes keep landing mid-flight, so a still-ticking
   * value morphs on the wind (IMPRV-016). Under reduced motion, follow with
   * `snap()` to complete instantly.
   */
  dismiss(options?: DismissOptions): void
  /**
   * Swap the live gradient without a model swap, so a color change can ride
   * an in-flight morph (local modification — upstream fixes the gradient at
   * construction). `undefined` or empty reverts to the flat warm-sand
   * default. Takes effect on the current frame (static frames included).
   */
  setGradient(gradient?: readonly GradientStop[]): void
}

/**
 * The sand slab a glyph display renders through, starting on `initialPlan`.
 * An optional `gradient` (ordered stops, bottom → top) colors each grain by
 * its current vertical position instead of the flat warm-sand default. An
 * optional `makeTransition` chooses the value-change style (RFCTR-007);
 * omitted, the classic damped morph applies.
 */
export function makeGlyphSlabModel(
  metrics: GlyphMetrics,
  initialPlan: SlotPlan[],
  gradient?: readonly GradientStop[],
  makeTransition: ValueTransitionFactory = makeMorphTransition,
): GlyphSlabModel {
  const n = SLAB_PARTICLE_COUNT

  // The current target sheet, persistent across composes, plus the slot map
  // that produced it: a slot whose glyph, column, and grain region are all
  // unchanged keeps its exact previous targets — its region is simply left
  // alone — so steady glyphs (a stable leading digit, a clock's colons) are
  // perfectly stationary while their neighbors transition.
  const sampled = new Float32Array(n * 3)
  interface Slot {
    glyph: string
    x: number
    y: number
    start: number
    count: number
    active: number
    /** Whether this compose resampled the slot (vs. keeping its exact targets). */
    changed: boolean
    /** Renderer-clock time of the previous resample — how fast this slot is churning. */
    changedAt: number
  }
  let slots: Slot[] = []
  function composeTarget(plan: SlotPlan[]): Float32Array {
    let start = 0
    const nextSlots = plan.map(({ glyph, x, y = 0, count, active = count }, i) => {
      const prev = slots[i]
      const unchanged =
        prev !== undefined &&
        prev.glyph === glyph &&
        prev.x === x &&
        prev.y === y &&
        prev.start === start &&
        prev.count === count &&
        prev.active === active
      const slot: Slot = {
        glyph,
        x,
        y,
        start,
        count,
        active,
        changed: !unchanged,
        changedAt: prev?.changedAt ?? -Infinity,
      }
      if (!unchanged) {
        sampleSlot(metrics.profileOf(glyph), metrics.norm, x, y, sampled, start, active)
        parkSurplus(sampled, start, active, count)
      }
      start += count
      return slot
    })
    slots = nextSlots
    return sampled
  }

  const transition = makeTransition(composeTarget(initialPlan))

  const positions = new Float32Array(n * 3)
  const colors = new Float32Array(n * 3)
  const baseColors = new Float32Array(n * 3)
  const phases = new Float32Array(n)
  const depthShade = new Float32Array(n)
  const isGlint = new Uint8Array(n)
  const glintBoost = new Float32Array(n)
  // Gradient texture is two stable per-grain draws: the shared brightness
  // jitter (kept out of baseColors, which a gradient rewrites every frame)
  // and a small offset on the sample position. Both are always allocated so
  // setGradient can move between flat and gradient coloring at runtime
  // (local modification — upstream allocates them only with a gradient).
  let activeGradient = gradient !== undefined && gradient.length > 0 ? gradient : null
  const grainJitter = new Float32Array(n)
  const grainOffset = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    grainJitter[i] = 1 - COLOR_JITTER + Math.random() * COLOR_JITTER * 2
    grainOffset[i] = (Math.random() * 2 - 1) * GRADIENT_NOISE
    phases[i] = Math.random() * Math.PI * 2
    depthShade[i] = DEPTH_MIN + (1 - DEPTH_MIN) * Math.random()
    if (Math.random() < GLINT_FRACTION) {
      isGlint[i] = 1
      glintBoost[i] = 0.5 + Math.random() * 0.5
    }
  }
  transition.advance(0, positions)

  // Re-read every grain's color from the gradient at its *current* y — grains
  // migrate between slots when the plan changes, so a construction-time
  // assignment would smear after the first morph. The 0..1 span is the fixed
  // glyph row (centered at y=0, half-extent GLYPH_SCALE), not the cloud's
  // per-frame min/max, which would pulse as the cloud breathes. Runs at
  // construction too, so wind spawns and static frames read correct colors
  // before the first update.
  function refreshGradientColors(stops: readonly GradientStop[]): void {
    for (let i = 0; i < n; i++) {
      const t = (positions[i * 3 + 1] + GLYPH_SCALE) / (2 * GLYPH_SCALE) + grainOffset[i]
      sampleGradient(stops, t, baseColors, i * 3)
      const jitter = grainJitter[i]
      baseColors[i * 3 + 0] = Math.min(1, baseColors[i * 3 + 0] * jitter)
      baseColors[i * 3 + 1] = Math.min(1, baseColors[i * 3 + 1] * jitter)
      baseColors[i * 3 + 2] = Math.min(1, baseColors[i * 3 + 2] * jitter)
    }
  }

  // The flat warm-sand default; position-independent, so one refresh suffices
  // until the next setGradient.
  function refreshFlatColors(): void {
    for (let i = 0; i < n; i++) {
      const jitter = grainJitter[i]
      baseColors[i * 3 + 0] = Math.min(1, SAND_COLOR[0] * jitter)
      baseColors[i * 3 + 1] = Math.min(1, SAND_COLOR[1] * jitter)
      baseColors[i * 3 + 2] = Math.min(1, SAND_COLOR[2] * jitter)
    }
  }

  if (activeGradient) refreshGradientColors(activeGradient)
  else refreshFlatColors()

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.PointsMaterial({
    size: POINT_SIZE,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: true,
  })
  const points = new THREE.Points(geometry, material)
  points.renderOrder = 0

  // The morph runs on wall time derived from `t`, not on the render loop's
  // `delta`: that delta is clamped to 50ms for the wind physics, so below
  // ~20fps it runs slower than real time and a 1s-tick display would never
  // finish settling — every frame showing the old and new glyphs overlapped.
  // A value morph is damped with no overshoot, so completing across one big
  // slow frame is exactly the right outcome.
  let lastT: number | null = null

  // The one-shot blow-away (FEAT-024). The flight is an additive per-grain
  // offset on top of the live morph-driven positions — not a frozen
  // snapshot — so plan changes keep landing and a still-ticking display
  // morphs on the wind as it departs (IMPRV-016). The morph only ever moves
  // grains within the display's static glyph layout, so the exit-distance
  // guarantee is unaffected by mid-flight updates.
  interface ActiveDismissal {
    duration: number
    onComplete?: () => void
    /** Renderer-clock time of the first flight frame; null until then. */
    startT: number | null
    /** True once snap() completed the sweep — elapsed pins to `duration`. */
    snapped: boolean
    completed: boolean
    plan: FlightPlan
  }
  let dismissal: ActiveDismissal | null = null

  const swirl: SwirlOffset = { x: 0, y: 0 }
  function addFlightOffsets(elapsed: number) {
    const d = dismissal!
    const { speed, drift, delay, swirlPhase, swirlRadius, swirlTurn, loft } = d.plan
    // The gust front (IMPRV-017, lobed by IMPRV-019): each grain lifts when
    // the front's finger reaches it — windward edge first — and until then
    // keeps riding the live morph untouched, so waiting sand still ticks
    // rather than freezes. On lift-off it puffs upward before the carry
    // dominates, and in flight it loops around its drifting eddy center
    // (IMPRV-018).
    for (let i = 0; i < n; i++) {
      const dist = flightDistance(elapsed - delay[i], DISMISS_RAMP)
      if (dist <= 0) continue
      const travelled = speed[i] * dist
      swirlOffset(travelled, swirlPhase[i], swirlRadius[i], swirlTurn[i], swirl)
      positions[i * 3 + 0] += travelled + swirl.x
      positions[i * 3 + 1] += drift[i] * dist + swirl.y + loftOffset(travelled, loft[i])
    }
    if (elapsed >= d.duration && !d.completed) {
      d.completed = true
      const done = d.onComplete
      // Microtask so a host's teardown/reset never re-enters the render
      // loop mid-update.
      if (done) queueMicrotask(done)
    }
  }

  function update(t: number, _delta: number) {
    transition.advance(elapsedDelta(lastT, t), positions)
    lastT = t
    if (dismissal) {
      if (dismissal.startT === null) dismissal.startT = t
      // Elapsed clamps at the duration: once complete, the flown grains
      // hold just past the exit distance instead of racing toward float
      // infinity.
      addFlightOffsets(dismissal.snapped ? dismissal.duration : Math.min(t - dismissal.startT, dismissal.duration))
    }
    // The loop below already rewrites all n grain colors per frame, so the
    // gradient re-read is not a new cost class.
    if (activeGradient) refreshGradientColors(activeGradient)
    for (let i = 0; i < n; i++) {
      const s = sparkle(t, phases[i])
      if (isGlint[i]) {
        const k = glintBoost[i] * depthShade[i] * s
        colors[i * 3 + 0] = k
        colors[i * 3 + 1] = k
        colors[i * 3 + 2] = k
      } else {
        const k = s * depthShade[i]
        colors[i * 3 + 0] = baseColors[i * 3 + 0] * k
        colors[i * 3 + 1] = baseColors[i * 3 + 1] * k
        colors[i * 3 + 2] = baseColors[i * 3 + 2] * k
      }
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
  }

  // Sheds grains off the live (mid-morph) cloud, so lifted sand separates
  // from wherever the display currently is, matching the plant models.
  const windSource: WindSource = {
    weight: n,
    prepare() {
      points.updateWorldMatrix(true, false)
    },
    sampleSpawn(out: SpawnTarget) {
      const i = (Math.random() * n) | 0
      out.position
        .set(positions[i * 3 + 0], positions[i * 3 + 1], positions[i * 3 + 2])
        .applyMatrix4(points.matrixWorld)
      out.color[0] = baseColors[i * 3 + 0]
      out.color[1] = baseColors[i * 3 + 1]
      out.color[2] = baseColors[i * 3 + 2]
    },
  }

  return {
    objects: [points],
    windSources: [windSource],
    update,
    setPlan(plan: SlotPlan[]) {
      // Plan changes land even mid-dismissal — the display keeps ticking
      // while its sand blows away (IMPRV-016). The strategy receives each
      // resampled region with its churn cadence, so it can treat a per-frame
      // churn (a clock's ms digits) differently from a slow tick.
      const now = lastT ?? 0
      composeTarget(plan)
      const changes: RegionChange[] = []
      for (const slot of slots) {
        if (!slot.changed) continue
        changes.push({ startGrain: slot.start, grainCount: slot.count, sinceLast: now - slot.changedAt })
        slot.changedAt = now
      }
      transition.retarget(sampled, changes)
    },
    snap() {
      transition.snap()
      if (dismissal && !dismissal.snapped) {
        // Reduced motion: a full-field sweep is vestibular-risk motion, so
        // complete it instantly — display empty, callback still exactly once.
        dismissal.snapped = true
        transition.advance(0, positions)
        addFlightOffsets(dismissal.duration)
        geometry.attributes.position.needsUpdate = true
      }
    },
    dismiss(options: DismissOptions = {}) {
      if (dismissal) return
      const duration = Math.max(options.duration ?? DISMISS_DURATION, 0.05)
      dismissal = {
        duration,
        onComplete: options.onComplete,
        startT: null,
        snapped: false,
        completed: false,
        // Planned off the cloud's positions at the trigger: the front delay
        // derives from each grain's windward-normalized x, the swirl phase
        // from its neighborhood.
        plan: planFlight(positions, duration, DISMISS_RAMP, DISMISS_EXIT_X),
      }
    },
    setGradient(next?: readonly GradientStop[]) {
      activeGradient = next !== undefined && next.length > 0 ? next : null
      // Refresh base colors immediately; the next update() — the animated
      // loop or the host's repaintStaticFrame() — renders them.
      if (activeGradient) refreshGradientColors(activeGradient)
      else refreshFlatColors()
    },
    setMorphTarget() {
      // Hover morph is a planet behavior — the displays are driven by data.
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
