import { useEffect, useRef } from 'react'
import type { Model } from '~/shop/obj'
import { frameToHtml, modelRadius, renderModel } from '~/shop/render'

const AUTO_SPIN = 0.6 // radians per second
const DRAG_SENSITIVITY = 0.012 // radians per pixel
const MAX_PITCH = 1.3

interface ModelViewportProps {
  model: Model
}

/**
 * Renders a model as colored ASCII, auto-rotating, with drag-to-rotate.
 * The grid is sized to fit the container using the measured glyph size.
 * Frames are written straight to the DOM, bypassing React state.
 */
export function ModelViewport({ model }: ModelViewportProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const dragging = useRef<{ x: number; y: number } | null>(null)
  const angles = useRef({ yaw: 0.6, pitch: 0.35 })

  useEffect(() => {
    const box = boxRef.current
    const pre = preRef.current
    const measure = measureRef.current
    if (!box || !pre || !measure) return

    const radius = modelRadius(model)
    let cols = 0
    let rows = 0
    let raf = 0
    let last = performance.now()

    const resize = () => {
      const cell = measure.getBoundingClientRect()
      if (!cell.width || !cell.height) return
      cols = Math.max(8, Math.floor(box.clientWidth / cell.width))
      rows = Math.max(4, Math.floor(box.clientHeight / cell.height))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(box)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!dragging.current && !reduceMotion) angles.current.yaw += AUTO_SPIN * dt
      if (cols && rows) {
        const { yaw, pitch } = angles.current
        pre.innerHTML = frameToHtml(renderModel(model, cols, rows, yaw, pitch, radius))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [model])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragging.current
    if (!d) return
    angles.current.yaw += (e.clientX - d.x) * DRAG_SENSITIVITY
    angles.current.pitch = Math.max(
      -MAX_PITCH,
      // Dragging down pulls the front of the model down (the top tips toward you)
      Math.min(MAX_PITCH, angles.current.pitch + (e.clientY - d.y) * DRAG_SENSITIVITY),
    )
    dragging.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = () => {
    dragging.current = null
  }

  return (
    <div
      ref={boxRef}
      className="relative h-full w-full cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="img"
      aria-label="Rotating 3D model. Drag to rotate."
    >
      <pre ref={preRef} className="m-0 text-sm font-mono leading-[1.2] text-neutral-300" />
      {/* Hidden glyph used to measure the character cell */}
      <span ref={measureRef} className="invisible absolute left-0 top-0 whitespace-pre font-mono text-sm leading-[1.2]">
        M
      </span>
    </div>
  )
}
