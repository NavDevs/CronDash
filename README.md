# CronDash

> A visual cron job manager with a terminal-style interface. Schedule, monitor, and manage your automated HTTP tasks with precision.

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black)
![React](https://img.shields.io/badge/React-19.2.4-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

---

## Project Overview

CronDash is a web-based cron job management system that allows users to:

- **Schedule** HTTP endpoints with cron expressions (GET, POST, PUT, DELETE)
- **Monitor** job execution history with status codes, duration, and response logs
- **Manage** jobs with enable/disable/toggle controls
- **Authenticate** via a custom session-based auth system
- **Organize** jobs by user with full isolation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS 4 |
| Database | SQLite via Prisma ORM |
| Auth | Custom session (base64 cookie) |
| Scheduler | node-cron (in-process) |
| HTTP Client | axios |
| Email | Resend |
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
│   │   │   ├── me/           # GET /api/auth/me
│   │   │   └── [...nextauth]/ # NextAuth handler (fallback)
│   │   ├── jobs/             # Job CRUD endpoints
│   │   │   ├── [id]/         # Single job operations
│   │   │   │   ├── route.ts  # GET/PUT/DELETE
│   │   │   │   ├── run/      # POST /api/jobs/[id]/run (manual trigger)
│   │   │   │   └── runs/     # GET /api/jobs/[id]/runs
│   │   │   └── route.ts      # GET/POST (list + create)
│   │   ├── init/             # POST /api/init (init scheduler)
│   │   └── test/             # POST /api/test (test endpoint)
│   ├── dashboard/           # Dashboard page (stats + job list)
│   ├── jobs/                # Job management pages
│   │   ├── [id]/            # Job detail page
│   │   └── create/          # Create job page
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── settings/            # User settings page
│   ├── page.tsx             # Landing page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles + theme
├── components/              # Reusable UI components
│   ├── ui/                  # Base UI components
│   │   ├── Button.tsx       # Button (primary/secondary)
│   │   ├── Card.tsx         # Card container with title
│   │   ├── Input.tsx        # Terminal-style input
│   │   ├── Logo.tsx         # CronDash ASCII logo
│   │   ├── ProfileMenu.tsx # User profile dropdown
│   │   ├── ProgressBar.tsx # Progress indicator
│   │   └── StatusIndicator.tsx # Status dot (success/pending/error)
│   ├── LogModal.tsx         # Job run log viewer modal
│   └── SchedulerInit.tsx    # Client-side scheduler initializer
├── lib/                     # Core business logic
│   ├── prisma.ts            # Prisma client singleton
│   ├── session.ts           # Session configuration
│   ├── scheduler.ts         # Job scheduling (node-cron)
│   ├── executor.ts          # Job execution (axios HTTP calls)
│   ├── alerts.ts            # Slack + email (Resend) alert dispatching
│   ├── cron-utils.ts        # Cron validation, description, presets
│   └── rate-limit.ts        # In-memory rate limiter for login
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma        # Database schema
│   ├── dev.db               # SQLite database file
│   └── migrations/          # Prisma migration files
├── types/                   # TypeScript type definitions
│   └── next-auth.d.ts       # NextAuth type augmentation
├── public/                  # Static assets
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── next.config.ts           # Next.js config
├── tailwind.config.ts       # Tailwind config
└── README.md                # This file
```

---

## Database Schema

CronDash uses **Prisma ORM** with **SQLite**. The schema consists of three models:

### User
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `email` | String (unique) | User email |
| `password` | String | Hashed password (bcrypt) |
| `slackWebhook` | String? | Slack webhook URL for alerts |
| `alertEmail` | String? | Email for alerts |
| `apiKey` | String (unique) | API key for external access |
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
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `userId` | String | Foreign key to User |

### JobRun
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `status` | String | `success`, `failed`, or `running` |
| `statusCode` | Int? | HTTP response status code |
| `duration` | Int? | Execution time in milliseconds |
| `response` | String? | Response body snippet (max 500 chars) |
| `error` | String? | Error message if failed |
| `executedAt` | DateTime | Execution timestamp |
| `jobId` | String | Foreign key to Job |

---

## How It Works

### Architecture Flow

```
User Browser
     │
     ▼
┌─────────────────────────────────┐
│         Next.js App Router       │
│  ┌───────────┐  ┌──────────────┐ │
│  │  Pages    │  │   API Routes │ │
│  │ (React)   │  │ (Server)     │ │
│  └─────┬─────┘  └──────┬───────┘ │
│        │              │          │
│        └──────┬───────┘          │
│               ▼                  │
│  ┌────────────────────────────┐ │
│  │       Prisma ORM           │ │
│  │         SQLite             │ │
│  └────────────────────────────┘ │
│               │                  │
│  ┌────────────┴────────────────┐ │
│  │   node-cron Scheduler       │ │
│  │   (in-process)              │ │
│  └────────────┬────────────────┘ │
└───────────────┼──────────────────┘
                ▼
        ┌──────────────┐
        │ HTTP Request │
        │  (axios)     │
        └──────────────┘
```

### Authentication Flow

1. User submits credentials at `/login`
2. Server validates against database (bcrypt comparison)
3. On success, session cookie is set (`crondash-session`)
4. Session contains `{ userId, email }` encoded in base64
5. All API routes check for valid session cookie
6. User data is isolated — jobs are scoped to `session.userId`

### Job Scheduling Flow

1. **Initialization** — `SchedulerInit` component calls `/api/init` on client mount
2. **Load** — Server fetches all enabled jobs from DB
3. **Schedule** — Each job is registered with `node-cron` using its cron expression
4. **Execute** — When a cron trigger fires, `executor.ts` runs the HTTP request
5. **Log** — Results are saved to `JobRun` table with status, code, duration, response
6. **Update** — `Job.lastRun` is updated after each execution

### Creating a Job

1. User navigates to `/jobs/create`
2. Fills form: name, URL, method, schedule, headers (JSON), body (JSON)
3. POST to `/api/jobs` with session cookie
4. Server creates job in DB and registers it with scheduler
5. User is redirected to `/dashboard`

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/login` | POST | Authenticate and set session |
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

### Settings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/slack` | POST | Save Slack webhook URL |
| `/api/settings/email` | POST | Save alert email address |
| `/api/settings/apikey` | POST | Regenerate API key |
| `/api/settings/danger/delete-all-jobs` | POST | Delete all user's jobs |
| `/api/settings/danger/delete-account` | POST | Delete user account |

### System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/init` | POST | Initialize scheduler (load all jobs) |
| `/api/cron` | GET | External cron trigger via API key |
| `/api/test` | GET | Health check (Prisma connectivity) |

---

## Cron Expression Reference

Cron expressions follow the standard 5-field format:

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
| `*/15 * * * *` | Every 15 minutes |
| `0 * * * *` | Every hour (at minute 0) |
| `0 0 * * *` | Every day at midnight |
| `0 9 * * *` | Every day at 9 AM |
| `0 9 * * 1` | Every Monday at 9 AM |
| `0 0 1 * *` | First day of every month |

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/NavDevs/CronDash.git
cd CronDash

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Initialize database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-secret-key-min-32-chars"

# Email (Resend) — optional, alerts fall back to logging
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="alerts@crondash.com"
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
- **Colors**: Dark background with green (`#00ff41`) as primary accent
- **Theme**: CRT-style overlays, blinking cursors, command prompts
- **Components**: Styled like terminal output with `[LABEL]` syntax

---

## Features

- [x] User registration and login
- [x] Create/edit/delete cron jobs
- [x] Custom HTTP headers and body (JSON)
- [x] Real-time execution history
- [x] Manual job trigger
- [x] Enable/disable jobs
- [x] Success/failure status tracking
- [x] Response log viewer
- [x] Cron expression reference guide
- [x] User settings page
- [x] Dashboard search & filter (by name, URL, schedule, status)
- [x] Slack webhook failure notifications
- [x] Email failure notifications via Resend
- [x] External cron endpoint with API key auth

---

## License

MIT © NavDevs

---

## Contributing

Contributions welcome! Open an issue or submit a pull request.