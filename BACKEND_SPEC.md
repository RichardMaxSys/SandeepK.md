# Backend Specification — CareerAI

## Purpose
This document specifies the FastAPI backend that powers the rewrite engine, resume parsing, billing, and analytics. **It does not exist yet** — the current MVP runs entirely on the frontend with a deterministic rewrite engine. This is the spec to build toward.

## Runtime Requirements
- **Python:** 3.12+
- **Package manager:** uv (or pip with venv)
- **Web server:** uvicorn (dev) / gunicorn (prod)
- **Database:** PostgreSQL 15+ (Supabase or self-hosted)
- **Cache:** Not required at MVP. Add Redis only if rewrite latency > 2s.
- **Queue:** Not required at MVP. Re-add Celery only when adding async batch jobs (e.g., bulk resume parsing).

## Local Development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in keys
uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, middleware, startup
│   ├── config.py                # Settings (env vars, OpenRouter key, Stripe key, DB URL)
│   ├── deps.py                  # Common dependencies (get_current_user, etc.)
│   ├── models/
│   │   ├── user.py              # User model (id, email, plan, stripe_customer_id, created_at)
│   │   ├── resume.py            # Resume + revision (id, user_id, json, created_at)
│   │   └── usage.py             # UsageEvent (id, user_id, feature, ts)
│   ├── routers/
│   │   ├── ai.py                # POST /api/rewrite, POST /api/cover-letter
│   │   ├── parse.py             # POST /api/parse-resume, POST /api/ats-score
│   │   ├── billing.py           # POST /api/billing/stripe-webhook, POST /api/billing/checkout
│   │   ├── auth.py              # POST /api/auth/login, POST /api/auth/signup, GET /api/auth/me
│   │   └── analytics.py         # POST /api/analytics/event (server-side aggregation)
│   ├── services/
│   │   ├── openrouter.py        # OpenRouter client (DeepSeek R1 default, configurable)
│   │   ├── parsing.py           # spaCy + pdfplumber pipeline
│   │   ├── ats.py               # Mirrors the frontend ats-engine for server-side validation
│   │   ├── stripe_client.py     # Stripe API wrapper
│   │   └── rate_limiter.py      # Per-user quota enforcement
│   └── schemas/                 # Pydantic models for request/response
├── tests/
│   ├── test_ai.py               # Endpoint tests for /api/rewrite, /api/cover-letter
│   ├── test_parse.py            # Endpoint tests for /api/parse-resume
│   └── test_billing.py          # Stripe webhook signature verification
├── requirements.txt
├── .env.example
└── Dockerfile
```

## Endpoints — Keep vs Delete

### KEEP (build these for the MVP)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create user (email + password or OAuth) |
| POST | `/api/auth/login` | Issue session JWT |
| GET  | `/api/auth/me` | Current user (plan, email) |
| POST | `/api/rewrite` | Bullet rewrite via LLM (with deterministic fallback) |
| POST | `/api/cover-letter` | Cover letter via LLM |
| POST | `/api/parse-resume` | Upload PDF/DOCX → structured `ResumeData` |
| POST | `/api/ats-score` | Optional: server-side ATS scoring mirror |
| POST | `/api/billing/checkout` | Create Stripe Checkout session |
| POST | `/api/billing/portal` | Redirect to Stripe Customer Portal |
| POST | `/api/billing/stripe-webhook` | Process Stripe events (subscription created/cancelled/payment failed) |
| POST | `/api/analytics/event` | Record an anonymized event |

### DELETE (from the previous project, do not build)
- ❌ `GET /api/jobs/search` — Adzuna integration
- ❌ `POST /api/applications` — Application tracking
- ❌ `GET /api/packages` — Application packages
- ❌ `POST /api/dry-run` — Auto-apply automation
- ❌ `POST /api/approve-package` — Approval flow
- ❌ `GET /api/download/{id}/pdf` — handled by `@react-pdf/renderer` on the frontend
- ❌ `POST /api/upload-resume` — replaced by `/api/parse-resume`
- ❌ Any Celery tasks (no queue at MVP)

## Endpoint Contracts

### `POST /api/rewrite`

```jsonc
// Request
{
  "bullet": "Was responsible for the API rewrite.",  // required, max 500 chars
  "jd": "Looking for Python, FastAPI, K8s experience.",  // optional, max 5000 chars
  "targetRole": "Senior Python Developer"  // optional, max 100 chars
}

// Response (200)
{
  "after": "Led the API rewrite to FastAPI, cutting p99 latency by 40%.",
  "reason": "Replaced weak lead verb, added metric.",
  "model": "deepseek/deepseek-r1",
  "latencyMs": 1240
}

// Response (429) — rate limited
{ "error": "rate_limited", "resetAt": "2026-06-04T12:00:00Z" }

// Response (402) — quota exceeded (free tier)
{ "error": "quota_exceeded", "feature": "tailor" }
```

**Behavior:**
- Validates auth + quota first
- Calls OpenRouter with the prompt chain (see `services/openrouter.py`)
- 8-second timeout
- On any failure (timeout, 4xx, 5xx, malformed response), returns 502 with `{ "error": "llm_unavailable" }` — the frontend falls back to deterministic
- Logs only `model, latencyMs, bullet.length, jd.length` — never the text

### `POST /api/cover-letter`

Same shape as `/api/rewrite` but:
- Inputs: `name, targetRole, company, jd, topBullets[]`
- Output: `{ text: string, model: string, latencyMs: number }`
- Longer timeout (15s) since output is longer

### `POST /api/parse-resume`

```jsonc
// Request: multipart/form-data with `file` (PDF or DOCX, max 5MB)

