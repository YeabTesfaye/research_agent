# Research Agent

A production-ready multi-agent AI research platform. Four specialized CrewAI agents collaborate
sequentially to produce a structured, cited research report from any topic you submit.

```
User submits topic
     ↓
Agent 1 — Researcher: searches the web via Tavily for 5+ credible sources
     ↓
Agent 2 — Reader:     reads and summarizes each source, preserving citations
     ↓
Agent 3 — Analyst:    synthesizes cross-source insights, trends, contradictions
     ↓
Agent 4 — Writer:     formats everything into a structured markdown report
     ↓
User receives full report with citations, saved to their history
```

**Stack:** FastAPI · Next.js (TypeScript) · PostgreSQL · Redis · JWT Auth · CrewAI · OpenAI GPT-4o-mini · Tavily

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (local or [Supabase free tier](https://supabase.com))
- Redis (local or [Upstash free tier](https://upstash.com))
- OpenAI API key (pay-per-use, ~$0.01–0.05 per report)
- Tavily API key (free tier — 1,000 searches/month at [tavily.com](https://tavily.com))
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled

---

## Setup

### 1. Clone and configure environment

```bash
git clone <your-repo-url>
cd research-agent
cp .env .env.local   # optional, or edit .env directly
```

Fill in all values in `.env`.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Database migrations with Alembic:**

```bash
alembic init alembic
```

Edit `alembic/env.py` — replace the `target_metadata = None` line and the `sqlalchemy.url` config:

```python
# At the top of alembic/env.py, add:
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from database import Base
from auth.models import User       # noqa: F401
from reports.models import Report  # noqa: F401
from config import settings

# Replace target_metadata = None with:
target_metadata = Base.metadata

# In run_migrations_offline(), replace the url config line with:
url = settings.DATABASE_URL
```

Then run:

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

**Start the backend:**

```bash
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
pnpm install      # or: npm install
pnpm dev          # or: npm run dev
```

Frontend available at `http://localhost:3000`.

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | — | Exchange refresh token for new pair |
| POST | `/api/auth/forgot-password` | — | Send password reset email |
| POST | `/api/auth/reset-password` | — | Consume token, set new password |
| GET | `/api/auth/me` | ✓ | Get current user |
| POST | `/api/reports/` | ✓ | Start research job (202 Accepted) |
| GET | `/api/reports/` | ✓ | List user's reports |
| GET | `/api/reports/{id}` | ✓ | Get report (ownership enforced) |
| DELETE | `/api/reports/{id}` | ✓ | Delete report (ownership enforced) |
| GET | `/api/health` | — | Health check |

---

## Testing

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secure123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secure123"}'

# Start research (use the access_token from login)
curl -X POST http://localhost:8000/api/reports/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"topic":"RAG systems in production 2025"}'

# Poll until status: "completed" (3-5 minutes)
curl http://localhost:8000/api/reports/1 \
  -H "Authorization: Bearer <access_token>"

# Password reset
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Project Structure

```
research-agent/
├── .env                          # all secrets (never commit this)
├── backend/
│   ├── main.py                   # FastAPI app, CORS, router registration
│   ├── config.py                 # pydantic-settings config
│   ├── database.py               # SQLAlchemy engine + session
│   ├── dependencies.py           # get_current_user JWT dependency
│   ├── crew.py                   # CrewAI orchestration (4 agents, 4 tasks)
│   ├── requirements.txt
│   ├── auth/
│   │   ├── models.py             # User SQLAlchemy model
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── service.py            # JWT, bcrypt, user queries
│   │   ├── email.py              # smtplib password reset emails
│   │   └── router.py             # /register /login /refresh /forgot /reset /me
│   ├── reports/
│   │   ├── models.py             # Report SQLAlchemy model
│   │   ├── schemas.py
│   │   └── router.py             # CRUD + background job dispatch
│   ├── agents/
│   │   ├── researcher.py         # Researcher agent (uses Tavily)
│   │   ├── reader.py             # Reader agent
│   │   ├── analyst.py            # Analyst agent
│   │   └── writer.py             # Writer agent
│   └── tools/
│       └── search.py             # TavilySearchTool (crewai BaseTool)
└── frontend/
    ├── app/
    │   ├── (auth)/               # login, register, forgot-password, reset-password
    │   ├── dashboard/            # research form + agent progress
    │   │   └── history/          # saved reports list
    │   ├── reports/[id]/         # full report view + download + delete
    │   └── layout.tsx
    ├── components/
    │   ├── AgentProgress.tsx     # 4-step agent pipeline display
    │   ├── ReportViewer.tsx      # markdown render + download button
    │   ├── AuthGuard.tsx         # redirect to /login if no token
    │   └── NavBar.tsx
    └── lib/
        ├── api.ts                # axios + JWT interceptor + auto-refresh
        └── auth.ts               # localStorage token helpers
```

---

## Security highlights

- JWT access tokens (30 min) + refresh tokens (7 days) with rotation
- bcrypt password hashing via passlib
- Password reset tokens: 32-byte cryptographically random, expire in 1 hour, single-use
- No email enumeration on forgot-password endpoint
- Report ownership enforced at query level (not just middleware)
- All secrets validated at startup via pydantic-settings