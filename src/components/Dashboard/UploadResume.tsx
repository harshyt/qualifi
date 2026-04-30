"use client";
import { useState, useCallback } from "react";
import { CloudUpload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AppButton from "@/components/ui/AppButton";
import SelectJobModal from "./SelectJobModal";
import { useActiveBatch } from "@/hooks/useActiveBatch";
import { BLOB_UPLOAD_TIMEOUT_MS, UPLOAD_CONCURRENCY } from "@/lib/uploadConstants";

export default function UploadResume() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { data: activeBatchData } = useActiveBatch();
  const hasActiveBatch = !!activeBatchData?.batch;

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleModalClose = useCallback(() => setIsModalOpen(false), []);

  const handleJobSelect = useCallback(
    async (
      jobId: string,
      jobDescription: string,
      roleKey?: string,
      files?: File[],
      jobTitle?: string,
    ) => {
      setIsModalOpen(false);
      if (!files || files.length === 0) return;

      setIsUploading(true);

      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("jobDescription", jobDescription);
      formData.append("jobTitle", jobTitle ?? "");
      if (roleKey) formData.append("roleKey", roleKey);
      for (const file of files) {
        formData.append("resumes", file);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), BLOB_UPLOAD_TIMEOUT_MS);
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

        if (body.failedUploads && body.failedUploads.length > 0) {
          const names = body.failedUploads.map((f) => f.name).join(", ");
          toast.error(`${body.failedUploads.length} file(s) could not be uploaded: ${names}`);
        }

        if (body.batchId && body.jobs && body.jobs.length > 0) {
          // Fire-and-forget processing — the processing page polls for status
          const queue = [...body.jobs];
          async function processJob(job: { id: string }) {
            const attempt = () =>
              fetch(`/api/process-resume/${job.id}`, { method: "POST" });
            try {
              const r = await attempt();
              if (!r.ok) return;
            } catch {
              try { await attempt(); } catch { /* polling will surface the stuck job */ }
            }
          }
          async function worker() {
            while (queue.length > 0) {
              const job = queue.shift()!;
              await processJob(job);
            }
          }
          void Promise.all(
            Array.from({ length: Math.min(UPLOAD_CONCURRENCY, body.jobs.length) }, worker),
          );

          router.push(`/bulk-upload/${body.batchId}`);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          toast.error("Upload timed out. Please try again with fewer files.");
        } else {
          toast.error(err instanceof Error ? err.message : "Upload failed");
        }
      } finally {
        setIsUploading(false);
      }
    },
    [router],
  );

  return (
    <>
      <AppButton
        variant="contained"
        startIcon={<CloudUpload size={18} />}
        onClick={handleOpenModal}
        disabled={isUploading || isModalOpen || hasActiveBatch}
      >
        {hasActiveBatch ? "Upload in Progress" : "Upload Resume"}
      </AppButton>

      <SelectJobModal
        open={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleJobSelect}
      />
    </>
  );
}
