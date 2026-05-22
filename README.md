# AI Career Intelligence Platform

A sophisticated, high-trust AI assistant that finds suitable jobs, analyzes them for ATS compatibility, and generates recruiter-grade tailored application packages.

## 🚀 Overview

This platform is designed to move beyond simple automation. It acts as an intelligent career preparation partner that:
- **Analyzes Job Quality:** Detects scams, "ghost jobs", and unrealistic expectations.
- **Simulates ATS Parsing:** Flags formatting risks and keyword gaps before you apply.
- **Generates Recruiter-Grade Resumes:** Enforces FAANG-level standards and quantified impact (X-Y-Z formula).
- **Keeps You in Control:** A robust manual review workflow ensures every application is human-approved.

## 🛠 Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts.
- **Backend:** FastAPI (Python 3.12), SQLAlchemy (PostgreSQL).
- **Task Queue:** Celery, Redis.
- **AI Integration:** OpenRouter (Gemini 2.0 Flash, Claude 3.5 Sonnet).
- **Automation:** Playwright (Dry-run mode).
- **Document Engine:** WeasyPrint (PDF), python-docx (DOCX).
- **Deployment:** Docker & Docker Compose.

## 🔑 Setup & Installation

### 1. Prerequisites
- Docker & Docker Compose installed.
- API Keys for OpenRouter (and optionally Adzuna for real job searches).

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

### 3. Startup
Run the entire stack using Docker Compose:
```bash
docker compose up --build
```
The system will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## 🧪 Testing Workflow

1. **Upload Resume:** Go to the dashboard and upload your master resume (.pdf or .txt).
2. **Search Jobs:** Search for roles (e.g., "Senior Python Developer").
3. **Tailor Application:** Click "Tailor Resume" on a job card. This runs in the background.
4. **Deep Review:** Open the generated package. Switch between "Intelligence Analysis" and "Resume Preview".
5. **Approve:** Click "Approve & Mark Ready" after reviewing the recruiter feedback and ATS score.
6. **Dry Run:** Click "Dry Run Apply" to open the job page and pre-fill fields using Playwright (stops before submission).

## 🛡 Safety & Privacy
- **No Auto-Submit:** The system strictly avoids automatic submission. All applications require manual human review.
- **Dry-Run Only:** Playwright automation is configured to stop before the final "Submit" button.
- **Encrypted Storage:** All documents are handled securely within the database volume.

## 📝 Known Limitations
- Initial search results use Adzuna API; support for more sources (JSearch, LinkedIn) is modular but pending.
- Playwright automation relies on common field name heuristics; complex forms may require manual completion.
