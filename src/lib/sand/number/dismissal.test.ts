import { describe, expect, it } from 'vitest'
import {
  DISMISS_RAMP,
  FRONT_FRACTION,
  LOFT_MAX,
  SWIRL_MAX,
  flightDistance,
  loftOffset,
  planFlight,
  swirlOffset,
} from './dismissal'

describe('flightDistance', () => {
  it('is 0 before lift-off', () => {
    expect(flightDistance(0, DISMISS_RAMP)).toBe(0)
    expect(flightDistance(-1, DISMISS_RAMP)).toBe(0)
  })

  it('is continuous where the ramp tops out', () => {
    const r = DISMISS_RAMP
    expect(flightDistance(r, r)).toBeCloseTo(r / 2, 10)
    expect(flightDistance(r + 1e-6, r)).toBeCloseTo(r / 2, 5)
  })

  it('advances at top speed after the ramp', () => {
    const r = DISMISS_RAMP
    expect(flightDistance(r + 1, r) - flightDistance(r, r)).toBeCloseTo(1, 10)
  })

  it('is monotonically increasing', () => {
    let prev = 0
    for (let tau = 0.05; tau < 3; tau += 0.05) {
      const d = flightDistance(tau, DISMISS_RAMP)
      expect(d).toBeGreaterThan(prev)
      prev = d
    }
  })
})

/** Stride-3 base positions from x/y pairs (z = 0, as the slab is flat). */
function basePositions(xs: number[], ys?: number[]): Float32Array {
  const out = new Float32Array(xs.length * 3)
  for (let i = 0; i < xs.length; i++) {
    out[i * 3 + 0] = xs[i]
    out[i * 3 + 1] = ys?.[i] ?? 0
  }
  return out
}

/** n random base positions spread over the slab's typical extent. */
function randomBase(n: number): Float32Array {
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < n; i++) {
    xs.push(Math.random() * 3 - 1.5)
    ys.push(Math.random() * 2 - 1)
  }
  return basePositions(xs, ys)
}

