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

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileProgress {
  name: string;
  status: FileStatus;
  errorMessage?: string;
}

function FileProgressItem({ file }: { file: FileProgress }) {
  const statusIcon = {
    pending: <Loader2 size={16} color="#90A4AE" />,
    uploading: <CircularProgress size={16} />,
    done: <CheckCircle2 size={16} color="#2E7D32" />,
    error: <AlertCircle size={16} color="#C62828" />,
  };

  const statusLabel = {
    pending: "Queued",
    uploading: "Analyzing...",
    done: "Complete",
    error: "Failed",
  };

  const statusColor = {
    pending: "#90A4AE",
    uploading: "#1976D2",
    done: "#2E7D32",
    error: "#C62828",
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
        bgcolor: file.status === "error" ? "#FFF5F5" : "transparent",
      }}
    >
      <FileText size={16} color="#78909C" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "#37474F",
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
}

export default function UploadResume() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);

  useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (files.length > 5) {
        toast.error("You can only upload up to 5 resumes at a time.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setPendingFiles(files);
      setIsModalOpen(true);
    },
    [],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setPendingFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleJobSelect = useCallback(
    async (jobId: string, jobDescription: string, roleKey?: string) => {
      setIsModalOpen(false);

      if (!pendingFiles || pendingFiles.length === 0) return;

      const files = Array.from(pendingFiles);

      // Initialize per-file progress
      const initialProgress: FileProgress[] = files.map((f) => ({
        name: f.name,
        status: "pending" as FileStatus,
      }));
      setFileProgress(initialProgress);
      setIsUploading(true);

      // Process all files in parallel using Promise.allSettled
      const results = await Promise.allSettled(
        files.map(async (file, index) => {
          // Mark as uploading
          setFileProgress((prev) =>
            prev.map((fp, i) =>
              i === index ? { ...fp, status: "uploading" as FileStatus } : fp,
            ),
          );

          const formData = new FormData();
          formData.append("resume", file);
          formData.append("jobId", jobId);
          formData.append("jobDescription", jobDescription);
          if (roleKey) {
            formData.append("roleKey", roleKey);
          }

          const result: { error?: string; success?: boolean } =
            await analyzeCandidateResume(formData);

          if (result.error) {
            throw new Error(result.error);
          }

          // Mark as done
          setFileProgress((prev) =>
            prev.map((fp, i) =>
              i === index ? { ...fp, status: "done" as FileStatus } : fp,
            ),
          );

          return result;
        }),
      );

      // Mark failures
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          setFileProgress((prev) =>
            prev.map((fp, i) =>
              i === index
                ? {
                    ...fp,
                    status: "error" as FileStatus,
                    errorMessage: result.reason?.message || "Analysis failed",
                  }
                : fp,
            ),
          );
        }
      });

      // Invalidate candidates query once after all uploads complete
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

      // Clear upload state after a brief delay so user can see final status
      uploadTimeoutRef.current = setTimeout(() => {
        setIsUploading(false);
        setFileProgress([]);
        setPendingFiles(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 3000);
    },
    [pendingFiles, queryClient],
  );

  const completedCount = fileProgress.filter(
    (f) => f.status === "done" || f.status === "error",
  ).length;
  const totalCount = fileProgress.length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          component="label"
          variant="outlined"
          startIcon={
            isUploading ? (
              <CircularProgress size={20} />
            ) : (
              <CloudUpload size={20} />
            )
          }
          disabled={isUploading || isModalOpen}
        >
          {isUploading ? "Analyzing..." : "Upload Resumes"}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
          />
        </Button>
      </Box>

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
              bgcolor: "#F9FAFB",
              borderBottom: "1px solid #E0E0E0",
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
        fileCount={pendingFiles?.length || 0}
      />
    </>
  );
}
