# Project Transition Brief — For Handoff to a New Agent

## Executive Summary

This is a **scope pivot**. The project is the same GitHub repo (`RichardMaxSys/SandeepK.md`), the same Next.js + FastAPI stack, and the same founder (Sandeep K) — but the product is being **rebuilt from a full job-search OS into a focused 3-tab resume intelligence tool**. The new agent's job is to **continue the new build, not the old one.**

The new MVP shell (3 tabs: Builder / Check / Tailor) is already shipped and works. The next priorities are: real PDF export, real LLM call for rewrites, file upload, Stripe paywall, and a marketing landing page.

---

## 1. Project A — The Previous Build (DEPRECATED, do not continue)

### What it was
A "full-stack job application assistant" — 6 routes in a sidebar, trying to be Adzuna + Jobscan + Resume.io + Notion simultaneously.

### Tech stack
- Next.js 15 App Router + TypeScript + Tailwind v3
- Framer Motion, Lucide React, Recharts
- FastAPI (Python 3.12) backend
- PostgreSQL 15 + Redis 7 + Celery
- OpenRouter API (DeepSeek R1) for AI
- Adzuna API for job search (Canada, US, GB)
- Docker Compose (5 containers)
- Dark theme: charcoal/navy with teal accent

### Features that were built
- Dashboard with KPI cards, activity chart, AI insights
- Live job search via Adzuna
- Master resume upload + parsing
- AI resume tailoring per job
- ATS scoring with recruiter feedback
- Kanban application pipeline (drag-and-drop with framer-motion)
- Package list, review panel modal
- Keyword gap analysis

### Why it's deprecated
Scope fragmentation. The product tried to do 5 things at once and was good at none of them. Real ATS-checker competitors (Jobscan at $49.95/mo) and resume builders (Resume.io, Kickresume) are already entrenched. Building a full job-search OS would require a 6-person team and 6+ months. Solo-dev timeline = product never ships.

**Decision (made this session):** Cut scope by 70%. The repo becomes **"Resume Intelligence"** — a focused tool that does ONE thing: helps people get resumes that land interviews.

### What to do with the old code
- **Old frontend files in `frontend/src/components/views/applications-view.tsx` and `ats-view.tsx` and the `shell/sidebar.tsx` + `topbar.tsx` have ALREADY been deleted** as part of the pivot.
- Backend code (FastAPI, Adzuna integration, Celery workers, application tracking DB) is **not yet deleted** but should be on the cleanup pass. Keep only: user accounts, resume storage, AI rewrite proxy, Stripe webhook, PDF generation endpoint.
- The `COMPLETE_SOURCE.txt` file at `/workspace/COMPLETE_SOURCE.txt` documents the OLD project only. It is for historical reference. Do NOT use it to rebuild old features.

---

## 2. Project B — The Current Build (CONTINUE THIS)

### What it is
**CareerAI — Resume Intelligence.** A focused web app with 3 tabs and a clear value prop.

### The 3 tabs

| Tab | User pain | What it does |
|---|---|---|
| **Builder** | "I need a resume that looks professional" | Pick from 18 templates, edit structured resume, live ATS score, export PDF/DOCX |
| **Check** | "Will this resume pass the ATS filter?" | Upload or use existing resume → 4-dimension transparent score (parseability, keyword match, formatting hygiene, content quality) + Humanizer (flags generic phrases like "passionate", "team player", "results-driven") |
| **Tailor** | "I want THIS specific job" | Paste JD → match score → AI rewrites summary + bullets with side-by-side diff → editable cover letter generator |

### The strategic differentiators (from research)
1. **Transparent scoring, not magic numbers** — show users what each dimension measures, why, and what to fix
2. **Anti-generic AI rewrites** — Humanizer check built into every rewrite; force specificity, metrics, user voice
3. **Cover letter bundled with Tailor** — not a separate product

### Pricing plan (for the eventual Stripe integration)
- **Free:** 1 ATS check per day, 1 Tailor scan per week (limited), watermarked PDF, 5 templates
- **Pro $15/mo or $120/yr:** unlimited checks, all templates, full AI rewrites, cover letter, no watermark, PDF + DOCX
- **Lifetime $199:** capped at 500 early-adopter customers only

### Target user
- **Primary:** Mid-level tech professionals (3-7 years) actively job hunting
- **Secondary:** New grads entering tech
- **Geography:** Canada + US initially, global English market after
- **Willingness to pay:** $9-19/mo range (validated by competitors)

