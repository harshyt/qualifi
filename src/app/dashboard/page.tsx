"use client";
import { useMemo, useState, memo } from "react";
import {
  Box,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import DashboardTable from "@/components/Dashboard/DashboardTable";
import UploadResume from "@/components/Dashboard/UploadResume";

import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/components/Providers/AuthContext";
import type { Candidate } from "@/components/Dashboard/DashboardTable";

type FilterTab = "ALL" | "PENDING" | "SHORTLIST" | "REJECT";

const FILTERS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "ALL" },
  { label: "Shortlist", value: "SHORTLIST" },
  { label: "Pending", value: "PENDING" },
  { label: "Reject", value: "REJECT" },
];

const FilterBar = memo(function FilterBar({
  value,
  onChange,
}: {
  value: FilterTab;
  onChange: (v: FilterTab) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v: FilterTab | null) => v && onChange(v)}
      size="small"
      sx={{
        bgcolor: "#F1F5F9",
        borderRadius: "20px",
        p: 0.5,
        "& .MuiToggleButtonGroup-grouped": {
          border: "none",
          borderRadius: "16px !important",
          mx: 0.25,
          px: 2,
          py: 0.5,
          fontWeight: 600,
          fontSize: 13,
          color: "#64748B",
          "&.Mui-selected": {
            bgcolor: "#FFFFFF",
            color: "#1A1A2E",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            "&:hover": {
              bgcolor: "#FFFFFF",
            },
          },
          "&:hover": {
            bgcolor: "transparent",
          },
        },
      }}
    >
      {FILTERS.map((f) => (
        <ToggleButton key={f.value} value={f.value} disableRipple>
          {f.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
});

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();
  const { data, isLoading, error } = useCandidates();
  const loading = authLoading || isLoading;
  const candidates: Candidate[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  const total = candidates.length;

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
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 2, sm: 0 },
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            Candidates
          </Typography>
          {!loading && (
            <Chip
              label={`${total} Total`}
              size="small"
              sx={{
                bgcolor: "#EFF6FF",
                color: "primary.main",
                fontWeight: 600,
                fontSize: 12,
                borderRadius: "12px",
              }}
            />
          )}
        </Box>
        <UploadResume />
      </Box>

      {/* Filters + table */}
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        {/* Filter bar */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
          }}
        >
          <FilterBar value={activeTab} onChange={setActiveTab} />
        </Box>

        {/* Table or empty state */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                border: "3px solid",
                borderColor: "divider",
                borderTopColor: "primary.main",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                "@keyframes spin": { to: { transform: "rotate(360deg)" } },
              }}
            />
          </Box>
        ) : filteredCandidates.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body2">
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
    </Box>
  );
}
