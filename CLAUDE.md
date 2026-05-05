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

**Admin client for aggregate stats:** The browser Supabase client is RLS-filtered — it only returns rows owned by the current user. All dashboard aggregate counts (total candidates, total jobs, total users) must use the Supabase admin client via the `/api/stats` Route Handler. Never use the browser client for global counts.

**Auth:** Supabase Auth managed by `AuthContext` in [src/components/Providers/](src/components/Providers/). Middleware in [src/middleware.ts](src/middleware.ts) protects `/dashboard` and `/jobs` routes and refreshes sessions. API routes do their own ownership checks (`user.id === record.user_id`).

**Server Actions vs API Routes:** Business logic lives in Server Actions (`src/actions/`). REST API routes (`src/app/api/`) handle only CRUD operations (delete candidate, update status, fetch job) plus the `/api/stats` aggregate endpoint.

**Data fetching:** TanStack React Query (5-min stale time) via custom hooks in [src/hooks/](src/hooks/). Mutations call Server Actions, then invalidate the relevant cache key.

**AI scoring verdicts:**

- `SHORTLIST`: score ≥ 70 AND no critical gaps
- `REJECT`: score < 50 OR 2+ missing must-have skills
- `PENDING`: everything else

**Input sanitization:** Resume text and job descriptions are truncated to 15,000 chars and markdown delimiters stripped before sending to Anthropic.

### Dashboard Stats (`/api/stats`)

The Route Handler at `src/app/api/stats/route.ts` returns global aggregate counts:

```ts
{ totalUsers, totalCandidates, totalJobs, candidatesThisMonth, jobsThisMonth, monthlyCounts[] }
```

Uses `adminClient.auth.admin.listUsers()` for user count and the Supabase admin client for candidate/job counts. `useDashboardStats` in `src/hooks/useDashboardStats.ts` fetches this single endpoint — it does **not** query Supabase directly from the browser.

### Shared Components (`src/components/shared/`)

**`DataTable<T>`** — Generic paginated table used by both the candidates and jobs pages.

- Accepts `ColumnDef<T>[]` where each column can include `cellSx?: object` for per-column `TableCell` styles (applied to both header and body cells).
- Outer `Box` is `flex: 1, minHeight: 0`; `TableContainer` is the only scrollable element (`flex: 1, overflow: "auto"`). This keeps pagination pinned at the bottom and only the table body scrolls.
- `Table` has `minWidth: 500` to prevent excessive column compression on narrow viewports.
- `TablePagination` is `flexShrink: 0` with responsive padding (`px: { xs: 1, sm: 3 }`).

**`DateRangePickerField`** — Custom two-month date range picker (no MUI Pro license required).

- Renders a single `TextField` that opens a `Popover` with two side-by-side month calendars.
- Uses CSS Grid (7 columns × 36px) for the day grid. Range days get an `#EEF2FF` strip; endpoint days get filled `#3B5BDB` circles with half-pill border-radius on range ends.
- Hover preview shows the in-progress range while selecting the second date.
- Uses `useState<HTMLDivElement | null>` + callback ref (`ref={setAnchorEl}`) — not `useRef` — to avoid React refs-during-render lint errors when passing to `Popover anchorEl`.
- Requires `dayjs` with `isBetween` plugin (`dayjs.extend(isBetween)`).
- `LocalizationProvider` with `AdapterDayjs` is wired in `ThemeRegistry` — no need to add it per-component.

### Layout (`src/components/layout/AppLayout.tsx`)

Toolpad `DashboardLayout` is configured with:

```tsx
<DashboardLayout
  sidebarExpandedWidth={220}
  sx={{ "& main": { overflow: "hidden" } }}
>
  <Box sx={{ p: { xs: 2, sm: 3 }, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
    {children}
  </Box>
</DashboardLayout>
```

The `"& main": { overflow: "hidden" }` override is critical — it prevents Toolpad's main area from scrolling so that only the `TableContainer` inside `DataTable` scrolls.

### Candidates Page (`src/app/candidates/page.tsx`)

- Default `rowsPerPage: 10`.
- On auth resolve, pre-selects the logged-in user's ID in the `uploaderIds` filter (only if the filter has not already been set).
- Filter bar uses `DateRangePickerField` (single field replacing the old From/To pair).
- Multiselect `Select` components use `displayEmpty` + custom `renderValue`: empty → grey placeholder; 1 selected → show name; 2+ → "N selected".
- All candidates are selectable regardless of status (no `disabled` on checkboxes).
- Context menu: PENDING candidates show Shortlist + Reject actions; non-PENDING candidates show Send Email.

### Jobs Page (`src/app/jobs/page.tsx`)

Same card layout and flex-column structure as the candidates page. Uses `DataTable<Job>` with these column widths:

| Column      | Width | Notes                                     |
| ----------- | ----- | ----------------------------------------- |
| Title       | 200px | `minWidth: 200, whiteSpace: "nowrap"`     |
| Client      | 110px |                                           |
| Tags        | 110px |                                           |
| Description | 250px | `maxWidth: 250` — text truncated          |
| Date        | 110px |                                           |
| Actions     | 70px  |                                           |

Filter bar has search + client dropdown in a single non-wrapping row. Default 10 rows per page.

### Hooks

**`useUpdateCandidateStatus(onSuccess?: () => void)`** — Accepts an optional `onSuccess` callback invoked after cache invalidation. Does **not** navigate anywhere by default; callers pass navigation as the callback (e.g., `CandidateView` passes `() => router.push("/candidates")`).

**`useDashboardStats`** — Fetches `/api/stats` via a single `fetch` call. Returns `DashboardStats | undefined`.

### Email Templates (`src/lib/emailUtils.ts`)

`generateBulkEmail` renders ASCII tables using a `padEnd` helper:

- Shortlisted section: `| Name | Score | Level | Key Strengths |`
- Rejected section: `| Name | Score | Level | Key Gaps |`
- Column widths are computed dynamically from content length.

### Directory Layout

```
src/
  app/           # Next.js App Router (pages + API routes)
    api/
      stats/     # GET /api/stats — global aggregate counts via admin client
      candidates/
      users/
  actions/       # Server Actions (analyze.ts, jobs.ts, jobList.ts)
  components/    # React components
    Dashboard/
    CandidateDetail/
    candidates/  # CandidateTable, CandidateFilterBar, CandidateStatusFilter
    layout/      # AppLayout (DashboardLayout wrapper)
    Providers/
    shared/      # DataTable, DateRangePickerField
    ThemeRegistry/
    ui/          # Atomic wrappers (AppButton, AppTextField, AppSelect, AppDialog, AppDrawer)
  hooks/         # React Query hooks wrapping Server Actions and API calls
  lib/           # Shared utilities (env.ts, claude.ts, pdf.ts, supabase*.ts, emailUtils.ts)
  types/         # Zod schemas + TypeScript types
  constants/     # Role configs for AI prompts
  theme/         # MUI theme + tokens
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
