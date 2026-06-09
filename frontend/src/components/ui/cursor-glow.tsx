'use client'

import * as React from 'react'
import {
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
  motion,
} from 'motion/react'

/* -------------------------------------------------------------------------- */
/*  useMousePosition — tracks cursor as smooth spring values                  */
/* -------------------------------------------------------------------------- */

export function useMousePosition() {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  React.useEffect(() => {
    const handle = (e: MouseEvent) => {
      x.set(e.clientX / window.innerWidth)
      y.set(e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', handle, { passive: true })
    return () => window.removeEventListener('mousemove', handle)
  }, [x, y])

  // Spring for smooth lag
  const smoothX = useSpring(x, { stiffness: 60, damping: 25 })
  const smoothY = useSpring(y, { stiffness: 60, damping: 25 })

  return { x: smoothX, y: smoothY }
}

/* -------------------------------------------------------------------------- */
/*  CursorGlow — a subtle radial gradient pinned to the cursor position       */
/*  Desktop only, pointer-events-none, respects reduced-motion                 */
/* -------------------------------------------------------------------------- */

export function CursorGlow() {
  const prefersReduced = useReducedMotion()
  const { x, y } = useMousePosition()

  const xPct = useTransform(x, [0, 1], [0, 100])
  const yPct = useTransform(y, [0, 1], [0, 100])

  const bg = useMotionTemplate`radial-gradient(700px circle at ${xPct}% ${yPct}%, rgba(20,184,166,0.08), transparent 50%)`

  if (prefersReduced) return null

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden md:block"
      style={{ background: bg }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  useParallaxOffset — returns a style object with x/y translate             */
/*  for a given depth factor. Larger depth = more movement.                   */
/* -------------------------------------------------------------------------- */

const MAX_SHIFT = 30 // px

export function useParallaxOffset(depth: number = 1) {
  const prefersReduced = useReducedMotion()
  const { x, y } = useMousePosition()

  const dx = useTransform(x, [0, 1], [depth * -MAX_SHIFT, depth * MAX_SHIFT])
  const dy = useTransform(y, [0, 1], [depth * -MAX_SHIFT, depth * MAX_SHIFT])

  if (prefersReduced) return { x: 0, y: 0 }

  return { x: dx, y: dy }
}
