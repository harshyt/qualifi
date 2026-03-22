"use client";
import { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import DashboardTable from "@/components/Dashboard/DashboardTable";
import UploadResume from "@/components/Dashboard/UploadResume";

import { useCandidates } from "@/hooks/useCandidates";
import type { Candidate } from "@/components/Dashboard/DashboardTable";

function StatCardSkeleton() {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={40} />
    </Paper>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useCandidates();
  const candidates: Candidate[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const stats = useMemo(() => {
    const total = candidates.length;
    const shortlisted = candidates.filter(
      (c: Candidate) => c.status === "SHORTLIST",
    ).length;
    const rejected = candidates.filter(
      (c: Candidate) => c.status === "REJECT",
    ).length;
    const pending = candidates.filter(
      (c: Candidate) => c.status === "PENDING",
    ).length;
    return [
      { label: "Total Candidates", value: total },
      { label: "Shortlisted", value: shortlisted },
      { label: "Rejected", value: rejected },
      { label: "Pending Review", value: pending },
    ];
  }, [candidates]);

  if (error)
    return (
      <Typography color="error">
        Error loading dashboard: {error.message}
      </Typography>
    );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#37474F", mb: 1 }}
          >
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of recent applications and AI analysis.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <UploadResume />
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 1 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <StatCardSkeleton />
              </Grid>
            ))
          : stats.map((stat) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "#37474F" }}
                  >
                    {stat.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
      </Grid>

      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "#37474F", mb: 1 }}
      >
        Recent Applications
      </Typography>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress aria-label="Loading dashboard" role="status" />
        </Box>
      ) : (
        <DashboardTable candidates={candidates} />
      )}
    </Box>
  );
}
