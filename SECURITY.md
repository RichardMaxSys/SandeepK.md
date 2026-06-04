# Security & Privacy — CareerAI

This document is the public-facing security policy for the CareerAI product. It applies to the backend (when it exists), the frontend, and any contractors or agents touching the codebase.

## 1. Data We Collect

| Data | Where | Retention | Sensitive? |
|---|---|---|---|
| Master resume (name, contact, experience, education, skills) | localStorage (MVP) → Postgres (post-MVP) | Until user deletes account | **PII** |
| Tailored cover letters | Generated on demand, never persisted (MVP) | None | **PII-adjacent** |
| Job description text | Client-side only (not sent to backend in MVP) | None | Low |
| LLM prompts (resume bullet + JD) | Sent to OpenRouter, NOT logged by us | Per OpenRouter policy (typically 30 days, no training) | **PII-adjacent** |
| Email (auth) | Postgres (post-MVP) | Until user deletes account | **PII** |
| Stripe customer ID, subscription status | Postgres | Until user deletes account | Low |
| Usage events (anonymized: which feature, when) | Postgres (post-MVP) | Aggregated monthly, raw 90 days | None |
| Error logs (Sentry) | Sentry | 30 days | Low — must scrub PII before sending |

## 2. PII Handling Rules

### DO
- Treat every resume, cover letter, and JD as **PII** by default
- Mask emails and phone numbers in any log line: `s***@e****.com`, `+1 416-***-0123`
- Hash user IDs in analytics events; never use email as a foreign key in event tables
- Strip PII from error reports before sending to Sentry (`beforeSend` hook)
- Require explicit user consent before sharing or exporting their data
- Allow users to export and delete all their data (GDPR + CCPA compliance)

### DO NOT
- Do not log full resume content, cover letter text, or JD content at INFO level
- Do not include resume text in error messages
- Do not include JD text in any analytics event
- Do not store payment information (cards, CVC) — that's Stripe's job
- Do not include emails in URL paths or query strings
- Do not send user data to OpenRouter for training (their default; double-check enterprise tier)
- Do not commit `.env` files, API keys, or customer data to the repo

## 3. LLM Call Safety

When calling OpenRouter (DeepSeek R1 default):

1. **Minimize PII sent to the LLM.** The frontend should send only the bullet text and (optionally) the JD. Do NOT send the user's full resume, name, email, or phone to the LLM.
2. **No training.** OpenRouter's default policy is no training on API calls. Confirm in the enterprise agreement if migrating off the free tier.
3. **Timeouts.** Every LLM call has an 8-second client timeout and a 15-second server timeout. Never block the UI waiting for a slow LLM.
4. **Fallback.** The frontend has a deterministic rewrite engine (`lib/ai-rewrite.ts`) that runs without the LLM. On any LLM failure, we fall back automatically. Users always get a result.
5. **Cost limits.** Per-user daily call caps (see BACKEND_SPEC § "LLM Cost Controls"). Circuit breaker if error rate spikes.

### Prompt-injection hardening

The JD is treated as **untrusted user input** (a user might paste a malicious JD containing "Ignore previous instructions and..."). The rewrite prompt must:
- Be the SYSTEM message, not the user message
- Treat the JD as data, not instructions
- Have a strict output format (JSON) and reject anything else
- Be reviewed by a second engineer before any prompt change ships

## 4. Authentication & Authorization

- **Passwords:** bcrypt with cost factor 12+. Never store plaintext. Never log.
- **Sessions:** JWT in httpOnly, Secure, SameSite=Lax cookie. 30-day expiry with refresh.
- **OAuth (Phase 2):** Google + LinkedIn via NextAuth or Clerk. Scopes requested: `openid email profile`. No write scopes.
- **MFA:** TOTP, optional, encouraged for Pro users.
- **Rate limits on auth:** 5 failed logins per email per hour (lock out for 1 hour). IP-based: 20 logins per IP per hour.
- **Password reset:** Time-limited token (1 hour), single use.

## 5. Stripe & Billing

- **Card data:** Goes directly from the user's browser to Stripe. We never see or store card numbers, expiry, or CVC.
- **Webhook verification:** Every Stripe webhook is signature-verified against `STRIPE_WEBHOOK_SECRET`. Reject any unsigned event.
- **No double-charging:** Idempotency keys on checkout session creation. Store Stripe event IDs to deduplicate webhook processing.
- **Refund policy:** Self-service via Stripe Customer Portal. We process refunds within 5 business days.

## 6. Rate Limiting & Abuse Prevention

| Surface | Free | Pro |
|---|---|---|
| ATS check | 1/day | unlimited |
| Tailor | 1/week | unlimited |
| PDF export | 3/month | unlimited |
| LLM calls per day | 10 | 200 |
| Auth attempts per email | 5/hour | 5/hour |
| Auth attempts per IP | 20/hour | 20/hour |

Soft limit (UX helper) lives in `lib/usage-limits.ts` (localStorage). Hard limit lives on the backend (Postgres counters) — see `BACKEND_SPEC.md`.

## 7. Secrets Management

### Local dev
- Use `.env` files. Add to `.gitignore`. Never commit.
- Use `python-dotenv` (backend) and `process.env.NEXT_PUBLIC_*` (frontend, must be `NEXT_PUBLIC_` prefix to be exposed to the browser).

### Production
- Use a secrets manager: Fly.io secrets, AWS Secrets Manager, Vercel env vars, etc.
- Rotate OpenRouter + Stripe keys quarterly.
- Use separate keys per environment (dev, staging, prod).
- Never log secrets. Scrub them from error reports.

## 8. Logging Standards

Every log line is structured JSON with these fields:
```json
{
  "ts": "2026-06-04T12:34:56.789Z",
  "level": "info",
  "service": "backend-api",
  "requestId": "req_abc123",
  "userId": "user_xyz",     // hashed
  "event": "ats_check_run",
  "meta": { "durationMs": 245, "score": 78 }
}
```

**Never log:** resume text, cover letter text, JD text, full email, full phone, full name, card data, API keys, JWT tokens, session cookies.

**Safe to log:** user ID hash, request ID, status code, duration, counts, lengths (not content), error type and stack trace (scrubbed of PII), feature names, plan tier.

## 9. Incident Response

1. **Detect:** Sentry alert on error rate spike or PII-in-logs alert from log pipeline
2. **Contain:** Rotate compromised keys, revoke compromised sessions, take the affected service offline
3. **Eradicate:** Patch the vulnerability, add tests
4. **Recover:** Restore from backup if needed, monitor for reoccurrence
5. **Notify:** Within 72 hours, notify affected users + relevant authorities (GDPR Article 33)

## 10. Compliance Targets

- **GDPR (EU):** Right to access, right to deletion, data portability, privacy by design. DPO contact: [TBD].
- **CCPA (California):** Same as above for CA residents.
- **PIPEDA (Canada):** Aligned with GDPR for the Canadian market.
- **SOC 2 Type II:** Target Q4 2026. Need: access logs, change management, vulnerability scans, penetration test.
- **Resume data specifically:** We are NOT a "consumer reporting agency" under FCRA. We do not provide data to third parties for employment decisions. We do not screen candidates.

## 11. What To Do If You Find A Vulnerability

Email `security@careerai.dev` (PGP key on the website). Do not open a public GitHub issue. We aim to acknowledge within 24 hours and patch within 7 days for high-severity issues.
