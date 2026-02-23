"use client";
import { Box, Typography, Paper, Grid, CircularProgress } from "@mui/material";
import DashboardTable from "@/components/Dashboard/DashboardTable";
import UploadResume from "@/components/Dashboard/UploadResume";

import { useCandidates } from "@/hooks/useCandidates";
import type { Candidate } from "@/components/Dashboard/DashboardTable";

export default function DashboardPage() {
  const { data, isLoading, error } = useCandidates();
  const candidates: Candidate[] = Array.isArray(data) ? data : [];

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Typography color="error">
        Error loading dashboard: {error.message}
      </Typography>
    );

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

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
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
        <Box sx={{ display: "flex", gap: 2 }}>
          <UploadResume />
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Candidates", value: total },
          { label: "Shortlisted", value: shortlisted },
          { label: "Rejected", value: rejected },
          { label: "Pending Review", value: pending },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
        sx={{ fontWeight: 600, color: "#37474F", mb: 2 }}
      >
        Recent Applications
      </Typography>
      <DashboardTable candidates={candidates} />
    </Box>
  );
}
