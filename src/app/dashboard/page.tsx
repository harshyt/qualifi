"use client";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";
import DashboardTable from "@/components/Dashboard/DashboardTable";
import UploadResume from "@/components/Dashboard/UploadResume";
import { useCandidates } from "@/hooks/useCandidates";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { data: candidates, isLoading, error } = useCandidates();

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

  const total = candidates?.length || 0;
  const shortlisted =
    candidates?.filter((c) => c.status === "SHORTLIST").length || 0;
  const rejected = candidates?.filter((c) => c.status === "REJECT").length || 0;
  const pending = candidates?.filter((c) => c.status === "PENDING").length || 0;

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
          <Button variant="contained" startIcon={<Plus size={18} />}>
            New Job
          </Button>
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
      <DashboardTable candidates={candidates || []} />
    </Box>
  );
}
