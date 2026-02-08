"use client";
import { Button, CircularProgress, Box } from "@mui/material";
import { CloudUpload } from "lucide-react";
import { useAnalyzeResume } from "@/hooks/useAnalyzeResume";

export default function UploadResume() {
  const { mutate, isPending } = useAnalyzeResume();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const formData = new FormData();
    formData.append("resume", e.target.files[0]);
    formData.append("jobId", "mock-job-id"); // In real app, select from list
    mutate(formData);
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
        <input type="file" hidden accept=".pdf" onChange={handleFileUpload} />
      </Button>
    </Box>
  );
}