describe('planFlight', () => {
  const n = 500
  const duration = 2
  const exitX = 12

  it('guarantees every grain reaches the exit distance by the duration, net of delay and swirl', () => {
    const plan = planFlight(randomBase(n), duration, DISMISS_RAMP, exitX, Math.random)
    for (let i = 0; i < n; i++) {
      const travelled = plan.speed[i] * flightDistance(duration - plan.delay[i], DISMISS_RAMP)
      // Even a worst-case upwind swirl excursion leaves the grain past exitX.
      expect(travelled - SWIRL_MAX).toBeGreaterThanOrEqual(exitX - 1e-3)
    }
  })

  it('the gust front still arrives windward-first on average: band mean delays grow with x (IMPRV-017)', () => {
    // Lobes make individual delays non-monotone, but the front must still
    // advance: windward third lifts earlier than the middle, middle earlier
    // than the downwind third.
    const base = randomBase(n)
    const plan = planFlight(base, duration, DISMISS_RAMP, exitX, Math.random)
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => base[a * 3] - base[b * 3])
    const third = Math.floor(n / 3)
    const meanDelay = (idxs: number[]) => idxs.reduce((sum, i) => sum + plan.delay[i], 0) / idxs.length
    const windward = meanDelay(order.slice(0, third))
    const middle = meanDelay(order.slice(third, 2 * third))
    const downwind = meanDelay(order.slice(2 * third))
    expect(windward).toBeLessThan(middle)
    expect(middle).toBeLessThan(downwind)
  })

  it('some grains lift essentially at the trigger — no stall (IMPRV-015)', () => {
    const plan = planFlight(randomBase(n), duration, DISMISS_RAMP, exitX, Math.random)
    const frontTime = FRONT_FRACTION * duration
    let earliest = Infinity
    for (let i = 0; i < n; i++) earliest = Math.min(earliest, plan.delay[i])
    expect(earliest).toBeLessThan(0.1 * frontTime)
  })

  it('the front is lobed, not straight: same-x grains at different heights lift at different times (IMPRV-019)', () => {
    // rng pinned to 0.5 zeroes the per-grain jitter, so any delay difference
    // between same-x grains comes from the eddy-phase lobes alone.
    const pinned = () => 0.5
    const plan = planFlight(basePositions([0, 0, -1.5, 1.5], [0.8, -0.6, 0, 0]), duration, DISMISS_RAMP, exitX, pinned)
    expect(plan.delay[0]).not.toBe(plan.delay[1])
  })

  it('no grain waits past the front-crossing time', () => {
    const plan = planFlight(randomBase(n), duration, DISMISS_RAMP, exitX, Math.random)
    const frontTime = FRONT_FRACTION * duration
    for (let i = 0; i < n; i++) {
      expect(plan.delay[i]).toBeGreaterThanOrEqual(0)
      expect(plan.delay[i]).toBeLessThanOrEqual(frontTime + 1e-9)
    }
  })

  it('a degenerate cloud with no x spread lifts all at once', () => {
    const plan = planFlight(basePositions([2, 2, 2]), duration, DISMISS_RAMP, exitX, Math.random)
    for (let i = 0; i < 3; i++) expect(plan.delay[i]).toBe(0)
  })

  it('varies grain speeds so the cloud stretches instead of sweeping in lockstep', () => {
    const plan = planFlight(randomBase(n), duration, DISMISS_RAMP, exitX, Math.random)
    let min = Infinity
    let max = 0
    for (let i = 0; i < n; i++) {
      min = Math.min(min, plan.speed[i])
      max = Math.max(max, plan.speed[i])
    }
    expect(min).toBeGreaterThan(0)
    expect(max / min).toBeGreaterThan(1.2)
  })

  it('keeps vertical drift a small fraction of downwind speed', () => {
    const plan = planFlight(randomBase(n), duration, DISMISS_RAMP, exitX, Math.random)
    for (let i = 0; i < n; i++) {
      expect(Math.abs(plan.drift[i])).toBeLessThanOrEqual(0.12 * plan.speed[i] + 1e-6)
    }
  })

  it('grains at the same base position share an eddy — same phase, spin, and radius', () => {
    const pinned = () => 0.5
    const plan = planFlight(basePositions([0.4, 0.4, -1.2], [0.3, 0.3, -0.5]), duration, DISMISS_RAMP, exitX, pinned)
    expect(plan.swirlPhase[0]).toBe(plan.swirlPhase[1])
    expect(plan.swirlTurn[0]).toBe(plan.swirlTurn[1])
    expect(plan.swirlRadius[0]).toBe(plan.swirlRadius[1])
    expect(plan.swirlPhase[2]).not.toBe(plan.swirlPhase[0])
  })

  it('adjacent eddies counter-rotate: both spin directions appear across the cloud (IMPRV-018)', () => {
    const plan = planFlight(randomBase(n), duration, DISMISS_RAMP, exitX, Math.random)
    let cw = 0
    let ccw = 0
    for (let i = 0; i < n; i++) {
      if (plan.swirlTurn[i] > 0) ccw++
      if (plan.swirlTurn[i] < 0) cw++
    }
    expect(cw).toBeGreaterThan(0)
    expect(ccw).toBeGreaterThan(0)
  })

  it('the eddy field is not periodic: phases along a y column do not advance linearly (IMPRV-020)', () => {
    // A linear phase field (phase = kx·x + ky·y) advances by the same
    // increment for every equal y step — the screen-wide periodicity that
    // read as a DNA helix. Sample a column of grains at equal spacing wider
    // than an eddy; with the per-grain jitter pinned to zero, at least one
    // consecutive phase increment must differ from the others.
    const pinned = () => 0.5
    const ys = [-1.2, -0.4, 0.4, 1.2]
    const plan = planFlight(basePositions([0, 0, 0, 0], ys), duration, DISMISS_RAMP, exitX, pinned)
    const increments = []
    for (let i = 1; i < ys.length; i++) increments.push(plan.swirlPhase[i] - plan.swirlPhase[i - 1])
    const spread = Math.max(...increments) - Math.min(...increments)
    expect(spread).toBeGreaterThan(1e-6)
  })

  it('the eddy field is continuous: dense y neighbors get near-equal delay and phase — no seams (IMPRV-021)', () => {
    // A piecewise-constant field (one hash per cell) jumps by up to its full
    // range wherever a cell boundary falls between two neighboring grains —
    // the pickup visibly lifts in chunks. Sample a dense y column (plus two
    // anchors so the cloud has an x span and the front term is nonzero);
    // with the per-grain jitter pinned to zero, adjacent grains 0.01 apart
    // must never jump by more than a sliver of the lobe/phase range.
    const pinned = () => 0.5
    const xs = [-1.5, 1.5]
    const ys = [0, 0]
    for (let y = -1.4; y <= 1.4; y += 0.01) {
      xs.push(0)
      ys.push(y)
    }
    const plan = planFlight(basePositions(xs, ys), duration, DISMISS_RAMP, exitX, pinned)
    let maxDelayJump = 0
    let maxPhaseJump = 0
    for (let i = 3; i < xs.length; i++) {
      maxDelayJump = Math.max(maxDelayJump, Math.abs(plan.delay[i] - plan.delay[i - 1]))
      maxPhaseJump = Math.max(maxPhaseJump, Math.abs(plan.swirlPhase[i] - plan.swirlPhase[i - 1]))
    }
    expect(maxDelayJump).toBeLessThan(0.02)
    expect(maxPhaseJump).toBeLessThan(0.5)
  })

  it('the eddy layout re-deals between dismissals: different draws flip some spins (IMPRV-020)', () => {
    // The same cloud dismissed twice must not swirl identically: with two
    // different (constant) rng streams, at least one grain's spin direction
    // must differ — impossible while spin is a pure function of position.
    const base = randomBase(n)
    const a = planFlight(base, duration, DISMISS_RAMP, exitX, () => 0.25)
    const b = planFlight(base, duration, DISMISS_RAMP, exitX, () => 0.75)
    let flipped = 0
    for (let i = 0; i < n; i++) {
      if (Math.sign(a.swirlTurn[i]) !== Math.sign(b.swirlTurn[i])) flipped++
    }
    expect(flipped).toBeGreaterThan(0)
  })

  it('keeps every eddy radius inside the swirl bound', () => {
    const plan = planFlight(randomBase(n), duration, DISMISS_RAMP, exitX, Math.random)
    for (let i = 0; i < n; i++) {
      expect(plan.swirlRadius[i]).toBeGreaterThan(0)
      expect(plan.swirlRadius[i]).toBeLessThanOrEqual(SWIRL_MAX / 2 + 1e-9)
    }
  })

  it('gives every grain an upward loft amplitude inside the loft bound (IMPRV-019)', () => {
    const plan = planFlight(randomBase(n), duration, DISMISS_RAMP, exitX, Math.random)
    for (let i = 0; i < n; i++) {
      expect(plan.loft[i]).toBeGreaterThan(0)
      expect(plan.loft[i]).toBeLessThanOrEqual(LOFT_MAX + 1e-9)
    }
    expect(LOFT_MAX).toBeLessThan(0.5)
  })
})

