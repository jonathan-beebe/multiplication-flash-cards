import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { createSandRenderer, type SandRenderer } from '@/lib/sand/model3d/createSandRenderer'
import { makeDigitStringModel, type DigitStringModel } from '@/lib/sand/number/makeDigitStringModel'
import type { GradientStop } from '@/lib/sand/number/gradientPalette'
import { resolveMotionMode, type MotionMode } from '@/lib/sand/motionMode'
import { canRenderSand } from './webglSupport'

/** Seconds for the wind to carry the sand off; snappier than the library's 2 s default. */
const DISMISS_SECONDS = 0.7

export interface SandDigitsProps {
  /** Display string: 0-9, ':', '.', '×', '+', '−', '÷' and space. */
  text: string
  /** Spoken form for assistive tech (e.g. "7 times 8"). Defaults to `text`. */
  srText?: string
  /** Grain colors, ordered bottom → top. Omitted: the library's warm-sand default. */
  gradient?: readonly GradientStop[]
  /** Camera distance from the origin; larger fits wider strings. */
  cameraDistance?: number
  /**
   * Contain-fit: scale the digits so they span this fraction of the stage
   * (e.g. 0.9), tracking container resizes and value-width changes.
   * Omitted: fixed scale 1.
   */
  fitToView?: number
  motionMode?: MotionMode
  windEnabled?: boolean
  /** Rising edge blows the sand off to the right. One-shot; a later `text` change resets the display. */
  dismissing?: boolean
  /** Fires once the sand is completely gone (immediately under reduced motion). */
  onDismissComplete?: () => void
  className?: string
}

function makeModel(
  text: string,
  gradient: readonly GradientStop[] | undefined,
  srTextRef: React.RefObject<string | undefined>,
): DigitStringModel {
  const model = makeDigitStringModel(text, gradient)
  // The renderer mirrors getAccessibleText into its visually-hidden readout
  // (the module's A11Y-004 seam); point it at the spoken form so "7 × 8"
  // reads as "7 times 8" and there is exactly one accessible surface.
  return { ...model, getAccessibleText: () => srTextRef.current ?? model.getText() }
}

/**
 * React binding for the vendored sand display: mounts `createSandRenderer`
 * into a container div and drives the digit-string model from props. The
 * dismissal contract is one-shot (the wind empties the pool); the next
 * `text` change swaps in a fresh model on the same renderer.
 *
 * Without WebGL (including jsdom) it renders the string as plain text and
 * still honors the dismissal callback, so the quiz flow never stalls.
 */
export default function SandDigits({
  text,
  srText,
  gradient,
  cameraDistance,
  fitToView,
  motionMode = 'auto',
  windEnabled = true,
  dismissing = false,
  onDismissComplete,
  className,
}: SandDigitsProps) {
  const supported = canRenderSand()
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<SandRenderer | null>(null)
  const modelRef = useRef<DigitStringModel | null>(null)
  /** True once the mounted model has been dismissed — it can only be replaced. */
  const spentRef = useRef(false)
  const lastGradientRef = useRef(gradient)

  const textRef = useRef(text)
  const srTextRef = useRef(srText)
  const gradientRef = useRef(gradient)
  const motionModeRef = useRef(motionMode)
  const windEnabledRef = useRef(windEnabled)
  const dismissingRef = useRef(dismissing)
  const onDismissCompleteRef = useRef(onDismissComplete)
  // Latest-value sync; declared first so every later effect in the same
  // commit reads current values.
  useEffect(() => {
    textRef.current = text
    srTextRef.current = srText
    gradientRef.current = gradient
    motionModeRef.current = motionMode
    windEnabledRef.current = windEnabled
    dismissingRef.current = dismissing
    onDismissCompleteRef.current = onDismissComplete
  })

  useEffect(() => {
    const container = containerRef.current
    if (!supported || !container) return
    const model = makeModel(textRef.current, gradientRef.current, srTextRef)
    modelRef.current = model
    lastGradientRef.current = gradientRef.current
    spentRef.current = false
    const renderer = createSandRenderer(container, {
      model,
      cameraDistance,
      fitToView,
      motionMode: motionModeRef.current,
      windEnabled: windEnabledRef.current,
    })
    rendererRef.current = renderer
    return () => {
      renderer.destroy()
      rendererRef.current = null
      modelRef.current = null
    }
  }, [supported, cameraDistance, fitToView])

  useEffect(() => {
    const renderer = rendererRef.current
    const model = modelRef.current
    if (!renderer || !model) return
    if (spentRef.current && dismissingRef.current) {
      // Mid-flight: new text keeps landing on the wind.
      if (model.getText() !== text) model.setText(text)
      return
    }
    if (spentRef.current) {
      const next = makeModel(text, gradient, srTextRef)
      renderer.setModel(next)
      modelRef.current = next
      lastGradientRef.current = gradient
      spentRef.current = false
      renderer.repaintStaticFrame()
      return
    }
    // Live swaps: a gradient change rides any in-flight morph, so a color
    // change and a text change in the same commit animate together.
    if (lastGradientRef.current !== gradient) {
      model.setGradient(gradient)
      lastGradientRef.current = gradient
      renderer.repaintStaticFrame()
    }
    if (model.getText() !== text) {
      model.setText(text)
      if (resolveMotionMode(motionModeRef.current) === 'static') model.snap()
      renderer.repaintStaticFrame()
    }
  }, [text, gradient])

  useEffect(() => {
    rendererRef.current?.setMotionMode(motionMode)
  }, [motionMode])

  useEffect(() => {
    rendererRef.current?.setWindEnabled(windEnabled)
  }, [windEnabled])

  useEffect(() => {
    if (!dismissing) return
    const renderer = rendererRef.current
    const model = modelRef.current
    if (!renderer || !model) {
      // No-WebGL fallback: the flow must still advance.
      const id = setTimeout(() => onDismissCompleteRef.current?.(), 0)
      return () => clearTimeout(id)
    }
    if (spentRef.current) return
    spentRef.current = true
    model.dismiss({ duration: DISMISS_SECONDS, onComplete: () => onDismissCompleteRef.current?.() })
    if (resolveMotionMode(motionModeRef.current) === 'static') {
      // No vestibular sweep: complete instantly, callback still fires once.
      model.snap()
      renderer.repaintStaticFrame()
    }
  }, [dismissing])

  if (!supported) {
    return (
      <span className={clsx('text-5xl font-bold tabular-nums text-text', className)}>
        <span aria-hidden="true">{text}</span>
        <span className="sr-only">{srText ?? text}</span>
      </span>
    )
  }
  return <div ref={containerRef} className={clsx('relative h-full w-full', className)} />
}
