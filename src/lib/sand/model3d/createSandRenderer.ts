import * as THREE from 'three'
import type { SandModel } from './sandModel'
import { createWindField, type WindField } from './windField'
import { resolveMotionMode, type MotionMode, type MotionSwappable } from '../motionMode'

export interface SandRendererOptions {
  /** Model to render first. Produced by a configurator (e.g. `makePlanetModel`). */
  model: SandModel
  /** Camera distance from origin. Default 4.2 — frames a unit-radius model. */
  cameraDistance?: number
  /** Vertical field of view in degrees. Default 50. */
  fov?: number
  /** Cap on devicePixelRatio for the renderer. Default 2. */
  maxPixelRatio?: number
  /**
   * Uniform display scale applied to each of the model's renderable roots.
   * Default 1. Multiplies the root world transform — independent of (and
   * stacks with) any scale the model bakes into its own clouds. The demo
   * uses this to render models at log-relative sizes in a single stage.
   */
  displayScale?: number
  /**
   * Fit the model to the view (local modification): a uniform contain-fit
   * scale so the model's target bounds span this fraction of the visible
   * stage at z = 0. Needs a model exposing `getBounds`; without one the
   * option is inert. Re-evaluated every frame — animated frames glide
   * toward the fit, static frames snap — so it tracks both container
   * resizes and value-width changes. Overrides `displayScale` while active.
   */
  fitToView?: number
  /**
   * Presentation mode. `'auto'` (default) reads `prefers-reduced-motion:
   * reduce` and paints a single static frame when set; `'animated'`
   * always runs the loop; `'static'` always paints one frame and skips
   * the loop, even when the OS preference allows motion.
   */
  motionMode?: MotionMode
  /**
   * Whether the wind blows. Default `true`. When `false`, grains still shed
   * from each body but aren't blown — a moving body leaves a trail of settling
   * sand instead of a downwind plume. Toggle at runtime via `setWindEnabled`.
   */
  windEnabled?: boolean
}

export interface SandRenderer extends MotionSwappable {
  /** Swap to a different model, rebuilding the point clouds. Disposes the old model. */
  setModel(model: SandModel): void
  /** Update the uniform display scale; persists across `setModel`. */
  setDisplayScale(scale: number): void
  /** Current uniform display scale. */
  readonly displayScale: number
  /** Enable/disable the wind field; persists across `setModel` and motion swaps. */
  setWindEnabled(on: boolean): void
  /**
   * Re-draw airborne wind-grain colors from the model (local modification).
   * Call after a live recolor (`setGradient`) so dust already in the air
   * rides the color change with the display instead of fading out in the
   * old palette.
   */
  refreshWindColors(): void
  /**
   * Sweep airborne wind grains back into the display (local modification).
   * Call at the start of a value morph: each straggler latches onto a live
   * model grain and glides to it, riding the morph into the new glyph
   * instead of hanging where it drifted.
   */
  recallWind(): void
  /**
   * Repaint the single static frame after the caller mutates the model's
   * data (e.g. a clock advancing its displayed time). No-op in animated
   * mode, where the loop repaints every frame anyway.
   */
  repaintStaticFrame(): void
  /** Tear down the loop, observers, listeners, GPU resources, and the model. */
  destroy(): void
}

/**
 * The imperative shell: mounts a sand model into `container`. Owns the
 * three.js renderer/scene/camera, the animation loop, resize handling, and
 * pointer-to-morph interaction — none of it model-specific. The renderable
 * clouds, wind sources, and morph behavior all come from the supplied
 * `SandModel`. For models that expose `getAccessibleText` (the number and
 * digit-string displays), the shell also owns the accessible name: a
 * visually-hidden text readout kept in sync with the displayed value, so a
 * screen reader perceives the value with no consumer wiring (A11Y-004) and
 * users can select and copy it like real text (FEAT-023).
 */
// True when a non-collapsed user selection includes (part of) `el`.
function selectionTouches(el: HTMLElement): boolean {
  const sel = el.ownerDocument.getSelection()
  return !!sel && !sel.isCollapsed && sel.containsNode(el, true)
}

/** Damping rate for the animated glide toward the fitted scale (per second). */
const FIT_DAMPING = 4

/**
 * Contain-fit (local modification): the uniform scale at which `bounds`
 * spans `fraction` of the view in its tighter dimension. Null when either
 * extent is degenerate — callers keep their current scale.
 */
export function fitViewScale(
  bounds: { width: number; height: number },
  view: { width: number; height: number },
  fraction: number,
): number | null {
  if (!(bounds.width > 0) || !(bounds.height > 0)) return null
  return Math.min((fraction * view.width) / bounds.width, (fraction * view.height) / bounds.height)
}