describe('loftOffset', () => {
  it('is zero at lift-off', () => {
    expect(loftOffset(0, 0.3)).toBe(0)
    expect(loftOffset(-1, 0.3)).toBe(0)
  })

  it('puffs the grain upward early, never past its amplitude', () => {
    let peak = 0
    for (let s = 0.05; s < 14; s += 0.05) {
      const y = loftOffset(s, 0.3)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThanOrEqual(0.3 + 1e-9)
      peak = Math.max(peak, y)
    }
    // The puff actually reaches its amplitude somewhere in the first units.
    expect(peak).toBeGreaterThan(0.29)
  })

  it('fades as the carry takes over: far downwind the loft is spent', () => {
    const peak = loftOffset(1.2, 0.3)
    expect(loftOffset(10, 0.3)).toBeLessThan(0.05 * peak)
  })
})

describe('swirlOffset', () => {
  const out = { x: 0, y: 0 }

  it('is zero at lift-off', () => {
    swirlOffset(0, 1.3, 0.15, 1.1, out)
    expect(out.x).toBe(0)
    expect(out.y).toBe(0)
    swirlOffset(-1, 1.3, 0.15, 1.1, out)
    expect(out.x).toBe(0)
    expect(out.y).toBe(0)
  })

  it('stays a hint — bounded by twice the radius over the whole flight', () => {
    const radius = SWIRL_MAX / 2
    for (let phase = 0; phase < 7; phase += 0.37) {
      for (let s = 0; s < 14; s += 0.05) {
        swirlOffset(s, phase, radius, 1.1, out)
        expect(Math.abs(out.x)).toBeLessThanOrEqual(SWIRL_MAX + 1e-9)
        expect(Math.abs(out.y)).toBeLessThanOrEqual(SWIRL_MAX + 1e-9)
      }
    }
    expect(SWIRL_MAX).toBeLessThan(0.5)
  })

  it('traces a curling arc, not a flat wave: the offset rotates through both axes', () => {
    // Along the flight the displacement must sweep a 2D arc — successive
    // deltas keep turning in one direction (nonzero swept area), which a
    // y-only wave (zero x) can never do.
    const pts: Array<[number, number]> = []
    for (let s = 2; s < 10; s += 0.25) {
      swirlOffset(s, 0.7, 0.15, 1.1, out)
      pts.push([out.x, out.y])
    }
    let sweep = 0
    for (let i = 2; i < pts.length; i++) {
      const ax = pts[i - 1][0] - pts[i - 2][0]
      const ay = pts[i - 1][1] - pts[i - 2][1]
      const bx = pts[i][0] - pts[i - 1][0]
      const by = pts[i][1] - pts[i - 1][1]
      sweep += ax * by - ay * bx
    }
    expect(Math.abs(sweep)).toBeGreaterThan(1e-3)
    const xs = pts.map((p) => p[0])
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.05)
  })

  it('flipping the spin sign reverses the rotation direction', () => {
    const sweepOf = (turn: number) => {
      const pts: Array<[number, number]> = []
      for (let s = 2; s < 10; s += 0.25) {
        swirlOffset(s, 0.7, 0.15, turn, out)
        pts.push([out.x, out.y])
      }
      let sweep = 0
      for (let i = 2; i < pts.length; i++) {
        const ax = pts[i - 1][0] - pts[i - 2][0]
        const ay = pts[i - 1][1] - pts[i - 2][1]
        const bx = pts[i][0] - pts[i - 1][0]
        const by = pts[i][1] - pts[i - 1][1]
        sweep += ax * by - ay * bx
      }
      return sweep
    }
    expect(Math.sign(sweepOf(1.1))).toBe(-Math.sign(sweepOf(-1.1)))
  })
})
