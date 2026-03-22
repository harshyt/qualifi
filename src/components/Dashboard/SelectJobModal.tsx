"use client";
import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  Chip,
  InputAdornment,
} from "@mui/material";
import { Search } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";

interface SelectJobModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, jobDescription: string, roleKey?: string) => void;
  fileCount: number;
}

export default function SelectJobModal({
  open,
  onClose,
  onConfirm,
  fileCount,
}: SelectJobModalProps) {
  const { data: jobs = [], isLoading: loading } = useJobs();
  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [],
  );

  const handleJobClick = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
  }, []);

  const handleConfirmClick = useCallback(() => {
    if (selectedJobId) {
      const selectedJob = jobs.find((j) => j.id === selectedJobId);
      if (selectedJob) {
        onConfirm(
          selectedJobId,
          selectedJob.description,
          selectedJob.tags?.[0],
        );
        // Reset selection for next open
        setSelectedJobId(null);
        setSearch("");
      }
    }
  }, [selectedJobId, jobs, onConfirm]);

  const handleClose = useCallback(() => {
    setSelectedJobId(null);
    setSearch("");
    onClose();
  }, [onClose]);

  const filteredJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          job.client?.some((c) =>
            c.toLowerCase().includes(search.toLowerCase()),
          ),
      ),
    [jobs, search],
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div">
        <Typography variant="h6" component="h2" fontWeight={600}>
          Select Job for Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You are uploading {fileCount} resume{fileCount > 1 ? "s" : ""}. Which
          job are they applying for?
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          placeholder="Search jobs or clients..."
          type="text"
          fullWidth
          variant="outlined"
          value={search}
          onChange={handleSearchChange}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="#9e9e9e" />
                </InputAdornment>
              ),
            },
          }}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : filteredJobs.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" p={3}>
            No active jobs found. Please create a job first.
          </Typography>
        ) : (
          <List sx={{ pt: 0, maxHeight: 300, overflow: "auto" }}>
            {filteredJobs.map((job) => (
              <ListItem disableGutters key={job.id}>
                <ListItemButton
                  selected={selectedJobId === job.id}
                  onClick={() => handleJobClick(job.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    border: "1px solid",
                    borderColor:
                      selectedJobId === job.id ? "primary.main" : "transparent",
                    bgcolor:
                      selectedJobId === job.id ? "primary.50" : "transparent",
                  }}
                >
                  <ListItemText
                    primary={job.title}
                    secondaryTypographyProps={{ component: "div" }}
                    secondary={
                      job.client && job.client.length > 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            mt: 0.5,
                            flexWrap: "wrap",
                          }}
                        >
                          {job.client.map((c) => (
                            <Chip
                              key={c}
                              label={c}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: "0.7rem", mr: 0.5 }}
                            />
                          ))}
                          {job.tags && job.tags.length > 0 && (
                            <Chip
                              label={`Role: ${job.tags[0]}`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            No client specified
                          </Typography>
                          {job.tags && job.tags.length > 0 && (
                            <Chip
                              label={`Role: ${job.tags[0]}`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      )
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirmClick}
          variant="contained"
          disabled={!selectedJobId}
        >
          Confirm & Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
