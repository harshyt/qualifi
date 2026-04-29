# Async Bulk Resume Processing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace synchronous resume processing (browser blocks until Claude finishes) with an async pipeline: upload PDFs to Vercel Blob instantly, process each in a separate API invocation, poll for status updates.

**Architecture:** Frontend calls `POST /api/bulk-upload` which uploads files to Vercel Blob and inserts `resume_jobs` rows, returning job IDs in ~1–2s. The frontend then fires `POST /api/process-resume/[jobId]` per file (capped at 5 concurrent), each running as its own Vercel Function with its own timeout. A polling hook queries `GET /api/resume-jobs` every 2s to drive the progress UI. Once all jobs complete the `candidates` React Query cache is invalidated.

**Tech Stack:** Next.js 15 App Router Route Handlers, `@vercel/blob` (already installed), Supabase (new `resume_jobs` table), TanStack Query, Claude Sonnet via `@anthropic-ai/sdk`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/types/resumeJob.ts` | `ResumeJob` type + status enum |
| Modify | `src/lib/env.ts` | Fix `BLOB_READ_WRITE_TOKEN` validation bug |
| Create | `src/app/api/bulk-upload/route.ts` | Upload N files → Blob + DB, return job IDs |
| Create | `src/app/api/process-resume/[jobId]/route.ts` | Download blob → Claude → Supabase → update job |
| Create | `src/app/api/resume-jobs/route.ts` | GET status of multiple jobs by IDs |
| Create | `src/hooks/useResumeJobs.ts` | Polling hook (React Query) |
| Modify | `src/components/Dashboard/UploadResume.tsx` | New async flow, poll-driven progress UI |
| Modify | `src/components/Dashboard/SelectJobModal.tsx` | Increase file limit from 5 → 20 |

---

## Task 0: Supabase Migration

**Files:**
- Run SQL in Supabase dashboard → SQL Editor

- [ ] **Step 1: Run this migration in the Supabase SQL Editor**

```sql
CREATE TABLE IF NOT EXISTS resume_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  job_description text NOT NULL,
  role_key text NOT NULL DEFAULT 'generic',
  file_name text NOT NULL,
  blob_url text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'done', 'error')),
  candidate_id uuid,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for polling: "give me all jobs for these IDs owned by this user"
CREATE INDEX IF NOT EXISTS resume_jobs_user_id_idx ON resume_jobs(user_id);

-- RLS
ALTER TABLE resume_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resume_jobs"
  ON resume_jobs
  FOR ALL
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Verify the table exists**

In Supabase dashboard → Table Editor → confirm `resume_jobs` appears with all columns.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add resume_jobs table migration"
```

---

## Task 1: Add `ResumeJob` type

**Files:**
- Create: `src/types/resumeJob.ts`

- [ ] **Step 1: Create the type file**

```ts
// src/types/resumeJob.ts
export type ResumeJobStatus = 'queued' | 'processing' | 'done' | 'error';

export interface ResumeJob {
  id: string;
  user_id: string;
  job_id: string;
  file_name: string;
  blob_url: string;
  status: ResumeJobStatus;
  candidate_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/resumeJob.ts
git commit -m "feat: add ResumeJob type"
```

---

## Task 2: Fix `env.ts` validation bug

**Files:**
- Modify: `src/lib/env.ts:12-45`

**Context:** `serverSchema` declares `BLOB_READ_WRITE_TOKEN` as required, but `getServerEnv()` only passes `ANTHROPIC_API_KEY` to `schema.parse()`. Zod throws on any call to `getServerEnv()` because `BLOB_READ_WRITE_TOKEN` is missing. Fix: include it in the parse call.

- [ ] **Step 1: Update `getServerEnv()`**

Replace the `serverSchema` definition and `getServerEnv` function (lines 12–45) with:

```ts
const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY must not be empty"),
  BLOB_READ_WRITE_TOKEN: z.string().min(1, "BLOB_READ_WRITE_TOKEN must not be empty"),
});

