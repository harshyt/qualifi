# Migration 002 — bulk_batches table + resume_jobs.batch_id

Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).

## Up

```sql
-- 1. Create bulk_batches table
CREATE TABLE bulk_batches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      uuid NOT NULL,
  job_title   text NOT NULL,
  total_files int  NOT NULL,
  status      text NOT NULL DEFAULT 'processing',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS: each user sees only their own batches
ALTER TABLE bulk_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own batches" ON bulk_batches
  FOR ALL USING (auth.uid() = user_id);

-- 3. Add batch_id FK to resume_jobs (nullable — existing rows unaffected)
ALTER TABLE resume_jobs
  ADD COLUMN batch_id uuid REFERENCES bulk_batches(id) ON DELETE SET NULL;

-- 4. Index for active-batch lookup (used by GET /api/bulk-batches/active)
CREATE INDEX idx_bulk_batches_user_status
  ON bulk_batches (user_id, status, created_at DESC);
```

## Down

```sql
ALTER TABLE resume_jobs DROP COLUMN IF EXISTS batch_id;
DROP TABLE IF EXISTS bulk_batches;
```
