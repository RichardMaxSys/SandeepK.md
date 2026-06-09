'use client'

import { SplineScene } from "@/components/ui/splite"

/* -------------------------------------------------------------------------- */
/*  Page-spanning transparent Spline scene layer                              */
/*  Renders the robot across the hero + features area, not inside a card.     */
/*  Transparent background, pointer-events-none, reduced on mobile.           */
/* -------------------------------------------------------------------------- */

export function SplineSceneBasic() {
  return (
    <div
      aria-hidden="true"
      className="hidden md:block absolute inset-0 w-full h-[180vh] pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      <SplineScene
        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
        className="w-full h-full"
      />
    </div>
  )
}
