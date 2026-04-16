"use client";
import * as React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Checkbox,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { MoreHorizontal, Trash2, Mail } from "lucide-react";
import { useState, useCallback, memo, useMemo } from "react";
import { useDeleteCandidate } from "@/hooks/useDeleteCandidate";
import { useRouter } from "next/navigation";
import EmailComposeDrawer from "./EmailComposeDrawer";

// Define minimal interface matching Supabase
export interface Candidate {
  id: string;
  name: string;
  role: string;
  score: number;
  status: string;
  created_at: string;
  email: string;
  analysis?: {
    strengths: string[];
    gaps: string[];
    experienceLevel: string;
    summary: string;
  } | null;
}

// Deterministic avatar color from candidate name
const AVATAR_COLORS = [
  { bg: "#EDE9FE", color: "#7C3AED" },
  { bg: "#FCE7F3", color: "#BE185D" },
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#D1FAE5", color: "#065F46" },
  { bg: "#FEF3C7", color: "#92400E" },
  { bg: "#FFE4E6", color: "#BE123C" },
  { bg: "#E0F2FE", color: "#0369A1" },
  { bg: "#F3E8FF", color: "#7E22CE" },
  { bg: "#DCFCE7", color: "#166534" },
  { bg: "#FEF9C3", color: "#854D0E" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStatusStyle(status: string) {
  switch (status) {
    case "SHORTLIST":
      return { bg: "#F0FDF4", color: "#4CAF50", label: "Shortlist" };
    case "REJECT":
      return { bg: "#FFF1F2", color: "#F44336", label: "Reject" };
    default:
      return { bg: "#FFF7ED", color: "#FF9800", label: "Pending" };
  }
}

const ScoreGauge = memo(function ScoreGauge({ score }: { score: number }) {
  let color = "#4CAF50";
  if (score < 50) color = "#F44336";
  else if (score < 75) color = "#FF9800";

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color, zIndex: 1 }}
        >
          {score}
        </Typography>
        <svg
          width="40"
          height="40"
          style={{ position: "absolute", transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray="113"
            strokeDashoffset={113 - (113 * score) / 100}
            strokeLinecap="round"
          />
        </svg>
      </Box>
    </Box>
  );
});

const CandidateAvatar = memo(function CandidateAvatar({
  name,
}: {
  name: string;
}) {
  const { bg, color } = getAvatarColor(name);
  return (
    <Avatar
      sx={{
        width: 36,
        height: 36,
        bgcolor: bg,
        color,
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
});

function DashboardTable({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteCandidate, isPending: isDeleting } =
    useDeleteCandidate();
  const open = Boolean(anchorEl);

  // Selection state
  const [selectedIdsRaw, setSelectedIdsRaw] = useState<Set<string>>(new Set());
  const selectedIds = useMemo(() => {
    const validIdSet = new Set(candidates.map((c) => c.id));
    const filtered = new Set<string>();
    for (const id of selectedIdsRaw) {
      if (validIdSet.has(id)) filtered.add(id);
    }
    return filtered;
  }, [selectedIdsRaw, candidates]);

  // Email drawer state
  const [emailDrawerOpen, setEmailDrawerOpen] = useState(false);
  const [emailMode, setEmailMode] = useState<"bulk" | "individual">("bulk");
  const [emailCandidates, setEmailCandidates] = useState<Candidate[]>([]);

  const selectableCandidates = candidates.filter((c) => c.status !== "PENDING");
  const allSelected =
    selectableCandidates.length > 0 &&
    selectableCandidates.every((c) => selectedIds.has(c.id));
  const someSelected =
    selectableCandidates.some((c) => selectedIds.has(c.id)) && !allSelected;

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIdsRaw(new Set(selectableCandidates.map((c) => c.id)));
      } else {
        setSelectedIdsRaw(new Set());
      }
    },
    [selectableCandidates],
  );

  const handleToggleRow = useCallback((id: string, checked: boolean) => {
    setSelectedIdsRaw((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleMenuClick = useCallback(
    (event: React.MouseEvent<HTMLElement>, candidate: Candidate) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setSelectedCandidate(candidate);
    },
    [],
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setAnchorEl(null);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleSendEmailClick = useCallback(() => {
    setAnchorEl(null);
    if (selectedCandidate) {
      setEmailCandidates([selectedCandidate]);
      setEmailMode("individual");
      setEmailDrawerOpen(true);
    }
  }, [selectedCandidate]);

  const handleComposeEmail = useCallback(() => {
    const selected = candidates.filter((c) => selectedIds.has(c.id));
    setEmailCandidates(selected);
    setEmailMode("bulk");
    setEmailDrawerOpen(true);
  }, [candidates, selectedIds]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedCandidate) {
      deleteCandidate(selectedCandidate.id);
      setIsDeleteDialogOpen(false);
      setSelectedCandidate(null);
    }
  }, [selectedCandidate, deleteCandidate]);

  const handleDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedCandidate(null);
  }, []);

  const handleRowClick = useCallback(
    (id: string) => {
      router.push(`/dashboard/candidate/${id}`);
    },
    [router],
  );

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "none", borderRadius: 0 }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="candidate table">
          <TableHead sx={{ bgcolor: "#F8FAFC" }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  indeterminate={someSelected}
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  disabled={selectableCandidates.length === 0}
                />
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Candidate Name
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Role
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Score
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Verdict
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Experience
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Date Applied
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((row) => {
              const statusStyle = getStatusStyle(row.status);
              const isPending = row.status === "PENDING";
              return (
                <TableRow
                  key={row.id}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#F8FAFC" },
                    ...(selectedIds.has(row.id) && { bgcolor: "#EFF6FF" }),
                    transition: "background-color 0.15s ease",
                  }}
                  onClick={() => handleRowClick(row.id)}
                >
                  <TableCell
                    padding="checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      size="small"
                      checked={selectedIds.has(row.id)}
                      disabled={isPending}
                      onChange={(e) =>
                        handleToggleRow(row.id, e.target.checked)
                      }
                      sx={{ opacity: isPending ? 0.3 : 1 }}
                    />
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <CandidateAvatar name={row.name} />
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            lineHeight: 1.3,
                          }}
                        >
                          {row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "text.primary", fontSize: 14 }}>
                    {row.role}
                  </TableCell>
                  <TableCell>
                    <ScoreGauge score={row.score} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusStyle.label}
                      size="small"
                      sx={{
                        bgcolor: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 700,
                        fontSize: 12,
                        border: `1px solid ${statusStyle.color}30`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: 14 }}>
                    {row.analysis?.experienceLevel ?? "—"}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: 14 }}>
                    {new Date(row.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, row)}
                      sx={{ color: "text.secondary" }}
                    >
                      <MoreHorizontal size={17} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Floating action bar */}
      {selectedIds.size > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1200,
          }}
        >
          <Paper
            elevation={6}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 3,
              py: 1.5,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                whiteSpace: "nowrap",
              }}
            >
              {selectedIds.size} candidate{selectedIds.size !== 1 ? "s" : ""}{" "}
              selected
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Mail size={15} />}
              onClick={handleComposeEmail}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Compose Email
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => setSelectedIdsRaw(new Set())}
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Clear
            </Button>
          </Paper>
        </Box>
      )}

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, minWidth: 160 },
        }}
      >
        {selectedCandidate?.status !== "PENDING" && (
          <MenuItem onClick={handleSendEmailClick}>
            <ListItemIcon>
              <Mail size={16} color="#2196F3" />
            </ListItemIcon>
            <ListItemText
              primary="Send Email"
              primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
            />
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <Trash2 size={16} color="#F44336" />
          </ListItemIcon>
          <ListItemText
            primary="Delete"
            primaryTypographyProps={{
              color: "error",
              variant: "body2",
              fontWeight: 500,
            }}
          />
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleDialogClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { borderRadius: 3, padding: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "text.primary" }}>
          Delete Candidate?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{selectedCandidate?.name}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDialogClose}
            sx={{ color: "text.secondary", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
            disabled={isDeleting}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {isDeleting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Deleting...
              </Box>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email compose drawer */}
      <EmailComposeDrawer
        open={emailDrawerOpen}
        onClose={() => setEmailDrawerOpen(false)}
        candidates={emailCandidates}
        mode={emailMode}
      />
    </>
  );
}

export default memo(DashboardTable);
