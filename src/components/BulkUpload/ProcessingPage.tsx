"use client";
import { useMemo, memo } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Skeleton,
} from "@mui/material";
import { FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBatch } from "@/hooks/useBatch";
import { useBatchJobs } from "@/hooks/useBatchJobs";
import type { BatchJob } from "@/hooks/useBatchJobs";
import AppButton from "@/components/ui/AppButton";
import { lightTokens } from "@/theme/tokens";
import { formatDate } from "@/lib/format";
import type { ResumeJobStatus } from "@/types/resumeJob";

// CSS keyframes injected once via sx on the first element that needs them
const spinKeyframes = {
  "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
  "@keyframes fadeInUp": {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
};

const JobStatusChip = memo(function JobStatusChip({
  status,
}: {
  status: ResumeJobStatus | undefined;
}) {
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ...spinKeyframes }}>
        <Box
          component="span"
          sx={{ display: "inline-flex", animation: "spin 1s linear infinite" }}
        >
          {/* Inline SVG avoids importing Loader2 which triggers re-renders */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={lightTokens.brandBase} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </Box>
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
});

const JobRow = memo(function JobRow({ job }: { job: BatchJob }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderBottom: `1px solid ${lightTokens.borderSubtle}`,
        "&:last-child": { borderBottom: "none" },
        bgcolor: job.status === "error" ? lightTokens.dangerSubtle : "transparent",
        transition: "background-color 0.3s ease",
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
          {job.file_name}
        </Typography>
        {job.error_message && (
          <Typography variant="caption" color="error">
            {job.error_message}
          </Typography>
        )}
      </Box>
      <JobStatusChip status={job.status} />
    </Box>
  );
});

interface ProcessingPageProps {
  batchId: string;
}

export default function ProcessingPage({ batchId }: ProcessingPageProps) {
  const router = useRouter();
  const { data: batchData, isLoading, isError } = useBatch(batchId);
  const { data: jobs = [] } = useBatchJobs(batchId);

  const batch = batchData?.batch;

  // Derive counts from live job data — single source of truth
  const counts = useMemo(() => {
    const c = { done: 0, error: 0, processing: 0, queued: 0 };
    for (const j of jobs) {
      if (j.status in c) c[j.status as keyof typeof c]++;
    }
    return c;
  }, [jobs]);

  const completed = counts.done + counts.error;
  const total = batch?.total_files ?? jobs.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  const isDone = batch?.status === "done";
  const allErrored = isDone && counts.done === 0 && counts.error > 0;

  const statChips = useMemo(
    () => [
      { label: "Shortlisted", count: counts.done, bg: lightTokens.successSubtle, color: lightTokens.successText },
      { label: "Queued", count: counts.queued, bg: lightTokens.brandSubtle, color: lightTokens.brandBase },
      { label: "Processing", count: counts.processing, bg: lightTokens.brandSubtle, color: lightTokens.brandBase },
      { label: "Errors", count: counts.error, bg: lightTokens.dangerSubtle, color: lightTokens.dangerText },
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
            {completed} of {total} complete
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: lightTokens.brandBase }}>
            {Math.round(pct)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            borderRadius: 2,
            height: 8,
            bgcolor: lightTokens.bgSurfaceAlt,
            "& .MuiLinearProgress-bar": { transition: "transform 0.5s ease" },
          }}
        />
      </Box>

      {/* Stats chips */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        {statChips.map((chip) => (
          <Chip
            key={chip.label}
            label={`${chip.label}: ${chip.count}`}
            size="small"
            sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 600, fontSize: 12, borderRadius: "12px" }}
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
            "@keyframes fadeInUp": {
              from: { opacity: 0, transform: "translateY(8px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
            animation: "fadeInUp 0.35s ease",
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
                : `${counts.done} resume${counts.done !== 1 ? "s" : ""} analyzed successfully.`}
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
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: lightTokens.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Files ({total})
          </Typography>
        </Box>
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {jobs.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Loading files…
              </Typography>
            </Box>
          ) : (
            jobs.map((job) => <JobRow key={job.id} job={job} />)
          )}
        </Box>
      </Box>
    </Box>
  );
}
