"use client";
import { useRef } from "react";
import { Button, CircularProgress, Box } from "@mui/material";
import { CloudUpload } from "lucide-react";
import { useAnalyzeResume } from "@/hooks/useAnalyzeResume";

export default function UploadResume() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useAnalyzeResume();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const formData = new FormData();
    formData.append("resume", e.target.files[0]);
    formData.append("jobId", "mock-job-id"); // In real app, select from list

    mutate(formData, {
      onSettled: () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  };

  return (
    <Box>
      <Button
        component="label"
        variant="outlined"
        startIcon={
          isPending ? <CircularProgress size={20} /> : <CloudUpload size={20} />
        }
        disabled={isPending}
      >
        {isPending ? "Analyzing..." : "Upload Resume"}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf"
          onChange={handleFileUpload}
        />
      </Button>
    </Box>
  );
}
