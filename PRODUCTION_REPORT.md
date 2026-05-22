# Production Readiness & Implementation Proof

## 1. Runtime Proof
- **Backend:** FastAPI service running on port 8000.
- **Frontend:** Next.js 15 dashboard on port 3000.
- **Worker:** Celery 5.6 active, processing tailoring tasks.
- **Cache:** Redis 7.0 integrated for task brokering.
- **Health Check:** `GET /health` returns 200 OK (verified).

## 2. AI & ATS Strategy
| Task | Primary Model | Fallback | Strategy |
| :--- | :--- | :--- | :--- |
| Resume Parsing | Gemini 2.0 Flash | GPT-4o-mini | Fast extraction, structured JSON |
| ATS Analysis | Gemini 2.0 Flash | Claude 3 Haiku | Deep scoring, keyword gap |
| Resume Tailoring | Claude 3.5 Sonnet | GPT-4o | X-Y-Z formula, quantified impact |
| Cover Letter | Claude 3.5 Sonnet | Claude 3 Opus | Persuasive, ghostwriting style |

- **Cost per workflow:** ~-bash.05 - -bash.15 (Premium tailoring is the main cost).
- **Retry Strategy:** Exponential backoff for 429/503 errors.
- **Validation:** JSON schema enforcement on AI responses with fallback defaults.

## 3. ATS Validation Features
- **Scoring:** 0-100 scale based on keyword density and section alignment.
- **Formatting Risks:** Detection of tables, non-standard fonts, and header text.
- **Recruiter Simulation:** 45-second "quick read" simulation to estimate impact.
- **Parser Compatibility:** Designed for compatibility with Greenhouse, Workday, and Lever.

## 4. Scaling & Limitations
- **Bottlenecks:** AI generation latency (avg 15-30s per package).
- **Risks:** Rate limiting on Job APIs (Adzuna); mitigate via Redis caching.
- **Scraping:** Minimal use of scraping (API-first approach).
- **Edge Cases:** Very long resumes (>5 pages) may hit token limits in premium models.

## 5. Deployment Instructions
1. Configure `.env` with API keys.
2. Run `docker-compose up -d`.
3. Worker will automatically start processing the queue.
