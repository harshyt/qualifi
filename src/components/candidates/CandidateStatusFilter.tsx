"use client";
import { memo } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export type FilterTab = "ALL" | "PENDING" | "SHORTLIST" | "REJECT";

const FILTERS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "ALL" },
  { label: "Shortlist", value: "SHORTLIST" },
  { label: "Pending", value: "PENDING" },
  { label: "Reject", value: "REJECT" },
];

interface CandidateStatusFilterProps {
  value: FilterTab;
  onChange: (v: FilterTab) => void;
}

export default memo(function CandidateStatusFilter({
  value,
  onChange,
}: CandidateStatusFilterProps) {
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
          px: { xs: 1, sm: 2 },
          py: 0.5,
          fontWeight: 600,
          fontSize: { xs: 12, sm: 13 },
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
