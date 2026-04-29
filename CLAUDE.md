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

**AI scoring verdicts:**

- `SHORTLIST`: score ≥ 70 AND no critical gaps
- `REJECT`: score < 50 OR 2+ missing must-have skills
- `PENDING`: everything else

**Input sanitization:** Resume text and job descriptions are truncated to 15,000 chars and markdown delimiters stripped before sending to Anthropic.

### Directory Layout

```
src/
  app/           # Next.js App Router (pages + API routes)
  actions/       # Server Actions (analyze.ts, jobs.ts, jobList.ts)
  components/    # React components (Dashboard/, CandidateDetail/, Providers/, ThemeRegistry/)
  hooks/         # React Query hooks wrapping Server Actions and API calls
  lib/           # Shared utilities (env.ts, claude.ts, pdf.ts, supabase*.ts)
  types/         # Zod schemas + TypeScript types
  constants/     # Role configs for AI prompts
  theme/         # MUI theme
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
