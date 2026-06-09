"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Wand2,
  ChevronDown,
  Check,
  Menu,
  X,
  Shield,
  FileText,
  Download,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Variants } from "motion/react";
import { Button, Card, cn } from "@/components/ui/base";
import DemoVideoSection from "@/components/sections/demo-video-section";

/* -------------------------------------------------------------------------- */
/*  Marketing landing page — /                                                */
/* -------------------------------------------------------------------------- */

const ACCENT = "#14b8a6";

/* ── shared animation variants ── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ── honest trust claims (no fakery) ── */

const HONEST_CLAIMS = [
  { icon: Shield, text: "No credit card required" },
  { icon: FileText, text: "ATS-safe templates" },
  { icon: Download, text: "Export PDF or DOCX" },
  { icon: CreditCard, text: "Your data stays local" },
];

/* ── feature cards data ── */

const FEATURES = [
  {
    icon: Sparkles,
    title: "Builder",
    tagline: "Build a polished resume",
    bullets: [
      "200 ATS-optimized templates",
      "Live preview editor",
      "PDF & DOCX export",
    ],
  },
  {
    icon: Search,
    title: "ATS Check",
    tagline: "Know exactly where you stand",
    bullets: [
      "4-dimension scoring: parseability, keywords, formatting, content",
      "Transparent breakdown — not a black-box score",
      "Shows exactly what recruiters' ATS detects",
    ],
  },
  {
    icon: Wand2,
    title: "Tailor to Job",
    tagline: "Adapt in seconds, not hours",
    bullets: [
      "Paste a job description, get AI-tailored bullets",
      "Side-by-side diff — accept or reject each change",
      "Quantify achievements without fabricating",
    ],
  },
];

/* ── ATS score dimensions (product illustration, not testimonial) ── */

const ATS_DIMENSIONS = [
  { label: "Parseability", before: 42, after: 94 },
  { label: "Keyword Match", before: 25, after: 88 },
  { label: "Formatting", before: 55, after: 96 },
  { label: "Content Depth", before: 33, after: 82 },
] as const;

/* ── pricing plans ── */

const PLANS = [
  {
    name: "Free",
    price: { monthly: "$0", yearly: "$0" },
    period: { monthly: "Forever", yearly: "Forever" },
    features: [
      "1 ATS check / day",
      "5 free templates",
      "Watermarked exports",
      "Live ATS scoring",
    ],
    cta: "Get started",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: "$15", yearly: "$120" },
    period: { monthly: "$15 / month", yearly: "$10 / month" },
    features: [
      "Unlimited ATS checks",
      "All 200 templates",
      "AI rewrite — no limit",
      "No watermark",
      "Cover letter generator",
      "Priority support",
    ],
    cta: "Get Pro",
    variant: "primary" as const,
    popular: true,
  },
  {
    name: "Lifetime",
    price: { monthly: "$199", yearly: "$199" },
    period: { monthly: "One-time", yearly: "One-time" },
    features: [
      "Everything in Pro",
      "No recurring billing",
      "Early access to new features",
      "Founder-level support",
      "Lifetime updates",
    ],
    cta: "Get Lifetime",
    variant: "outline" as const,
    popular: false,
  },
];

/* ── FAQs ── */

const FAQS = [
  {
    q: "Is there a free plan?",
    a: "Yes. You get 1 ATS check per day, access to 5 free templates, and watermarked PDF/DOCX export. No credit card needed.",
  },
  {
    q: "How is ATS scoring different from other tools?",
    a: "Most tools give a single opaque score. We show 4 transparent dimensions — Parseability, Keyword Match, Formatting, and Content Depth — so you know exactly what to improve.",
  },
  {
    q: "Does the AI make up experience?",
    a: "No. The AI rewrites what you already wrote — rephrasing bullets, quantifying achievements, and restructuring sentences. It never fabricates roles, companies, or skills.",
  },
  {
    q: "What formats can I export?",
    a: "PDF and DOCX, both styled with your chosen template. PDF preserves the exact visual layout; DOCX is optimized for ATS parsers.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly and yearly plans cancel instantly with no penalties. You keep access until the end of your billing period.",
  },
  {
    q: "Is my data private?",
    a: "Resumes are stored locally in your browser. We never see, sell, or train on your data. Everything happens client-side.",
  },
];