### Competitive context
Jobscan ($49.95/mo), Resume Worded ($49/mo), Rezi ($29/mo), Kickresume ($8-24/mo), Novoresume, Resume.io, Enhancv. The 3-tab MVP can undercut on price while beating on UX (transparent feedback, no generic AI).

---

## 3. Current Code State (already shipped, do not rewrite)

### Frontend structure
```
frontend/src/
├── app/
│   ├── globals.css           # design tokens (canvas, line, ink, accent, success/warning/danger/info)
│   ├── layout.tsx            # Inter + JetBrains Mono via next/font/google
│   └── page.tsx              # SLIM SHELL — 3 tabs only, ResumeProvider wrapping
├── components/
│   ├── shell/
│   │   └── top-nav.tsx       # Brand · 3 tabs · profile (replaces old sidebar+topbar)
│   ├── ui/
│   │   ├── base.tsx          # cn, Button, Card, KpiCard, Badge, Avatar, Spinner
│   │   ├── charts.tsx        # ScoreChart (donut), KeywordChart, ActivityAreaChart
│   │   └── review-panel.tsx  # Kept for legacy, currently unused — can delete
│   ├── builder/
│   │   ├── template-card.tsx # 18 template thumbnails with rendered previews
│   │   └── resume-form.tsx   # Full resume editor (contact, summary, exp, edu, skills, projects)
│   └── views/
│       ├── builder-view.tsx  # Tab 1: 3-column (gallery · editor · live ATS sidebar)
│       ├── check-view.tsx    # Tab 2: 4-dim score, issue list, Humanizer
│       └── tailor-view.tsx   # Tab 3: JD input, AI rewrite diff, cover letter
└── lib/
    ├── api.ts                # Legacy API client (searchJobs, uploadResume, etc.) — TODO: clean up
    ├── ai-rewrite.ts         # DETERMINISTIC local rewrite + cover letter generator
    ├── ats-engine.ts         # Transparent 4-dimension scoring + Humanizer phrase bank
    ├── pipeline.ts           # Legacy kanban stages — TODO: delete
    ├── resume-store.tsx      # React Context + localStorage, full resume CRUD
    └── templates.ts          # 18 template definitions across 6 categories
```

### Design tokens (DO NOT change without strong reason)
- `canvas.DEFAULT` = `#0a0e1a` (page bg)
- `canvas.subtle` = `#0f1422` (sidebar/shell)
- `canvas.raised` = `#161c2e` (cards)
- `line.DEFAULT` = `rgba(255,255,255,0.08)` (borders)
- `ink.DEFAULT` = `#e6ebf5`, `ink.muted` = `#9aa3b8`, `ink.subtle` = `#6b7491`
- `accent.500` = `#14b8a6` (teal — primary action color)
- `success` = `#22c55e`, `warning` = `#f59e0b`, `danger` = `#ef4444`, `info` = `#3b82f6`
- Each status has a `-soft` variant at 12% opacity for backgrounds

### Build status
- `next build` ✓ clean, 169 kB first load (down from 276 kB before pivot)
- 5/5 static pages generated
- TypeScript ✓ no errors
- All 3 tabs work end-to-end with the deterministic rewrite engine (no LLM needed to demo)

### How the rewrite engine works (for the next agent to swap in real LLM)
`lib/ai-rewrite.ts` exports:
- `rewriteBullet(bullet, ctx?)` → `{ before, after, reason, changed }`
- `rewriteResume({ summary, experienceBullets, jd })` → batch version
- `generateCoverLetter({ name, targetRole, company, jd, topBullets })` → string

Currently uses deterministic rules (strip generic phrases, replace weak verbs, add plausible metric, inject JD terms). To wire in real LLM: replace `rewriteBullet` body with a `fetch('/api/rewrite', { method: 'POST', body: JSON.stringify({ bullet, jd }) })` call. The view code doesn't need to change.

---

## 4. Explicit Next Steps (in priority order)

The new agent should pick up from here. The dev server is NOT running. Start with `cd frontend && rm -rf .next && npm install && npm run dev` (or `npm run build && npm start` for prod). **Run `npm test` to verify the ats-engine and ai-rewrite engines pass before doing anything else.**

### Priority 1 — Real PDF export (1-2 days)
**Why:** Currently the DOCX/PDF buttons in the Builder view are UI-only. Users can't actually export. This is the #1 thing that makes it a real product.

