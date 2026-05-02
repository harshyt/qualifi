"use client";
import { useState, useCallback } from "react";
import { BLOB_UPLOAD_TIMEOUT_MS, UPLOAD_CONCURRENCY } from "@/lib/uploadConstants";

export interface UploadBatchParams {
  jobId: string;
  jobDescription: string;
  jobTitle: string;
  roleKey?: string;
  files: File[];
}

export interface UploadBatchResult {
  batchId: string;
  jobs: { id: string; file_name: string; status: string }[];
  failedUploads: { name: string; reason: string }[];
}

async function triggerProcessing(jobs: { id: string }[]) {
  const queue = [...jobs];

  async function processOne(job: { id: string }) {
    const attempt = () =>
      fetch(`/api/process-resume/${job.id}`, { method: "POST" });
    try {
      const r = await attempt();
      if (!r.ok) return;
    } catch {
      try {
        await attempt();
      } catch {
        // polling on the processing page will surface the stuck job
      }
    }
  }

  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift()!;
      await processOne(job);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, jobs.length) }, worker),
  );
}

export function useUploadBatch() {
  const [isPending, setIsPending] = useState(false);

  const upload = useCallback(
    async (params: UploadBatchParams): Promise<UploadBatchResult> => {
      const { jobId, jobDescription, jobTitle, roleKey, files } = params;

      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("jobDescription", jobDescription);
      formData.append("jobTitle", jobTitle);
      if (roleKey) formData.append("roleKey", roleKey);
      for (const file of files) {
        formData.append("resumes", file);
      }

      setIsPending(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          BLOB_UPLOAD_TIMEOUT_MS,
        );

        let res: Response;
        try {
          res = await fetch("/api/bulk-upload", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const body = (await res.json()) as {
          batchId?: string;
          jobs?: { id: string; file_name: string; status: string }[];
          failedUploads?: { name: string; reason: string }[];
          error?: string;
        };

        if (!res.ok || !body.batchId) {
          throw new Error(body.error ?? "Bulk upload failed");
        }

        const result: UploadBatchResult = {
          batchId: body.batchId,
          jobs: body.jobs ?? [],
          failedUploads: body.failedUploads ?? [],
        };

        // Fire-and-forget — processing page polls for status
        if (result.jobs.length > 0) {
          void triggerProcessing(result.jobs);
        }

        return result;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { upload, isPending };
}
