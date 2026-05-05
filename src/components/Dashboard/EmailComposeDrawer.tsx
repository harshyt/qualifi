"use client";
import * as React from "react";
import { Box, Typography, IconButton, Divider, Snackbar } from "@mui/material";
import AppButton from "@/components/ui/AppButton";
import AppDrawer from "@/components/ui/AppDrawer";
import AppTextField from "@/components/ui/AppTextField";
import { X, Copy, Mail } from "lucide-react";
import { useState } from "react";
import type { Candidate } from "@/components/candidates/CandidateTable";
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
  const currentSubject = subject || (open ? generatedEmail.subject : "");
  const currentBody = body || (open ? generatedEmail.body : "");

  const handleDrawerClose = React.useCallback(() => {
    setSubject("");
    setBody("");
    onClose();
  }, [onClose]);

  return (
    <>
      <AppDrawer open={open} onClose={handleDrawerClose}>
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

        <AppTextField
          label="Subject"
          value={currentSubject}
          onChange={(e) => setSubject(e.target.value)}
          size="small"
        />

        <AppTextField
          label="Email Body"
          value={currentBody}
          onChange={(e) => setBody(e.target.value)}
          multiline
          rows={20}
          sx={{
            flexGrow: 1,
            "& .MuiOutlinedInput-root": {
              fontFamily: "monospace",
              fontSize: 13,
              alignItems: "flex-start",
            },
          }}
        />

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <AppButton
            variant="outlined"
            startIcon={<Copy size={16} />}
            onClick={() => {
              navigator.clipboard.writeText(
                `${currentSubject}\n\n${currentBody}`,
              );
              setCopied(true);
            }}
            sx={{ flex: 1, borderColor: "#90CAF9", color: "#1565C0" }}
          >
            Copy
          </AppButton>
          <AppButton
            variant="contained"
            startIcon={<Mail size={16} />}
            onClick={() => {
              const url = `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(currentSubject)}&body=${encodeURIComponent(currentBody)}`;
              window.open(url, "_blank");
            }}
            sx={{ flex: 1 }}
          >
            Open in Outlook
          </AppButton>
        </Box>
      </AppDrawer>

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