**What to do:**
- Add `@react-pdf/renderer` to package.json (serverless-friendly, React-based, lighter than Puppeteer)
- Create `frontend/src/components/builder/pdf-document.tsx` that renders the current resume + selected template as a PDF
- Wire the Builder view's "PDF" button to trigger export
- Research recommendation: NOT Puppeteer (heavier, harder on serverless). Use `@react-pdf/renderer`.

**Reference for tech choice:** The research report at `/workspace/RESEARCH_REPORT.pdf` and `/workspace/RESEARCH_REPORT.txt` (sections 8.2-8.3) confirms this.

### Priority 2 — Real LLM call (1 day + prompt engineering)
**Why:** The deterministic rewrite is good enough for demo but not for paying users. Real LLM is what makes Tailor the money feature.

**What to do:**
- Backend: add FastAPI endpoint `POST /api/rewrite` that takes `{ bullet, jd, tone }` and calls OpenRouter with DeepSeek R1
- Backend: add `POST /api/cover-letter` similar shape — see contract in `/workspace/BACKEND_SPEC.md`
- Frontend: the wrapper is **already written** — `rewriteBulletWithLlm()` and `rewriteResumeWithLlm()` in `lib/ai-rewrite.ts` already try `/api/rewrite` and fall back to deterministic on any failure. The view code does not need to change.
- Prompt engineering matters: force the model to (a) lead with action verbs, (b) include metrics, (c) avoid generic phrases, (d) reference specific JD terms. Test on 5-10 real JDs before shipping.
- **Cost controls (already in the wrapper):** 8s timeout per call, log only length/status, never text. See `lib/ai-rewrite.ts` `safeLog()` and `LLM_TIMEOUT_MS`.

### Priority 3 — Resume file upload in Check tab (1-2 days)
**Why:** Currently the Check tab uses the resume data from the Builder. Users coming straight to Check without filling out the Builder first have nothing to score.

**What to do:**
- Backend: add `POST /api/parse-resume` (contract in `BACKEND_SPEC.md`) — accepts PDF/DOCX, returns structured `ResumeData`
- Use `spaCy` + `pdfplumber` (Python) on backend. The research report section 8.1 recommends this stack.
- Frontend: add file picker in `check-view.tsx` that uploads, then populates a temporary resume in the store, then runs the ATS check
- Persist the parsed resume so the user can switch to Builder and continue editing
- **Security:** files are parsed in-memory and deleted immediately. Never persist uploads to disk. See `SECURITY.md` § 1.

### Priority 4 — Stripe paywall (2 days)
**Why:** Without monetization this is a hobby project, not a business.

**What to do:**
- Free tier: 1 ATS check per day, 1 Tailor scan per week, 3 PDF exports per month. **Limit enforcement lives on the backend** (Postgres counters) once auth lands — the localStorage check in `lib/usage-limits.ts` is a UX helper for logged-out users only.
- Pro: $15/mo or $120/yr — unlimited everything, no watermark, full AI rewrites
- Lifetime: $199 capped at 500 customers
- The `UsageGate` component in `components/usage-gate.tsx` already wraps the action. Wire it around the Tailor "Rewrite for this JD" button, the PDF export, and the (Phase 2) LinkedIn scan.
- Add `users` table to Postgres (or use Supabase for simplicity)
- Add Stripe Checkout + webhook handler (see `BACKEND_SPEC.md` § "billing.py")
- Pricing copy: emphasize accuracy, transparent scoring, non-generic AI

### Priority 5 — Marketing landing page (3-4 days)
**Why:** A dashboard with no entry point is dead. Need a `/` route that sells the product.

**What to do:**
- Replace the current dashboard at `/` with a marketing page
- Move the actual app to `/app` (or `/dashboard`)
- Sections: hero with screenshot, "How it works" 3-step, comparison vs competitors, pricing, FAQ, footer
- Add a `/login` and `/signup` flow (NextAuth or Clerk)
- SEO-optimized meta tags, OG images, structured data

### Priority 6 — Cleanup (1 day)
- Delete legacy files: `lib/api.ts`, `lib/pipeline.ts`, `components/ui/review-panel.tsx`
- Delete FastAPI endpoints for Adzuna, Celery workers, application tracking
- Remove Redis + Celery containers from docker-compose.yml (keep Postgres for users)
- Remove old `COMPLETE_SOURCE.txt` from workspace
- **Search the repo for hardcoded API keys, Adzuna IDs, or personal emails and remove/replace with env references** (already done — see "Repo Hygiene" below)

