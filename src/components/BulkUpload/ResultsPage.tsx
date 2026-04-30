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
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import CandidateTable from "@/components/Dashboard/DashboardTable";
import AppButton from "@/components/ui/AppButton";
import { useBatch } from "@/hooks/useBatch";
import { useBatchCandidates } from "@/hooks/useBatchCandidates";
import { useAuth } from "@/components/Providers/AuthContext";
import { lightTokens } from "@/theme/tokens";
import type { Candidate } from "@/components/Dashboard/DashboardTable";

type FilterTab = "ALL" | "PENDING" | "SHORTLIST" | "REJECT";

const FILTERS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "ALL" },
  { label: "Shortlist", value: "SHORTLIST" },
  { label: "Pending", value: "PENDING" },
  { label: "Reject", value: "REJECT" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
        bgcolor: "#F5F4F2",
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
          color: "#6B6560",
          "&.Mui-selected": {
            bgcolor: "#FFFFFF",
            color: "#1A1714",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            "&:hover": { bgcolor: "#FFFFFF" },
          },
          "&:hover": { bgcolor: "transparent" },
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

function TableSkeleton() {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "none", borderRadius: 0 }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: "#F5F4F2" }}>
          <TableRow>
            {["Candidate Name", "Role", "Score", "Verdict", "Date"].map((col) => (
              <TableCell key={col}><Skeleton variant="text" width={80} /></TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton variant="text" width={120} height={16} />
                </Box>
              </TableCell>
              {[90, 40, 40, 80, 28].map((w, j) => (
                <TableCell key={j}><Skeleton variant="text" width={w} /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface ResultsPageProps {
  batchId: string;
}

export default function ResultsPage({ batchId }: ResultsPageProps) {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { data: batchData } = useBatch(batchId);
  const { data, isLoading, error } = useBatchCandidates(batchId);

  const loading = authLoading || isLoading;
  const candidates: Candidate[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  const batch = batchData?.batch;

  const filteredCandidates = useMemo(
    () =>
      activeTab === "ALL"
        ? candidates
        : candidates.filter((c) => c.status === activeTab),
    [candidates, activeTab],
  );

  if (error) {
    return (
      <Typography color="error">Error loading candidates: {error.message}</Typography>
    );
  }

  return (
    <Box>
      {/* Header */}
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
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <AppButton
              variant="text"
              size="small"
              startIcon={<ArrowLeft size={14} />}
              onClick={() => router.push(`/bulk-upload/${batchId}`)}
              sx={{ px: 0, minWidth: 0, color: lightTokens.textSecondary }}
            >
              Back to Processing
            </AppButton>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
            >
              Batch Results
            </Typography>
            {!loading && (
              <Chip
                label={`${candidates.length} candidates`}
                size="small"
                sx={{
                  bgcolor: lightTokens.brandSubtle,
                  color: lightTokens.brandBase,
                  fontWeight: 600,
                  fontSize: 12,
                  borderRadius: "12px",
                }}
              />
            )}
          </Box>
          {batch && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {batch.job_title} · {formatDate(batch.created_at)}
            </Typography>
          )}
        </Box>
        <AppButton
          variant="outlined"
          size="small"
          endIcon={<ArrowRight size={14} />}
          onClick={() => router.push("/candidates")}
          sx={{ color: lightTokens.textSecondary, borderColor: lightTokens.borderDefault }}
        >
          View All Candidates
        </AppButton>
      </Box>

      {/* Table */}
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
            py: 1.5,
            borderBottom: `1px solid ${lightTokens.borderSubtle}`,
            display: "flex",
            alignItems: "center",
          }}
        >
          <FilterBar value={activeTab} onChange={setActiveTab} />
        </Box>

        {loading ? (
          <TableSkeleton />
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
              candidates in this batch.
            </Typography>
          </Box>
        ) : (
          <CandidateTable candidates={filteredCandidates} />
        )}
      </Box>
    </Box>
  );
}
