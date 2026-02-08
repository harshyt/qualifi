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
} from "@mui/material";
import { Eye, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
// import { Candidate } from '@/lib/mockData'; // Removing dependency

// Define minimal interface matching Supabase
export interface Candidate {
  id: string;
  name: string;
  role: string;
  score: number;
  status: string;
  created_at: string;
  email: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "SHORTLIST":
      return { bg: "#E8F5E9", color: "#2E7D32", label: "Shortlisted" };
    case "REJECT":
      return { bg: "#FBE9E7", color: "#C62828", label: "Rejected" }; // Using a slightly different red for better contrast if needed, or stick to guideline
    default:
      return { bg: "#FFF3E0", color: "#E65100", label: "Pending" };
  }
}

function ScoreGauge({ score }: { score: number }) {
  let color = "#2E7D32";
  if (score < 50) color = "#C62828";
  else if (score < 75) color = "#E65100";

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: `3px solid ${color}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color }}>
          {score}
        </Typography>
        <svg
          width="40"
          height="40"
          style={{ position: "absolute", transform: "rotate(-90deg)" }}
        >
          <circle
            cx="20"
            cy="20"
            r="18.5"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray="116"
            strokeDashoffset={116 - (116 * score) / 100}
            strokeLinecap="round"
          />
        </svg>
      </Box>
    </Box>
  );
}

export default function DashboardTable({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const router = useRouter();

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid #E0E0E0", borderRadius: 2 }}
    >
      <Table sx={{ minWidth: 650 }} aria-label="candidate table">
        <TableHead sx={{ bgcolor: "#F9FAFB" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, color: "#78909C" }}>
              Candidate
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#78909C" }}>
              Role
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#78909C" }}>
              AI Score
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#78909C" }}>
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#78909C" }}>
              Date Applied
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, color: "#78909C" }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {candidates.map((row) => {
            const statusStyle = getStatusColor(row.status);
            return (
              <TableRow
                key={row.id}
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#F5F5F5" },
                }}
                onClick={() => router.push(`/dashboard/candidate/${row.id}`)}
              >
                <TableCell component="th" scope="row">
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#37474F" }}
                  >
                    {row.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.email}
                  </Typography>
                </TableCell>
                <TableCell>{row.role}</TableCell>
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
                      fontWeight: 600,
                      borderRadius: 1,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: "#78909C" }}>
                  {new Date(row.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/candidate/${row.id}`);
                    }}
                  >
                    <Eye size={18} color="#78909C" />
                  </IconButton>
                  <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={18} color="#78909C" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