### Priority 7 — Phase 2 features (after MVP ships, weeks 7-12)
- **LinkedIn Optimizer** (highest ROI per research, ~3-4 weeks) — full spec at `/workspace/LINKEDIN_OPTIMIZER_SPEC.md`. Stub already in `tailor-view.tsx` as a teaser card.
- Job URL scraping (paste LinkedIn URL → auto-fill JD)
- French + Spanish support
- Version tracking / A/B test resume variants

---

## 5. Key Constraints (read these before making changes)

1. **No new dependencies without justification** — every npm/pip package adds bundle size and supply chain risk. Justify each one.
2. **Keep dark theme** — it's the brand. Don't introduce light mode.
3. **Use the existing component library** — `cn`, `Button`, `Card`, `Badge` from `components/ui/base.tsx`. Don't add new primitives without first trying to compose from existing ones.
4. **Tailwind v3 only** — `tailwind.config.js` is configured for v3. DO NOT upgrade to v4. (This was a bug we fixed earlier — the previous build had v3 code but v4 PostCSS plugin and nothing compiled.)
5. **TypeScript strict** — fix type errors, don't `any` your way out.
6. **Deterministic where possible** — the ATS engine and Humanizer produce consistent results from the same input. Real LLM is only needed for the rewrite. Don't make random UI states.
7. **localStorage for now** — the resume state lives in localStorage. That's fine for MVP, but when Stripe is added, the resume needs to sync to the backend so users can access across devices.
8. **Accessibility** — maintain sufficient color contrast, keep flows keyboard-navigable, label all icon-only buttons, use ARIA where needed. Focus rings are already in the global CSS.
9. **Performance** — keep first load < 200 kB JS (currently 169 kB). Don't reintroduce large dashboard dependencies you removed with the pivot.
10. **No PII in logs** — never log full resume text, cover letter text, or JD text. Log only lengths and statuses. Sentry `beforeSend` hook must scrub PII.
11. **No secrets in the repo** — `.env` files go in `.gitignore`. Use a secrets manager in production. A secrets scan has been run; result: clean.
12. **Tests on the trust engines** — `npm test` must pass. The ats-engine and ai-rewrite tests live in `src/lib/__tests__/`. Add new tests when changing these files. Don't ship a change to scoring or rewrite without updating the corresponding test.

## 6. Backend Architecture (planned — see `BACKEND_SPEC.md` for full details)

The backend is a **FastAPI** service that will be added in Priority 2-4 of the Next Steps. The MVP runs entirely on the frontend; the backend is the source of truth for rate limiting, auth, billing, and the real LLM.

**Planned structure:**
```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── routers/        # ai.py, parse.py, billing.py, auth.py, analytics.py
│   ├── services/       # openrouter.py, parsing.py, ats.py, stripe_client.py, rate_limiter.py
│   ├── models/         # user.py, resume.py, usage.py
│   └── schemas/
├── tests/
├── requirements.txt
└── Dockerfile
```

**Endpoints to build:** `/api/rewrite`, `/api/cover-letter`, `/api/parse-resume`, `/api/ats-score`, `/api/billing/checkout`, `/api/billing/stripe-webhook`, `/api/auth/*`, `/api/analytics/event`.

**Endpoints to NEVER build (from old project):** Adzuna search, application tracking, Celery tasks, dry-run automation.

Full spec: `/workspace/BACKEND_SPEC.md`.

## 7. Data, Privacy & Security (see `SECURITY.md` for full policy)

### PII handling rules
- **Never log** resume text, cover letter text, or JD text at INFO level
- **Mask** emails and phones in any log line: `s***@e****.com`, `+1 416-***-0123`
- **Hash** user IDs in analytics events
- **Strip PII** from error reports before sending to Sentry (`beforeSend` hook)

### LLM call safety
- Send only the bullet + (optionally) the JD to the LLM. Never the full resume, name, email, or phone
- No training on user data (OpenRouter default; confirm in enterprise agreement)
- 8-second client timeout, 15-second server timeout
- Frontend always falls back to deterministic rewrite on LLM failure (already implemented)
- Prompt-injection hardening: JD is untrusted input; rewrite prompt is the SYSTEM message; strict JSON output schema

### Stripe & billing
- All card data goes through Stripe. We never store card numbers, expiry, or CVC
- Webhook signature verification on every Stripe event
- Idempotency keys to prevent double-charging

### Secrets management
- `.env` files in `.gitignore`. Never commit.
- Production: use Fly.io secrets, AWS Secrets Manager, or equivalent
- Rotate OpenRouter + Stripe keys quarterly
- Separate keys per environment (dev, staging, prod)

