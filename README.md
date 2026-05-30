# RecruitAI — Resume Screening & Candidate Ranking App

> AI-powered resume screening that compares resumes against a Job Description and ranks candidates by fit score (0–100).

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)
![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)
![Stack](https://img.shields.io/badge/Database-MySQL-4479A1?style=flat-square&logo=mysql)
![Stack](https://img.shields.io/badge/AI-Claude%20(Anthropic)-blueviolet?style=flat-square)

---

## Features

- **Multi-resume upload** — PDF, DOC, DOCX with drag-and-drop
- **AI-powered scoring** — Claude AI evaluates each resume across 4 dimensions
- **Smart ranking** — candidates sorted highest to lowest by match %
- **Score breakdown** — Skills, Experience, Education, Keywords
- **Skill gap analysis** — matching and missing skills per candidate
- **Score visualization** — bar charts and radar charts
- **Search & sort** — filter candidates in real time
- **CSV export** — one-click export of ranked candidates
- **Responsive UI** — works on desktop and tablet

---

## Architecture

```
resume-screener/
├── backend/              ← FastAPI + MySQL
│   ├── app/
│   │   ├── main.py       ← App entry, CORS, routers
│   │   ├── api/          ← REST endpoints
│   │   │   ├── resumes.py
│   │   │   ├── jobs.py
│   │   │   └── analysis.py
│   │   ├── core/
│   │   │   ├── config.py ← Settings via .env
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── models.py ← SQLAlchemy ORM models
│   │   │   └── schemas.py← Pydantic schemas
│   │   └── services/
│   │       ├── resume_parser.py  ← PDF/DOCX extraction
│   │       └── scorer.py         ← AI + heuristic scoring
│   └── requirements.txt
│
├── frontend/             ← React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── JobPage.jsx
│   │   │   └── ResultsPage.jsx
│   │   ├── components/
│   │   │   ├── ui/       ← ScoreRing, ScoreBar, SkillBadge, Skeleton
│   │   │   ├── layout/   ← Sidebar Layout
│   │   │   └── dashboard/← CandidateCard
│   │   ├── services/api.js
│   │   └── utils/scoreUtils.js
│   └── package.json
│
└── setup_db.sql          ← MySQL setup script
```

---

## Scoring Approach

Each resume is scored across **4 dimensions** using Claude AI (with heuristic fallback):

| Dimension | Weight | How it's measured |
|-----------|--------|-------------------|
| **Skills Match** | 35% | Overlap between resume skills and JD requirements |
| **Experience** | 30% | Years of experience vs. JD requirement |
| **Education** | 20% | Degree level alignment with role |
| **Keyword Similarity** | 15% | JD keyword presence in resume text |

**Overall Score** = `Skills×0.35 + Experience×0.30 + Education×0.20 + Keywords×0.15`

If the Anthropic API key is not set, the system falls back to a heuristic scorer that uses regex-based extraction and keyword overlap — no external dependency required.

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+
- (Optional) Anthropic API key for AI scoring

---

## Step-by-Step Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/yourusername/resume-screener.git
cd resume-screener
```

---

### Step 2 — Set up MySQL database

**Option A — MySQL CLI:**
```bash
mysql -u root -p < setup_db.sql
```

**Option B — Manual:**
```sql
CREATE DATABASE resume_screener CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### Step 3 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
# MySQL connection (update user/password/host as needed)
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/resume_screener

# Anthropic API key (get one at https://console.anthropic.com)
# Leave blank to use heuristic scoring
ANTHROPIC_API_KEY=sk-ant-...

MAX_FILE_SIZE_MB=10
```

---

### Step 4 — Install backend dependencies

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

> **Note:** On Ubuntu/Debian, you may need `sudo apt install antiword` for .doc support.

---

### Step 5 — Start the backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: **http://localhost:8000/docs**

The database tables will be created automatically on first start.

---

### Step 6 — Install frontend dependencies

Open a new terminal:
```bash
cd frontend
npm install
```

---

### Step 7 — Start the frontend

```bash
npm run dev
```

App available at: **http://localhost:3000**

---

## Usage Workflow

1. **Upload Resumes** → Go to "Upload Resumes" → drag-drop PDF/DOCX files
2. **Add Job Description** → Go to "Job Description" → paste or type the JD
3. **Run Analysis** → Go to "Results" → select the job → click "Run Analysis"
4. **View Rankings** → Candidates appear ranked by AI match score
5. **Export** → Click "Export CSV" to download the ranked list

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload multiple resumes |
| GET | `/api/resumes/` | List all resumes |
| DELETE | `/api/resumes/{id}` | Delete a resume |
| POST | `/api/jobs/` | Create job description |
| GET | `/api/jobs/` | List all jobs |
| POST | `/api/analysis/run/{job_id}` | Run AI scoring |
| GET | `/api/analysis/results/{job_id}` | Get ranked results |
| GET | `/api/analysis/export/{job_id}` | Export CSV |

Full interactive docs: **http://localhost:8000/docs**

---

## Deployment

### Deploy Backend (Render)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set build command: `pip install -r backend/requirements.txt`
4. Set start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env`
6. Use a managed MySQL (Railway, PlanetScale, or Render's PostgreSQL)

### Deploy Frontend (Vercel / Netlify)

```bash
cd frontend
npm run build
```

Upload the `dist/` folder to Vercel or Netlify.
Set environment variable `VITE_API_URL` if backend is on a different domain,
and update `vite.config.js` proxy accordingly.

---

## Assumptions

- Candidate name is extracted from the first non-email line of the resume
- Skills are matched against a curated list of ~40 common tech skills
- Experience years are extracted using regex patterns
- Education level is detected by keywords (PhD, Master, Bachelor, etc.)
- The AI scorer (Claude) provides more nuanced scoring; heuristics are the fallback

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Dropzone |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | MySQL 8 |
| AI | Anthropic Claude (claude-sonnet-4) |
| PDF Parsing | pdfplumber |
| DOCX Parsing | python-docx |
| Deployment | Render (backend), Vercel (frontend) |

---

## License

MIT — free to use, modify, and deploy.
