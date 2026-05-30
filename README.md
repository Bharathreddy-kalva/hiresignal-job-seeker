# HireSignal

Real-time company growth intelligence platform for job seekers. HireSignal monitors funding rounds, hiring surges, and expansion signals across thousands of companies so you can apply at the exact moment a company is primed to grow its team.

## Project Structure

```
hiresignal-job-seeker/
├── frontend/          # React + TypeScript + Vite + Tailwind CSS + shadcn/ui
├── backend/           # NestJS + TypeScript + Prisma ORM (PostgreSQL)
├── docker-compose.yml # PostgreSQL (5432) + Redis (6379)
└── README.md
```

## Tech Stack

| Layer     | Technology                                                   |
|-----------|--------------------------------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui       |
| Backend   | NestJS, TypeScript, Prisma ORM                               |
| Database  | PostgreSQL 16                                                |
| Cache     | Redis 7                                                      |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Start the infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL on port **5432** and Redis on port **6379**.

### 2. Backend setup

```bash
cd backend
cp .env.example .env      # already configured for Docker Compose defaults
npm install
npx prisma migrate dev    # runs DB migrations
npm run start:dev         # starts NestJS on http://localhost:3000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev               # starts Vite dev server on http://localhost:5173
```

## Backend — Environment Variables

Configured in `backend/.env` (see `backend/.env.example`):

| Variable       | Default                                               |
|----------------|-------------------------------------------------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/hiresignal` |
| `REDIS_URL`    | `redis://localhost:6379`                              |
| `PORT`         | `3000`                                                |
| `NODE_ENV`     | `development`                                         |

## Database Schema (Prisma)

Core models defined in `backend/prisma/schema.prisma`:

- **User** — job seeker accounts with saved jobs and alerts
- **Company** — tracked companies (name, website, LinkedIn)
- **GrowthSignal** — detected signals (funding, hiring surge, expansion)
- **Job** — job postings linked to companies
- **SavedJob** — user ↔ job bookmarks
- **Alert** — saved search filters per user

Run migrations:

```bash
cd backend && npx prisma migrate dev --name <migration-name>
```

Explore the database in Prisma Studio:

```bash
cd backend && npx prisma studio
```

## Frontend — Adding shadcn/ui Components

```bash
cd frontend && npx shadcn@latest add button
```

Components are placed in `frontend/src/components/ui/`.