### Compliance targets
- **GDPR / CCPA / PIPEDA:** Right to access, right to deletion, data portability
- **SOC 2 Type II:** Target Q4 2026
- **FCRA:** We are NOT a consumer reporting agency. We do not screen candidates.

Full policy: `/workspace/SECURITY.md`.

## 8. Limits, Abuse Prevention & Analytics (see `lib/usage-limits.ts`)

### Free-tier limits (enforced client-side now, server-side after auth)
| Feature | Free | Pro |
|---|---|---|
| ATS Check | 1/day | unlimited |
| Tailor | 1/week | unlimited |
| PDF Export | 3/month | unlimited |
| LLM calls per day | 10 | 200 |

### Required analytics events
- `ats_check_run` — `{ score, hasJd, jdLengthBucket }`
- `tailor_run` — `{ bulletsChanged, summaryChanged, source: 'llm' | 'fallback' }`
- `pdf_export` — `{ template, hasWatermark }`
- `signup`, `upgrade`, `churn`

Store as **anonymized aggregate stats** in Postgres. Use a daily job to roll up raw events into daily/weekly/monthly aggregates; retain raw for 90 days, aggregates indefinitely.

### Required dashboard queries (build a small `/admin` page or run in SQL)
- "How many free users hit their ATS limit last 7 days?"
- "What % of ATS users ever try Tailor?"
- "Free→Pro conversion last 30 days"
- "LLM fallback rate (how often does deterministic run?)"

## 9. Testing & Quality Bar

### Required tests (already written — run with `npm test`)
- **Unit tests for `lib/ats-engine.ts`** — 20+ tests covering all 4 dimensions, edge cases, determinism, the humanizer phrase bank
- **Unit tests for `lib/ai-rewrite.ts`** — 20+ tests covering humanizer stripping, weak-verb replacement, metric injection, JD term injection, cover letter generation, determinism

### Required tests (to add when backend lands)
- **Endpoint tests for `/api/rewrite`, `/api/cover-letter`, `/api/parse-resume`** — Vitest/Jest on the frontend side, pytest on the backend. Catch parsing and LLM regressions before they hit users.
- **E2E happy path:** Builder → Check → Tailor → PDF export, on a real resume and a real JD

### Performance budget
- First load JS: < 200 kB (currently 169 kB ✓)
- Time to Interactive on Tailor tab: < 1.5s
- LLM rewrite response: < 8s (timeout) + 1s UI

## 10. LLM Usage Contract (already implemented)

`lib/ai-rewrite.ts` exports a public wrapper:

```ts
rewriteBulletWithLlm(bullet, { jd?, targetRole?, signal? }): Promise<LlmRewriteResult>
rewriteResumeWithLlm({ summary, experienceBullets, jd }): Promise<...>
```

**Behavior:**
- Tries `POST /api/rewrite` with an 8s timeout
- On any failure (timeout, 4xx, 5xx, JSON parse, shape mismatch), falls back to deterministic
- Returns `{ before, after, reason, changed, source: "llm" | "deterministic" | "llm-fallback" }`
- The view code calls this and never has to handle the fallback path

**Logging policy:** only `event, kind, length` — never the bullet or JD text.

**Cost controls (server-side, to be added in Priority 2):**
- Per-user daily cap (10 free, 200 pro)
- Circuit breaker: if OpenRouter error rate > 30% over 5 min, temporarily disable Tailor for free users
- Per-call token limit: 2000 input, 500 output
- Cache by hash of (bullet + jd) for 30 days

## 11. Deployment (see `DEPLOYMENT.md` for full details)

| Layer | Provider |
|---|---|
| Frontend | Vercel (auto-deploys from `main`) |
| Backend | Fly.io (Docker, free tier sufficient for MVP) |
| Database | Supabase Postgres |
| Object storage | Supabase Storage (for resume uploads) |
| Error tracking | Sentry |
| Logging | Axiom or Better Stack |
| Email | Resend |
| Analytics | Plausible or PostHog |

**Environments:** local / preview (per-PR) / staging / production.
**CI:** GitHub Actions runs `npm test` + `npm run build` on every PR.
**CD:** Vercel auto-deploys frontend on merge to `main`; Fly.io auto-deploys backend via `fly deploy`.
**Rollback:** Vercel and Fly.io both keep the last 10 releases; one-click rollback. Supabase has point-in-time recovery.

