# Qualiphy

AI-powered resume screening tool that analyzes candidate PDFs against role-specific criteria and produces structured hiring verdicts.

## What It Does

Upload a candidate's resume (PDF), select a target role, and Qualiphy uses Google Gemini's multimodal AI to:

- Extract and understand resume content directly from the PDF
- Score the candidate (0–100) against role-specific rubrics
- Identify matched skills, missing must-haves, and critical gaps
- Produce a hiring verdict: **SHORTLIST**, **REJECT**, or **PENDING**
- Store results per-user in a Supabase database for review and management

## Tech Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Framework       | Next.js 16 (App Router)            |
| Language        | TypeScript                         |
| UI              | MUI v7 (Material 3) + Lucide React |
| Auth & Database | Supabase (PostgreSQL + Auth)       |
| AI              | Google Gemini (multimodal)         |
| Data Fetching   | TanStack React Query v5            |
| Validation      | Zod v4                             |
| Notifications   | Sonner                             |

## Supported Roles

Qualiphy ships with six pre-configured role profiles, each with its own evaluation criteria and scoring rubric:

| Role Key        | Title                      | Key Criteria                                |
| --------------- | -------------------------- | ------------------------------------------- |
| `dotnet`        | .NET Developer             | C#, ASP.NET Core, EF/Dapper, REST APIs      |
| `react-nextjs`  | React / Next.js Developer  | React hooks, App Router, TypeScript, SSR    |
| `react-native`  | React Native Developer     | RN, Expo, store deployments, native modules |
| `qa-playwright` | QA / Automation Engineer   | Playwright, POM, CI/CD, API testing         |
| `manual-tester` | Manual Tester / QA Analyst | Test plans, Jira, bug reporting, Agile      |
| `generic`       | Software Engineer          | Evaluated purely against the provided JD    |

## Scoring & Verdicts

| Verdict     | Condition                                 |
| ----------- | ----------------------------------------- |
| `SHORTLIST` | Score ≥ 70 AND no critical gaps           |
| `REJECT`    | Score < 50 OR 2+ missing must-have skills |
| `PENDING`   | Everything else                           |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with Auth enabled
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### Installation

```bash
git clone https://github.com/harshyt/qualifi.git
cd qualifi
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the three required values:

```bash
cp .env.example .env.local
```

| Variable                        | Scope                 | Description                                        |
| ------------------------------- | --------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public (browser-safe) | Your Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser-safe) | Supabase anon/public key                           |
| `GEMINI_API_KEY`                | Server-only           | Google Gemini API key — never expose to the client |

All three are validated at startup via Zod. The app will fail fast with a clear error if any are missing.

### Running Locally

```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Data Flow

```
User uploads PDF
    └─> UploadResume component
        └─> analyzeCandidateResume() Server Action
            ├─> PDF buffer sent to Gemini multimodal API
            ├─> Role-specific prompt constructed from ROLE_CONFIGS
            ├─> Gemini response validated with Zod (analysisResultSchema)
            └─> Candidate record stored in Supabase (with user_id FK)
                └─> React Query cache invalidated → dashboard updates
```

### Key Files

```
src/
  app/
    page.tsx                        # Landing / login redirect
    login/page.tsx                  # Auth page
    dashboard/
      page.tsx                      # Candidate list dashboard
      candidate/[id]/page.tsx       # Candidate detail view
    jobs/
      page.tsx                      # Job listings
    api/                            # REST handlers (CRUD: delete candidate, update status, fetch job)
  actions/
    analyze.ts                      # Core Server Action: PDF → Gemini → Supabase
    jobs.ts                         # Job management Server Actions
    jobList.ts                      # Job list Server Actions
  components/
    Dashboard/                      # Upload form, candidate table, filters
    CandidateDetail/                # Full analysis view
    Providers/                      # AuthContext + React Query provider
    ThemeRegistry/                  # MUI theme setup
  hooks/                            # React Query hooks (useCandidates, useJobs, etc.)
  lib/
    env.ts                          # Zod-validated env vars (getServerEnv / publicEnv)
    gemini.ts                       # Gemini client setup
    supabase.ts                     # Browser Supabase client
    supabase-server.ts              # Server Supabase client (Server Actions + Route Handlers)
  types/
    analysis.ts                     # Zod schema (analysisResultSchema) + TypeScript types
  constants/
    roles.ts                        # Role configs: persona, criteria, scoring rubric
  theme/                            # MUI theme tokens
```

### Auth & Security

- Supabase Auth handles sign-in/sign-out via `AuthContext`
- Middleware at `src/middleware.ts` protects `/dashboard` and `/jobs` — unauthenticated requests are redirected to `/login`
- API routes enforce ownership checks: `user.id === record.user_id` before any mutation
- `GEMINI_API_KEY` is accessed only via `getServerEnv()` in Server Actions — never sent to the browser
- Resume content is truncated to 15,000 characters and markdown delimiters are stripped before being sent to Gemini

### Two Supabase Clients

There are two distinct Supabase clients to match Next.js rendering boundaries:

- `src/lib/supabase.ts` — browser client, used in client components
- `src/lib/supabase-server.ts` — server client, used in Server Actions and Route Handlers

Always use the server client on the server side.

### Data Fetching

TanStack React Query (5-minute stale time) manages all async state via custom hooks in `src/hooks/`. Mutations go through Server Actions, then invalidate the relevant cache key to trigger a fresh fetch.

## UI Design

Follows a **Light & Airy Material 3** aesthetic:

- Primary color: Soft Azure `#2196F3`
- Background: Cloud White `#F9FAFB`
- No heavy shadows — subtle borders and skeleton loaders preferred
