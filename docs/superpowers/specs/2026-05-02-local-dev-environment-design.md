# Local Development Environment Design

**Date:** 2026-05-02  
**Status:** Approved — ready for implementation

## Context

The project currently uses production Supabase, Vercel Blob, and the Anthropic API during local development. This causes:

- Real Anthropic API costs on every resume upload/test
- Supabase and Vercel Blob storage filling up with test data
- No isolation between dev and prod data

This design replaces all three with free or local alternatives, activated via `.env.local` without touching the production code path.

---

## Architecture Overview

Three independent swaps, each controlled by env vars in `.env.local`:

| Service      | Prod                   | Local dev                 | Switch                     |
| ------------ | ---------------------- | ------------------------- | -------------------------- |
| Database     | Supabase Cloud         | Supabase CLI (Docker)     | `NEXT_PUBLIC_SUPABASE_URL` |
| LLM          | Anthropic Claude Haiku | Google Gemini 2.0 Flash   | `LLM_PROVIDER=gemini`      |
| File storage | Vercel Blob            | Local filesystem (`/tmp`) | `STORAGE_PROVIDER=local`   |

Two new abstraction modules (`src/lib/llm.ts` and `src/lib/storage.ts`) export factory functions. All call sites import from these abstractions — prod behavior is default, local mode activates only when env vars are set.

---

## Section 1: Supabase Local Dev

### Setup

- Run `supabase init` once to create `supabase/` config folder
- `supabase start` spins up the full local stack via Docker:
  - Postgres on port 54322
  - API/Auth on port 54321
  - Studio on port 54323
- Local anon key is printed on first start — goes in `.env.local`

### Migration

Create `supabase/migrations/001_initial_schema.sql`. `docs/migration.sql` has the `resume_jobs` table but not the full schema — the complete SQL must be assembled by:

1. Inspecting the cloud Supabase dashboard (Table Editor → SQL of each table)
2. Or using `supabase db dump --linked` against the prod project to export the full schema

The migration captures:

- `candidates` table
- `resume_jobs` table
- `bulk_batches` table
- All RLS policies

Run `supabase db reset` to replay migrations from scratch.

### Code Changes

**None.** The Supabase clients in `src/lib/supabase.ts` and `src/lib/supabase-server.ts` already read from env vars.

### New env vars

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<printed by supabase start>
```

---

## Section 2: LLM Abstraction (Gemini 2.0 Flash)

### New Files

**`src/lib/llm.ts`** — Factory function:

```ts
export function getLLMProvider(): LLMProvider {
  if (process.env.LLM_PROVIDER === "gemini") {
    return new GeminiProvider();
  }
  return new AnthropicProvider();
}
```

**`src/lib/llm/anthropic.ts`** — Existing logic extracted from `src/lib/claude.ts`, implementing `LLMProvider`.

**`src/lib/llm/gemini.ts`** — Gemini 2.0 Flash implementation:

- Accepts PDFs as `inlineData` (base64, `mimeType: 'application/pdf'`) — same format as Anthropic's document blocks
- Uses `responseMimeType: 'application/json'` + `responseSchema` for structured output (cleaner than replicating tool-call format)
- Converts the existing Zod `analysisResultSchema` from `src/types/analysis.ts` to a JSON schema for Gemini
- Model: `gemini-2.0-flash`

### Shared Interface

```ts
interface LLMProvider {
  analyzeResume(params: {
    fileBase64: string;
    mimeType: "application/pdf" | "text/plain";
    role: RoleKey;
    jobDescription?: string;
  }): Promise<AnalysisResult>;
}
```

### Modified Files

- `src/actions/analyze.ts` — replace direct Claude call with `getLLMProvider().analyzeResume()`
- `src/app/api/process-resume/[jobId]/route.ts` — same swap
- `src/lib/env.ts` — make both `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` optional in the Zod schema (`.optional()`); validate at runtime that whichever provider is active has its key set
- `src/lib/claude.ts` — keep as-is; `src/lib/llm/anthropic.ts` delegates to it

### Free Tier

Gemini 2.0 Flash: 1,500 requests/day, 1M tokens/min, zero cost. Get key at https://aistudio.google.com/apikey.

### New env vars

```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=<from aistudio.google.com>
ANTHROPIC_API_KEY=sk-placeholder   # silences env validation
```

---

## Section 3: Storage Abstraction (Local Filesystem)

### New Files

**`src/lib/storage.ts`** — Factory function:

```ts
export function getStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === "local") {
    return new LocalStorageProvider();
  }
  return new VercelBlobProvider();
}
```

**`src/lib/storage/vercel-blob.ts`** — Existing Vercel Blob logic extracted from call sites, implementing `StorageProvider`.

**`src/lib/storage/local.ts`** — Local filesystem provider:

- Writes to `/tmp/screener-uploads/{userId}/{timestamp}-{filename}`
- Returns a `local://` URL (e.g., `local:///tmp/screener-uploads/user123/123-resume.pdf`)
- `download()`: reads file directly from path when URL starts with `local://`
- `delete()`: removes file from path