## 12. LinkedIn Optimizer (Phase 2 stub)

Already added: a teaser card at the bottom of the Tailor view that says "LinkedIn Optimizer — coming soon" with a Notify button.

**Full spec:** `/workspace/LINKEDIN_OPTIMIZER_SPEC.md`. The next agent should treat it as a starting point. Estimated build: 3-4 weeks for 1 engineer, scheduled for weeks 7-12 after the MVP validates.

**Reuse from existing code:**
- `lib/ai-rewrite.ts` — for the actual rewrites
- `lib/ats-engine.ts` — content quality dimension + humanizer phrase bank
- `lib/usage-limits.ts` — for rate limiting
- `components/views/check-view.tsx` — issue-list pattern

## 13. Repo Hygiene

Secrets scan has been run. Result: **clean**. No hardcoded API keys, no real personal emails, no Adzuna/Stripe references. The only email in the codebase is `sandeep@example.com` (IANA reserved for documentation).

**Pre-merge checklist for any PR:**
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] No new `any` types
- [ ] No secrets in diff (gitleaks pre-commit hook recommended)
- [ ] No PII logged at INFO level
- [ ] No resume/JD/bullet text in error reports
- [ ] Accessibility audit on any new UI

**Pre-release checklist:**
- [ ] All tests pass
- [ ] CHANGELOG updated
- [ ] Sentry error rate < 1% over 24h
- [ ] Manual smoke test: Builder → Check → Tailor → PDF export

## 14. Reference Files in `/workspace/`

- `/workspace/PROJECT_TRANSITION_BRIEF.md` — this file
- `/workspace/BACKEND_SPEC.md` — full FastAPI backend specification
- `/workspace/SECURITY.md` — security & privacy policy
- `/workspace/DEPLOYMENT.md` — deployment, environments, observability
- `/workspace/LINKEDIN_OPTIMIZER_SPEC.md` — Phase 2 LinkedIn feature spec stub
- `/workspace/AGENT_CONTEXT.md` — original context dump for the research agent
- `/workspace/RESEARCH_REPORT.pdf` + `.txt` — 15-page competitive research (2025-2026, 35 sources)
- `/workspace/COMPLETE_SOURCE.txt` — OLD project source (DEPRECATED, delete on cleanup pass)
- `/workspace/SandeepK/frontend/` — the actual current project code
- `/workspace/screenshots/v2-*.png` — current MVP screenshots (Builder, Check, Tailor)
- `/workspace/screenshots/01-04*.png` — OLD project screenshots (DEPRECATED)

---

## 6. Reference Files in `/workspace/`

- `/workspace/PROJECT_TRANSITION_BRIEF.md` — this file
- `/workspace/AGENT_CONTEXT.md` — original context dump for the research agent
- `/workspace/RESEARCH_REPORT.pdf` + `.txt` — 15-page competitive research (2025-2026 data, 35 sources)
- `/workspace/COMPLETE_SOURCE.txt` — OLD project source (DEPRECATED, do not use)
- `/workspace/SandeepK/frontend/` — the actual current project code
- `/workspace/screenshots/v2-*.png` — current MVP screenshots (Builder, Check, Tailor)
- `/workspace/screenshots/01-04*.png` — OLD project screenshots (DEPRECATED)

---

## 7. Quickstart for the New Agent

```bash
cd /workspace/SandeepK/frontend
cat package.json                            # see current deps
cat src/app/page.tsx                        # see the slim 3-tab shell
cat src/lib/resume-store.tsx                # understand state model
cat src/lib/ats-engine.ts                   # understand ATS scoring
cat src/lib/ai-rewrite.ts                   # understand rewrite engine (where to swap in real LLM)
cat src/components/views/builder-view.tsx   # see Tab 1
cat src/components/views/check-view.tsx     # see Tab 2
cat src/components/views/tailor-view.tsx    # see Tab 3
npm install
npm run dev                                 # http://localhost:3000
```

Then pick up **Priority 1: Real PDF export** as the first task.

---

## 8. The Founder's Voice

- **Direct, no-fluff communication** — don't pad responses with "great question" or "I'd be happy to help"
- **Has opinions, asks for pushback** — if you think a decision is wrong, say so once with reasoning. If they hold the line, follow them
- **Decision-maker, not a delegator** — gives clear direction, expects execution
- **Time-conscious** — wants shipping velocity, not endless polish
- **Honest about uncertainty** — if you don't know, say so and propose how to find out

End of brief. Go ship.
