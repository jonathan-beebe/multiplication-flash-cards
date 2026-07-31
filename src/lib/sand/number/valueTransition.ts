// The value-change transition seam (RFCTR-007): the strategy a glyph slab
// display animates its plan→plan changes through. The shell keeps the slot
// bookkeeping — which grain regions a retarget resampled, and how long each
// held its previous glyph — and hands it over; a strategy owns the per-grain
// kinematics between retargets. The default is the damped morph the displays
// have always used; alternative styles implement the same contract in their
// own module, chosen per display at construction, without touching the shell.

import {
  advanceMorph,
  catchUpSettle,
  createDigitTransition,
  retarget as retargetMorph,
  settleRegion,
  writePositions,
} from './digitTransition'

/** A grain region a retarget resampled, and how long it held its previous glyph. */
export interface RegionChange {
  startGrain: number
  grainCount: number
  /** Seconds since this region last resampled — the slot's churn cadence; Infinity on its first change. */
  sinceLast: number
}

/**
 * Per-grain kinematics between value changes. All arrays are xyz-interleaved
 * over the display's fixed grain pool.
 */
export interface ValueTransition {
  /**
   * Aim every grain at `targets` (copied, not aliased). A call mid-flight
   * must depart from wherever the cloud currently is — never jump. `changes`
   * lists only the resampled regions; grains outside them already sit on
   * their (unchanged) targets.
   */
  retarget(targets: Float32Array, changes: readonly RegionChange[]): void
  /** Advance `delta` seconds of wall time, write the current cloud into `out`, and return it. Delta 0 is a repaint. */
  advance(delta: number, out: Float32Array): Float32Array
  /** Land every grain on its target instantly (reduced motion). */
  snap(): void
}

/** Builds a display's transition from its initial settled targets (copied, not aliased). */
export type ValueTransitionFactory = (initial: Float32Array) => ValueTransition

// Damping rate for the plan→plan morph; ~0.5s to visually settle, well
// inside the demo displays' 1s tick.
const MORPH_LAMBDA = 6

// How much of its journey a slot must complete before its next change, no
// matter how fast changes arrive. Slots changing slower than the morph
// settles (≳0.4s at λ=6) get no top-up at all; a per-frame churn (a clock's
// ms digits) settles ~this fraction onto each fresh sample, which keeps the
// cloud spread near the glyph's full sample spread (√(R/(2−R)) ≈ 0.9)
// instead of collapsing onto the sample mean (IMPRV-013).
const SETTLE_REACH = 0.9

/**
 * The default transition: a damped source→target morph over the pure
 * digitTransition core, with the per-frame-churn catch-up settle (IMPRV-013)
 * applied to each changed region by its own cadence.
 */
export function makeMorphTransition(initial: Float32Array): ValueTransition {
  const state = createDigitTransition(initial)
  return {
    retarget(targets, changes) {
      retargetMorph(state, targets)
      for (const { startGrain, grainCount, sinceLast } of changes) {
        const fraction = catchUpSettle(MORPH_LAMBDA, sinceLast, SETTLE_REACH)
        if (fraction > 0) settleRegion(state, startGrain, grainCount, fraction)
      }
    },
    advance(delta, out) {
      advanceMorph(state, MORPH_LAMBDA, delta)
      return writePositions(state, out)
    },
    snap() {
      state.morph = 1
    },
  }
}
