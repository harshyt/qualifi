"use client";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Paper,
  Divider,
  Chip,
} from "@mui/material";
import { X, History } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import type { JobHistoryEntry, JobFieldDiff } from "@/types/job";

interface JobHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  jobTitle: string;
  history: JobHistoryEntry[];
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DiffRow({ diff }: { diff: JobFieldDiff }) {
  const isHtml = diff.field === "description";

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "#546E7A",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          display: "block",
          mb: 0.75,
        }}
      >
        {diff.label}
      </Typography>

      {/* Removed (before) */}
      <Box
        sx={{
          bgcolor: "#FFEBEE",
          border: "1px solid #FFCDD2",
          borderRadius: 1,
          px: 1.5,
          py: 1,
          mb: 0.5,
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          lineBreak: "anywhere",
          overflow: "scroll",
        }}
      >
        <Typography
          component="span"
          sx={{
            color: "#C62828",
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.6,
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          −
        </Typography>
        {isHtml ? (
          <Box
            sx={{
              color: "#C62828",
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: "monospace",
              "& p": { m: 0 },
              "& ul, & ol": { pl: 2 },
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(diff.before),
            }}
          />
        ) : (
          <Typography
            sx={{
              color: "#C62828",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {diff.before}
          </Typography>
        )}
      </Box>

      {/* Added (after) */}
      <Box
        sx={{
          bgcolor: "#E8F5E9",
          border: "1px solid #C8E6C9",
          borderRadius: 1,
          px: 1.5,
          py: 1,
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          overflow: "scroll",
          lineBreak: "anywhere",
        }}
      >
        <Typography
          component="span"
          sx={{
            color: "#2E7D32",
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.6,
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          +
        </Typography>
        {isHtml ? (
          <Box
            sx={{
              color: "#2E7D32",
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: "monospace",
              "& p": { m: 0 },
              "& ul, & ol": { pl: 2 },
            }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(diff.after) }}
          />
        ) : (
          <Typography
            sx={{
              color: "#2E7D32",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {diff.after}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function JobHistoryDrawer({
  open,
  onClose,
  jobTitle,
  history,
}: JobHistoryDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100vw", sm: 1200 },
          height: "100vh",
          p: 0,
          borderTopLeftRadius: { xs: 16, sm: 0 },
          borderTopRightRadius: { xs: 16, sm: 0 },
          bgcolor: "#F9FAFB",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          p: 3,
          pb: 2,
          borderBottom: "1px solid #E0E0E0",
          bgcolor: "background.paper",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <History size={20} color="#78909C" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#37474F" }}>
              Change History
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ maxWidth: 380 }}
            >
              {jobTitle}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close change history"
        >
          <X size={20} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 3, overflow: "auto", flexGrow: 1 }}>
        {history.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              p: 6,
              bgcolor: "background.paper",
              borderRadius: 2,
              border: "1px dashed #E0E0E0",
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No changes recorded yet.
            </Typography>
          </Box>
        ) : (
          history.map((entry, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 2,
                borderRadius: 2,
                bgcolor: "background.paper",
                borderColor: "#E0E0E0",
              }}
            >
              {/* Entry header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#37474F" }}
                  >
                    {entry.changedBy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(entry.changedAt)}
                  </Typography>
                </Box>
                <Chip
                  label={`${entry.diffs.length} field${entry.diffs.length !== 1 ? "s" : ""} changed`}
                  size="small"
                  sx={{ bgcolor: "#E3F2FD", color: "#1565C0", fontWeight: 500 }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {entry.diffs.map((diff) => (
                <DiffRow key={diff.field} diff={diff} />
              ))}
            </Paper>
          ))
        )}
      </Box>
    </Drawer>
  );
}
