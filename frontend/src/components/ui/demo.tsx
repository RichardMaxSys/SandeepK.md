'use client'

import { SplineScene } from "@/components/ui/splite"
import { Card } from "@/components/ui/base"
import { Spotlight } from "@/components/ui/spotlight"

export function SplineSceneBasic() {
  return (
    <section className="py-24 px-6 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <Card className="w-full bg-black/[0.96] relative overflow-hidden border-0 rounded-3xl">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="white"
          />

          <div className="flex flex-col md:flex-row h-auto md:h-[500px]">
            {/* Left: text */}
            <div className="w-full md:w-1/2 p-8 md:p-12 relative z-10 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3">
                Interactive Demo
              </p>
              <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                See your resume come to life
              </h1>
              <p className="mt-4 text-neutral-300 max-w-lg text-sm md:text-base leading-relaxed">
                Explore our 3D product showcase. Watch how ResumeElevate transforms
                your resume with AI-powered tailoring and transparent ATS scoring.
              </p>
            </div>

            {/* Right: Spline scene */}
            <div className="w-full md:w-1/2 h-[300px] md:h-[500px] relative">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
