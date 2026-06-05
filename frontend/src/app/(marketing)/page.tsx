"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Search, Wand2, ChevronDown, Check, Menu, X } from "lucide-react";
import { Button, Card, cn } from "@/components/ui/base";

/* -------------------------------------------------------------------------- */
/*  Marketing landing page — /                                                */
/* -------------------------------------------------------------------------- */

const ACCENT = "#14b8a6";

export default function MarketingPage() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [activePrice, setActivePrice] = React.useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-canvas text-ink overflow-x-hidden">
      {/* ---- STICKY NAV ---- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center group-hover:bg-accent-500/25 transition-colors">
              <Sparkles size={15} className="text-accent-300" />
            </div>
            <span className="font-bold tracking-tight text-sm text-ink">CareerAI</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-ink-muted hover:text-ink transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-ink-muted hover:text-ink transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-ink-muted hover:text-ink transition-colors">FAQ</a>
            <Link href="/app" className="text-sm text-ink-muted hover:text-ink transition-colors">Log in</Link>
            <Link href="/app">
              <Button className="rounded-none" size="sm">Get started</Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink border border-line"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-line bg-canvas/95 backdrop-blur-md">
            <div className="px-6 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm text-ink-muted hover:text-ink">Features</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-sm text-ink-muted hover:text-ink">Pricing</a>
              <a href="#faq" onClick={() => setMobileOpen(false)} className="block text-sm text-ink-muted hover:text-ink">FAQ</a>
              <Link href="/app" onClick={() => setMobileOpen(false)} className="block text-sm text-ink-muted hover:text-ink">Log in</Link>
              <Link href="/app" onClick={() => setMobileOpen(false)} className="block">
                <Button className="rounded-none w-full" size="sm">Get started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ---- HERO ---- */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto animate-fade-up fade-delay-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-5">
          Resume Intelligence
        </p>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-ink leading-[1.05] max-w-4xl">
          Your resume,<br />
          <span className="text-accent-400">optimized</span> for every job.
        </h1>
        <p className="mt-6 text-lg text-ink-muted max-w-2xl leading-relaxed">
          18 templates. Transparent ATS scoring. AI-powered tailoring. $0 to start.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 items-center">
          <Link href="/app">
            <Button size="lg" className="rounded-none text-base px-8">
              Start building — free
            </Button>
          </Link>
          <a href="#features">
            <Button variant="ghost" size="lg" className="rounded-none text-base px-6">
              See how it works
            </Button>
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-subtle font-mono">
          <span>78 tests passing</span>
          <span>·</span>
          <span>185 KB first load</span>
          <span>·</span>
          <span>0 backend required</span>
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto border-t border-line animate-fade-up fade-delay-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3">
          How it works
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Three tabs. One goal.
        </h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              icon: Sparkles,
              title: "Build",
              desc: "Pick from 18 templates. Edit your resume live. Export PDF or DOCX.",
            },
            {
              num: "02",
              icon: Search,
              title: "Check",
              desc: "Transparent 4-dimension ATS scoring. Parseability, keywords, formatting, content.",
            },
            {
              num: "03",
              icon: Wand2,
              title: "Tailor",
              desc: "Paste a job description. AI rewrites your bullets. Side-by-side diff.",
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.num}
                className="rounded-none border-line p-8 hover:border-accent-500/40 transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                    <Icon size={22} className="text-accent-300" />
                  </div>
                  <span className="text-3xl font-bold text-white/5">{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold text-ink mb-3">{step.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ---- COMPARISON TABLE ---- */}
      <section className="py-24 px-6 border-t border-line animate-fade-up fade-delay-3">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3">
            Comparison
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-14">
            Why CareerAI
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-4 pr-6 text-ink-muted font-medium w-1/5" />
                  {["CareerAI", "Jobscan", "Resume Worded", "Rezi"].map((name, i) => (
                    <th
                      key={name}
                      className={cn(
                        "py-4 px-4 text-left font-semibold text-ink whitespace-nowrap",
                        i === 0 && "border border-accent-500/30 bg-accent-500/5",
                      )}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Price", "$0 / $15 / $199", "$70/mo", "$0 / $36/mo", "$0 / $36/mo"],
                  ["ATS Scoring", "4 transparent dimensions", "Single score", "Single score", "Single score"],
                  ["AI Rewrite", "Yes — side-by-side diff", "Yes", "Limited", "Yes"],
                  ["Templates", "18", "3", "5", "10"],
                  ["Cover Letter", "Yes", "Yes", "Yes", "No"],
                  ["Free Tier", "1 check/day", "3 scans total", "1 scan total", "Limited"],
                ].map(([label, ...vals]) => (
                  <tr key={label} className="border-b border-line">
                    <td className="py-4 pr-6 text-ink-muted font-medium">{label}</td>
                    {vals.map((v, i) => (
                      <td
                        key={i}
                        className={cn(
                          "py-4 px-4 text-ink",
                          i === 0 && "border border-accent-500/30 bg-accent-500/5",
                        )}
                      >
                        {i === 0 ? <span className="text-accent-300 font-medium">{v}</span> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- PRICING ---- */}
      <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto border-t border-line animate-fade-up fade-delay-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3">
          Pricing
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-14">
          Simple pricing
        </h2>

        {/* Toggle */}
        <div className="flex items-center gap-3 mb-12">
          <button
            onClick={() => setActivePrice("monthly")}
            className={cn(
              "text-sm px-4 py-2 rounded-none border transition-colors",
              activePrice === "monthly"
                ? "border-accent-500/40 bg-accent-500/10 text-accent-300"
                : "border-line text-ink-muted hover:text-ink",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setActivePrice("yearly")}
            className={cn(
              "text-sm px-4 py-2 rounded-none border transition-colors",
              activePrice === "yearly"
                ? "border-accent-500/40 bg-accent-500/10 text-accent-300"
                : "border-line text-ink-muted hover:text-ink",
            )}
          >
            Yearly <span className="text-2xs text-accent-400 ml-1">Save 33%</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <Card className="rounded-none border-line p-8 flex flex-col">
            <h3 className="text-lg font-semibold text-ink">Free</h3>
            <p className="mt-1 text-3xl font-bold text-ink">
              $0
            </p>
            <p className="mt-1 text-sm text-ink-muted">Forever</p>
            <ul className="mt-8 space-y-3 flex-1">
              {["1 ATS check / day", "5 free templates", "Watermarked exports", "Live ATS scoring"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <Check size={14} className="mt-0.5 text-accent-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="mt-8 block">
              <Button variant="outline" className="rounded-none w-full">Get started</Button>
            </Link>
          </Card>

          {/* Pro */}
          <Card className="rounded-none border-accent-500/40 bg-accent-500/[0.03] p-8 flex flex-col relative">
            <span className="absolute -top-3 left-4 px-3 py-0.5 bg-accent-500 text-white text-2xs font-semibold uppercase tracking-wider rounded-none">
              Most popular
            </span>
            <h3 className="text-lg font-semibold text-ink">Pro</h3>
            <p className="mt-1 text-3xl font-bold text-ink">
              {activePrice === "monthly" ? "$15" : "$120"}
              <span className="text-base font-normal text-ink-muted">/{activePrice === "monthly" ? "mo" : "yr"}</span>
            </p>
            <p className="mt-1 text-sm text-ink-muted">{activePrice === "monthly" ? "$15 / month" : "$10 / month"}</p>
            <ul className="mt-8 space-y-3 flex-1">
              {[
                "Unlimited ATS checks",
                "All 18 templates",
                "AI rewrite — no limit",
                "No watermark",
                "Cover letter generator",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <Check size={14} className="mt-0.5 text-accent-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="mt-8 block">
              <Button className="rounded-none w-full">Get Pro</Button>
            </Link>
          </Card>

          {/* Lifetime */}
          <Card className="rounded-none border-line p-8 flex flex-col">
            <h3 className="text-lg font-semibold text-ink">Lifetime</h3>
            <p className="mt-1 text-3xl font-bold text-ink">$199</p>
            <p className="mt-1 text-sm text-ink-muted">One-time. 500 spots.</p>
            <ul className="mt-8 space-y-3 flex-1">
              {[
                "Everything in Pro",
                "No recurring billing",
                "Early access to new features",
                "Founder-level support",
                "Lifetime updates",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <Check size={14} className="mt-0.5 text-accent-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="mt-8 block">
              <Button variant="outline" className="rounded-none w-full">Get Lifetime</Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section id="faq" className="py-24 px-6 max-w-3xl mx-auto border-t border-line animate-fade-up fade-delay-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400 mb-3">
          Questions
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-14">
          FAQ
        </h2>

        <div className="space-y-0 divide-y divide-line">
          {[
            {
              q: "Is there a free plan?",
              a: "Yes. You get 1 ATS check per day, access to 5 free templates, and watermarked PDF/DOCX export. No credit card needed.",
            },
            {
              q: "How is ATS scoring different from Jobscan?",
              a: "Instead of a single opaque number, we show 4 transparent dimensions — Parseability, Keyword Match, Formatting, and Content Depth — so you know exactly what to improve.",
            },
            {
              q: "Does the AI make up experience?",
              a: "No. The AI rewrites what you already wrote — it rephrases bullets, quantifies achievements, and restructures sentences. It never fabricates roles or skills.",
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
          ].map((item, i) => (
            <div key={i} className="border-line">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left text-sm font-medium text-ink hover:text-accent-300 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "shrink-0 text-ink-subtle transition-transform duration-200",
                    openFaq === i && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  openFaq === i ? "max-h-60 pb-5" : "max-h-0",
                )}
              >
                <p className="text-sm text-ink-muted leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- CTA BANNER ---- */}
      <section className="py-20 px-6 border-t border-line animate-fade-up fade-delay-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Ready to build a better resume?
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            No signup. No backend. Just your browser and a better job application.
          </p>
          <Link href="/app" className="mt-8 inline-block">
            <Button size="lg" className="rounded-none text-base px-10">
              Start building — free
            </Button>
          </Link>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-line py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ink-subtle">
            CareerAI · Built in Toronto · {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/RichardMaxSys/SandeepK.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-ink-subtle hover:text-ink transition-colors"
            >
              GitHub
            </a>
            <span className="text-sm text-ink-subtle hover:text-ink transition-colors cursor-pointer">
              Privacy
            </span>
            <span className="text-sm text-ink-subtle hover:text-ink transition-colors cursor-pointer">
              Terms
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
