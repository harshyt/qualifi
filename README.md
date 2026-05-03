# Qualifi

AI-powered resume screening platform that turns an unstructured pile of CVs into structured, actionable hiring verdicts — in seconds.

---

## Problem Statement

Hiring teams at small-to-mid-sized engineering companies spend a disproportionate amount of time on the earliest and most repetitive part of the funnel: reading resumes. A single open role can attract 50–300 applicants. A recruiter or tech lead must manually read each CV, mentally map it against a job description they half-remember, decide whether to pass it forward, and then write a rejection or shortlist email — often without a consistent rubric. This process is:

- **Slow** — a thorough manual screen takes 5–15 minutes per resume. 100 applicants = 8–25 hours of skilled-person time.
- **Inconsistent** — two reviewers looking at the same resume may reach opposite verdicts based on personal bias, fatigue, or varying interpretations of "required skills."
- **Lossy** — gut-feel decisions miss candidates who look unconventional on paper but are strong fits, and pass forward candidates who superficially match keywords but lack depth.
- **Undocumented** — verbal or informal decisions leave no audit trail. When a hiring manager asks "why did we reject this person?", there is no structured answer.

The result is wasted recruiter time, inconsistent candidate quality reaching interviews, and a poor candidate experience (slow or no feedback).

---

## Business Use Case

Qualifi is built for engineering teams and recruiters who need to screen technical resumes at volume, without sacrificing quality or consistency.

**Who it is for:**

- Startups and scale-ups running lean recruiting operations
- Tech leads who are asked to "take a first pass" on CVs before interviews
- Recruiting agencies placing .NET, React, React Native, and QA engineers

**What it solves:**

| Pain                                            | Qualifi's Answer                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Spending hours reading CVs                      | Upload a PDF/DOCX → structured analysis in ~10 seconds                            |
| Inconsistent evaluation standards               | Role-specific rubrics applied identically to every candidate                      |
| No record of why a candidate was rejected       | Persistent structured analysis stored per job, per user                           |
| Writing rejection/shortlist emails from scratch | One-click email drafts pre-filled with candidate name, role, and verdict          |
| Gut-feel decisions that are hard to defend      | Scored output with explicit strengths, gaps, red flags, and interview focus areas |

**Workflow:**

1. A recruiter or tech lead logs in and creates a job opening with a job description.
2. They upload one or more resumes (PDF or DOCX) against that job.
3. Claude analyzes each resume against the JD and role-specific criteria, returning a 0–100 score, structured data, and a SHORTLIST / REJECT / PENDING verdict.
4. The dashboard shows all candidates for that job — sortable by score, filterable by verdict.
5. The recruiter selects candidates and sends individual or bulk emails via Outlook with pre-filled drafts.

---

## What It Does

Upload a candidate's resume (PDF or DOCX), select a target role, and Qualifi uses Claude (claude-sonnet-4-6) to:

- Extract and understand resume content — PDFs are processed natively as multimodal documents; DOCX files have text extracted via mammoth
- Score the candidate (0–100) against role-specific rubrics
- Identify matched skills, missing must-haves, and critical gaps
- Flag red flags: frequent job changes, vague descriptions, inflated claims, unexplained gaps
- Suggest interview focus areas tailored to each candidate's specific profile
- Infer culture fit indicators from soft-skill signals in the resume
- Produce a hiring verdict: **SHORTLIST**, **REJECT**, or **PENDING**
- Store all results per-user, per-job in Supabase for ongoing review and management
- Draft and send individual or bulk candidate emails via Outlook

---

## Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Framework       | Next.js 15 (App Router)                |
| Language        | TypeScript                             |
| UI              | MUI v7 (Material 3) + Lucide React     |
| Auth & Database | Supabase (PostgreSQL + Auth)           |
| AI              | Anthropic Claude (`claude-sonnet-4-6`) |
| Data Fetching   | TanStack React Query v5                |
| Validation      | Zod v4                                 |
| DOCX Parsing    | mammoth                                |
| Notifications   | Sonner                                 |
| Analytics       | Vercel Analytics + Speed Insights      |

