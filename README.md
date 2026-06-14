# CronDash

> A visual cron job manager with a terminal-style interface. Schedule, monitor, and manage your automated HTTP tasks with precision. **Keep your Render free-tier apps alive forever!**

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black)
![React](https://img.shields.io/badge/React-19.2.4-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1)
![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7)

🔗 **Live Demo**: [https://cron-dash.onrender.com](https://cron-dash.onrender.com)

---

## Project Overview

CronDash is a web-based cron job management system that allows users to:

- **Schedule** HTTP endpoints with cron expressions (GET, POST, PUT, DELETE)
- **Monitor** job execution history with status codes, duration, and response logs
- **Manage** jobs with enable/disable/toggle controls
- **Keep apps alive** — ping your Render free-tier apps every 10 minutes so they never sleep
- **Get alerts** — Slack, email, and webhook notifications on job failures
- **Authenticate** via custom JWT-based auth (bcryptjs + jose)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS 4 |
| Database | PostgreSQL (Neon — free tier) |
| ORM | Prisma |
| Auth | Custom JWT (jose + bcryptjs, HTTP-only cookies) |
| Scheduler | node-cron (in-process) + external cron fallback |
| HTTP Client | axios |
| Email | Resend |
| Deployment | Render (free tier) |
| Fonts | JetBrains Mono (Google Fonts) |

---

## Project Structure

```
CronDash/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   │   ├── login/        # POST /api/auth/login
│   │   │   ├── logout/       # POST /api/auth/logout
│   │   │   ├── register/     # POST /api/auth/register
│   │   │   └── me/           # GET /api/auth/me
│   │   ├── jobs/             # Job CRUD endpoints
│   │   │   ├── [id]/         # Single job operations
│   │   │   │   ├── route.ts  # GET/PUT/DELETE
│   │   │   │   ├── run/      # POST manual trigger
│   │   │   │   ├── runs/     # GET run history
│   │   │   │   ├── toggle/   # POST enable/disable
│   │   │   │   └── duplicate/# POST duplicate job
│   │   │   └── route.ts      # GET/POST (list + create)
│   │   ├── settings/         # User settings endpoints
│   │   │   ├── slack/        # Slack webhook config
│   │   │   ├── email/        # Alert email config
│   │   │   ├── webhook/      # Webhook notification config
│   │   │   ├── apikey/       # API key management
│   │   │   └── danger/       # Delete all jobs / account
│   │   ├── cron/             # External cron trigger endpoint
│   │   └── test/             # Health check
│   ├── dashboard/            # Dashboard page (stats + job list)
│   ├── jobs/                 # Job management pages
│   │   ├── [id]/             # Job detail + edit pages
│   │   └── create/           # Create job page
│   ├── login/                # Login page
│   ├── signup/               # Signup page
│   ├── settings/             # User settings page
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles + theme
├── components/               # Reusable UI components
│   ├── ui/                   # Base UI components
│   │   ├── Button.tsx        # Button (primary/secondary/error)
│   │   ├── Card.tsx          # Card container with title
│   │   ├── Input.tsx         # Terminal-style input
│   │   ├── Logo.tsx          # CronDash ASCII logo
│   │   ├── ProfileMenu.tsx   # User profile dropdown
│   │   └── StatusIndicator.tsx # Status dot (success/pending/error)
│   ├── Toast.tsx             # Toast notification system
│   ├── LogModal.tsx          # Job run log viewer modal
│   └── TestEndpoint.tsx      # Test endpoint button widget
├── lib/                      # Core business logic
│   ├── auth.ts               # JWT auth (jose + bcryptjs)
│   ├── prisma.ts             # Prisma client singleton
│   ├── scheduler.ts          # Job scheduling (node-cron)
│   ├── executor.ts           # Job execution (axios HTTP calls)
│   ├── alerts.ts             # Slack + email + webhook alerts
│   ├── cron-utils.ts         # Cron validation & description
│   └── rate-limit.ts         # In-memory rate limiter for login
├── prisma/
│   └── schema.prisma         # Database schema (PostgreSQL)
├── middleware.ts              # JWT auth middleware
├── render.yaml               # Render deployment blueprint
├── Dockerfile                # Docker deployment
├── docker-compose.yml        # Docker Compose config
├── .node-version             # Node.js version (22)
└── README.md                 # This file
```

---

## Database Schema

CronDash uses **Prisma ORM** with **Neon PostgreSQL**.

### User
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `email` | String (unique) | User email |
| `password` | String | Hashed password (bcrypt, 12 rounds) |
| `slackWebhook` | String? | Slack webhook URL for alerts |
| `webhookUrl` | String? | Custom webhook URL for alerts |
| `alertEmail` | String? | Email for alerts |
| `apiKey` | String (unique) | API key for external cron access |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### Job
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `name` | String | Display name |
| `url` | String | Target HTTP endpoint |
| `method` | String | HTTP method (GET/POST/PUT/DELETE) |
| `headers` | String? | JSON string of custom headers |
| `body` | String? | JSON string of request body |
| `schedule` | String | Cron expression (e.g., `*/5 * * * *`) |
| `enabled` | Boolean | Whether the job is active |
| `lastRun` | DateTime? | Last execution timestamp |
| `nextRun` | DateTime? | Next scheduled run |
| `userId` | String | Foreign key to User |

### JobRun
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `status` | String | `success` or `failed` |
| `statusCode` | Int? | HTTP response status code |
| `duration` | Int? | Execution time in milliseconds |
| `response` | String? | Response body (max 500 chars) |
| `error` | String? | Error message if failed |
| `executedAt` | DateTime | Execution timestamp |
| `jobId` | String | Foreign key to Job |

---

## How It Works

### Architecture Flow

```
cron-job.org (external)
      │ every 10 min
      ▼
┌────────────────────────────────────────┐
│           CronDash (Next.js)           │
│                                        │
│  /api/cron ──► Triggers all jobs       │
│       │                                │
│       ▼                                │
│  ┌──────────┐    ┌─────────────────┐   │
│  │ Scheduler│───►│  Executor       │   │
│  │(node-cron│    │  (axios HTTP)   │   │
│  └──────────┘    └────────┬────────┘   │
│                           │            │
│  ┌────────────────────────▼──────────┐ │
│  │         Prisma ORM                │ │
│  │     Neon PostgreSQL (free)        │ │
│  └───────────────────────────────────┘ │
│                           │            │
│  ┌────────────────────────▼──────────┐ │
│  │         Alerts                    │ │
│  │  Slack / Email / Webhook          │ │
│  └───────────────────────────────────┘ │
└────────────────────────────────────────┘
      │
      ▼
┌──────────────┐  ┌──────────────┐
│ Your Site A  │  │ Your Site B  │  ... (all stay awake!)
└──────────────┘  └──────────────┘
```

### Authentication Flow

1. User registers at `/signup` — password hashed with **bcryptjs** (12 salt rounds)
2. JWT token created with **jose** (HS256, 7-day expiry)
3. Token stored as **HTTP-only cookie** (`crondash-session`)
4. Middleware verifies JWT on every request
5. API routes use `requireUserId()` to extract user from session
6. Rate limiting on login (5 attempts / 15 min lockout)

### Keep Render Apps Alive

1. Create a job in CronDash for each Render app with schedule `*/10 * * * *`
2. Set up [cron-job.org](https://cron-job.org) to ping CronDash's `/api/cron?apiKey=YOUR_KEY` every 10 min
3. cron-job.org keeps CronDash awake → CronDash keeps all your apps awake
4. **Everything stays alive, completely free** ✅

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/login` | POST | Authenticate and set session (rate-limited) |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/auth/me` | GET | Get current user info |

### Jobs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs` | GET | List all jobs for current user |
| `/api/jobs` | POST | Create a new job |
| `/api/jobs/[id]` | GET | Get single job details |
| `/api/jobs/[id]` | PUT | Update a job |
| `/api/jobs/[id]` | DELETE | Delete a job |
| `/api/jobs/[id]/run` | POST | Trigger job manually |
| `/api/jobs/[id]/runs` | GET | Get run history for a job |
| `/api/jobs/[id]/toggle` | POST | Enable/disable a job |
| `/api/jobs/[id]/duplicate` | POST | Duplicate a job |

### Settings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/slack` | POST | Save Slack webhook URL |
| `/api/settings/email` | POST | Save alert email address |
| `/api/settings/webhook` | POST | Save custom webhook URL |
| `/api/settings/apikey` | POST | Regenerate API key |
| `/api/settings/danger/delete-all-jobs` | POST | Delete all user's jobs |
| `/api/settings/danger/delete-account` | POST | Delete user account |

### System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cron` | GET | External cron trigger (requires `?apiKey=`) |
| `/api/test` | GET | Health check |

---

## Cron Expression Reference

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sunday=0)
│ │ │ │ │
* * * * *
```

| Expression | Schedule |
|-----------|----------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `*/10 * * * *` | Every 10 minutes |
| `*/15 * * * *` | Every 15 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 9 * * *` | Daily at 9 AM |
| `0 9 * * 1` | Every Monday at 9 AM |
| `0 0 1 * *` | First day of every month |

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- [Neon](https://neon.tech) PostgreSQL account (free)

### Local Development

```bash
# Clone the repository
git clone https://github.com/NavDevs/CronDash.git
cd CronDash

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Neon database URLs and a session secret

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Database (Neon PostgreSQL - free at https://neon.tech)
DATABASE_URL="postgresql://user:pass@endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@endpoint.region.aws.neon.tech/neondb?sslmode=require"

# Session Secret (REQUIRED - min 32 characters)
SESSION_SECRET="your-random-secret-key-min-32-chars"

# Email alerts (optional - via Resend)
RESEND_API_KEY=""
RESEND_FROM_EMAIL="alerts@crondash.com"
```

---

## Deployment

### Deploy to Render (Free)

1. Push code to GitHub
2. Create a free [Neon](https://neon.tech) PostgreSQL database
3. Go to [Render](https://render.com) → **New → Web Service** → connect your repo
4. Set build command: `npm install && npx prisma generate && npx prisma db push && npm run build`
5. Set start command: `npm run start`
6. Add environment variables: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `NODE_ENV=production`
7. Deploy!

### Docker Deployment

```bash
docker compose up -d
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## UI Design System

CronDash uses a **terminal/hacker aesthetic** with:

- **Font**: JetBrains Mono (monospace throughout)
- **Colors**: Dark background (`#0a0a0a`) with green (`#33ff00`) as primary accent
- **Theme**: CRT-style scanline overlay, blinking cursors, command prompts
- **Components**: Styled like terminal output with `[LABEL]` and `user@crondash:~$` syntax

---

## Features

- [x] User registration and login (JWT + bcrypt)
- [x] Rate-limited authentication (5 attempts / 15 min)
- [x] Create/edit/delete/duplicate cron jobs
- [x] Custom HTTP headers and body (JSON)
- [x] Real-time execution history with auto-refresh
- [x] Manual job trigger
- [x] Enable/disable jobs
- [x] Dashboard search & filter (by name, URL, schedule, status)
- [x] Paginated job table
- [x] Slack webhook failure notifications
- [x] Email failure notifications via Resend
- [x] Custom webhook failure notifications
- [x] External cron endpoint with API key auth
- [x] Keep Render free-tier apps alive
- [x] Render deployment (free tier)
- [x] Docker deployment

---

## License

MIT © NavDevs

---

## Contributing

Contributions welcome! Open an issue or submit a pull request.