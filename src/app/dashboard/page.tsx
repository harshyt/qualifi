"use client";
import { useMemo, useState, memo } from "react";
import {
  Box,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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

function DashboardTableSkeleton() {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "none", borderRadius: 0 }}
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: "#F8FAFC" }}>
          <TableRow>
            <TableCell padding="checkbox">
              <Skeleton
                variant="rectangular"
                width={18}
                height={18}
                sx={{ borderRadius: 0.5 }}
              />
            </TableCell>
            {[
              "Candidate Name",
              "Role",
              "Score",
              "Verdict",
              "Experience",
              "Date",
            ].map((col) => (
              <TableCell key={col}>
                <Skeleton variant="text" width={80} />
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell padding="checkbox">
                <Skeleton
                  variant="rectangular"
                  width={18}
                  height={18}
                  sx={{ borderRadius: 0.5 }}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box>
                    <Skeleton variant="text" width={120} height={16} />
                    <Skeleton
                      variant="text"
                      width={80}
                      height={13}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={90} />
              </TableCell>
              <TableCell>
                <Skeleton variant="circular" width={40} height={40} />
              </TableCell>
              <TableCell>
                <Skeleton
                  variant="rounded"
                  width={72}
                  height={24}
                  sx={{ borderRadius: 3 }}
                />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={70} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell>
                <Skeleton
                  variant="circular"
                  width={28}
                  height={28}
                  sx={{ ml: "auto" }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
                color: "#2196F3",
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
          border: "1px solid #E2E8F0",
          borderRadius: 2,
          bgcolor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* Filter bar */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
          }}
        >
          <FilterBar value={activeTab} onChange={setActiveTab} />
        </Box>

        {/* Table or empty state */}
        {loading ? (
          <DashboardTableSkeleton />
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
