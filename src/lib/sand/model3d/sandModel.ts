// The model contract for the 3D sand renderer.
//
// A "sand model" is anything the generic renderer can turn into drifting
// sand: it yields the renderable point clouds to add to the scene, a
// per-frame update + morph control, and the set of wind sources that shed
// grains into the global wind field. The renderer knows nothing about
// planets — planet generation lives behind a configurator
// (`makePlanetModel`) that produces a conforming model.

import type * as THREE from 'three'

export type RGB = [number, number, number]

/**
 * One grain's spawn, filled in place by a `WindSource`. World-space
 * position + base color. Reused across spawns so the wind field stays
 * allocation-free in its hot loop.
 */
export interface SpawnTarget {
  position: THREE.Vector3
  color: RGB
}

/**
 * A cloud that sheds sand into the wind field. The model supplies one per
 * shedding cloud (a planet yields a body source and, if ringed, a ring
 * source); the generic field samples them in proportion to `weight`.
 */
export interface WindSource {
  /** Relative sampling weight — the cloud's particle count. */
  weight: number
  /**
   * Fill `out` with one world-space spawn position and base color. The
   * source owns its own shape (sphere, disc, …), color, and any
   * morph-driven shift; the field only reads the result.
   */
  sampleSpawn(out: SpawnTarget): void
  /**
   * Optional per-frame hook, called once before the spawn loop. Sources
   * that spawn off a live `THREE.Object3D` use this to refresh its
   * `matrixWorld` so spawns read current transforms even when the field
   * is driven before the host updates the scene graph.
   */
  prepare?(): void
}

/**
 * A model the sand renderer can consume. Produced by a configurator (e.g.
 * `makePlanetModel`) and handed to `createSandRenderer` — the renderer's
 * own types carry no model-domain vocabulary.
 */
export interface SandModel {
  /** Renderable roots to add to the scene (e.g. a tilt group). */
  objects: THREE.Object3D[]
  /** Clouds that shed sand into the wind field. */
  windSources: WindSource[]
  /** Advance the model: morph damping, rotation, per-cloud point updates. */
  update(t: number, delta: number): void
  /** Set the morph target (1 = glyph, 0 = rest); damped internally. */
  setMorphTarget(v: number): void
  /**
   * The currently displayed value as plain text, for models that depict
   * text (a number, a digit string). The renderer mirrors it into a
   * visually-hidden DOM readout so assistive tech can perceive the value
   * with no consumer wiring (A11Y-004). Models with no text equivalent
   * (planets, plants) omit it and leave naming to the consumer's host.
   */
  getAccessibleText?(): string
  /**
   * The target layout's extent in world units, for models that lay out
   * glyphs (local modification). The renderer's `fitToView` reads it to
   * frame the value; it reflects the layout targets, not in-flight grain
   * positions, so it is stable mid-morph and mid-dismissal. Shape models
   * (planets, plants) omit it, which leaves `fitToView` inert.
   */
  getBounds?(): { width: number; height: number }
  /** Release GPU resources owned by the model's renderable clouds. */
  dispose(): void
}
