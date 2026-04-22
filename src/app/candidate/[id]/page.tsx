"use client";
import { MemoizedCandidateView } from "@/components/CandidateDetail/CandidateView";
import { useCandidate } from "@/hooks/useCandidate";
import { useParams } from "next/navigation";
import { Box, Typography, Grid, Paper, Skeleton, Divider } from "@mui/material";

function CandidateDetailSkeleton() {
  return (
    <Box
      sx={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header skeleton */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="rounded" width={72} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="circular" width={52} height={52} />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Skeleton variant="text" width={160} height={28} />
              <Skeleton variant="rounded" width={80} height={22} sx={{ borderRadius: 1 }} />
            </Box>
            <Skeleton variant="text" width={240} height={18} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Skeleton variant="rounded" width={90} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>

      {/* Two-column skeleton */}
      <Grid container spacing={2.5} sx={{ flexGrow: 1, overflow: "hidden" }}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          <Paper sx={{ height: "100%", p: 3 }}>
            {/* Summary */}
            <Skeleton variant="text" width={120} height={14} sx={{ mb: 1.5 }} />
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="90%" height={16} />
            <Skeleton variant="text" width="75%" height={16} sx={{ mb: 2.5 }} />
            <Divider sx={{ my: 2.5 }} />
            {/* Experience */}
            <Skeleton variant="text" width={100} height={14} sx={{ mb: 1.5 }} />
            {Array.from({ length: 2 }).map((_, i) => (
              <Box key={i} sx={{ mb: 2.5, pl: 2, borderLeft: "2px solid #E2E8F0" }}>
                <Skeleton variant="text" width="55%" height={20} />
                <Skeleton variant="text" width="40%" height={16} />
                <Skeleton variant="text" width="85%" height={16} />
              </Box>
            ))}
            <Divider sx={{ my: 2.5 }} />
            {/* Education */}
            <Skeleton variant="text" width={80} height={14} sx={{ mb: 1.5 }} />
            <Skeleton variant="text" width="50%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Paper>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          <Paper sx={{ height: "100%", p: 3 }}>
            {/* Score widget */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Skeleton variant="circular" width={88} height={88} />
              <Box>
                <Skeleton variant="text" width={100} height={18} />
                <Skeleton variant="text" width={70} height={14} />
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            {/* Strengths */}
            <Skeleton variant="text" width={80} height={14} sx={{ mb: 1.5 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="text" width={`${80 - i * 8}%`} height={18} sx={{ mb: 0.75 }} />
            ))}
            <Box sx={{ mt: 2.5, mb: 1.5 }}>
              <Skeleton variant="text" width={80} height={14} sx={{ mb: 1.5 }} />
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} variant="text" width={`${70 - i * 6}%`} height={18} sx={{ mb: 0.75 }} />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: candidate, isLoading, error } = useCandidate(id);

  if (isLoading) return <CandidateDetailSkeleton />;
  if (error)
    return (
      <Typography color="error">
        Error loading candidate: {error.message}
      </Typography>
    );
  if (!candidate) return <Typography>Candidate not found</Typography>;

  return <MemoizedCandidateView candidate={candidate} />;
}
