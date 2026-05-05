"use client";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import DateRangePickerField from "@/components/shared/DateRangePickerField";
import CandidateStatusFilter from "./CandidateStatusFilter";
import type { CandidateFilters } from "@/hooks/useCandidates";
import type { UserOption } from "@/hooks/useUsers";
import type { JobOption } from "@/hooks/useJobOptions";

export interface CandidateFilterBarProps {
  filters: CandidateFilters;
  onChange: (filters: CandidateFilters) => void;
  userOptions: UserOption[];
  jobOptions: JobOption[];
}

const SELECT_SX = { minWidth: 160, maxWidth: 220 };
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: { maxHeight: ITEM_HEIGHT * 6 + ITEM_PADDING_TOP },
  },
};

const hasActiveFilters = (f: CandidateFilters) =>
  f.uploaderIds.length > 0 ||
  f.jobIds.length > 0 ||
  !!f.dateFrom ||
  !!f.dateTo;

export default function CandidateFilterBar({
  filters,
  onChange,
  userOptions,
  jobOptions,
}: CandidateFilterBarProps) {
  const set = (patch: Partial<CandidateFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <CandidateStatusFilter
        value={filters.status}
        onChange={(status) => set({ status })}
      />

      {/* Job title multiselect */}
      <FormControl size="small" sx={SELECT_SX}>
        <Select
          multiple
          displayEmpty
          value={filters.jobIds}
          onChange={(e) => set({ jobIds: e.target.value as string[] })}
          renderValue={(selected) =>
            selected.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ lineHeight: "inherit" }}>
                Job Title
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ lineHeight: "inherit" }}>
                {selected.length === 1
                  ? (jobOptions.find((j) => j.id === (selected as string[])[0])?.title ?? "1 selected")
                  : `${selected.length} selected`}
              </Typography>
            )
          }
          MenuProps={MenuProps}
        >
          {jobOptions.map((j) => (
            <MenuItem key={j.id} value={j.id}>{j.title}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Uploaded by multiselect */}
      <FormControl size="small" sx={SELECT_SX}>
        <Select
          multiple
          displayEmpty
          value={filters.uploaderIds}
          onChange={(e) => set({ uploaderIds: e.target.value as string[] })}
          renderValue={(selected) =>
            selected.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ lineHeight: "inherit" }}>
                Uploaded by
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ lineHeight: "inherit" }}>
                {selected.length === 1
                  ? (userOptions.find((u) => u.id === (selected as string[])[0])?.full_name ?? "1 selected")
                  : `${selected.length} selected`}
              </Typography>
            )
          }
          MenuProps={MenuProps}
        >
          {userOptions.map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <DateRangePickerField
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onChange={(from, to) => set({ dateFrom: from, dateTo: to })}
      />

      {hasActiveFilters(filters) && (
        <Tooltip title="Clear filters">
          <IconButton
            size="small"
            onClick={() =>
              onChange({
                status: filters.status,
                roles: [],
                uploaderIds: [],
                jobIds: [],
                dateFrom: null,
                dateTo: null,
              })
            }
          >
            <X size={16} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