The `local://` scheme avoids a self-referencing HTTP round-trip — `process-resume` reads the file directly off disk.

### Shared Interface

```ts
interface StorageProvider {
  upload(path: string, data: Buffer, mimeType: string): Promise<string>; // returns URL
  download(url: string): Promise<Buffer>;
  delete(url: string): Promise<void>;
}
```

### Modified Files

- `src/app/api/bulk-upload/route.ts` — replace `@vercel/blob` `put()` with `getStorageProvider().upload()`
- `src/app/api/process-resume/[jobId]/route.ts` — replace blob `fetch(blobUrl)` with `getStorageProvider().download()`; replace blob delete with `getStorageProvider().delete()`

Files land in `/tmp/` — cleared on system restart, which is fine for dev.

### New env vars

```bash
STORAGE_PROVIDER=local
BLOB_READ_WRITE_TOKEN=placeholder   # silences env validation
```

---

## Section 4: Environment Configuration

### New file: `.env.local.example` (committed to git)

```bash
# --- Local development overrides ---
# Copy to .env.local and fill in your values

# Supabase local (values printed by `supabase start`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>

# LLM: Gemini 2.0 Flash free tier (1500 req/day)
# Get key: https://aistudio.google.com/apikey
LLM_PROVIDER=gemini
GEMINI_API_KEY=<your-gemini-api-key>
ANTHROPIC_API_KEY=sk-placeholder

# Storage: local filesystem (/tmp/screener-uploads/)
STORAGE_PROVIDER=local
BLOB_READ_WRITE_TOKEN=placeholder
```

`.env.local` stays in `.gitignore` (already is).

---

## Files Summary

### New files

| File                                         | Purpose                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `supabase/config.toml`                       | Supabase CLI config (generated by `supabase init`)      |
| `supabase/migrations/001_initial_schema.sql` | Full schema + RLS policies for local DB                 |
| `src/lib/llm.ts`                             | LLM provider factory                                    |
| `src/lib/llm/anthropic.ts`                   | Anthropic provider (extracted from `src/lib/claude.ts`) |
| `src/lib/llm/gemini.ts`                      | Gemini 2.0 Flash provider                               |
| `src/lib/storage.ts`                         | Storage provider factory                                |
| `src/lib/storage/vercel-blob.ts`             | Vercel Blob provider (extracted from call sites)        |
| `src/lib/storage/local.ts`                   | Local filesystem provider                               |
| `.env.local.example`                         | Local dev env template                                  |

### Modified files

| File                                          | Change                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/actions/analyze.ts`                      | Use `getLLMProvider().analyzeResume()`                                          |
| `src/app/api/process-resume/[jobId]/route.ts` | Use `getLLMProvider()` and `getStorageProvider()`                               |
| `src/app/api/bulk-upload/route.ts`            | Use `getStorageProvider().upload()`                                             |
| `src/lib/env.ts`                              | Make `ANTHROPIC_API_KEY` optional in gemini mode; add optional `GEMINI_API_KEY` |

---

## Verification

1. **Supabase:** `supabase init && supabase start` → confirm Studio opens at localhost:54323
2. **Env setup:** Copy `.env.local.example` → `.env.local`, fill in Gemini key + local Supabase anon key
3. **Start:** `npm run dev`
4. **Auth:** Sign up/log in → confirm it uses local Supabase Auth
5. **Upload:** Upload a test PDF → confirm file appears in `/tmp/screener-uploads/`
6. **Processing:** Watch resume_jobs polling → status goes `queued → processing → done`
7. **Result:** Confirm candidate appears in dashboard with a Gemini-generated score
8. **Cleanup:** Confirm file is deleted from `/tmp/screener-uploads/` after processing

---

## Out of Scope

- Ollama / local LLM (can be added later as a third provider in `src/lib/llm/ollama.ts`)
- MinIO / S3-compatible local storage (local filesystem is sufficient for temp files)
- Migrating prod from Vercel Blob to R2 (separate concern)
