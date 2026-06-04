# LinkedIn Optimizer — Phase 2 Spec Stub

## Why This Exists

Per the deep research report (`/workspace/RESEARCH_REPORT.pdf` § 7.2), LinkedIn optimization is the **#1 highest-ROI feature** the next agent should build after the MVP ships. Resume Worded does it well, almost nobody else does, and the demand is validated. The research recommends it as Phase 2 (weeks 7-12) — after the Builder/Check/Tailor MVP is validated by paying users.

This document is a **stub**: enough to align future work without committing to a full implementation yet. The next agent should treat it as a starting point and refine the details.

## User Pain

> "I optimized my resume, but my LinkedIn profile is a mess. Recruiters find me on LinkedIn, not by reading my PDF. My About section is generic. My headline is just my job title. My experience entries copy-paste from the resume and don't read like a person."

## What It Does

**Input:** Either
- A LinkedIn profile URL (we fetch + parse), OR
- Pasted "About + Experience" text (manual copy-paste from LinkedIn's "Edit profile" mode)

**Output:**
- 3 scores: **Presence** (completeness, sections filled), **Keyword Alignment** (vs target role or current resume), **Clarity** (no generic phrases, has metrics, action verbs)
- Suggested rewrites for: **Headline** (220 char max), **About** (2600 char max), top 1-2 **Experience** entries
- Each rewrite is the **same anti-generic, metric-focused logic** as the Tailor tab — never "passionate, results-driven team player" garbage

## UX

- A 4th tab in the top nav: **"LinkedIn"** (disabled with a "Q3 2026" badge until shipped, then live)
- OR a sub-flow inside the Tailor tab: "Also optimize your LinkedIn for this role?" — runs after a Tailor scan if the user opts in
- Decision: ship as a sub-flow first (lower complexity), then graduate to a top-level tab if usage justifies it

## API Contract (sketch)

```jsonc
// Request
POST /api/linkedin-review
{
  "profileText": "Headline: ...\nAbout: ...\nExperience 1: ...\nExperience 2: ...",
  "targetRole": "Senior Python Developer",  // optional
  "targetLocation": "Toronto, ON",          // optional
  "resumeContext": { ... }                  // optional, the user's current resume
}

// Response (200)
{
  "scores": {
    "presence": 78,
    "keywordAlignment": 65,
    "clarity": 82
  },
  "findings": [
    { "section": "headline", "severity": "high",   "message": "Headline is just your job title. Add a specialty." },
    { "section": "about",    "severity": "medium", "message": "About is 1,200 chars. Recruiters scan the first 300." },
    { "section": "experience.0", "severity": "low", "message": "First bullet lacks a metric." }
  ],
  "rewrites": {
    "headline":  { "before": "Software Engineer at CloudBase", "after": "Senior Software Engineer at CloudBase · FastAPI, K8s, 2M daily reqs", "reason": "Added specialty + metric" },
    "about":     { "before": "Passionate engineer...", "after": "I build...", "reason": "Stripped generic phrases, added 2 metrics" },
    "experience.0.bullets.0": { "before": "Built things", "after": "Built X that did Y", "reason": "..." }
  },
  "model": "deepseek/deepseek-r1",
  "latencyMs": 3200
}
```

## Reuse From Existing Code

- **`lib/ai-rewrite.ts`** — `rewriteBulletWithLlm`, `rewriteResumeWithLlm` for the actual rewrites
- **`lib/ats-engine.ts`** — content quality dimension, humanizer phrase bank
- **`lib/usage-limits.ts`** — rate limiting (1 free LinkedIn scan per week?)
- **`components/views/check-view.tsx`** — issue-list pattern can be reused for the "findings" panel

## New Code Needed

- **`lib/linkedin-parser.ts`** — extract Headline, About, Experience sections from pasted text
- **`components/views/linkedin-view.tsx`** — main UI (or a sub-flow inside Tailor)
- **`backend/routers/linkedin.py`** — endpoint
- **`backend/services/linkedin_scorer.py`** — scoring logic (mirror of `ats-engine` but for LinkedIn-specific signals)

## LinkedIn-Specific Scoring Dimensions

1. **Presence** (completeness):
   - Headline present and not just job title? (10 pts)
   - About is 300+ chars? (10 pts)
   - 2+ experience entries with descriptions? (10 pts)
   - Skills section has 5+ items? (10 pts)
   - Featured section populated? (10 pts)
   - Profile photo set? (10 pts) — can't detect, but flag as "verify"
   - Custom URL set? (10 pts) — can't detect
   - Location set? (10 pts)
   - Industry set? (10 pts)
   - Connections 500+? (10 pts) — can't detect

2. **Keyword Alignment** (vs target role + resume):
   - Top 20 keywords from JD present in headline/about/experience? (60 pts)
   - Resume + LinkedIn keyword overlap? (40 pts)

3. **Clarity** (anti-generic, has impact):
   - Headline has a number or specialty? (20 pts)
   - About has 1+ quantified statement? (20 pts)
   - About has 0+ generic phrases? (Humanizer) (20 pts)
   - Experience bullets lead with action verbs? (20 pts)
   - Experience bullets have numbers? (20 pts)

## Anti-Generic Logic (reused)

The Humanizer phrase bank in `lib/ats-engine.ts` (15 phrases: "passionate", "results-driven", "team player", "rockstar", etc.) applies equally to LinkedIn. Reuse the same detection + rewrite patterns.

## Open Questions for the Next Agent

1. **URL parsing:** Is it worth trying to scrape LinkedIn URLs? They have aggressive anti-bot measures. Recommendation: start with pasted-text-only, add URL import later if there's demand.
2. **Job-title-only headlines:** How aggressively should we suggest rewrites? Some users intentionally keep it simple. Don't be annoying.
3. **Connection count / profile completeness items we can't see:** Show as a checklist the user can self-verify, not a "you scored 40%" failure.
4. **Photo / banner / featured section:** Can only check by user input. Build a "Profile completeness checklist" UI alongside the score.

## Why This Is Phase 2, Not Phase 1

- LinkedIn optimization is **only useful if the user already has a resume worth aligning with.** Builder/Check/Tailor must work first.
- It adds complexity: a new scoring system, new UI, possibly new auth (LinkedIn OAuth).
- It does not change the core value prop: "make your resume land interviews." LinkedIn is a nice-to-have multiplier.

## Ship Criteria

- [ ] All 3 scoring dimensions implemented + tested
- [ ] Headline + About rewrites use the same anti-generic logic as Tailor
- [ ] Rate limited (1 free scan/week, unlimited on Pro)
- [ ] Usage analytics events fired
- [ ] Mobile-responsive
- [ ] Accessibility audited (labels, keyboard, ARIA)
- [ ] Documentation updated in PROJECT_TRANSITION_BRIEF
- [ ] Sentry integration tested

Estimated build: 3-4 weeks for 1 engineer.
