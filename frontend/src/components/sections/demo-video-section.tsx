"use client";

import * as React from "react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";

/* -------------------------------------------------------------------------- */
/*  Demo Video Section — premium product showcase card                         */
/*  Dark elevated card with gradient spotlight, side-by-side layout.           */
/* -------------------------------------------------------------------------- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function DemoVideoSection() {
  return (
    <section className="py-24 px-6 border-t border-line overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="max-w-6xl mx-auto"
      >
        {/* Premium showcase card */}
        <div className="relative rounded-3xl border border-line/60 bg-canvas-subtle/80 overflow-hidden isolate">
          {/* Ambient spotlight glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 70%)",
            }}
          />

          {/* Inner content — side-by-side on desktop, stacked on mobile */}
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 p-6 sm:p-8 md:p-10 lg:p-12">
            {/* Left: text */}
            <motion.div
              variants={stagger}
              className="flex-1 w-full md:max-w-[35%] text-center md:text-left"
            >
              <motion.p
                variants={fadeRight}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400"
              >
                Product Demo
              </motion.p>
              <motion.h2
                variants={fadeRight}
                className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink leading-[1.15]"
              >
                See ResumeElevate in action
              </motion.h2>
              <motion.p
                variants={fadeRight}
                className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed max-w-sm"
              >
                Upload, tailor, optimize, and export in one smooth flow.
              </motion.p>
            </motion.div>

            {/* Right: video */}
            <motion.div
              variants={fadeLeft}
              className="w-full md:flex-[2] rounded-2xl border border-line/60 overflow-hidden shadow-xl shadow-black/20 bg-black/20"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                className="w-full h-full object-contain"
              >
                <source src="/videos/demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