// Response (200)
{
  "contact": { "name": "...", "email": "...", "phone": "...", "location": "..." },
  "summary": "...",
  "experience": [...],
  "education": [...],
  "skills": [...],
  "projects": [...]
}

// Response (400) — file too large or wrong type
{ "error": "invalid_file", "message": "PDF or DOCX only, max 5MB" }
```

**Behavior:**
- File-type sniff first (don't trust extension)
- pdfplumber for PDF, python-docx for DOCX
- spaCy NER for entity extraction (name, email, phone, employer, dates)
- Returns confidence score per field (so frontend can highlight uncertain extractions)
- 5-second timeout per file
- Files deleted immediately after parsing — never persisted to disk

### `POST /api/billing/stripe-webhook`

- Verifies Stripe signature
- Handles: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Updates `User.plan` accordingly
- Returns 200 immediately, processes async if needed

## Rate Limiting (Server-Side)

The frontend has a soft client-side check (`lib/usage-limits.ts`). The **server is the source of truth** for free-tier enforcement.

```python
# Pseudo-code
QUOTAS = {
    "free":   { "atsCheck": (1, "day"), "tailor": (1, "week"), "pdfExport": (3, "month") },
    "pro":    { "atsCheck": (INF, "lifetime"), "tailor": (INF, "lifetime"), "pdfExport": (INF, "lifetime") },
}

def enforce(user: User, feature: str):
    plan = user.plan
    quota, period = QUOTAS[plan][feature]
    used = UsageEvent.count(user_id=user.id, feature=feature, since=period_start(period))
    if used >= quota:
        raise HTTPException(402, "quota_exceeded")
    UsageEvent.create(user_id=user.id, feature=feature, ts=now())
```

**Quota table (matches `lib/usage-limits.ts`):**
| Plan | atsCheck | tailor | pdfExport |
|---|---|---|---|
| free | 1/day | 1/week | 3/month |
| pro  | unlimited | unlimited | unlimited |
| lifetime | unlimited | unlimited | unlimited |

## Authentication

- **MVP:** Email + password (bcrypt), JWT session token (httpOnly cookie, 30-day expiry)
- **Phase 2:** Add Google + LinkedIn OAuth (Clerk or NextAuth)
- **MFA:** TOTP, optional, encouraged for Pro users

## LLM Cost Controls

To stay profitable at $15/mo pricing:

1. **Per-request cap:** Max 2000 input tokens, 500 output tokens per `/api/rewrite` call
2. **Circuit breaker:** If OpenRouter error rate > 30% over 5 minutes, temporarily disable Tailor for all free users (show banner). Pro users always allowed.
3. **Per-user daily cap:** Free = 10 calls/day (covers 1 Tailor scan). Pro = 200 calls/day.
4. **Caching:** Cache by hash of (bullet + jd). Common bullets ("Mentored X engineers") cache for 30 days.
5. **Model selection:** Default to DeepSeek R1 (cheap). Allow Pro users to opt into GPT-4o for higher quality.

## Observability

- **Logs:** Structured JSON to stdout. One logger per service. Never log resume/JD/bullet text — only length + hash.
- **Errors:** Sentry SDK (or similar). One project per env.
- **Metrics:** Prometheus endpoint at `/metrics`. Track: `llm_calls_total`, `llm_latency_seconds`, `llm_errors_total`, `parse_failures_total`, `stripe_webhook_failures_total`.
- **Alerts (PagerDuty or equivalent):** LLM error rate > 30%, parse failure rate > 10%, Stripe webhook failures.

## Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@localhost:5432/careerai
JWT_SECRET=                  # openssl rand -hex 32
OPENROUTER_API_KEY=          # sk-or-v1-...
STRIPE_SECRET_KEY=           # sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=       # whsec_...
STRIPE_PRICE_PRO_MONTHLY=    # price_...
STRIPE_PRICE_PRO_ANNUAL=     # price_...
STRIPE_PRICE_LIFETIME=       # price_...
SENTRY_DSN=                  # https://...@sentry.io/...
APP_URL=https://app.careerai.dev
CORS_ORIGINS=https://careerai.dev,https://app.careerai.dev
```

**Never commit real values. Use a secrets manager in production (Fly.io secrets, AWS Secrets Manager, etc.).**

## Migration Plan from Current State

1. Set up FastAPI skeleton (1 day)
2. Add `/api/rewrite` and `/api/cover-letter` (1 day + prompt engineering)
3. Wire frontend `rewriteBulletWithLlm` to hit the endpoint (1 hour)
4. Add `/api/parse-resume` with spaCy (2 days)
5. Add `/api/auth/*` and migrate from localStorage to backend (2 days)
6. Add Stripe (2 days)
7. Add rate limiting + analytics (1 day)
8. Remove legacy Adzuna/Celery code (1 day)

Total: ~10 working days for a fully production-ready backend.
