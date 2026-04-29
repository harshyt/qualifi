# Migration 001 — `resume_jobs` Table

**Feature:** Async bulk resume processing  
**Branch:** `feat/async-bulk-resume-processing`  
**Applied:** 2026-04-29

---

## Purpose

Tracks the lifecycle of each resume in a bulk upload batch. Previously, resume processing was synchronous — the browser waited for every Claude API call to finish before getting a response. This table enables an async pipeline: upload instantly, process in the background, poll for results.

---

## SQL

Run in **Supabase dashboard → SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS resume_jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id          uuid        NOT NULL,
  job_description text        NOT NULL,
  role_key        text        NOT NULL DEFAULT 'generic',
  file_name       text        NOT NULL,
  blob_url        text        NOT NULL,
  status          text        NOT NULL DEFAULT 'queued'
                              CHECK (status IN ('queued', 'processing', 'done', 'error')),
  candidate_id    uuid,
  error_message   text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resume_jobs_user_id_idx
  ON resume_jobs(user_id);

ALTER TABLE resume_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resume_jobs"
  ON resume_jobs
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## Schema Reference

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | — | FK → `auth.users(id)`, cascade delete |
| `job_id` | `uuid` | NO | — | FK → `jobs(id)` (the job posting) |
| `job_description` | `text` | NO | — | Denormalized JD (truncated to 15,000 chars) |
| `role_key` | `text` | NO | `'generic'` | AI scoring profile (e.g. `react`, `dotnet`) |
| `file_name` | `text` | NO | — | Original filename of the uploaded resume |
| `blob_url` | `text` | NO | — | Vercel Blob public URL of the stored PDF/DOCX |
| `status` | `text` | NO | `'queued'` | Lifecycle state (see below) |
| `candidate_id` | `uuid` | YES | `NULL` | Set to the created candidate's ID on success |
| `error_message` | `text` | YES | `NULL` | First 500 chars of the error if status = `'error'` |
| `created_at` | `timestamptz` | YES | `now()` | Row creation time |
| `updated_at` | `timestamptz` | YES | `now()` | Last status change time |

---

## Status Lifecycle

```
queued → processing → done
                    ↘ error
```

| Status | Meaning |
|--------|---------|
| `queued` | File uploaded to Blob, waiting for processing to start |
| `processing` | Claude API call in flight |
| `done` | Candidate row created; `candidate_id` is populated |
| `error` | Processing failed; `error_message` contains the reason |

---

## RLS Policy

Row-level security is enabled. Users can only read and write rows where `user_id = auth.uid()`. The API routes also enforce `.eq('user_id', user.id)` at the query level for defence in depth.

---

## Cleanup

Blobs are deleted from Vercel Blob storage after a resume is successfully processed (fire-and-forget `del(blob_url)` in `POST /api/process-resume/[jobId]`). The `resume_jobs` row itself is kept for audit purposes.

---

## Rollback

```sql
DROP POLICY IF EXISTS "Users can manage their own resume_jobs" ON resume_jobs;
DROP TABLE IF EXISTS resume_jobs;
```
