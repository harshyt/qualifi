# Plan: Bulk Upload — Background Processing Flow

## Context

Currently, after clicking "Analyze All Resumes" the user sees a small bottom-right overlay and must stay on the page for it to feel coherent. The goal is a first-class background processing experience: a dedicated processing page with a stable URL, a persistent floating pill that survives navigation, and a scoped results page showing only the batch's candidates.

**Decisions made in design session:**
- Processing screen: A1 layout (header stats + progress bar + scrollable file list), within app layout (sidebar visible)
- URL persistence: Option C — stable `/bulk-upload/[batchId]` URL, DB-backed recovery on refresh
- Completion: Option B — explicit "View Results" CTA button
- Floating widget: W1 — slim dark pill (bottom-right, fixed position)
- Concurrent uploads: Option A — blocked while a batch is processing

---

## Architecture

### New Routes (all inside existing `AppLayout`)

| Route | Purpose |
|---|---|
| `/bulk-upload/[batchId]` | Processing screen — polls live, shows "View Results" CTA when done |
| `/bulk-upload/[batchId]/results` | Batch candidates page — scoped clone of `/candidates` |
| `/bulk-upload/layout.tsx` | Re-exports `src/app/dashboard/layout.tsx` |

### DB Changes

**New table: `bulk_batches`**
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES auth.users(id)
job_id      uuid NOT NULL REFERENCES jobs(id)
job_title   text NOT NULL   -- denormalized, avoids join in pill/header
total_files int  NOT NULL
status      text NOT NULL DEFAULT 'processing'  -- 'processing' | 'done'
created_at  timestamptz NOT NULL DEFAULT now()
```

**New column: `resume_jobs.batch_id`**
```sql
ALTER TABLE resume_jobs ADD COLUMN batch_id uuid REFERENCES bulk_batches(id);
```
Nullable — existing rows unaffected.

### User Journey

1. `/candidates` — "Upload Resume" button (disabled if active batch exists)
2. User picks files + job → clicks "Analyze All Resumes"
3. `POST /api/bulk-upload` → creates `bulk_batches` row + N `resume_jobs` rows → returns `batchId`
4. Client navigates to `/bulk-upload/[batchId]`
5. Processing page polls every 10s; shows live verdict counts per file
6. If user navigates away → slim pill appears on every other page → click → back to `/bulk-upload/[batchId]`
7. All jobs reach terminal state → page shows "All Done!" + "View Results" button → pill disappears
8. "View Results" → `/bulk-upload/[batchId]/results` — same table/tabs as candidates, scoped to batch

---

## Step 1 — DB Migration

**File:** `docs/migrations/002_bulk_batches.md` (migration doc)

Create `bulk_batches` table and add `batch_id` column to `resume_jobs`. Run via Supabase dashboard or CLI.

```sql
CREATE TABLE bulk_batches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      uuid NOT NULL,
  job_title   text NOT NULL,
  total_files int  NOT NULL,
  status      text NOT NULL DEFAULT 'processing',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resume_jobs ADD COLUMN batch_id uuid REFERENCES bulk_batches(id) ON DELETE SET NULL;

-- RLS: users can only see their own batches
ALTER TABLE bulk_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own batches" ON bulk_batches
  FOR ALL USING (auth.uid() = user_id);
```

---

## Step 2 — New Types

**File:** `src/types/bulkBatch.ts` (new)

```ts
export type BulkBatchStatus = 'processing' | 'done';