---

## Supported Roles

Six pre-configured role profiles, each with its own persona, evaluation criteria, and scoring rubric:

| Role Key        | Title                      | Key Criteria                                |
| --------------- | -------------------------- | ------------------------------------------- |
| `dotnet`        | .NET Developer             | C#, ASP.NET Core, EF/Dapper, REST APIs      |
| `react-nextjs`  | React / Next.js Developer  | React hooks, App Router, TypeScript, SSR    |
| `react-native`  | React Native Developer     | RN, Expo, store deployments, native modules |
| `qa-playwright` | QA / Automation Engineer   | Playwright, POM, CI/CD, API testing         |
| `manual-tester` | Manual Tester / QA Analyst | Test plans, Jira, bug reporting, Agile      |
| `generic`       | Software Engineer          | Evaluated purely against the provided JD    |

---

## Analysis Output

Every screened resume produces a structured record with:

| Field                    | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| `name`, `email`, `phone` | Contact info extracted from the resume                                       |
| `role`                   | Applied role or latest role title                                            |
| `workExperience`         | Array of roles with company, duration, and description                       |
| `education`              | Degrees, institutions, and years                                             |
| `skills`                 | Flat list of inferred skills                                                 |
| `technologiesUsed`       | Grouped by category (e.g. Frontend, Backend, DevOps)                         |
| `experienceLevel`        | Junior / Mid / Senior / Lead / Unknown                                       |
| `score`                  | 0–100 numeric score against the JD and role rubric                           |
| `summary`                | 2–3 sentence executive summary a hiring manager can read in 10 seconds       |
| `strengths`              | Specific strengths tied to the JD requirements                               |
| `gaps`                   | Missing skills or experience gaps vs. the JD                                 |
| `redFlags`               | Concerns: job-hopping, vague descriptions, inflated claims, unexplained gaps |
| `interviewFocusAreas`    | Suggested topics to probe based on this candidate's specific profile         |
| `cultureFitIndicators`   | Soft skills and collaboration signals observed in the resume                 |
| `verdict`                | SHORTLIST / REJECT / PENDING                                                 |

---

## Scoring & Verdicts

| Verdict     | Condition                                            |
| ----------- | ---------------------------------------------------- |
| `SHORTLIST` | Score ≥ 70 AND no critical gaps                      |
| `REJECT`    | Score < 50 OR 2+ missing must-have skills            |
| `PENDING`   | Everything else — good potential, needs human review |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with Auth enabled
- An [Anthropic](https://console.anthropic.com) API key

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

| Variable                        | Scope                 | Description                                     |
| ------------------------------- | --------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public (browser-safe) | Your Supabase project URL                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser-safe) | Supabase anon/public key                        |
| `ANTHROPIC_API_KEY`             | Server-only           | Anthropic API key — never exposed to the client |

All three are validated at startup via Zod. The app will fail fast with a clear error if any are missing.

### Running Locally

```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Local Development (Zero Cost)

Run the full stack locally without a paid Supabase project or Anthropic API key. Uses the **Supabase CLI** for a local Postgres + Auth instance and **Gemini 2.0 Flash** (1,500 free requests/day) instead of Claude.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) — required by Supabase CLI
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) — `brew install supabase/tap/supabase`
- [Gemini API key](https://aistudio.google.com/apikey) — free, no billing required

### Setup

```bash
# 1. Start the local Supabase stack (Postgres + Auth + Studio)
supabase start
# Copy the "API URL" and "anon key" printed by this command

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_SUPABASE_ANON_KEY and GEMINI_API_KEY

# 3. Apply the database schema
supabase db reset

# 4. Start the app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, create a job, and upload a PDF — the resume will be analysed by Gemini and stored in the local database.

### How It Works

| Setting in `.env.local`             | Effect                                           |
| ----------------------------------- | ------------------------------------------------ |
| `LLM_PROVIDER=gemini`               | Routes analysis through Gemini 2.0 Flash         |
| `STORAGE_PROVIDER=local`            | Saves uploaded files to `/tmp/screener-uploads/` |
| `ANTHROPIC_API_KEY=sk-placeholder`  | Satisfies the SDK init; never called             |
| `BLOB_READ_WRITE_TOKEN=placeholder` | Satisfies env validation; never called           |

