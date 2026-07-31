// The blow-away dismissal core (FEAT-024): when a display is dismissed, its
// entire grain pool — not just the wind field's small drift pool — flies
// downwind (+x) and off-frame. Pure data + functions; makeGlyphSlabModel
// wires them to the live cloud. The gust arrives as a front (IMPRV-017): it
// reaches the windward (left) edge of the cloud first and grabs grains
// progressively as it advances downwind, each grain lifting after a delay
// proportional to its windward-normalized x — spatially *correlated*
// staggering, unlike the uncorrelated per-grain staggers IMPRV-015 removed
// for reading as a stalled cloud eroding from the wrong side. Granularity
// comes from a per-grain speed spread, with each grain's speed sized against
// its own remaining flight time so that EVERY grain is past the exit
// distance when the configured duration elapses — "completely gone" is
// guaranteed by construction, not judged by a per-frame frustum test, which
// keeps the model camera-agnostic (ARCH-001).

/** Seconds the dismissal wind takes to ease up to its top speed. */
export const DISMISS_RAMP = 0.3
/** Default total transition duration, seconds. */
export const DISMISS_DURATION = 2
/**
 * Model-space x distance that guarantees off-frame: the default camera
 * (distance 4.2, fov 50) sees a half-width of ~2 world units per unit of
 * stage aspect ratio, so 12 clears even a very wide stage with margin.
 */
export const DISMISS_EXIT_X = 12
/**
 * Fraction of the duration the gust front takes to cross the cloud from its
 * windward to its downwind edge (IMPRV-017). Grains ahead of the front keep
 * their ambient morph/tick untouched, so the wait reads as calm, not freeze.
 */
export const FRONT_FRACTION = 0.25
// Ragged front: ± jitter on each grain's front-arrival, as a fraction of the
// front-crossing time, so the gust edge tears rather than slicing cleanly.
const FRONT_JITTER = 0.15
// Lobed front (IMPRV-019): each eddy shifts its grains' front-arrival, so
// the gust tears in as curling fingers aligned with the vortex structure —
// a digit's top and bottom tear loose at different moments — instead of a
// straight vertical line sweeping right.
const FRONT_LOBE = 0.18
// Fastest grain over the slowest, minus one: speeds spread uniformly across
// [1, 1 + SPEED_SPREAD] × the exit-exactly-at-duration speed, so the cloud
// stretches downwind as it flies instead of translating in lockstep. 0.4
// matches the speed ratio the FEAT-024 stagger produced, so the grain
// texture of the departing cloud reads as before. Half of each grain's
// position in that spread is shared with its neighbors (via the swirl
// phase), so speed varies in patches — downwind density clumps — rather
// than pure per-grain noise, which would only widen the spray.
const SPEED_SPREAD = 0.4
// Vertical scatter as a fraction of a grain's downwind speed.
const DRIFT_FRACTION = 0.12

// Swirl (IMPRV-017, reshaped by IMPRV-018/IMPRV-020): each grain loops
// around a local eddy center that drifts downwind with it — a cycloid, not a
// flat wave. Nearby grains share an eddy (angle origin, spin, front lobe),
// and both spin directions occur across the cloud, but eddy identity is
// hashed, not graded: the IMPRV-018 linear phase field advanced uniformly
// with y and alternated spin on a fixed period, which still read as a
// screen-wide DNA helix.
const SWIRL_RADIUS_MAX = 0.17
// Radii spread across [RADIUS_MIN_FRACTION, 1] × max within an eddy, so a
// vortex stays granular instead of orbiting as a rigid ring.
const SWIRL_RADIUS_MIN_FRACTION = 0.35
// Rotation rate in radians per travelled world unit: base × [0.7, 1.3], so
// an average grain completes a turn every ~6 units — a few slow curls over
// the 12-unit flight, not a drill bit.
const SWIRL_TURN_BASE = 1.1
const SWIRL_TURN_SPREAD = 0.6
// Amplitude eases in over the first travelled units so lift-off stays smooth.
const SWIRL_RAMP_DIST = 1.5
// Loft (IMPRV-019): freshly torn sand puffs upward before the downwind carry
// dominates — saltation, not horizontal streaking. The puff peaks after
// LOFT_RISE travelled units and is spent a few units later.
/** Hard bound on a grain's upward loft — a hint, inside the glyph half-height. */
export const LOFT_MAX = 0.3
const LOFT_MIN_FRACTION = 0.3
const LOFT_RISE = 1.2
/** Hard bound on each |swirlOffset| component — a hint, inside the glyph half-height. */
export const SWIRL_MAX = 2 * SWIRL_RADIUS_MAX
// Eddy field (IMPRV-020, smoothed by IMPRV-021): per-cell hashes give the
// field its irregularity — no gradient that could read as a period — and
// smooth interpolation between them keeps it seamless: a grain's phase,
// spin, and front lobe vary continuously with position, so nothing lifts in
// per-cell chunks. A per-dismissal salt and grid offset re-deal the layout
// every dismissal. The per-grain jitter keeps neighboring grains from
// orbiting in lockstep.
const EDDY_SIZE = 0.7
const PHASE_JITTER = 0.6

