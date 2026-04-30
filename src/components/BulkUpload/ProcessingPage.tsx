"use client";
import { useMemo } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Skeleton,
} from "@mui/material";
import { FileText, CheckCircle2, Loader2, Clock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useBatch } from "@/hooks/useBatch";
import { useResumeJobs } from "@/hooks/useResumeJobs";
import AppButton from "@/components/ui/AppButton";
import { lightTokens } from "@/theme/tokens";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { ResumeJobStatus } from "@/types/resumeJob";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function JobStatusChip({ status }: { status: ResumeJobStatus | undefined }) {
  if (!status || status === "queued") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Clock size={14} color={lightTokens.textMuted} />
        <Typography variant="caption" sx={{ color: lightTokens.textMuted, fontWeight: 600 }}>
          Queued
        </Typography>
      </Box>
    );
  }
  if (status === "processing") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Loader2 size={14} color={lightTokens.brandBase} />
        <Typography variant="caption" sx={{ color: lightTokens.brandBase, fontWeight: 600 }}>
          Analyzing
        </Typography>
      </Box>
    );
  }
  if (status === "done") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <CheckCircle2 size={14} color={lightTokens.successBase} />
        <Typography variant="caption" sx={{ color: lightTokens.successBase, fontWeight: 600 }}>
          Done
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <XCircle size={14} color={lightTokens.dangerBase} />
      <Typography variant="caption" sx={{ color: lightTokens.dangerBase, fontWeight: 600 }}>
        Error
      </Typography>
    </Box>
  );
}

interface ProcessingPageProps {
  batchId: string;
}

export default function ProcessingPage({ batchId }: ProcessingPageProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useBatch(batchId);

  const batch = data?.batch;
  const counts = data?.counts;

  // Fetch per-file statuses by querying resume_jobs for this batch
  // We pass job IDs from the batch counts — but we need the actual IDs.
  // Use a separate query keyed on the batchId to get job ids.
  const { data: jobListData } = useJobIdsByBatch(batchId);
  const jobIds = jobListData ?? [];

  const { data: remoteJobs } = useResumeJobs(jobIds);

  const done = (counts?.done ?? 0) + (counts?.error ?? 0);
  const total = batch?.total_files ?? 0;
  const pct = total > 0 ? (done / total) * 100 : 0;

  const isDone = batch?.status === "done";
  const allErrored =
    isDone && counts?.done === 0 && (counts?.error ?? 0) > 0;

  const statChips = useMemo(
    () => [
      {
        label: "Shortlisted",
        count: counts?.done ?? 0,
        bg: lightTokens.successSubtle,
        color: lightTokens.successText,
      },
      {
        label: "Queued",
        count: counts?.queued ?? 0,
        bg: lightTokens.brandSubtle,
        color: lightTokens.brandBase,
      },
      {
        label: "Processing",
        count: counts?.processing ?? 0,
        bg: "#EFF6FF",
        color: "#1D4ED8",
      },
      {
        label: "Errors",
        count: counts?.error ?? 0,
        bg: lightTokens.dangerSubtle,
        color: lightTokens.dangerText,
      },
    ],
    [counts],
  );

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Skeleton variant="text" width={240} height={32} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={180} height={20} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={8} sx={{ mb: 2, borderRadius: 2 }} />
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={100} height={32} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={44} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (isError || !batch) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center", py: 8 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Batch not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This batch doesn&apos;t exist or you don&apos;t have access to it.
        </Typography>
        <AppButton variant="outlined" onClick={() => router.push("/candidates")}>
          Go to Candidates
        </AppButton>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
          {isDone ? "Analysis Complete" : "Analyzing Resumes"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {batch.job_title} · {formatDate(batch.created_at)}
        </Typography>
      </Box>

      {/* Progress bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            {done} of {total} complete
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: lightTokens.brandBase }}>
            {Math.round(pct)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ borderRadius: 2, height: 8, bgcolor: lightTokens.bgSurfaceAlt }}
        />
      </Box>

      {/* Stats chips */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        {statChips.map((chip) => (
          <Chip
            key={chip.label}
            label={`${chip.label}: ${chip.count}`}
            size="small"
            sx={{
              bgcolor: chip.bg,
              color: chip.color,
              fontWeight: 600,
              fontSize: 12,
              borderRadius: "12px",
            }}
          />
        ))}
      </Box>

      {/* Done banner */}
      {isDone && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: allErrored ? lightTokens.dangerSubtle : lightTokens.successSubtle,
            border: `1px solid ${allErrored ? lightTokens.dangerMuted : lightTokens.successMuted}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: allErrored ? lightTokens.dangerText : lightTokens.successText }}
            >
              {allErrored ? "Analysis failed" : "All done!"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allErrored
                ? "All resumes encountered errors during analysis."
                : `${counts?.done ?? 0} resume${(counts?.done ?? 0) !== 1 ? "s" : ""} analyzed successfully.`}
            </Typography>
          </Box>
          {!allErrored && (
            <AppButton
              variant="contained"
              onClick={() => router.push(`/bulk-upload/${batchId}/results`)}
              sx={{ flexShrink: 0 }}
            >
              View Results
            </AppButton>
          )}
        </Box>
      )}

      {/* File list */}
      <Box
        sx={{
          border: `1px solid ${lightTokens.borderSubtle}`,
          borderRadius: 2,
          bgcolor: lightTokens.bgSurface,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${lightTokens.borderSubtle}`,
            bgcolor: lightTokens.bgBase,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: lightTokens.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Files ({total})
          </Typography>
        </Box>
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {jobIds.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Loading files…
              </Typography>
            </Box>
          ) : (
            jobIds.map((jobId) => {
              const job = remoteJobs?.find((j) => j.id === jobId);
              return (
                <Box
                  key={jobId}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.25,
                    borderBottom: `1px solid ${lightTokens.borderSubtle}`,
                    "&:last-child": { borderBottom: "none" },
                    bgcolor:
                      job?.status === "error" ? lightTokens.dangerSubtle : "transparent",
                  }}
                >
                  <FileText size={16} color={lightTokens.textMuted} style={{ flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {job?.file_name ?? jobId}
                    </Typography>
                    {job?.error_message && (
                      <Typography variant="caption" color="error">
                        {job.error_message}
                      </Typography>
                    )}
                  </Box>
                  <JobStatusChip status={job?.status as ResumeJobStatus | undefined} />
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Fetches job IDs for a batch — separate from useBatch so we can
// pass them to the existing useResumeJobs polling hook.
function useJobIdsByBatch(batchId: string) {
  return useQuery<string[]>({
    queryKey: ["batch-job-ids", batchId],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("resume_jobs")
        .select("id")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: true });
      return (data ?? []).map((r: { id: string }) => r.id);
    },
    staleTime: Infinity,
  });
}
