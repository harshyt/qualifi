"use client";
import { useMemo, useState, memo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Skeleton,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import DashboardTable from "@/components/Dashboard/DashboardTable";
import UploadResume from "@/components/Dashboard/UploadResume";

import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/components/Providers/AuthContext";
import type { Candidate } from "@/components/Dashboard/DashboardTable";

const TabLabel = memo(function TabLabel({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {label}
      <Chip
        label={count}
        size="small"
        sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
      />
    </Box>
  );
});

function StatCardSkeleton() {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={40} />
    </Paper>
  );
}

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();
  const { data, isLoading, error } = useCandidates();
  const loading = authLoading || isLoading;
  const candidates: Candidate[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const [activeTab, setActiveTab] = useState<
    "ALL" | "PENDING" | "SHORTLIST" | "REJECT"
  >("ALL");

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

  const filteredCandidates = useMemo(
    () =>
      activeTab === "ALL"
        ? candidates
        : candidates.filter((c: Candidate) => c.status === activeTab),
    [candidates, activeTab],
  );

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
        {loading
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

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(
            _: React.SyntheticEvent,
            v: "ALL" | "PENDING" | "SHORTLIST" | "REJECT",
          ) => setActiveTab(v)}
          sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
        >
          <Tab
            label={<TabLabel label="All" count={stats[0].value} />}
            value="ALL"
          />
          <Tab
            label={<TabLabel label="Pending" count={stats[3].value} />}
            value="PENDING"
          />
          <Tab
            label={<TabLabel label="Shortlisted" count={stats[1].value} />}
            value="SHORTLIST"
          />
          <Tab
            label={<TabLabel label="Rejected" count={stats[2].value} />}
            value="REJECT"
          />
        </Tabs>
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress aria-label="Loading dashboard" role="status" />
        </Box>
      ) : filteredCandidates.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 6,
            color: "text.secondary",
            bgcolor: "#F9FAFB",
            borderRadius: "0 0 8px 8px",
            border: "1px solid #E0E0E0",
            borderTop: 0,
          }}
        >
          <Typography variant="body1">
            No{" "}
            {activeTab === "ALL"
              ? ""
              : activeTab === "PENDING"
                ? "pending"
                : activeTab === "SHORTLIST"
                  ? "shortlisted"
                  : "rejected"}{" "}
            candidates yet.
          </Typography>
        </Box>
      ) : (
        <DashboardTable candidates={filteredCandidates} />
      )}
    </Box>
  );
}
