# Deployment & Observability — CareerAI

## Target Stack

| Layer | Provider (recommended) | Why |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Native Next.js support, edge functions, automatic preview deploys |
| Backend (FastAPI) | **Fly.io** or **Railway** | Docker support, free tier sufficient for MVP, easy scaling |
| Database (Postgres) | **Supabase** | Free tier, managed backups, built-in auth (if we use it) |
| Object storage (resume uploads) | **Supabase Storage** or **S3** | PDF/DOCX files pre-parse |
| Error tracking | **Sentry** | Industry standard, free tier |
| Logging | **Axiom** or **Better Stack** | Cheap log hosting, integrates with Vercel/Fly |
| Email (auth, transactional) | **Resend** | Clean DX, free tier, good deliverability |
| Analytics | **Plausible** or **PostHog** | Privacy-respecting, no cookies needed |

## Environments

| Env | URL | Branch | Database | Stripe mode |
|---|---|---|---|---|
| **local** | `localhost:3000` (FE) / `localhost:8000` (BE) | any | local Postgres | test mode |
| **preview** | `pr-{n}.careerai.dev` (auto per PR) | PR branch | preview DB | test mode |
| **staging** | `staging.careerai.dev` | `main` | staging DB | test mode |
| **production** | `careerai.dev` | `main` (tagged release) | prod DB | live mode |

## Frontend Deployment (Vercel)

### Setup
1. Connect the GitHub repo to Vercel
2. Set environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` (e.g., `https://api.careerai.dev`)
   - Anything else `NEXT_PUBLIC_*` your code reads
3. Vercel auto-detects Next.js and uses `next build`

### Preview deploys
- Every PR gets a unique URL: `pr-123.careerai.dev`
- Vercel posts the URL as a PR comment
- Merging to `main` auto-deploys to production

### Production deploys
- Tag a release: `git tag v0.1.0 && git push --tags`
- Vercel uses the tagged commit
- (Optional) Add a "Deploy to production" GitHub Action that requires approval

## Backend Deployment (Fly.io)

### Setup
1. Install `fly` CLI: `curl -L https://fly.io/install.sh | sh`
2. `fly launch` in the `backend/` directory
3. Set secrets: `fly secrets set OPENROUTER_API_KEY=... STRIPE_SECRET_KEY=...`
4. Add `fly.toml` (see template below)
5. `fly deploy`

### fly.toml template
```toml
app = "careerai-api"
primary_region = "yyz"  # Toronto

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"
  APP_URL = "https://careerai.dev"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 250
    soft_limit = 200

[[services.tcp_checks]]
  interval = "15s"
  timeout = "2s"
  grace_period = "10s"

[deploy]
  release_command = "alembic upgrade head"
```

### Health check
- `GET /healthz` returns 200 with `{ "status": "ok", "version": "0.1.0" }`
- Fly pings this every 15s

## Database (Supabase)

### Setup
1. Create a project in Supabase
2. Copy the connection string to `DATABASE_URL`
3. Run migrations: `cd backend && alembic upgrade head`
4. Set up daily backups (Supabase does this automatically on paid plans)

### Schema migrations
- Use Alembic (Python). One migration per change.
- Never edit a committed migration — always add a new one.
- Test migrations on a copy of production data before deploying.

### Connection pooling
- Supabase has a built-in pooler (port 6543). Use it for serverless deploys.
- For long-running deploys (Fly.io), use the direct connection (port 5432).

## Observability

### Error tracking (Sentry)
1. Create a Sentry project for each env (dev, staging, prod)
2. Add the SDK to both frontend and backend
3. **Before-send hook:** Strip PII from error reports. Specifically, scrub:
   - User emails
   - Resume text
   - JD text
   - API keys
   - JWT tokens

```python
# Backend (sentry_sdk)
def before_send(event, hint):
    if "request" in event and "data" in event["request"]:
        event["request"]["data"] = "[REDACTED]"
    if "extra" in event:
        for k in list(event["extra"].keys()):
            if k in ("resume", "jd", "bullet", "cover_letter"):
                event["extra"][k] = "[REDACTED]"
    return event
```

### Logging
- Structured JSON to stdout in production
- Collected by Fly.io (or your platform) and shipped to Axiom/Better Stack
- Set log retention to 30 days; archived to S3 (Glacier) for 1 year

### Metrics
- Backend exposes Prometheus at `GET /metrics`
- Track: `llm_calls_total{status}`, `llm_latency_seconds`, `parse_failures_total`, `stripe_webhook_failures_total`, `auth_attempts_total{status}`
- Dashboard in Grafana Cloud (free tier)

### Uptime monitoring
- Better Uptime or UptimeRobot: ping `/healthz` every 60s from 3 regions
- Alert on 2+ consecutive failures

### Alerts (PagerDuty or simple email/Slack)

| Alert | Condition | Severity |
|---|---|---|
| LLM error rate | > 30% over 5 min | High |
| Parse failure rate | > 10% over 1 hour | Medium |
| Stripe webhook failures | > 5 in 5 min | High |
| API 5xx rate | > 1% over 5 min | High |
| DB connection pool exhausted | pool > 90% for 5 min | Medium |
| Disk usage | > 80% | Low |
| Uptime check failed | 2+ regions fail | Critical |

## CI/CD

### GitHub Actions workflow (`.github/workflows/ci.yml`)

Runs on every PR and push to `main`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm test
      - run: npm run build
  # backend tests added when backend lands
```

### Required checks before merge
- All tests pass
- Build succeeds
- No `any` types added (TypeScript strict)
- No secrets in diff (gitleaks)
- Lint passes

## Release Process

1. Cut a release branch: `git checkout -b release/v0.1.0`
2. Bump version in `package.json` and `backend/app/__init__.py`
3. Update `CHANGELOG.md` with user-facing changes
4. Open a PR to `main`
5. After merge and CI green, tag: `git tag v0.1.0 && git push --tags`
6. Vercel auto-deploys frontend; Fly.io auto-deploys backend
7. Verify in production: hit `/healthz`, run a test rewrite, check Sentry
8. Announce in #launches Slack channel (or equivalent)

## Rollback

- **Frontend:** Vercel keeps the last 10 deployments. One click to promote an older one.
- **Backend:** Fly.io keeps the last 10 releases. `fly releases rollback` to revert.
- **Database:** Supabase has point-in-time recovery on paid plans. Restore to a timestamp.

Always communicate rollbacks in #incidents with: what broke, who is affected, what the rollback is, ETA to fix.
