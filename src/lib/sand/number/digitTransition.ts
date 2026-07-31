// The value→value transition core for the numbers model: a per-particle
// source/target pair with a damped morph factor. Unlike the planet's
// hover morph (0 = sphere, 1 = glyph, reversible), this machine only ever
// travels source → target; changing value mid-flight rebases the source
// to the current interpolated positions, so a tick landing mid-morph
// redirects the cloud from wherever it is. Pure data + functions — the
// three.js wiring lives in makeNumberModel.

/** Per-particle transition state, xyz-interleaved. */
export interface DigitTransition {
  /** Where each particle departs from. */
  source: Float32Array
  /** Where each particle is headed. */
  target: Float32Array
  /** Damped progress: 0 = at source, 1 = settled on target. */
  morph: number
}

/** Start settled on `initial` (copied, not aliased). */
export function createDigitTransition(initial: Float32Array): DigitTransition {
  return {
    source: initial.slice(),
    target: initial.slice(),
    morph: 1,
  }
}

/**
 * Aim the transition at `nextTarget` (copied, not aliased). The source is
 * rebased to the current interpolated positions first, so the cloud departs
 * from where it is — settled or mid-flight — without jumping.
 */
export function retarget(state: DigitTransition, nextTarget: Float32Array): void {
  const { source, target, morph } = state
  for (let i = 0; i < source.length; i++) {
    source[i] += (target[i] - source[i]) * morph
  }
  target.set(nextTarget)
  state.morph = 0
}

/**
 * The fraction of the remaining distance a just-retargeted slot must close
 * immediately so that, together with the natural morph, it reaches `reach`
 * of its target before the next change — assuming changes keep arriving at
 * the observed `interval`. A slot changing slower than the morph settles
 * needs no help: the fraction is 0 and the standard morph is untouched.
 * Without this top-up, a per-frame churn only closes ~λ·dt per change, and
 * grains chasing fresh random samples collapse onto the sample mean
 * (IMPRV-013's center-clumped ms digits).
 */
export function catchUpSettle(lambda: number, interval: number, reach: number): number {
  return Math.max(0, 1 - (1 - reach) * Math.exp(lambda * interval))
}

/**
 * Immediately close `fraction` of the source→target distance for the grain
 * range [startGrain, startGrain + grainCount). Meant to run right after
 * `retarget` (morph 0), where moving the source moves the visible cloud;
 * grains outside the range, the morph factor, and the target are untouched.
 */
export function settleRegion(state: DigitTransition, startGrain: number, grainCount: number, fraction: number): void {
  const { source, target, morph } = state
  const end = (startGrain + grainCount) * 3
  for (let i = startGrain * 3; i < end; i++) {
    const p = source[i] + (target[i] - source[i]) * morph
    source[i] = p + (target[i] - p) * fraction
  }
}

/** Advance the morph toward 1 with framerate-independent damping. */
export function advanceMorph(state: DigitTransition, lambda: number, delta: number): void {
  state.morph = 1 + (state.morph - 1) * Math.exp(-lambda * delta)
}

/**
 * The real time elapsed between consecutive samples of an animation clock:
 * 0 on the first sample, and 0 again when the clock restarts from zero (a
 * motion-mode swap rebuilds the renderer's timer), never negative. Feeding
 * this to advanceMorph keeps the morph on wall time even when the render
 * loop's own delta is clamped for physics.
 */
export function elapsedDelta(lastT: number | null, t: number): number {
  return lastT === null ? 0 : Math.max(0, t - lastT)
}

/** Write the current interpolated cloud into `out` and return it. */
export function writePositions(state: DigitTransition, out: Float32Array): Float32Array {
  const { source, target, morph } = state
  for (let i = 0; i < source.length; i++) {
    out[i] = source[i] + (target[i] - source[i]) * morph
  }
  return out
}
