# Shortify — Modern Link Infrastructure & Analytics Platform

Shortify is a high-performance URL shortening, custom domain alias branding, and real-time click analytics application engineered with React 19, TypeScript, Vite, Tailwind CSS, FastAPI, PostgreSQL, and Redis.

> **Developer & Author**: [Sumit Parsad](https://github.com/SumitParsad)  
> **Version**: 1.0.0

---

## ✨ Key Features

- **High-Speed Link Redirection**: Fast 302 redirection served directly from Redis caching before database lookups.
- **Custom Alias Branding**: Create auto-generated 8-character unique slugs or specify custom domain aliases (`shortify.to/my-alias`).
- **Tokenized Search & Filtering**: Multi-field search across title, short URL, destination URL, and custom slug with status filter pills (*All Links*, *Active*, *Inactive*).
- **Real-Time Click Analytics**: Interactive dashboard visualizations featuring click volume breakdown, top performing link leaderboards, device classification, browser breakdowns, and geolocation insights.
- **Vector QR Code Studio**: Client-side high-resolution vector QR code export for digital and print campaigns.
- **Link Status & Expiration Governance**: Set expiration dates on temporary links or activate/deactivate links anytime without deleting historical statistics.
- **Claude AI Aesthetic System**: Dual-theme engine supporting **System** (OS auto-detection), **Claude Alabaster Light** (warm porcelain ivory), and **Obsidian Dark** modes.
- **URL Normalization**: Automatic protocol prepend (`google.com` ➔ `https://google.com`), internal whitespace rejection, and `type="url"` accessibility.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript (`verbatimModuleSyntax`)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4 + Google Fonts (*Outfit*, *Inter*, *JetBrains Mono*)
- **State & Caching**: TanStack Query v5 + Zustand (with `persist` middleware)
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL + AsyncSQLAlchemy + Alembic
- **Cache & Rate Limiting**: Redis
- **Validation**: Pydantic v2
- **Authentication**: PyJWT + Passlib (Bcrypt)

---

## 📁 Repository Structure

```text
shortify/
├── shortify_frontend/   # React 19 + TypeScript + Vite + Tailwind CSS Web App
└── shortify_backend/    # FastAPI + PostgreSQL + Redis Microservice
```

---

## 🚀 How to Setup Locally

### 1. Backend Setup (`/shortify_backend`)

```bash
cd shortify_backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Apply database migrations
alembic upgrade head

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```

FastAPI interactive documentation available at `http://localhost:8000/docs`.

### 2. Frontend Setup (`/shortify_frontend`)

```bash
cd shortify_frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend application available at `http://localhost:5173`.

---

## 🌐 Free Production Deployment Stack

- **Frontend**: Deployed on **Vercel** (Root: `shortify_frontend`)
- **Backend API**: Deployed on **Render.com** (Root: `shortify_backend`)
- **Database**: Serverless PostgreSQL on **Neon.tech**
- **Redis Cache**: Serverless Redis on **Upstash.com**
