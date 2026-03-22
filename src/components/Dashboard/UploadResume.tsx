"use client";
import { useRef, useState } from "react";
import { Button, CircularProgress, Box, Typography } from "@mui/material";
import { CloudUpload } from "lucide-react";
import { useAnalyzeResume } from "@/hooks/useAnalyzeResume";
import { toast } from "sonner";
import SelectJobModal from "./SelectJobModal";

export default function UploadResume() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync } = useAnalyzeResume();
  const [isUploading, setIsUploading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 5) {
      toast.error("You can only upload up to 5 resumes at a time.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPendingFiles(files);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPendingFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleJobSelect = async (
    jobId: string,
    jobDescription: string,
    roleKey?: string,
  ) => {
    setIsModalOpen(false);

    if (!pendingFiles || pendingFiles.length === 0) return;

    setIsUploading(true);
    setLoadingMessage(
      `Please wait while we screen ${pendingFiles.length} profile${pendingFiles.length > 1 ? "s" : ""}...`,
    );

    let successCount = 0;

    const uploadPromises = Array.from(pendingFiles).map(async (file) => {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobId", jobId);
      formData.append("jobDescription", jobDescription);
      if (roleKey) {
        formData.append("roleKey", roleKey);
      }

      try {
        await mutateAsync(formData);
        successCount++;
      } catch (error: unknown) {
        toast.error(
          `Failed to analyze ${file.name}: ${(error as Error).message}`,
        );
      }
    });

    await Promise.all(uploadPromises);

    if (successCount > 0) {
      toast.success(
        `Successfully analyzed and saved ${successCount} resume${successCount > 1 ? "s" : ""}!`,
      );
    }

    setIsUploading(false);
    setLoadingMessage("");
    setPendingFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          component="label"
          variant="outlined"
          startIcon={
            isUploading ? (
              <CircularProgress size={20} />
            ) : (
              <CloudUpload size={20} />
            )
          }
          disabled={isUploading || isModalOpen}
        >
          {isUploading ? "Analyzing..." : "Upload Resumes"}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
          />
        </Button>
        {isUploading && loadingMessage && (
          <Typography variant="body2" color="text.secondary">
            {loadingMessage}
          </Typography>
        )}
      </Box>

      <SelectJobModal
        open={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleJobSelect}
        fileCount={pendingFiles?.length || 0}
      />
    </>
  );
}