export function getServerEnv() {
  return serverSchema.parse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  });
}
```

- [ ] **Step 2: Verify the app starts without errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes (or fails only if `BLOB_READ_WRITE_TOKEN` is missing from `.env.local`). If the token is missing, add it to `.env.local` from the Vercel dashboard → Storage → Blob → your store → `.env.local` snippet.

- [ ] **Step 3: Commit**

```bash
git add src/lib/env.ts
git commit -m "fix: include BLOB_READ_WRITE_TOKEN in getServerEnv validation"
```

---

## Task 3: Build `POST /api/bulk-upload`

**Files:**
- Create: `src/app/api/bulk-upload/route.ts`

This handler receives `FormData` with N files plus `jobId`, `jobDescription`, `roleKey`. It uploads each file to Vercel Blob, inserts a `resume_jobs` row per file, and returns the inserted rows immediately — no Claude involved.

- [ ] **Step 1: Create the route handler**

```ts
// src/app/api/bulk-upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { ResumeJob } from '@/types/resumeJob';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const jobId = formData.get('jobId');
  const jobDescription = formData.get('jobDescription');
  const roleKey = (formData.get('roleKey') as string | null) ?? 'generic';

  if (typeof jobId !== 'string' || typeof jobDescription !== 'string') {
    return NextResponse.json({ error: 'jobId and jobDescription are required' }, { status: 400 });
  }

  const files = formData.getAll('resumes') as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }
  if (files.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 files per batch' }, { status: 400 });
  }

  // Upload all files to Vercel Blob in parallel
  const uploadResults = await Promise.allSettled(
    files.map(async (file) => {
      const blob = await put(
        `resumes/${user.id}/${Date.now()}-${file.name}`,
        file,
        { access: 'public' },
      );
      return { fileName: file.name, blobUrl: blob.url };
    }),
  );

  const succeeded = uploadResults
    .map((r, i) => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean) as { fileName: string; blobUrl: string }[];

  const failed = uploadResults
    .map((r, i) => (r.status === 'rejected' ? files[i].name : null))
    .filter(Boolean) as string[];

  if (succeeded.length === 0) {
    return NextResponse.json({ error: 'All file uploads failed' }, { status: 500 });
  }

  // Insert resume_jobs rows
  const rows = succeeded.map(({ fileName, blobUrl }) => ({
    user_id: user.id,
    job_id: jobId,
    job_description: jobDescription.slice(0, 15000),
    role_key: roleKey,
    file_name: fileName,
    blob_url: blobUrl,
    status: 'queued' as const,
  }));

  const { data: jobs, error: dbError } = await supabase
    .from('resume_jobs')
    .insert(rows)
    .select('id, file_name, status, blob_url');

  if (dbError) {
    logger.error('Failed to insert resume_jobs', { userId: user.id, error: dbError.message });
    return NextResponse.json({ error: 'Failed to queue resume jobs' }, { status: 500 });
  }

  logger.info('Bulk upload queued', { userId: user.id, count: jobs.length });

  return NextResponse.json({
    jobs: jobs as Pick<ResumeJob, 'id' | 'file_name' | 'status'>[],
    failedUploads: failed,
  });
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
npx tsc --noEmit 2>&1 | grep bulk-upload
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bulk-upload/route.ts
git commit -m "feat: add bulk-upload API route (blob upload + resume_jobs insert)"
```

---

## Task 4: Build `POST /api/process-resume/[jobId]`

**Files:**
- Create: `src/app/api/process-resume/[jobId]/route.ts`

This handler is called once per resume job by the frontend. It fetches the PDF from Blob, calls Claude, inserts a candidate row, and updates the `resume_jobs` row to `done` (or `error`).

- [ ] **Step 1: Create the route handler**

```ts
// src/app/api/process-resume/[jobId]/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { analyzeResume } from '@/lib/claude';
import { logger } from '@/lib/logger';
import type { RoleKey } from '@/constants/roles';
import { ROLE_CONFIGS } from '@/constants/roles';
import { del } from '@vercel/blob';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!UUID_REGEX.test(jobId)) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the resume_job (ownership enforced by RLS)
  const { data: job, error: fetchError } = await supabase
    .from('resume_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Resume job not found' }, { status: 404 });
  }

  if (job.status !== 'queued') {
    // Already processing or done — idempotent, return current state
    return NextResponse.json({ status: job.status, candidateId: job.candidate_id });
  }

  // Mark as processing
  await supabase
    .from('resume_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', jobId);

  try {
    // Download PDF from Vercel Blob
    const blobResponse = await fetch(job.blob_url);
    if (!blobResponse.ok) {
      throw new Error(`Failed to fetch blob: ${blobResponse.status}`);
    }
    const arrayBuffer = await blobResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine mime type from file extension
    const ext = job.file_name.split('.').pop()?.toLowerCase() ?? 'pdf';
    const mimeType = ext === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

    const isValidRoleKey = Object.keys(ROLE_CONFIGS).includes(job.role_key);
    const roleKey: RoleKey = isValidRoleKey ? (job.role_key as RoleKey) : 'generic';

    // Run Claude analysis
    const analysis = await analyzeResume(
      buffer,
      mimeType,
      job.file_name,
      job.job_description,
      roleKey,
    );

    // Insert candidate
    const { data: candidate, error: dbError } = await supabase
      .from('candidates')
      .insert({
        name: analysis.name,
        email: analysis.email,
        phone: analysis.phone,
        role: analysis.role,
        status: 'PENDING',
        score: analysis.score,
        resume_text: '',
        analysis,
        user_id: user.id,
        job_id: job.job_id,
      })
      .select('id')
      .single();

    if (dbError) {
      throw new Error(`DB insert failed: ${dbError.message}`);
    }

    // Mark job done + store candidate_id
    await supabase
      .from('resume_jobs')
      .update({
        status: 'done',
        candidate_id: candidate.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Clean up blob (fire-and-forget, don't await)
    del(job.blob_url).catch((err) =>
      logger.error('Blob delete failed', { blobUrl: job.blob_url, error: String(err) }),
    );

    logger.info('Resume job processed', {
      jobId,
      candidateId: candidate.id,
      score: analysis.score,
      verdict: analysis.verdict,
    });

    return NextResponse.json({ status: 'done', candidateId: candidate.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Resume job failed', { jobId, error: message });

    await supabase
      .from('resume_jobs')
      .update({
        status: 'error',
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
npx tsc --noEmit 2>&1 | grep process-resume
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/process-resume/
git commit -m "feat: add process-resume/[jobId] API route"
```

---

## Task 5: Build `GET /api/resume-jobs`

**Files:**
- Create: `src/app/api/resume-jobs/route.ts`

Polling endpoint: accepts `?ids=uuid1,uuid2,...` and returns current status rows. The frontend calls this every 2s.

- [ ] **Step 1: Create the route handler**

```ts
// src/app/api/resume-jobs/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { ResumeJob } from '@/types/resumeJob';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('ids') ?? '';
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_REGEX.test(s));

  if (ids.length === 0) {
    return NextResponse.json({ jobs: [] });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: jobs, error } = await supabase
    .from('resume_jobs')
    .select('id, file_name, status, candidate_id, error_message, updated_at')
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: jobs as Partial<ResumeJob>[] });
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
npx tsc --noEmit 2>&1 | grep resume-jobs
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/resume-jobs/route.ts
git commit -m "feat: add resume-jobs polling GET endpoint"
```

---

## Task 6: Build `useResumeJobs` polling hook

**Files:**
- Create: `src/hooks/useResumeJobs.ts`

React Query hook that polls `GET /api/resume-jobs` every 2s until all jobs are terminal (`done` or `error`), then stops.

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/useResumeJobs.ts
import { useQuery } from '@tanstack/react-query';
import type { ResumeJob, ResumeJobStatus } from '@/types/resumeJob';

const TERMINAL: ResumeJobStatus[] = ['done', 'error'];

async function fetchResumeJobs(ids: string[]): Promise<Partial<ResumeJob>[]> {
  const res = await fetch(`/api/resume-jobs?ids=${ids.join(',')}`);
  if (!res.ok) throw new Error('Failed to fetch job statuses');
  const { jobs } = await res.json() as { jobs: Partial<ResumeJob>[] };
  return jobs;
}

export function useResumeJobs(jobIds: string[]) {
  const enabled = jobIds.length > 0;

  return useQuery({
    queryKey: ['resume-jobs', jobIds],
    queryFn: () => fetchResumeJobs(jobIds),
    enabled,
    refetchInterval: (query) => {
      if (!query.state.data) return 2000;
      const allDone = query.state.data.every(
        (j) => j.status && TERMINAL.includes(j.status as ResumeJobStatus),
      );
      return allDone ? false : 2000;
    },
    staleTime: 0,
  });
}
```

- [ ] **Step 2: Verify the hook compiles**

```bash
npx tsc --noEmit 2>&1 | grep useResumeJobs
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useResumeJobs.ts
git commit -m "feat: add useResumeJobs polling hook"
```

---

## Task 7: Increase file limit in `SelectJobModal`

**Files:**
- Modify: `src/components/Dashboard/SelectJobModal.tsx:122`

- [ ] **Step 1: Bump the file limit constant and label**

In [src/components/Dashboard/SelectJobModal.tsx](src/components/Dashboard/SelectJobModal.tsx), find and replace:

```ts
  const MAX_FILES = 5;
```

with:

```ts
  const MAX_FILES = 20;
```

Also find the caption that says `Up to 5 files`:

```tsx
            Accepts PDF, DOCX · Up to 5 files
```

Replace with:

```tsx
            Accepts PDF, DOCX · Up to 20 files
```

Also update the `getAll` field name in the modal's `onConfirm` callback — no change needed here since files are passed as an array of `File[]` objects, not FormData field names.

- [ ] **Step 2: Commit**

```bash
git add src/components/Dashboard/SelectJobModal.tsx
git commit -m "feat: increase bulk upload limit from 5 to 20 files"
```

---

## Task 8: Rewrite `UploadResume.tsx` with async flow

**Files:**
- Modify: `src/components/Dashboard/UploadResume.tsx`

Replace the current synchronous `analyzeCandidateResume` calls with the new three-phase flow:
1. Call `POST /api/bulk-upload` → get job IDs back instantly
2. Concurrently call `POST /api/process-resume/[jobId]` for each job (max 5 at a time)
3. Poll `useResumeJobs` to drive progress UI

The `FileStatus` type and `FileProgressItem` component stay the same visually. The state shape changes: instead of tracking progress in local state alone, we reconcile with polled data.

- [ ] **Step 1: Replace the full component**

```tsx
// src/components/Dashboard/UploadResume.tsx
"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  Button,
  CircularProgress,
  Box,
  Typography,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SelectJobModal from "./SelectJobModal";
import { memo } from "react";
import { useResumeJobs } from "@/hooks/useResumeJobs";
import type { ResumeJobStatus } from "@/types/resumeJob";

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileProgress {
  name: string;
  status: FileStatus;
  errorMessage?: string;
  jobId?: string;
}

const FileProgressItem = memo(function FileProgressItem({
  file,
}: {
  file: FileProgress;
}) {
  const statusIcon = {
    pending: <Loader2 size={16} color="#94A3B8" />,
    uploading: <CircularProgress size={16} />,
    done: <CheckCircle2 size={16} color="#4CAF50" />,
    error: <AlertCircle size={16} color="#F44336" />,
  };
  const statusLabel = {
    pending: "Queued",
    uploading: "Analyzing...",
    done: "Complete",
    error: "Failed",
  };
  const statusColor = {
    pending: "#94A3B8",
    uploading: "#2196F3",
    done: "#4CAF50",
    error: "#F44336",
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1,
        px: 1.5,
        borderRadius: 1,
        bgcolor: file.status === "error" ? "#FFF1F2" : "transparent",
      }}
    >
      <FileText size={16} color="#94A3B8" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "text.primary",
          }}
        >
          {file.name}
        </Typography>
        {file.errorMessage && (
          <Typography variant="caption" color="error">
            {file.errorMessage}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {statusIcon[file.status]}
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: statusColor[file.status] }}
        >
          {statusLabel[file.status]}
        </Typography>
      </Box>
    </Box>
  );
});

function remoteStatusToLocal(remote: ResumeJobStatus | undefined): FileStatus {
  if (!remote) return "pending";
  if (remote === "queued") return "pending";
  if (remote === "processing") return "uploading";
  if (remote === "done") return "done";
  return "error";
}

export default function UploadResume() {
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);

  // IDs of queued resume_jobs — drives polling
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const { data: remoteJobs } = useResumeJobs(activeJobIds);

  // Reconcile remote job status into local progress state
  useEffect(() => {
    if (!remoteJobs || remoteJobs.length === 0) return;

    setFileProgress((prev) =>
      prev.map((fp) => {
        if (!fp.jobId) return fp;
        const remote = remoteJobs.find((j) => j.id === fp.jobId);
        if (!remote) return fp;
        return {
          ...fp,
          status: remoteStatusToLocal(remote.status as ResumeJobStatus),
          errorMessage: remote.error_message ?? fp.errorMessage,
        };
      }),
    );

    const allDone = remoteJobs.every(
      (j) => j.status === "done" || j.status === "error",
    );

    if (allDone) {
      const successCount = remoteJobs.filter((j) => j.status === "done").length;
      const failCount = remoteJobs.filter((j) => j.status === "error").length;

      if (successCount > 0) {
        toast.success(
          `Successfully analyzed ${successCount} resume${successCount > 1 ? "s" : ""}!`,
        );
        queryClient.invalidateQueries({ queryKey: ["candidates"] });
      }
      if (failCount > 0) {
        toast.error(
          `${failCount} resume${failCount > 1 ? "s" : ""} failed to analyze.`,
        );
      }

      clearRef.current = setTimeout(() => {
        setIsUploading(false);
        setFileProgress([]);
        setActiveJobIds([]);
      }, 3000);
    }
  }, [remoteJobs, queryClient]);

  useEffect(() => {
    return () => {
      if (clearRef.current) clearTimeout(clearRef.current);
    };
  }, []);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleModalClose = useCallback(() => setIsModalOpen(false), []);

  const handleJobSelect = useCallback(
    async (
      jobId: string,
      jobDescription: string,
      roleKey?: string,
      files?: File[],
    ) => {
      setIsModalOpen(false);
      if (!files || files.length === 0) return;

      // Show all files as "pending" immediately
      setFileProgress(files.map((f) => ({ name: f.name, status: "pending" })));
      setIsUploading(true);

      // Phase 1: Upload all files to Blob + create resume_jobs rows
      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("jobDescription", jobDescription);
      if (roleKey) formData.append("roleKey", roleKey);
      for (const file of files) {
        formData.append("resumes", file);
      }

      let queuedJobs: { id: string; file_name: string; status: string }[];
      try {
        const res = await fetch("/api/bulk-upload", {
          method: "POST",
          body: formData,
        });
        const body = await res.json() as {
          jobs?: typeof queuedJobs;
          failedUploads?: string[];
          error?: string;
        };

        if (!res.ok || !body.jobs) {
          throw new Error(body.error ?? "Bulk upload failed");
        }

        queuedJobs = body.jobs;

        if (body.failedUploads && body.failedUploads.length > 0) {
          toast.error(`${body.failedUploads.length} file(s) failed to upload.`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
        setIsUploading(false);
        setFileProgress([]);
        return;
      }

      // Attach job IDs to file progress entries, start polling
      setFileProgress((prev) =>
        prev.map((fp) => {
          const matched = queuedJobs.find((j) => j.file_name === fp.name);
          return matched ? { ...fp, jobId: matched.id, status: "pending" } : fp;
        }),
      );
      setActiveJobIds(queuedJobs.map((j) => j.id));

      // Phase 2: Trigger processing for each job, max 5 concurrent
      const CONCURRENCY = 5;
      const queue = [...queuedJobs];

      async function processJob(job: { id: string }) {
        try {
          await fetch(`/api/process-resume/${job.id}`, { method: "POST" });
        } catch {
          // Errors are surfaced via polling — silent here
        }
      }

      async function worker() {
        while (queue.length > 0) {
          const job = queue.shift()!;
          await processJob(job);
        }
      }

      // Fire-and-forget — polling drives the UI from here
      Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, queuedJobs.length) }, worker),
      );
    },
    [],
  );

  const completedCount = fileProgress.filter(
    (f) => f.status === "done" || f.status === "error",
  ).length;
  const totalCount = fileProgress.length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <>
      <Button
        variant="contained"
        startIcon={
          isUploading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <CloudUpload size={18} />
          )
        }
        onClick={handleOpenModal}
        disabled={isUploading || isModalOpen}
      >
        {isUploading ? "Analyzing..." : "Upload Resume"}
      </Button>

      {isUploading && fileProgress.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 360,
            zIndex: 1300,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Screening Resumes ({completedCount}/{totalCount})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ mt: 1, borderRadius: 1, height: 6 }}
            />
          </Box>
          <Box sx={{ maxHeight: 240, overflow: "auto", py: 0.5 }}>
            {fileProgress.map((file, i) => (
              <FileProgressItem key={i} file={file} />
            ))}
          </Box>
        </Paper>
      )}

      <SelectJobModal
        open={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleJobSelect}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify the component compiles**

```bash
npx tsc --noEmit 2>&1 | grep UploadResume
```

Expected: no output.

- [ ] **Step 3: Start the dev server and do a manual test**

```bash
npm run dev
```

1. Open http://localhost:3000/dashboard
2. Click "Upload Resume"
3. Select a job and pick 3–5 PDF/DOCX files
4. Click "Analyze All Resumes"
5. The progress panel should appear immediately with all files in "Queued" state
6. Files should transition to "Analyzing..." as processing kicks off
7. Files complete one by one as Claude finishes
8. Dashboard table updates after all finish

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard/UploadResume.tsx
git commit -m "feat: async bulk upload flow — instant queue, poll-driven progress"
```

---

## Self-Review

### Spec Coverage

| Requirement | Covered By |
|---|---|
| Upload PDFs to Vercel Blob instantly | Task 3 (`/api/bulk-upload`) |
| Return job IDs immediately, no blocking | Task 3 returns before any Claude call |
| Process each resume in isolated function invocation | Task 4 (`/api/process-resume/[jobId]`) |
| Frontend polls for status updates | Task 5 + Task 6 |
| Progress panel reflects real-time state | Task 8 (`useResumeJobs` → `remoteStatusToLocal`) |
| Dashboard invalidated when all done | Task 8 (`queryClient.invalidateQueries`) |
| Blobs cleaned up after processing | Task 4 (`del(job.blob_url)`) |
| File limit raised for bulk use | Task 7 (5 → 20) |
| env.ts validation bug fixed | Task 2 |

### Placeholder Scan

None — all steps contain complete code.

### Type Consistency

- `ResumeJob` / `ResumeJobStatus` defined in Task 1, used in Tasks 3–6, 8 ✓
- `remoteStatusToLocal(remote: ResumeJobStatus): FileStatus` defined and used in Task 8 ✓
- `ROLE_CONFIGS` import in Task 4 matches existing `src/constants/roles.ts` ✓
- `analyzeResume` import in Task 4 matches existing `src/lib/claude.ts` signature ✓
- `del` from `@vercel/blob` — already a project dependency ✓