export function createSandRenderer(container: HTMLElement, options: SandRendererOptions): SandRenderer {
  const cameraDistance = options.cameraDistance ?? 4.2
  const fov = options.fov ?? 50
  const maxPixelRatio = options.maxPixelRatio ?? 2
  const fitToView = options.fitToView
  let currentDisplayScale = options.displayScale ?? 1
  // Whether the wind blows; persists across model swaps and motion rebuilds, so
  // it's re-applied to each freshly-built field in addModelToScene.
  let windEnabled = options.windEnabled ?? true
  let model: SandModel = options.model
  // Resolved 'static' state for the currently-mounted scene. `setMotionMode`
  // rebuilds when this flips, because `preserveDrawingBuffer` is fixed at
  // renderer construction and can't be toggled on a live renderer.
  let prefersReducedMotion = resolveMotionMode(options.motionMode ?? 'auto') === 'static'

  // Per-mount resources — (re)created by `mount()`, released by `unmount()`.
  let renderer: THREE.WebGLRenderer
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let wind: WindField
  let timer: THREE.Timer
  let resizeObserver: ResizeObserver
  let rafId = 0
  let morphTarget = 0

  // The accessible readout (A11Y-004): models that depict text expose it via
  // `getAccessibleText`, and this shell — the only layer that owns DOM —
  // mirrors it into a visually-hidden span so AT can perceive the value with
  // no consumer wiring. No live region: the value is available on
  // focus/navigation, not announced on every change, so a fast-churning
  // display (the ms clock) stays calm. Outlives mount/unmount so a motion
  // swap never drops the text; destroy() removes it.
  let readoutEl: HTMLElement | null = null

  function syncReadout() {
    const text = model.getAccessibleText?.()
    if (text === undefined) {
      readoutEl?.remove()
      readoutEl = null
      return
    }
    if (!readoutEl) {
      readoutEl = document.createElement('span')
      readoutEl.className = 'sand-renderer__text'
      // Real text, visually hidden: a transparent fill keeps it in the a11y
      // tree — and selectable — while it overlays the canvas box (the
      // A11Y-003 technique), centered to sit roughly over the sand glyphs.
      // It receives pointer events so users can select/copy the value
      // (FEAT-023); that shadows the canvas's hover morph, which is a
      // deliberate no-op for the text-bearing models.
      readoutEl.style.cssText =
        'position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; -webkit-text-fill-color: transparent;'
      container.appendChild(readoutEl)
    }
    // Hold the text while the user is selecting it: a churning display (the
    // ms clock) rewrites every frame, and each rewrite would collapse the
    // selection — so the readout freezes at the selected value and catches
    // up once the selection clears (FEAT-023).
    if (readoutEl.textContent !== text && !selectionTouches(readoutEl)) {
      readoutEl.textContent = text
    }
  }

  function addModelToScene() {
    // Display scale lives on the renderer, not the model: it's a presentation
    // transform on each renderable root, leaving the model's own clouds intact.
    for (const obj of model.objects) {
      obj.scale.setScalar(currentDisplayScale)
      scene.add(obj)
    }
    wind = createWindField(model.windSources)
    wind.setBlowing(windEnabled)
    scene.add(wind.points)
  }

  function removeModelFromScene() {
    for (const obj of model.objects) scene.remove(obj)
    scene.remove(wind.points)
    wind.dispose()
  }

  function applyScale(scale: number) {
    currentDisplayScale = scale
    for (const obj of model.objects) obj.scale.setScalar(scale)
  }

  /** The fitToView target for the current bounds/aspect; null → keep the current scale. */
  function fitTarget(): number | null {
    if (fitToView === undefined) return null
    const bounds = model.getBounds?.()
    if (!bounds) return null
    const visibleHeight = 2 * cameraDistance * Math.tan(THREE.MathUtils.degToRad(fov / 2))
    return fitViewScale(bounds, { width: visibleHeight * camera.aspect, height: visibleHeight }, fitToView)
  }

  function render(t: number, delta: number) {
    const fit = fitTarget()
    if (fit !== null && fit !== currentDisplayScale) {
      // Static frames (delta 0) snap; animated frames glide, so a
      // value-width change rescales as smoothly as the morph it rides.
      applyScale(delta > 0 ? currentDisplayScale + (fit - currentDisplayScale) * Math.min(1, delta * FIT_DAMPING) : fit)
    }
    model.setMorphTarget(morphTarget)
    model.update(t, delta)
    wind.update(t, delta)
    // Every repaint — animated frame or static refresh — is a moment the
    // displayed value may have changed; keep the readout current with it.
    syncReadout()
    renderer.render(scene, camera)
  }

  function frame(timestamp: number) {
    timer.update(timestamp)
    // Belt-and-suspenders clamp on top of the Page Visibility handling.
    const delta = Math.min(timer.getDelta(), 0.05)
    render(timer.getElapsed(), delta)
    rafId = requestAnimationFrame(frame)
  }

  function resize() {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    // In reduced-motion mode nothing else redraws, so repaint the static frame
    // at the new size.
    if (prefersReducedMotion && wind) render(timer.getElapsed(), 0)
  }

  const onPointerEnter = () => {
    morphTarget = 1
  }
  const onPointerLeave = () => {
    morphTarget = 0
  }

  function mount() {
    // When motion is suppressed we draw a single frame and stop. A WebGL drawing
    // buffer is cleared by the compositor after it paints unless we preserve it,
    // so without this the static model would flash once and vanish.
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: prefersReducedMotion,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio))
    renderer.setClearColor(0x000000, 0)
    // Honor each cloud's renderOrder (body → ring → wind) instead of three.js's
    // distance sort, which ties unstably for clouds sharing the origin.
    renderer.sortObjects = false
    renderer.domElement.classList.add('sand-renderer__canvas')
    // The canvas is presentation only: its accessible name lives on the
    // model's text readout (below), or on the consumer's host for models
    // with no text equivalent.
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(renderer.domElement)

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100)
    camera.position.z = cameraDistance

    morphTarget = 0
    addModelToScene()
    // In animated mode the first render is a frame away — expose the
    // readout immediately rather than after the first RAF.
    syncReadout()

    // Timer (vs. the deprecated Clock) hooks the Page Visibility API via
    // connect(), so a backgrounded tab won't return a giant delta that teleports
    // every grain across the screen.
    timer = new THREE.Timer()
    timer.connect(document)
    rafId = 0

    resize()

    // First paint lands at the fitted size; later fits glide via the loop.
    const fit = fitTarget()
    if (fit !== null) applyScale(fit)

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    renderer.domElement.addEventListener('pointerenter', onPointerEnter)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)

    // Honor prefers-reduced-motion: resize() already drew the single static
    // frame, so only start the animation loop when motion is allowed.
    if (!prefersReducedMotion) {
      rafId = requestAnimationFrame(frame)
    }
  }

  function unmount() {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    resizeObserver.disconnect()
    renderer.domElement.removeEventListener('pointerenter', onPointerEnter)
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
    // Release renderer-owned GPU + the wind field, but keep the model: a
    // motion-swap rebuild re-adds the same clouds to a fresh scene, so its
    // geometries survive and re-upload to the new context on next render.
    removeModelFromScene()
    timer.dispose()
    renderer.dispose()
    // dispose() alone leaves the GL context alive until GC, and a page-wide
    // motion swap rebuilds every renderer at once — without an explicit
    // release the transient doubling trips the browser's WebGL context cap.
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }

  mount()

  return {
    get displayScale() {
      return currentDisplayScale
    },
    setModel(next: SandModel) {
      removeModelFromScene()
      model.dispose()
      model = next
      morphTarget = 0
      addModelToScene()
      // A swap is a fresh display — land at its fitted size, no glide.
      const fit = fitTarget()
      if (fit !== null) applyScale(fit)
      // The new model may carry different (or no) accessible text.
      syncReadout()
      if (prefersReducedMotion) render(timer.getElapsed(), 0)
    },
    setDisplayScale(scale: number) {
      currentDisplayScale = scale
      for (const obj of model.objects) obj.scale.setScalar(scale)
      // Reduced-motion paints a single frame on construction and after
      // each scene mutation — keep the static frame current.
      if (prefersReducedMotion) render(timer.getElapsed(), 0)
    },
    setWindEnabled(on: boolean) {
      windEnabled = on
      wind.setBlowing(on)
      // In reduced-motion mode nothing else redraws, so repaint the static
      // frame to reflect the change.
      if (prefersReducedMotion) render(timer.getElapsed(), 0)
    },
    refreshWindColors() {
      wind.refreshColors()
      if (prefersReducedMotion) render(timer.getElapsed(), 0)
    },
    recallWind() {
      wind.recall()
    },
    repaintStaticFrame() {
      if (prefersReducedMotion) render(timer.getElapsed(), 0)
    },
    setMotionMode(mode: MotionMode) {
      const next = resolveMotionMode(mode) === 'static'
      if (next === prefersReducedMotion) return
      // preserveDrawingBuffer is fixed at renderer construction, so a motion
      // change means a full rebuild — hidden behind this method. The model
      // persists across unmount/mount, so it reappears as it was.
      unmount()
      prefersReducedMotion = next
      mount()
    },
    destroy() {
      unmount()
      readoutEl?.remove()
      readoutEl = null
      model.dispose()
    },
  }
}
