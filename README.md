# CareerAI — Resume Intelligence

AI-powered resume builder with transparent ATS scoring and job-specific tailoring.

## What it does

| Tab | Purpose |
|-----|---------|
| **Builder** | Pick from 18 templates. Edit your resume live. Export PDF or DOCX. |
| **ATS Check** | Transparent 4-dimension scoring — parseability, keywords, formatting, content. |
| **Tailor** | Paste a job description. AI rewrites your bullets. Side-by-side diff. |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| Animations | Framer Motion 11 |
| Icons | Lucide React |
| PDF export | @react-pdf/renderer (lazy-loaded) |
| DOCX export | docx + file-saver (lazy-loaded) |
| Testing | Vitest — 85 tests |
| State | React Context + localStorage |

## Quick start

cd frontend
npm install
npm run dev        # http://localhost:3000 (marketing) / http://localhost:3000/app (builder)
npm test           # 85/85 tests
npm run build      # ~185 kB first load

## Architecture

frontend/src/
├── app/
│   ├── (marketing)/page.tsx     Landing page at /
│   └── (app)/app/page.tsx       3-tab resume builder at /app
├── components/
│   ├── shell/top-nav.tsx        Top navigation
│   ├── builder/                 Template gallery, resume editor, PDF/DOCX export
│   ├── views/                   builder-view, check-view, tailor-view
│   └── ui/                      Button, Card, Badge, charts, usage-gate
├── lib/
│   ├── ats-engine.ts            4-dimension ATS scoring + humanizer
│   ├── ai-rewrite.ts            Deterministic rewrite + LLM wrapper
│   ├── resume-store.tsx         Multi-version resume state
│   ├── templates.ts             18 template definitions
│   └── usage-limits.ts          Free-tier rate limiting

## Design system

Dark theme with teal accent. Fonts: Inter (body), JetBrains Mono (code).

| Token | Value | Use |
|-------|-------|-----|
| canvas.DEFAULT | #0a0e1a | Page background |
| canvas.raised | #161c2e | Cards |
| ink.DEFAULT | #e6ebf5 | Body text |
| accent.500 | #14b8a6 | Teal — primary actions |

## Pricing model

| Tier | Price | What you get |
|------|-------|-------------|
| Free | $0 | 1 ATS check/day, 5 templates, watermarked export |
| Pro | $15/mo | Unlimited checks, all 18 templates, AI rewrite, no watermark |
| Lifetime | $199 | Everything, forever (capped at 500 customers) |

## Roadmap

| Status | Feature |
|--------|---------|
| Done | Resume builder + 18 templates |
| Done | 4-dimension ATS scoring |
| Done | Tailor tab (JD analysis + AI rewrite) |
| Done | PDF + DOCX export |
| Done | Marketing landing page |
| Done | Multi-version resume management |
| Next | Real LLM rewrite (OpenRouter) |
| Planned | Resume file upload (PDF/DOCX parsing) |
| Planned | Stripe paywall + authentication |

## Repository

- **Repo:** github.com/RichardMaxSys/SandeepK.md
- **Active branch:** feat/pivot-mvp
- **Founder:** Sandeep K — richardmaxsys@gmail.com

## License

Proprietary. All rights reserved.