// Integer mix of an eddy cell's coords (plus a stream salt) into a uniform
// [0, 1) draw — deterministic per (cell, salt), uncorrelated across cells.
function hashCell(ix: number, iy: number, salt: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ salt
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

// 2D value noise: smoothstep-bilinear blend of the four surrounding corner
// hashes — continuous everywhere, irregular across cells.
function valueNoise(px: number, py: number, salt: number): number {
  const ix = Math.floor(px)
  const iy = Math.floor(py)
  const fx = px - ix
  const fy = py - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = hashCell(ix, iy, salt)
  const b = hashCell(ix + 1, iy, salt)
  const c = hashCell(ix, iy + 1, salt)
  const d = hashCell(ix + 1, iy + 1, salt)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

export interface FlightPlan {
  /** Per-grain top wind speed along +x, world units/s. */
  speed: Float32Array
  /** Per-grain vertical velocity (± scatter), world units/s. */
  drift: Float32Array
  /** Per-grain lift-off delay after the trigger — the gust front's arrival. */
  delay: Float32Array
  /** Per-grain eddy angle origin, shared by base-position neighbors. */
  swirlPhase: Float32Array
  /** Per-grain orbit radius around the eddy center, world units. */
  swirlRadius: Float32Array
  /** Per-grain signed spin, radians per travelled unit — sign follows the smooth eddy field. */
  swirlTurn: Float32Array
  /** Per-grain upward puff amplitude at lift-off, world units. */
  loft: Float32Array
}

/** Scratch target for `swirlOffset` — one per caller, reused per grain. */
export interface SwirlOffset {
  x: number
  y: number
}

/**
 * Distance factor `tau` seconds after the trigger, in "seconds at top
 * speed": the integral of a linear 0→1 speed ramp over `ramp` seconds —
 * τ²/2R while the wind rises, τ − R/2 once it tops out. Multiply by a
 * grain's speed for world units.
 */
export function flightDistance(tau: number, ramp: number): number {
  if (tau <= 0) return 0
  if (tau < ramp) return (tau * tau) / (2 * ramp)
  return tau - ramp / 2
}

/**
 * Displacement of a grain that has travelled `s` world units downwind: the
 * grain orbits an eddy center drifting with it — angle `phase + s·turn` on a
 * circle of `radius`, minus the lift-off point so the offset starts at zero —
 * a cycloid through both axes. Pure and stateless per frame — the slab
 * recomputes flight offsets from the live morph base every frame, so the
 * swirl must be a function of progress, not an integrated velocity. Writes
 * into `out` to keep the 7200-grain frame loop allocation-free.
 */
export function swirlOffset(s: number, phase: number, radius: number, turn: number, out: SwirlOffset): void {
  if (s <= 0) {
    out.x = 0
    out.y = 0
    return
  }
  const ease = Math.min(1, s / SWIRL_RAMP_DIST)
  const a = phase + s * turn
  out.x = radius * ease * (Math.cos(a) - Math.cos(phase))
  out.y = radius * ease * (Math.sin(a) - Math.sin(phase))
}

/**
 * Upward displacement of a grain that has travelled `s` world units: rises
 * from zero at lift-off to `amp` at LOFT_RISE, then decays as the carry
 * dominates — the puff of sand being torn off a surface. Same
 * stateless-over-progress contract as `swirlOffset`.
 */
export function loftOffset(s: number, amp: number): number {
  if (s <= 0) return 0
  const u = s / LOFT_RISE
  return amp * u * Math.exp(1 - u)
}

/**
 * A flight for every grain of `basePositions` (stride 3, the cloud at the
 * moment of dismissal) such that each grain lifts when the gust front
 * reaches its x and has still travelled at least `exitX` by `duration`: the
 * slowest, last-grabbed grain exits exactly at the duration, the rest streak
 * ahead. `rng` is injectable so tests can pin the draws.
 */
export function planFlight(
  basePositions: Float32Array,
  duration: number,
  ramp: number,
  exitX: number,
  rng: () => number = Math.random,
): FlightPlan {
  const n = (basePositions.length / 3) | 0
  const speed = new Float32Array(n)
  const drift = new Float32Array(n)
  const delay = new Float32Array(n)
  const swirlPhase = new Float32Array(n)
  const swirlRadius = new Float32Array(n)
  const swirlTurn = new Float32Array(n)
  const loft = new Float32Array(n)

  let minX = Infinity
  let maxX = -Infinity
  for (let i = 0; i < n; i++) {
    const x = basePositions[i * 3]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
  }
  const span = maxX - minX
  const invSpan = span > 0 ? 1 / span : 0
  const frontTime = FRONT_FRACTION * duration
  // One deal per dismissal: a fresh salt and grid offset move every eddy, so
  // the same cloud never swirls the same way twice.
  const salt = (rng() * 0xffffffff) | 0
  const gridX = rng() * EDDY_SIZE
  const gridY = rng() * EDDY_SIZE

  for (let i = 0; i < n; i++) {
    const x = basePositions[i * 3]
    const y = basePositions[i * 3 + 1]
    const px = (x + gridX) / EDDY_SIZE
    const py = (y + gridY) / EDDY_SIZE
    const eddyPhase = valueNoise(px, py, salt) * Math.PI * 2
    const lobe = 2 * valueNoise(px, py, salt ^ 0x85ebca6b) - 1
    // Signed-sqrt shaping: interpolation biases the raw field toward zero, so
    // pull magnitudes back up while keeping the sign crossing continuous —
    // spin flips happen through a near-still eddy, never as a seam.
    const turnRaw = 2 * valueNoise(px, py, salt ^ 0xc2b2ae35) - 1
    const spin = Math.sign(turnRaw) * Math.sqrt(Math.abs(turnRaw))
    // No x spread → no front to cross: the gust takes the cloud at once.
    // Otherwise the eddy lobe bends the front into fingers and the jitter
    // frays its edge.
    const ragged = span > 0 ? (x - minX) * invSpan + FRONT_LOBE * lobe + (rng() - 0.5) * FRONT_JITTER : 0
    delay[i] = frontTime * Math.min(1, Math.max(0, ragged))
    const phase = eddyPhase + (rng() - 0.5) * PHASE_JITTER
    swirlPhase[i] = phase
    swirlRadius[i] = SWIRL_RADIUS_MAX * (SWIRL_RADIUS_MIN_FRACTION + (1 - SWIRL_RADIUS_MIN_FRACTION) * rng())
    swirlTurn[i] = spin * SWIRL_TURN_BASE * (1 - SWIRL_TURN_SPREAD / 2 + SWIRL_TURN_SPREAD * rng())
    loft[i] = LOFT_MAX * (LOFT_MIN_FRACTION + (1 - LOFT_MIN_FRACTION) * rng())
    // Half random, half eddy-correlated: patches of neighbors fly at similar
    // speeds, so the stretching cloud clumps instead of blurring uniformly.
    const mix = 0.5 * rng() + 0.5 * (0.5 + 0.5 * Math.sin(phase * 0.77))
    // Sized against the swirl's worst upwind excursion so the exit distance
    // holds by construction even mid-loop.
    const exitSpeed = (exitX + SWIRL_MAX) / flightDistance(duration - delay[i], ramp)
    speed[i] = exitSpeed * (1 + SPEED_SPREAD * mix)
    drift[i] = (rng() * 2 - 1) * DRIFT_FRACTION * speed[i]
  }
  return { speed, drift, delay, swirlPhase, swirlRadius, swirlTurn, loft }
}
