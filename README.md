# Shortify — Link Management & Analytics Platform

Shortify is a full-stack URL shortening and analytics platform. Create short links with custom aliases, track click analytics in real time, generate QR codes, and manage link expiration — all from a clean, modern dashboard.

> **Built by**: [Sumit Parsad](https://github.com/SumitParsad) © 2026

---

## ✨ Features

- **Fast Link Redirection** — Redis-cached 302 redirects before any database lookup
- **Custom Alias Slugs** — Auto-generated 8-character slugs or user-defined custom aliases
- **Real-Time Click Analytics** — Click volume charts, device breakdown, browser breakdown, geolocation insights, and top link leaderboards
- **Vector QR Code Export** — Client-side SVG/PNG QR code generation for any short link
- **Link Expiration & Status Control** — Set expiration dates or toggle links active/inactive without losing analytics history
- **Multi-Field Search & Filtering** — Search by title, slug, or destination URL with status filter pills
- **Dual Theme Engine** — System auto, warm light (Claude Alabaster), and dark (Obsidian) modes
- **URL Normalization** — Auto-prepends `https://` so users never need to type it

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology |
| :--- | :--- |
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| State & Cache | Zustand + TanStack Query v5 |
| Fonts | Outfit, Inter, JetBrains Mono |
| Icons | Lucide React |

### Backend
| Layer | Technology |
| :--- | :--- |
| API | FastAPI (Python 3.11+) |
| Database | PostgreSQL + AsyncSQLAlchemy |
| Migrations | Alembic |
| Cache | Redis |
| Auth | Bcrypt + PyJWT |
| Validation | Pydantic v2 |

---

## 📁 Repository Structure

```
shortify/
├── shortify_frontend/    # React 19 + Vite web app
└── shortify_backend/     # FastAPI + PostgreSQL + Redis API
```

---

## 🚀 Local Setup

### Backend

```bash
cd shortify_backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
source venv/bin/activate       # macOS / Linux

pip install -r requirements.txt

# Set environment variables
cp .env.example .env           # Fill in your values

# Run database migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

### Frontend

```bash
cd shortify_frontend

npm install

cp .env.example .env.local     # Fill in VITE_API_BASE_URL and VITE_SHORT_URL_BASE

npm run dev
```

App available at `http://localhost:5173`.

---

## 🌐 Environment Variables

### Backend (`.env`)

| Variable | Description |
| :--- | :--- |
| `DATABASE_HOSTNAME` | PostgreSQL host |
| `DATABASE_PORT` | PostgreSQL port (default: `5432`) |
| `DATABASE_USERNAME` | PostgreSQL user |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `DATABASE_NAME` | PostgreSQL database name |
| `REDIS_URL` | Redis connection URL |
| `SECRET_KEY` | Random 32+ char string for session signing |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `BASE_URL` | Public base URL of your backend (e.g. `https://api.onrender.com`) |
| `ENVIRONMENT` | `development` or `production` |
| `CORS_ORIGINS` | Allowed frontend origins (e.g. `https://your-app.vercel.app`) |

### Frontend (`.env.local`)

| Variable | Description |
| :--- | :--- |
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `https://api.onrender.com/api/v1`) |
| `VITE_SHORT_URL_BASE` | Backend public base URL used for link previews on landing page |

---

## 🚢 Deployment (Free Tier)

| Service | Provider | Purpose |
| :--- | :--- | :--- |
| Frontend | [Vercel](https://vercel.com) | Root: `shortify_frontend` |
| Backend API | [Render.com](https://render.com) | Root: `shortify_backend` |
| PostgreSQL | [Neon.tech](https://neon.tech) | Serverless Postgres |
| Redis | [Upstash.com](https://upstash.com) | Serverless Redis |
