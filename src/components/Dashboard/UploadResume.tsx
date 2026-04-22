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
import { analyzeCandidateResume } from "@/actions/analyze";
import { toast } from "sonner";
import SelectJobModal from "./SelectJobModal";
import { memo } from "react";

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileProgress {
  name: string;
  status: FileStatus;
  errorMessage?: string;
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
    uploading: "#3B5BDB",
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

export default function UploadResume() {
  const uploadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);

  useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleJobSelect = useCallback(
    async (
      jobId: string,
      jobDescription: string,
      roleKey?: string,
      files?: File[],
    ) => {
      setIsModalOpen(false);

      if (!files || files.length === 0) return;

      // Initialize per-file progress
      const initialProgress: FileProgress[] = files.map((f) => ({
        name: f.name,
        status: "pending" as FileStatus,
      }));
      setFileProgress(initialProgress);
      setIsUploading(true);

      // Process files in parallel with a concurrency cap of 5
      const CONCURRENCY = 5;
      const results: PromiseSettledResult<{
        error?: string;
        success?: boolean;
      }>[] = new Array(files.length);
      const queue = files.map((file, index) => ({ file, index }));

      async function processEntry(entry: { file: File; index: number }) {
        const { file, index } = entry;
        setFileProgress((prev) =>
          prev.map((fp, i) =>
            i === index ? { ...fp, status: "uploading" as FileStatus } : fp,
          ),
        );

        const formData = new FormData();
        formData.append("resume", file);
        formData.append("jobId", jobId);
        formData.append("jobDescription", jobDescription);
        if (roleKey) formData.append("roleKey", roleKey);

        try {
          const result: { error?: string; success?: boolean } =
            await analyzeCandidateResume(formData);
          if (result.error) throw new Error(result.error);
          setFileProgress((prev) =>
            prev.map((fp, i) =>
              i === index ? { ...fp, status: "done" as FileStatus } : fp,
            ),
          );
          results[index] = { status: "fulfilled", value: result };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Analysis failed";
          setFileProgress((prev) =>
            prev.map((fp, i) =>
              i === index
                ? {
                    ...fp,
                    status: "error" as FileStatus,
                    errorMessage: message,
                  }
                : fp,
            ),
          );
          results[index] = { status: "rejected", reason: err };
        }
      }

      async function runWorker() {
        while (queue.length > 0) {
          const entry = queue.shift()!;
          await processEntry(entry);
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, files.length) }, runWorker),
      );

      queryClient.invalidateQueries({ queryKey: ["candidates"] });

      const successCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const failCount = results.filter((r) => r.status === "rejected").length;

      if (successCount > 0) {
        toast.success(
          `Successfully analyzed ${successCount} resume${successCount > 1 ? "s" : ""}!`,
        );
      }
      if (failCount > 0) {
        toast.error(
          `${failCount} resume${failCount > 1 ? "s" : ""} failed to analyze.`,
        );
      }

      uploadTimeoutRef.current = setTimeout(() => {
        setIsUploading(false);
        setFileProgress([]);
      }, 3000);
    },
    [queryClient],
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

      {/* Per-file progress panel */}
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
