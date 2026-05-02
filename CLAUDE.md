# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (Next.js on port 3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test suite is configured.

## Environment Variables

Three required variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` — public, safe for browser
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, safe for browser
- `ANTHROPIC_API_KEY` — server-only, never expose to client

All are validated at startup via Zod in [src/lib/env.ts](src/lib/env.ts). Use `getServerEnv()` in server-side code and `publicEnv` on the client.

## Architecture

**Stack:** Next.js 15 App Router + TypeScript + MUI v7 + Supabase (PostgreSQL + Auth) + Anthropic AI

### Data Flow

Resume upload triggers this pipeline:

1. User uploads PDF via `UploadResume` component
2. Server Action `analyzeCandidateResume()` in [src/actions/analyze.ts](src/actions/analyze.ts) sends PDF to Anthropic multimodal API for text extraction + analysis
3. Role-specific prompt built from [src/constants/roles.ts](src/constants/roles.ts) (6 role configs: .NET, React/Next.js, React Native, QA Playwright, QA Manual, Generic)
4. Anthropic response validated with Zod against `analysisResultSchema` in [src/types/analysis.ts](src/types/analysis.ts)
5. Validated candidate stored in Supabase with `user_id` foreign key
6. React Query cache invalidated → dashboard updates

### Key Architectural Decisions

**Two Supabase clients:** [src/lib/supabase.ts](src/lib/supabase.ts) for browser, [src/lib/supabase-server.ts](src/lib/supabase-server.ts) for Server Actions and Route Handlers. Always use the server client in server-side code.

**Auth:** Supabase Auth managed by `AuthContext` in [src/components/Providers/](src/components/Providers/). Middleware in [src/middleware.ts](src/middleware.ts) protects `/dashboard` and `/jobs` routes and refreshes sessions. API routes do their own ownership checks (`user.id === record.user_id`).

**Server Actions vs API Routes:** Business logic lives in Server Actions (`src/actions/`). REST API routes (`src/app/api/`) handle only CRUD operations (delete candidate, update status, fetch job).

**Data fetching:** TanStack React Query (5-min stale time) via custom hooks in [src/hooks/](src/hooks/). Mutations call Server Actions, then invalidate the relevant cache key.

**DB query layer:** All Supabase SELECT queries for server-side code are extracted into typed helper functions in [src/lib/db/](src/lib/db/). API routes and Server Actions call these helpers instead of writing inline `.from().select()` chains. Shared column lists (e.g. `CANDIDATE_COLUMNS`) live here so they're defined once.

**AI scoring verdicts:**

- `SHORTLIST`: score ≥ 70 AND no critical gaps
- `REJECT`: score < 50 OR 2+ missing must-have skills
- `PENDING`: everything else

**Input sanitization:** Resume text and job descriptions are truncated to 15,000 chars and markdown delimiters stripped before sending to Anthropic.

### Bulk Upload Pipeline

Async pipeline for uploading and analyzing multiple resumes at once:

1. User selects files + job in `SelectJobModal` → `UploadResume` calls `useUploadBatch` hook
2. `useUploadBatch` POSTs all files to `/api/bulk-upload`, which creates a `bulk_batches` row and one `resume_jobs` row per file, then returns `{ batchId, jobs }`
3. Hook fires a worker pool (`UPLOAD_CONCURRENCY = 3`) of POSTs to `/api/process-resume/[jobId]` — each job downloads its PDF from Vercel Blob, runs Claude analysis, inserts a `candidates` row, and marks itself `done`
4. When all jobs in a batch reach `done`/`error`, `flipBatchIfComplete` (in `src/lib/db/batches.ts`) flips `bulk_batches.status` to `done`
5. `ProcessingPage` polls `useBatch` (HTTP, for overall status) + `useBatchJobs` (Supabase browser, every 5 s) to show live per-file progress
6. `ActiveBatchPill` appears on other pages via `useActiveBatch` polling every 30 s; hides on `/bulk-upload/*` routes

**Key hooks:**

| Hook | Purpose |
|------|---------|
| `useUploadBatch` | Mutation — runs the full upload + worker pool, returns `{ batchId, failedUploads }` |
| `useBatch(batchId)` | Polls `/api/bulk-batches/[id]` for batch status + counts |
| `useBatchJobs(batchId)` | Direct Supabase query for per-file job statuses; self-stops when all terminal |
| `useBatchCandidates(batchId)` | Fetches candidates linked to a completed batch |
| `useActiveBatch` | Polls for any in-progress batch; drives the `ActiveBatchPill` |

### Directory Layout

```
src/
  app/           # Next.js App Router (pages + API routes)
  actions/       # Server Actions (analyze.ts, jobs.ts, jobList.ts)
  components/    # React components
    BulkUpload/  # ProcessingPage, ResultsPage, ActiveBatchPill
    Dashboard/   # DashboardTable, UploadResume, AddJobForm, drawers
    CandidateDetail/
    Providers/
    ui/          # Atomic wrappers (AppButton, AppDialog, …)
  hooks/         # React Query hooks — one hook per data concern
  lib/
    db/          # Supabase query helpers (batches.ts, resumeJobs.ts, candidates.ts)
    # + env.ts, claude.ts, supabase*.ts, format.ts, logger.ts …
  types/         # Zod schemas + TypeScript types
  constants/     # Role configs for AI prompts
  theme/         # MUI theme + design tokens
```

### UI Guidelines

Design follows a Light & Airy Material 3 aesthetic. Primary color: Indigo `#3B5BDB` (`brandBase`). Background: Warm Off-White `#FAFAF9` (`bgBase`). Avoid heavy shadows; prefer subtle borders and skeleton loaders during async operations.

**Always use atomic UI components from `src/components/ui/` — never import the raw MUI equivalent directly:**

| Use this       | Instead of                                                   |
| -------------- | ------------------------------------------------------------ |
| `AppButton`    | `Button` from `@mui/material`                                |
| `AppTextField` | `TextField` from `@mui/material`                             |
| `AppSelect`    | `Select` + `FormControl` + `InputLabel` from `@mui/material` |
| `AppDialog`    | `Dialog` from `@mui/material`                                |
| `AppDrawer`    | `Drawer` from `@mui/material`                                |

These wrappers enforce consistent border-radius, font-weight, z-index, and default props. `AppSelect` also auto-wires `labelId`/`id` for accessibility. `AppDialog` and `AppDrawer` ensure drawers and modals always layer above the Toolpad DashboardLayout header.

**Design tokens:** All colors must come from `lightTokens` in `src/theme/tokens.ts`. Never hardcode hex values that correspond to a token.

## Code Patterns

Rules established during refactoring — follow these for all new code.

### No inline Supabase queries in components or API routes

All SELECT queries belong in `src/lib/db/`. API routes and Server Actions import and call the helpers — they never build a `.from().select()` chain inline.

```ts
// ✅ correct
import { getBatchById } from "@/lib/db/batches";
const { data, error } = await getBatchById(supabase, id, user.id);

// ❌ wrong — inline query in a route handler
const { data, error } = await supabase.from("bulk_batches").select("*").eq("id", id)...
```

If a query doesn't exist in `src/lib/db/` yet, add it there before using it.

### No direct fetch() calls in components

All data mutations belong in custom hooks. Components call the hook; the hook owns the `fetch()` call, error handling, and loading state.

```ts
// ✅ correct — component delegates to hook
const { upload, isPending } = useUploadBatch();
await upload({ jobId, files });

// ❌ wrong — fetch inside a component callback
const res = await fetch("/api/bulk-upload", { method: "POST", body: formData });
```

### UUID validation before DB queries in API routes

Any route that accepts an ID from the URL must validate it before querying the database. Use the shared regex pattern:

```ts
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!UUID_REGEX.test(id)) {
  return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
}
```

### Fire-and-forget async calls use .catch(), not void

`void promise` swallows errors silently. Always attach `.catch()` so failures are logged:

```ts
// ✅ correct
flipBatchIfComplete(supabase, batchId).catch((err) =>
  logger.error("flipBatch failed", { batchId, error: String(err) }),
);

// ❌ wrong
void flipBatchIfComplete(supabase, batchId);
```

### React Query hooks: stable query keys and adaptive polling

- Query keys must be minimal stable primitives — never include arrays of IDs (`["jobs", ids]` → use `["jobs", batchId]`)
- Hooks that poll live data must self-stop when the data reaches a terminal state:

```ts
refetchInterval: (query) => {
  const jobs = query.state.data;
  return jobs?.every((j) => TERMINAL.includes(j.status)) ? false : 5_000;
},
```

### Shared column constants for repeated SELECT column lists

If the same column list appears in more than one file, extract it to `src/lib/db/<table>.ts`:

```ts
// src/lib/db/candidates.ts
export const CANDIDATE_COLUMNS =
  "id, name, role, score, status, created_at, email, job_id, user_id, analysis" as const;
```