Leaving `LLM_PROVIDER` and `STORAGE_PROVIDER` unset (or pointing at a real Supabase project in `.env.local`) restores the production code path — no code changes required.

### Supabase Studio

The local Studio UI is available at [http://localhost:54323](http://localhost:54323). Use it to inspect tables, run queries, and manage Auth users.

---

## Architecture

### Data Flow

```
User uploads PDF or DOCX
    └─> UploadResume component
        └─> analyzeCandidateResume() Server Action
            ├─> PDF: buffer encoded as base64 → sent as multimodal document to Claude API
            ├─> DOCX: text extracted via mammoth → sent as text prompt to Claude API
            ├─> Role-specific prompt constructed from ROLE_CONFIGS
            ├─> Input sanitized: truncated to 15,000 chars, markdown delimiters stripped
            ├─> Claude (claude-sonnet-4-6) returns structured JSON analysis
            ├─> Response validated with Zod (analysisResultSchema)
            └─> Candidate record stored in Supabase (with user_id + job_id FK)
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
    analyze.ts                      # Core Server Action: file → Claude → Supabase
    jobs.ts                         # Job management Server Actions
    jobList.ts                      # Job list Server Actions
  components/
    Dashboard/                      # Upload form, candidate table, filters, email drawer
    CandidateDetail/                # Full analysis view
    Providers/                      # AuthContext + React Query provider
    ThemeRegistry/                  # MUI theme setup
  hooks/                            # React Query hooks (useCandidates, useJobs, etc.)
  lib/
    env.ts                          # Zod-validated env vars (getServerEnv / publicEnv)
    claude.ts                       # Anthropic client + PDF/DOCX dispatch + prompt builder
    emailUtils.ts                   # Email subject/body generation utilities
    logger.ts                       # Structured logging
    supabase.ts                     # Browser Supabase client
    supabase-server.ts              # Server Supabase client (Server Actions + Route Handlers)
  types/
    analysis.ts                     # Zod schema (analysisResultSchema) + TypeScript types
  constants/
    roles.ts                        # Role configs: persona, evaluation criteria, scoring rubric
  theme/                            # MUI theme tokens
```

### Auth & Security

- Supabase Auth handles sign-in/sign-out via `AuthContext`
- Middleware at `src/middleware.ts` protects `/dashboard` and `/jobs` — unauthenticated requests redirect to `/login`
- API routes enforce ownership checks: `user.id === record.user_id` before any mutation
- `ANTHROPIC_API_KEY` is accessed only via `getServerEnv()` in Server Actions — never sent to the browser
- Resume content is truncated to 15,000 characters and markdown delimiters are stripped before being sent to Claude to mitigate prompt injection from user-supplied JDs

### Two Supabase Clients

There are two distinct Supabase clients to match Next.js rendering boundaries:

- `src/lib/supabase.ts` — browser client, used in client components
- `src/lib/supabase-server.ts` — server client, used in Server Actions and Route Handlers

Always use the server client on the server side.

### Data Fetching

TanStack React Query (5-minute stale time) manages all async state via custom hooks in `src/hooks/`. Mutations go through Server Actions, then invalidate the relevant cache key to trigger a fresh fetch.

---

## Email Composition

The dashboard supports drafting emails to candidates directly from the results table:

- **Individual mode** — select one candidate and open the email drawer to review/edit a pre-filled subject and body
- **Bulk mode** — select multiple candidates and generate a batch of emails; each draft opens as an Outlook deep link (`ms-outlook://`)
- Email content is generated by `src/lib/emailUtils.ts` using the candidate's name, role, and verdict

---

## UI Design

Follows a **Light & Airy Material 3** aesthetic:

- Primary color: Soft Azure `#2196F3`
- Background: Cloud White `#F9FAFB`
- No heavy shadows — subtle borders and skeleton loaders preferred
