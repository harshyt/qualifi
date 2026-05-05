"use client";
import {
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Chip,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { X } from "lucide-react";
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
        <InputLabel>Job Title</InputLabel>
        <Select
          multiple
          value={filters.jobIds}
          onChange={(e) => set({ jobIds: e.target.value as string[] })}
          input={<OutlinedInput label="Job Title" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {(selected as string[]).map((id) => {
                const j = jobOptions.find((j) => j.id === id);
                return <Chip key={id} label={j?.title ?? id} size="small" />;
              })}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {jobOptions.map((j) => (
            <MenuItem key={j.id} value={j.id}>
              {j.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Uploaded by multiselect */}
      <FormControl size="small" sx={SELECT_SX}>
        <InputLabel>Uploaded by</InputLabel>
        <Select
          multiple
          value={filters.uploaderIds}
          onChange={(e) => set({ uploaderIds: e.target.value as string[] })}
          input={<OutlinedInput label="Uploaded by" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {(selected as string[]).map((id) => {
                const u = userOptions.find((u) => u.id === id);
                return (
                  <Chip key={id} label={u?.full_name ?? id} size="small" />
                );
              })}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {userOptions.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.full_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Date from */}
      <TextField
        label="From"
        type="date"
        size="small"
        value={filters.dateFrom ?? ""}
        onChange={(e) => set({ dateFrom: e.target.value || null })}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: 150 }}
      />

      {/* Date to */}
      <TextField
        label="To"
        type="date"
        size="small"
        value={filters.dateTo ?? ""}
        onChange={(e) => set({ dateTo: e.target.value || null })}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: 150 }}
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
