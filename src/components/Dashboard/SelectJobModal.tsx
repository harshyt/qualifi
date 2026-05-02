"use client";
import { useState, useMemo, useCallback, useRef, memo } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Autocomplete,
  Grid,
} from "@mui/material";
import AppTextField from "@/components/ui/AppTextField";
import AppButton from "@/components/ui/AppButton";
import AppDialog from "@/components/ui/AppDialog";
import { X, FileText, UploadCloud, Cpu } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { toast } from "sonner";
import {
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from "@/lib/uploadConstants";
import { lightTokens } from "@/theme/tokens";

interface SelectJobModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    jobId: string,
    jobDescription: string,
    roleKey?: string,
    files?: File[],
    jobTitle?: string,
  ) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

const FileCard = memo(function FileCard({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1.5,
        border: `1px solid ${lightTokens.borderSubtle}`,
        borderRadius: 1.5,
        bgcolor: lightTokens.bgBase,
        position: "relative",
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          bgcolor: lightTokens.brandSubtle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FileText size={16} color={lightTokens.brandBase} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatFileSize(file.size)}
        </Typography>
      </Box>
      <IconButton
        size="small"
        onClick={onRemove}
        sx={{
          width: 20,
          height: 20,
          color: "text.secondary",
          flexShrink: 0,
          "&:hover": { color: "error.main" },
        }}
      >
        <X size={13} />
      </IconButton>
    </Box>
  );
});

export default function SelectJobModal({
  open,
  onClose,
  onConfirm,
}: SelectJobModalProps) {
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const oversized: string[] = [];
    const arr = Array.from(incoming).filter((f) => {
      const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "");
      const validType =
        ALLOWED_MIME_TYPES.has(f.type) ||
        ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number]);
      if (!validType) return false;
      if (f.size > MAX_FILE_SIZE_BYTES) {
        oversized.push(f.name);
        return false;
      }
      return true;
    });

    if (oversized.length > 0) {
      toast.error(
        `${oversized.length} file(s) exceed the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit and were skipped.`,
      );
    }

    let skipped = 0;
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const deduped = arr.filter((f) => !existing.has(f.name + f.size));
      const merged = [...prev, ...deduped];
      if (merged.length > MAX_FILES) {
        skipped = merged.length - MAX_FILES;
        return merged.slice(0, MAX_FILES);
      }
      return merged;
    });
    if (skipped > 0) {
      toast.error(
        `Only ${MAX_FILES} files allowed. ${skipped} file${skipped > 1 ? "s" : ""} skipped.`,
      );
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedJobId(null);
    setFiles([]);
    setIsDragging(false);
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (!selectedJob || files.length === 0) return;
    onConfirm(
      selectedJob.id,
      selectedJob.description,
      selectedJob.tags?.[0],
      files,
      selectedJob.title,
    );
    setSelectedJobId(null);
    setFiles([]);
  }, [selectedJob, files, onConfirm]);

  const canConfirm = !!selectedJob && files.length > 0;

  return (
    <AppDialog open={open} onClose={handleClose}>
      {/* Header */}
      <DialogTitle component="div" sx={{ pb: 0.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Upload Resume
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Select a job position and upload candidate resumes for AI
              analysis.
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ mt: -0.5, color: "text.secondary" }}
          >
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Job dropdown */}
        <Typography
          variant="body2"
          fontWeight={600}
          color="text.primary"
          sx={{ mb: 1 }}
        >
          Select Job Position
        </Typography>
        <Autocomplete
          options={jobs}
          loading={jobsLoading}
          getOptionLabel={(option) => option.title}
          value={selectedJob}
          onChange={(_, value) => setSelectedJobId(value?.id ?? null)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          slotProps={{
            popper: { style: { zIndex: 1400 } },
          }}
          renderInput={(params) => (
            <AppTextField
              {...params}
              placeholder="Select a job position..."
              size="small"
              sx={{ mb: 2.5 }}
            />
          )}
          noOptionsText="No active jobs found. Please create a job first."
        />

        {/* Drag-and-drop zone */}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept=".pdf,.docx"
          onChange={handleFileInput}
        />
        <Box
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            border: `2px dashed ${isDragging ? lightTokens.brandBase : lightTokens.borderDefault}`,
            borderRadius: 2,
            py: 4,
            px: 3,
            textAlign: "center",
            cursor: "pointer",
            bgcolor: isDragging ? lightTokens.brandSubtle : lightTokens.bgBase,
            transition: "all 0.15s ease",
            "&:hover": {
              borderColor: lightTokens.brandBase,
              bgcolor: lightTokens.brandSubtle,
            },
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: lightTokens.brandSubtle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1.5,
            }}
          >
            <UploadCloud size={22} color={lightTokens.brandBase} />
          </Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            Drag and drop PDF resumes or click to browse
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: "block" }}
          >
            Accepts PDF, DOCX · Up to {MAX_FILES} files · Max{" "}
            {MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB each
          </Typography>
        </Box>

        {/* Selected files */}
        {files.length > 0 && (
          <Grid container spacing={1} sx={{ mt: 1.5 }}>
            {files.map((file, i) => (
              <Grid size={{ xs: 12, sm: 6 }} key={`${file.name}-${file.size}`}>
                <FileCard file={file} onRemove={() => handleRemoveFile(i)} />
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <AppButton onClick={handleClose} sx={{ color: "text.secondary" }}>
          Cancel
        </AppButton>
        <AppButton
          onClick={handleConfirm}
          variant="contained"
          disabled={!canConfirm}
          startIcon={<Cpu size={16} />}
          sx={{ px: 3 }}
        >
          Analyze All Resumes
        </AppButton>
      </DialogActions>
    </AppDialog>
  );
}