export interface BulkBatch {
  id: string;
  user_id: string;
  job_id: string;
  job_title: string;
  total_files: number;
  status: BulkBatchStatus;
  created_at: string;
}
```

---

## Step 3 — Update `/api/bulk-upload/route.ts`

**Critical file:** `src/app/api/bulk-upload/route.ts`

1. Client (`UploadResume.tsx`) adds `jobTitle` to the FormData so the server has it without an extra DB fetch:
   ```ts
   formData.append("jobTitle", selectedJob.title); // add in UploadResume handleJobSelect
   ```

2. Before uploading blobs, insert a `bulk_batches` row:
   ```ts
   const jobTitle = formData.get("jobTitle") as string;
   const { data: batch, error: batchError } = await supabase
     .from('bulk_batches')
     .insert({ user_id: user.id, job_id: jobId, job_title: jobTitle, total_files: validFiles.length })
     .select('id')
     .single();
   if (batchError || !batch) {
     return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
   }
   // Note: no blobs uploaded yet, so no cleanup needed here
   ```

3. Stamp `batch_id: batch.id` on each `resume_jobs` insert row.

4. Return `batchId: batch.id` in the response alongside `jobs`. If blob uploads succeed but `resume_jobs` DB insert fails, existing blob cleanup logic (`del(blobUrl)`) applies as before — also delete the orphaned `bulk_batches` row.

5. Add `batchId: string` to the response type annotation inline in the route.

---

## Step 4 — New API: `GET /api/bulk-batches/[id]`

**File:** `src/app/api/bulk-batches/[id]/route.ts` (new)

Returns the batch row + aggregated job status counts (done, error, processing, queued).

```ts
// Response shape
{
  batch: BulkBatch,
  counts: { done: number; error: number; processing: number; queued: number }
}
```

Auth: user_id check on batch row.

---

## Step 5 — New API: `GET /api/bulk-batches/active`

**File:** `src/app/api/bulk-batches/active/route.ts` (new)

Returns the most recent `processing` batch for the authenticated user, or `null`. Used by `ActiveBatchPill` on mount to recover state after page refresh.

```ts
// Response shape
{ batch: BulkBatch | null }
```

---

## Step 6 — Update `POST /api/process-resume/[id]` to flip batch status

**File:** `src/app/api/process-resume/[id]/route.ts`

After updating a `resume_job` to `done` or `error`, check if all jobs in the same `batch_id` are now terminal. If yes, update `bulk_batches.status = 'done'`.

```ts
// After updating resume_job status:
if (batch_id) {
  const { count } = await supabase
    .from('resume_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('batch_id', batch_id)
    .in('status', ['queued', 'processing']);
  if (count === 0) {
    await supabase.from('bulk_batches').update({ status: 'done' }).eq('id', batch_id);
  }
}
```

---

## Step 7 — New Hook: `useBatch`

**File:** `src/hooks/useBatch.ts` (new)

```ts
export function useBatch(batchId: string) {
  return useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => fetch(`/api/bulk-batches/${batchId}`).then(r => r.json()),
    refetchInterval: (query) => {
      const batch = query.state.data?.batch;
      return batch?.status === 'done' ? false : 10_000;
    },
    staleTime: 0,
  });
}
```

---

## Step 8 — New Component: `ActiveBatchPill`

**File:** `src/components/BulkUpload/ActiveBatchPill.tsx` (new)

- Uses `useActiveBatch()` hook (Step 13) to get the active batch — no direct API call
- When `activeBatch` exists, passes its `id` to `useBatch(batchId)` for live polling every 10s
- Hidden when `usePathname()` starts with `/bulk-upload/`
- Hidden when `batch.status === 'done'`
- Renders: fixed bottom-right, `z-index: 1400`, dark pill — pulsing dot · "Analyzing · {done}/{total}" · mini progress bar (width = done/total * 100%) · `↑` icon
- Clicking anywhere navigates to `/bulk-upload/[batchId]`
- Styling: `bgcolor: '#1e1e2e'`, `borderRadius: '24px'`, `px: 1.5`, `py: 0.75`

---

## Step 9 — Add `ActiveBatchPill` to `AppLayout`

**File:** `src/components/layout/AppLayout.tsx`

Add `<ActiveBatchPill />` as the last child, outside the `DashboardLayout` scroll container (so it's always fixed on screen).

---

## Step 10 — New Page: Processing Screen

**Files:**
- `src/app/bulk-upload/[batchId]/page.tsx` (new)
- `src/app/bulk-upload/layout.tsx` (new — re-export dashboard layout)
- `src/components/BulkUpload/ProcessingPage.tsx` (new)

**Layout (A1):**
- Page header: "Analyzing Resumes" title + job title + date subtitle
- Full-width progress bar: `completedJobs / totalFiles * 100`
- Stats row (4 chips): Shortlisted · Pending · Rejected · Queued — count updates live
- Scrollable file list: each row = FileText icon · filename · status chip (Queued / Analyzing / SHORTLIST / PENDING / REJECT / Error)
- **When `batch.status === 'done'`**: show "All done!" banner above the list + prominent "View Results" `AppButton` that navigates to `/bulk-upload/[batchId]/results`
- **Error states:**
  - If all jobs errored: replace "View Results" with "Analysis failed" state, list error messages
  - If `batchId` not found or belongs to different user: inline "Batch not found" message with "Go to Candidates" link
  - If user lands on a `done` batch: renders directly in the "All done" state (no polling needed)

Uses `useBatch(batchId)` for batch header data and `useResumeJobs(jobIds)` (existing hook) for live file statuses.

---

## Step 11 — New Page: Results Screen

**Files:**
- `src/app/bulk-upload/[batchId]/results/page.tsx` (new)
- `src/components/BulkUpload/ResultsPage.tsx` (new)

**Layout:** mirrors `src/app/candidates/page.tsx` exactly but:
- Fetches candidates filtered by `batch_id` (new `useCandidates` parameter or a new `useBatchCandidates(batchId)` hook)
- Page header: "Batch Results" · job title · date · total count chip
- Breadcrumb: "← Back to Processing" link to `/bulk-upload/[batchId]`
- Footer link: "View All Candidates →" to `/candidates`
- All existing actions work (view detail, update status, email, etc.)

Requires: add an optional `batchId` parameter to the existing `useCandidates` hook. When present, the query fetches `candidate_id`s from `resume_jobs` where `batch_id = batchId AND candidate_id IS NOT NULL`, then fetches those candidates via `.in('id', candidateIds)`. Two-step query, no schema change to `candidates` table needed.

---

## Step 12 — Update `UploadResume.tsx`

**File:** `src/components/Dashboard/UploadResume.tsx`

1. After `/api/bulk-upload` succeeds and returns `batchId`, call `router.push(`/bulk-upload/${batchId}`)`.
2. Remove all local polling state (`activeJobIds`, `fileProgress`, `remoteJobs` reconciliation effect, the fixed-position `Paper` overlay). This component's job ends at navigation.
3. Keep the `disabled` prop: button is disabled if `activeBatch !== null` (query `GET /api/bulk-batches/active` on mount via a lightweight hook or the existing `useBatch` context).

---

## Step 13 — Disable Upload Button During Active Batch

**File:** `src/app/candidates/page.tsx`

Pass `disabled={!!activeBatch}` to `<UploadResume />`. `activeBatch` comes from a shared `useActiveBatch()` hook (thin wrapper around `GET /api/bulk-batches/active`) that both `UploadResume` and `ActiveBatchPill` use.

Add `useActiveBatch` as a shared hook: `src/hooks/useActiveBatch.ts`.

---

## Execution Order

1. DB migration (Step 1) — run manually in Supabase
2. `src/types/bulkBatch.ts` (Step 2)
3. `src/app/api/bulk-upload/route.ts` (Step 3) — creates batch + stamps batch_id
4. `src/app/api/bulk-batches/[id]/route.ts` (Step 4)
5. `src/app/api/bulk-batches/active/route.ts` (Step 5)
6. `src/app/api/process-resume/[id]/route.ts` (Step 6) — flips batch status to done
7. `src/hooks/useBatch.ts` (Step 7)
8. `src/hooks/useActiveBatch.ts` (Step 13 hook)
9. `src/components/BulkUpload/ActiveBatchPill.tsx` (Step 8)
10. `src/components/layout/AppLayout.tsx` (Step 9) — add pill
11. `src/app/bulk-upload/layout.tsx` + `src/components/BulkUpload/ProcessingPage.tsx` + page (Step 10)
12. `src/components/BulkUpload/ResultsPage.tsx` + page (Step 11) — needs candidates filter
13. `src/components/Dashboard/UploadResume.tsx` (Step 12) — simplify to navigate only
14. `src/app/candidates/page.tsx` (Step 13) — wire disabled prop

---

## Verification

- Upload 3 files → confirm redirect to `/bulk-upload/[batchId]`, progress updates live
- Navigate to `/candidates` mid-upload → confirm pill appears bottom-right with correct count
- Click pill → confirm navigation back to processing page
- Refresh processing page mid-upload → confirm page recovers from DB with correct state
- Wait for all files to complete → confirm "All done!" state + "View Results" button appears, pill disappears
- Click "View Results" → confirm only that batch's candidates shown, all actions functional
- Upload button on `/candidates` → confirm disabled while batch is active
- Upload an invalid batchId in URL → confirm "Batch not found" inline error