/* ========================================================================== */
/*  Page Component                                                            */
/* ========================================================================== */

export default function MarketingPage() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [activePrice, setActivePrice] = React.useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
    <div className="min-h-screen bg-canvas text-ink overflow-x-hidden">
      {/* ---- STICKY NAV ---- */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-xl border-b border-line"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="ResumeElevate home"
          >
            <div className="h-8 w-8 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center group-hover:bg-accent-500/25 transition-colors">
              <Sparkles size={15} className="text-accent-300" />
            </div>
            <span className="font-bold tracking-tight text-sm text-ink">
              ResumeElevate
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-ink-muted hover:text-ink active:text-ink transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-ink-muted hover:text-ink active:text-ink transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm text-ink-muted hover:text-ink active:text-ink transition-colors"
            >
              FAQ
            </a>
            <Link
              href="/app"
              className="text-sm text-ink-muted hover:text-ink active:text-ink transition-colors"
            >
              Log in
            </Link>
            <Link href="/app">
              <Button size="sm" className="rounded-lg">
                Get started
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink active:text-ink border border-line cursor-pointer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden border-t border-line bg-canvas/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-4 space-y-3">
                <a
                  href="#features"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-ink-muted hover:text-ink active:text-ink py-2"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-ink-muted hover:text-ink active:text-ink py-2"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-ink-muted hover:text-ink active:text-ink py-2"
                >
                  FAQ
                </a>
                <Link
                  href="/app"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-ink-muted hover:text-ink active:text-ink py-2"
                >
                  Log in
                </Link>
                <Link href="/app" onClick={() => setMobileOpen(false)}>
                  <Button className="rounded-lg w-full" size="sm">
                    Get started
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ---- HERO ---- */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Subtle ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid-fade"
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-6"
          >
            AI Resume Builder &amp; ATS Optimizer
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-ink leading-[1.05]"
          >
            Your resume,{" "}
            <span className="text-accent-400">optimized</span>
            <br />
            for every application.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            className="mt-6 text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed"
          >
            Build, check, and tailor your resume against any job description.
            Transparent ATS scoring, AI-powered rewrites, and polished export —
            all in your browser, no backend required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/app">
              <Button
                size="lg"
                className="rounded-xl text-base px-8 h-12 shadow-glow-accent active:scale-[0.97] active:shadow-none transition-all duration-150"
              >
                Start building — free
              </Button>
            </Link>
            <a
              href="#features"
              className="text-sm text-ink-muted hover:text-ink active:text-ink transition-colors underline underline-offset-4 decoration-white/20"
            >
              See how it works
            </a>
          </motion.div>

          {/* Mini 3-pillar preview */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65, ease: "easeOut" }}
            className="mt-16 flex items-center justify-center gap-1 md:gap-6"
          >
            {[
              { icon: Sparkles, name: "Builder", desc: "200 templates" },
              { icon: Search, name: "ATS Check", desc: "4-part score" },
              { icon: Wand2, name: "Tailor", desc: "for any job" },
            ].map((pill, i) => {
              const Icon = pill.icon;
              return (
                <div key={pill.name} className="flex items-center gap-3 md:gap-6">
                  <div className="flex items-center gap-2.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="h-6 w-6 rounded-md bg-accent-500/10 flex items-center justify-center">
                      <Icon size={12} className="text-accent-300" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium text-ink">
                        {pill.name}
                      </span>
                      <span className="text-2xs text-ink-subtle hidden sm:inline">
                        {pill.desc}
                      </span>
                    </div>
                  </div>
                  {i < 2 && (
                    <span
                      aria-hidden="true"
                      className="hidden sm:block text-white/[0.08] text-sm select-none"
                    >
                      /
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* Honest trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {HONEST_CLAIMS.map((claim) => {
              const Icon = claim.icon;
              return (
                <div
                  key={claim.text}
                  className="flex items-center gap-2 text-xs text-ink-subtle"
                >
                  <Icon size={13} className="text-accent-400 shrink-0" />
                  <span>{claim.text}</span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ---- DEMO VIDEO ---- */}
      <DemoVideoSection />

      {/* ---- FEATURES: 3 PILLARS ---- */}
      <section
        id="features"
        className="py-24 px-6 border-t border-line"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3"
            >
              How it works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight text-ink"
            >
              Three tabs. One goal.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-base text-ink-muted max-w-xl mx-auto"
            >
              A complete resume workflow — from building to ATS-checking to
              job-specific tailoring — in one place.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Card className="rounded-xl border-line p-6 sm:p-8 h-full flex flex-col hover:border-accent-500/30 transition-colors duration-200">
                    <div className="flex items-start justify-between mb-6">
                      <div className="h-12 w-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                        <Icon size={22} className="text-accent-300" />
                      </div>
                      <span className="text-3xl font-bold text-white/[0.04] select-none">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-ink mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-ink-muted mb-5">
                      {feature.tagline}
                    </p>
                    <ul className="mt-auto space-y-2.5">
                      {feature.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2.5 text-sm text-ink-subtle"
                        >
                          <Check
                            size={13}
                            className="mt-0.5 text-accent-400 shrink-0"
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ---- ATS SCORE PANEL (before / after) ---- */}
      <section className="py-24 px-6 border-t border-line">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3"
            >
              ATS scoring
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight text-ink"
            >
              4 dimensions. No black box.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-base text-ink-muted max-w-xl mx-auto"
            >
              Most tools hide behind a single score. We show exactly where your
              resume stands — and what to fix — across four transparent
              dimensions.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Before */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">
                  Typical resume before tailoring
                </h3>
                <span className="text-xs text-ink-subtle font-mono">39/100</span>
              </div>
              <div className="space-y-5">
                {ATS_DIMENSIONS.map((d, i) => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-ink-muted">{d.label}</span>
                      <span className="text-xs text-ink-subtle font-mono">
                        {d.before}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.before}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          ease: "easeOut",
                          delay: 0.1 + i * 0.12,
                        }}
                        className="h-full rounded-full bg-white/[0.1]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">
                  After ResumeElevate
                </h3>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xs text-ink-subtle uppercase tracking-wider">
                    Example scenario
                  </span>
                  <span className="text-xs text-accent-400 font-mono">90/100</span>
                </div>
              </div>
              <div className="space-y-5">
                {ATS_DIMENSIONS.map((d, i) => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-ink-muted">{d.label}</span>
                      <span className="text-xs text-accent-400 font-mono">
                        {d.after}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-accent-500/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.after}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          ease: "easeOut",
                          delay: 0.1 + i * 0.12,
                        }}
                        className="h-full rounded-full bg-accent-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-2xs text-ink-subtle max-w-lg mx-auto leading-relaxed">
            Illustrative example based on a typical untailored resume. Actual
            scores vary by role, content, and formatting.
          </p>
        </div>
      </section>

      {/* ---- TRUST / PROOF STRIP (honest claims only) ---- */}
      <section className="py-16 px-6 border-t border-line bg-canvas-subtle/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              {
                stat: "200",
                label: "ATS-optimized templates",
              },
              {
                stat: "4",
                label: "Transparent ATS dimensions",
              },
              {
                stat: "PDF + DOCX",
                label: "Dual export formats",
              },
              {
                stat: "$0",
                label: "No credit card required",
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                className="text-center"
              >
                <p className="text-2xl font-bold text-ink tracking-tight">
                  {item.stat}
                </p>
                <p className="mt-1.5 text-xs text-ink-subtle leading-relaxed">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---- PRICING ---- */}
      <section id="pricing" className="py-24 px-6 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3"
            >
              Pricing
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight text-ink"
            >
              Simple pricing
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-base text-ink-muted max-w-xl mx-auto"
            >
              Start free. Upgrade when you outgrow it.
            </motion.p>
          </motion.div>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView="visible"
            viewport={{ once: true }}
            role="tablist"
            aria-label="Billing frequency"
            className="flex items-center justify-center gap-3 mb-12"
          >
            <button
              onClick={() => setActivePrice("monthly")}
              role="tab"
              aria-selected={activePrice === "monthly"}
              className={cn(
                "text-sm px-4 py-2 rounded-lg border transition-colors cursor-pointer",
                activePrice === "monthly"
                  ? "border-accent-500/40 bg-accent-500/10 text-accent-300"
                  : "border-line text-ink-muted hover:text-ink active:text-ink"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setActivePrice("yearly")}
              role="tab"
              aria-selected={activePrice === "yearly"}
              className={cn(
                "text-sm px-4 py-2 rounded-lg border transition-colors cursor-pointer",
                activePrice === "yearly"
                  ? "border-accent-500/40 bg-accent-500/10 text-accent-300"
                  : "border-line text-ink-muted hover:text-ink active:text-ink"
              )}
            >
              Yearly{" "}
              <span className="text-2xs text-accent-400 ml-1">Save 33%</span>
            </button>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {PLANS.map((plan) => (
              <motion.div key={plan.name} variants={fadeUp}>
                <Card
                  className={cn(
                    "rounded-xl p-8 flex flex-col relative border-line",
                    plan.popular && "border-accent-500/40 bg-accent-500/[0.03]"
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent-500 text-white text-2xs font-semibold uppercase tracking-wider rounded-md whitespace-nowrap">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-ink">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-ink">
                    {plan.price[activePrice]}
                    {plan.name !== "Lifetime" && (
                      <span className="text-base font-normal text-ink-muted">
                        /{activePrice === "monthly" ? "mo" : "yr"}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {plan.period[activePrice]}
                    {plan.popular && activePrice === "yearly" && (
                      <span className="ml-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-500/10 text-accent-300 text-2xs font-medium border border-accent-500/20">
                        Save $60/yr
                      </span>
                    )}
                  </p>
                  <ul className="mt-8 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-sm text-ink-muted"
                      >
                        <Check
                          size={14}
                          className="mt-0.5 text-accent-400 shrink-0"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/app" className="mt-8 block">
                    <Button
                      variant={plan.variant}
                      className={cn(
                        "rounded-lg w-full",
                        plan.popular && "shadow-glow-accent"
                      )}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section id="faq" className="py-24 px-6 border-t border-line">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3"
            >
              Questions
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight text-ink"
            >
              FAQ
            </motion.h2>
          </motion.div>

          <div className="space-y-0 divide-y divide-line">
            {FAQS.map((item, i) => (
              <div key={i} className="border-line">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  id={`faq-btn-${i}`}
                  className="w-full flex items-center justify-between py-5 text-left text-sm font-medium text-ink hover:text-accent-300 active:text-accent-400 transition-colors cursor-pointer"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span>{item.q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <ChevronDown
                      size={14}
                      className="shrink-0 text-ink-subtle"
                    />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      role="region"
                      aria-labelledby={`faq-btn-${i}`}
                      key={i}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm text-ink-muted leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA BANNER ---- */}
      <section className="py-24 px-6 border-t border-line">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-4xl font-bold tracking-tight text-ink"
          >
            Ready to build a better resume?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg text-ink-muted"
          >
            No credit card. No signup. Just your browser and a stronger
            application.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <Link href="/app">
              <Button
                size="lg"
                className="rounded-xl text-base px-10 h-12 shadow-glow-accent active:scale-[0.97] active:shadow-none transition-all duration-150"
              >
                Start building — free
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-line py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
              <Sparkles size={13} className="text-accent-300" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-ink-subtle">
              ResumeElevate
            </span>
          </div>
          <p className="text-xs text-ink-subtle">
            Built in Toronto &middot; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/RichardMaxSys/SandeepK.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ink-subtle hover:text-ink active:text-ink transition-colors"
            >
              GitHub
            </a>
            <button className="text-xs text-ink-subtle hover:text-ink active:text-ink transition-colors cursor-pointer">
              Privacy
            </button>
            <button className="text-xs text-ink-subtle hover:text-ink active:text-ink transition-colors cursor-pointer">
              Terms
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
