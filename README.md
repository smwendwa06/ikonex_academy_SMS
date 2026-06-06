# Ikonex Academy — Student Management System

A full-stack web application for managing students, class streams, subjects, scores, and generating PDF report cards.

---

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS |
| Backend    | Node.js, Express, TypeScript |
| Database   | PostgreSQL (via Prisma ORM) |
| PDF        | PDFKit                      |
| Deployment | Netlify (frontend) + Railway (backend + DB) |

---

## Project Structure

```
ikonex_systems/
├── backend/          Node.js/Express REST API
│   ├── prisma/       Database schema & seed
│   └── src/          Routes, middleware, PDF lib
├── frontend/         Next.js application
│   └── src/          Pages, components, API client
├── .gitignore
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Node.js v18+
- PostgreSQL running locally (or a Supabase free project)
- Git

---

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/ikonex_systems.git
cd ikonex_systems

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure environment

**Backend** — copy and fill in:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ikonex_sms"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

**Frontend** — copy and fill in:
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### 3. Set up the database

```bash
cd backend

# Push schema to database
npm run db:push

# Seed with sample data (streams, students, subjects, scores)
npm run db:seed
```

---

### 4. Run both servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# API running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App running at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### Backend → Railway

1. Go to [railway.app](https://railway.app) and create a new project.
2. Click **Add Service → PostgreSQL** to provision a database.
3. Click **Add Service → GitHub Repo**, connect your repo, and set the **root directory** to `backend`.
4. In the backend service **Variables**, Railway auto-injects `DATABASE_URL`. Add:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-app.netlify.app
   ```
5. Railway uses `railway.toml` — it runs `npm run build && npm run db:push` then `npm start`.
6. After deploy, copy your Railway backend URL (e.g. `https://ikonex-backend.railway.app`).

---

### Frontend → Netlify

1. Go to [netlify.com](https://netlify.com) and create a new site from Git.
2. Connect your GitHub repo.
3. Set **Base directory** to `frontend`, **Build command** to `npm run build`, **Publish directory** to `.next`.
4. Add the environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://ikonex-backend.railway.app
   ```
5. Install the Netlify Next.js plugin (auto-detected via `netlify.toml`).
6. Deploy.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/streams` | List / create streams |
| GET/PUT/DELETE | `/api/streams/:id` | Stream CRUD |
| GET | `/api/streams/:id/students` | Students in stream |
| POST/DELETE | `/api/streams/:id/subjects` | Assign / remove subject |
| GET/POST | `/api/students` | List / register students |
| GET/PUT/DELETE | `/api/students/:id` | Student CRUD |
| GET/POST | `/api/subjects` | List / create subjects |
| GET/PUT/DELETE | `/api/subjects/:id` | Subject CRUD |
| POST | `/api/scores` | Record score (upsert — prevents duplicates) |
| PUT | `/api/scores/:id` | Edit score |
| GET | `/api/scores/student/:id` | Scores for a student |
| GET | `/api/results/student/:id?term=&year=` | Student result with grades & positions |
| GET | `/api/results/stream/:id?term=&year=` | Class rankings & subject averages |
| GET | `/api/reports/student/:id?term=&year=` | Download PDF report card |
| GET | `/api/reports/stream/:id?term=&year=` | Download PDF class report |
| GET/PUT | `/api/grading` | View / update grading scale |

---

## Grading Scale (KCSE)

| Grade | Score Range | Points |
|-------|-------------|--------|
| A     | 75 – 100    | 12     |
| A-    | 70 – 74     | 11     |
| B+    | 65 – 69     | 10     |
| B     | 60 – 64     | 9      |
| B-    | 55 – 59     | 8      |
| C+    | 50 – 54     | 7      |
| C     | 45 – 49     | 6      |
| C-    | 40 – 44     | 5      |
| D+    | 35 – 39     | 4      |
| D     | 30 – 34     | 3      |
| D-    | 25 – 29     | 2      |
| E     | 0 – 24      | 1      |

Grading scales are stored in the database and can be updated via the API.

---

## Features

- **Class Stream Management** — Create and manage Form 1A, 1B, 2A, etc.
- **Student Registration** — Full CRUD with stream assignment, search, and filtering
- **Subject Management** — Create subjects and assign them to streams
- **Score Entry** — Bulk entry per subject/stream with exam (max 70) + CAT (max 30)
- **Duplicate Prevention** — Upsert logic with database UNIQUE constraint
- **Results Processing** — Automatic totals, averages, KCSE grades, subject positions, class rankings
- **PDF Report Cards** — Per-student with full subject breakdown and class position
- **PDF Class Reports** — Ranked class list with subject performance summary

---

## License

MIT — Developed for Ikonex Academy by Sanaipei Mwendwa
