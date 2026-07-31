// The explosion value-change transition (FEAT-026): on a value change, each
// resampled region's grains blast outward from their glyph — radially off
// the region's centroid — then converge onto the new glyph as the burst
// envelope dies. Built on the same pure digitTransition core as the classic
// morph: the convergence is the damped source→target settle, and the burst
// is an additive per-grain offset whose envelope rises from zero (a
// retarget never jumps) and decays out. On a re-retarget mid-burst the
// residual offset is folded into the morph source, so the cloud departs
// exactly from where it is rendered. The burst scales with the region's
// churn cadence: a calm 1s tick gets the full blast, a per-frame churn (a
// clock's ms digits) gets a negligible one plus the same IMPRV-013 catch-up
// settle as the morph, so churning digits stay legible.

import {
  advanceMorph,
  catchUpSettle,
  createDigitTransition,
  retarget as retargetMorph,
  settleRegion,
  writePositions,
} from './digitTransition'
import type { ValueTransition } from './valueTransition'

// Same damped settle rate as the classic morph, so the display lands well
// inside the demo's 1s tick.
const CONVERGE_LAMBDA = 6
// Same churn catch-up as the morph (IMPRV-013).
const SETTLE_REACH = 0.9

/** Seconds from a value change to the widest scatter. */
export const BURST_PEAK_TIME = 0.18
// Scatter reach at the envelope peak, world units (glyph half-extent is 1):
// every burst clears the glyph decisively, none leaves the stage.
const BURST_MIN = 1.2
const BURST_MAX = 2.6
// A region changing at least this slowly gets the full blast; faster
// cadences scale it down linearly, to essentially nothing at per-frame
// churn — permanent chaos is not a transition.
const FULL_BURST_CADENCE = 0.5

// Rises from 0, peaks at 1 when age = BURST_PEAK_TIME, decays to nothing —
// by the next 1s tick under 3% of the blast remains.
function burstEnvelope(age: number): number {
  const a = age / BURST_PEAK_TIME
  return a * Math.exp(1 - a)
}

/**
 * The full-field variant (FEAT-027): every retarget blasts the ENTIRE grain
 * pool as one region — whatever the shell reports changed, at full strength
 * — so even a near-identical change (a clock resetting to the current time)
 * reads as one boom that re-forms into the new value. Not for churning
 * displays: retargeted every frame this is permanent chaos. Hosts fire it
 * for one deliberate change, e.g. an explosive reset.
 */
export function makeFullBlastTransition(initial: Float32Array): ValueTransition {
  const inner = makeExplosionTransition(initial)
  const grainCount = initial.length / 3
  return {
    ...inner,
    retarget(targets) {
      inner.retarget(targets, [{ startGrain: 0, grainCount, sinceLast: Infinity }])
    },
  }
}

/** The explosion transition: grains burst out and re-form into the new value. */
export function makeExplosionTransition(initial: Float32Array): ValueTransition {
  const state = createDigitTransition(initial)
  const grainCount = initial.length / 3
  // Per-grain burst vector (xy; the slab sheet is flat) and seconds since it
  // was dealt. A zeroed vector renders no offset at any age.
  const burst = new Float32Array(grainCount * 2)
  const age = new Float32Array(grainCount)

  return {
    retarget(targets, changes) {
      retargetMorph(state, targets)
      const { source } = state
      for (const region of changes) {
        const begin = region.startGrain
        const end = region.startGrain + region.grainCount
        // Depart from the rendered cloud, residual blast included: fold each
        // grain's live offset into the freshly rebased source.
        for (let i = begin; i < end; i++) {
          const e = burstEnvelope(age[i])
          source[i * 3 + 0] += burst[i * 2 + 0] * e
          source[i * 3 + 1] += burst[i * 2 + 1] * e
        }
        // Blast radially off the region's centroid at departure.
        let cx = 0
        let cy = 0
        for (let i = begin; i < end; i++) {
          cx += source[i * 3 + 0]
          cy += source[i * 3 + 1]
        }
        cx /= region.grainCount
        cy /= region.grainCount
        const scale = Math.min(1, region.sinceLast / FULL_BURST_CADENCE)
        for (let i = begin; i < end; i++) {
          let dx = source[i * 3 + 0] - cx
          let dy = source[i * 3 + 1] - cy
          const len = Math.hypot(dx, dy)
          if (len > 1e-6) {
            dx /= len
            dy /= len
          } else {
            const theta = Math.random() * Math.PI * 2
            dx = Math.cos(theta)
            dy = Math.sin(theta)
          }
          const reach = (BURST_MIN + Math.random() * (BURST_MAX - BURST_MIN)) * scale
          burst[i * 2 + 0] = dx * reach
          burst[i * 2 + 1] = dy * reach
          age[i] = 0
        }
        const fraction = catchUpSettle(CONVERGE_LAMBDA, region.sinceLast, SETTLE_REACH)
        if (fraction > 0) settleRegion(state, region.startGrain, region.grainCount, fraction)
      }
    },
    advance(delta, out) {
      advanceMorph(state, CONVERGE_LAMBDA, delta)
      writePositions(state, out)
      for (let i = 0; i < grainCount; i++) {
        age[i] += delta
        const e = burstEnvelope(age[i])
        out[i * 3 + 0] += burst[i * 2 + 0] * e
        out[i * 3 + 1] += burst[i * 2 + 1] * e
      }
      return out
    },
    snap() {
      state.morph = 1
      burst.fill(0)
    },
  }
}
