"use client";
import * as React from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Snackbar,
} from "@mui/material";
import { X, Copy, Mail } from "lucide-react";
import { useState } from "react";
import type { Candidate } from "./DashboardTable";
import { generateBulkEmail, generateCandidateEmail } from "@/lib/emailUtils";

interface EmailComposeDrawerProps {
  open: boolean;
  onClose: () => void;
  candidates: Candidate[];
  mode: "bulk" | "individual";
}

export default function EmailComposeDrawer({
  open,
  onClose,
  candidates,
  mode,
}: EmailComposeDrawerProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const generatedEmail = React.useMemo(() => {
    if (candidates.length === 0) {
      return { subject: "", body: "" };
    }

    return mode === "bulk"
      ? generateBulkEmail(candidates)
      : generateCandidateEmail(candidates[0]);
  }, [candidates, mode]);

  // Initialize fields when drawer opens; preserve user edits while open
  const currentSubject = subject ?? (open ? generatedEmail.subject : "");
  const currentBody = body ?? (open ? generatedEmail.body : "");

  const handleDrawerClose = React.useCallback(() => {
    setSubject("");
    setBody("");
    onClose();
  }, [onClose]);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 520 },
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#37474F" }}>
              {mode === "bulk"
                ? "Compose Summary Email"
                : "Compose Candidate Email"}
            </Typography>
            {mode === "bulk" && (
              <Typography variant="caption" color="text.secondary">
                {candidates.length} candidate
                {candidates.length !== 1 ? "s" : ""} selected
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleDrawerClose} size="small">
            <X size={20} color="#78909C" />
          </IconButton>
        </Box>

        <Divider />

        <TextField
          label="Subject"
          value={currentSubject}
          onChange={(e) => setSubject(e.target.value)}
          fullWidth
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />

        <TextField
          label="Email Body"
          value={currentBody}
          onChange={(e) => setBody(e.target.value)}
          fullWidth
          multiline
          rows={20}
          sx={{
            flexGrow: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              fontFamily: "monospace",
              fontSize: 13,
              alignItems: "flex-start",
            },
          }}
        />

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<Copy size={16} />}
            onClick={() => {
              navigator.clipboard.writeText(
                `${currentSubject}\n\n${currentBody}`,
              );
              setCopied(true);
            }}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              flex: 1,
              borderColor: "#90CAF9",
              color: "#1565C0",
            }}
          >
            Copy
          </Button>
          <Button
            variant="contained"
            startIcon={<Mail size={16} />}
            onClick={() => {
              const mailto = `mailto:?subject=${encodeURIComponent(currentSubject)}&body=${encodeURIComponent(currentBody)}`;
              window.open(mailto);
            }}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              flex: 1,
              boxShadow: "none",
              bgcolor: "#2196F3",
              "&:hover": { bgcolor: "#1976D2", boxShadow: "none" },
            }}
          >
            Open in Mail
          </Button>
        </Box>
      </Drawer>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
