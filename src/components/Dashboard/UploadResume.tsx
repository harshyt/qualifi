"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  CircularProgress,
  Box,
  Typography,
  Paper,
  LinearProgress,
} from "@mui/material";
import AppButton from "@/components/ui/AppButton";
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
import { lightTokens } from "@/theme/tokens";

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
    pending: <Loader2 size={16} color={lightTokens.textMuted} />,
    uploading: <CircularProgress size={16} />,
    done: <CheckCircle2 size={16} color={lightTokens.successBase} />,
    error: <AlertCircle size={16} color={lightTokens.dangerBase} />,
  };
  const statusLabel = {
    pending: "Queued",
    uploading: "Analyzing...",
    done: "Complete",
    error: "Failed",
  };
  const statusColor = {
    pending: lightTokens.textMuted,
    uploading: lightTokens.brandBase,
    done: lightTokens.successBase,
    error: lightTokens.dangerBase,
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
        bgcolor:
          file.status === "error" ? lightTokens.dangerSubtle : "transparent",
      }}
    >
      <FileText size={16} color={lightTokens.textMuted} />
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
      setFileProgress(
        files.map((f) => ({ name: f.name, status: "pending" as FileStatus })),
      );
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
        const body = (await res.json()) as {
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
          return matched
            ? { ...fp, jobId: matched.id, status: "pending" as FileStatus }
            : fp;
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
      void Promise.all(
        Array.from(
          { length: Math.min(CONCURRENCY, queuedJobs.length) },
          worker,
        ),
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
      <AppButton
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
      </AppButton>

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
              bgcolor: lightTokens.bgBase,
              borderBottom: `1px solid ${lightTokens.borderSubtle}`,
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
