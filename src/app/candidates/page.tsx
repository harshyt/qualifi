"use client";
import { useState } from "react";
import { Box, Typography, Chip } from "@mui/material";
import CandidateTable from "@/components/candidates/CandidateTable";
import CandidateFilterBar from "@/components/candidates/CandidateFilterBar";
import type { FilterTab } from "@/components/candidates/CandidateStatusFilter";
import UploadResume from "@/components/Dashboard/UploadResume";
import {
  useCandidates,
  DEFAULT_CANDIDATE_FILTERS,
  type CandidateFilters,
} from "@/hooks/useCandidates";
import { useUsers } from "@/hooks/useUsers";
import { useJobOptions } from "@/hooks/useJobOptions";
import { useAuth } from "@/components/Providers/AuthContext";

const EMPTY_MESSAGES: Record<FilterTab, string> = {
  ALL: "No candidates yet.",
  SHORTLIST: "No shortlisted candidates.",
  PENDING: "No pending candidates.",
  REJECT: "No rejected candidates.",
};

export default function CandidatesPage() {
  const { loading: authLoading } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState<CandidateFilters>(
    DEFAULT_CANDIDATE_FILTERS,
  );

  const { data, isLoading, isFetching, error } = useCandidates({
    page,
    rowsPerPage,
    filters,
  });
  const { data: users = [] } = useUsers();
  const { data: jobOptions = [] } = useJobOptions();

  const loading = authLoading || isLoading;
  const candidates = data?.candidates ?? [];
  const total = data?.total ?? 0;

  const handleFiltersChange = (next: CandidateFilters) => {
    setFilters(next);
    setPage(0);
  };

  const handleRowsPerPageChange = (rpp: number) => {
    setRowsPerPage(rpp);
    setPage(0);
  };

  if (error)
    return (
      <Typography color="error">
        Error loading candidates: {error.message}
      </Typography>
    );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 2, sm: 0 },
          mb: 3,
          flexShrink: 0,
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
                bgcolor: "#EEF2FF",
                color: "#3B5BDB",
                fontWeight: 600,
                fontSize: 12,
                borderRadius: "12px",
              }}
            />
          )}
        </Box>
        <UploadResume />
      </Box>

      {/* Table card — grows to fill remaining height */}
      <Box
        sx={{
          border: "1px solid #E2E8F0",
          borderRadius: 2,
          bgcolor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Filter bar */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <CandidateFilterBar
            filters={filters}
            onChange={handleFiltersChange}
            userOptions={users}
            jobOptions={jobOptions}
          />
        </Box>

        {/* Table + pagination — DataTable handles internal scroll */}
        <CandidateTable
          candidates={candidates}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          loading={loading || isFetching}
          emptyMessage={EMPTY_MESSAGES[filters.status]}
        />
      </Box>
    </Box>
  );
}
