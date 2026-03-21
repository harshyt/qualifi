"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Drawer,
  IconButton,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from "@mui/material";
import {
  Plus,
  X,
  Search,
  Eye,
  Trash2,
  Briefcase,
  Calendar,
  Users,
} from "lucide-react";
import AddJobForm from "@/components/Dashboard/AddJobForm";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import DOMPurify from "isomorphic-dompurify";
import { useDeleteJob } from "@/hooks/useDeleteJob";

interface Job {
  id: string;
  title: string;
  description: string;
  client: string[];
  user_id: string;
  created_at: string;
}

export default function JobLibraryPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState("All");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob(() => {
    fetchJobs();
  });

  const isAdmin = user?.app_metadata?.role === "ADMIN";

  useEffect(() => {
    fetchJobs();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("Failed to fetch user:", error.message);
      return;
    }
    if (user) {
      setUser(user);
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, description, client, user_id, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      setJobs(data || []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsDrawerOpen(false);
    fetchJobs();
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setIsViewDrawerOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (jobToDelete) {
      deleteJob(jobToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setJobToDelete(null);
        },
      });
    }
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  const allClients = Array.from(
    new Set(jobs.flatMap((job) => job.client || [])),
  ).sort();

  const filteredJobs = jobs.filter((job) => {
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = job.title.toLowerCase().includes(searchLower);
    const descMatch = job.description.toLowerCase().includes(searchLower);
    const clientMatch = job.client?.some((c) =>
      c.toLowerCase().includes(searchLower),
    );

    const matchesSearch = titleMatch || descMatch || clientMatch;

    const matchesClient =
      selectedClientFilter === "All" ||
      (job.client && job.client.includes(selectedClientFilter));

    return matchesSearch && matchesClient;
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#37474F", mb: 1 }}
          >
            Job Library
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage open positions and job descriptions.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setIsDrawerOpen(true)}
          sx={{
            bgcolor: "#2196F3",
            "&:hover": { bgcolor: "#1976D2" },
            textTransform: "none",
            borderRadius: 2,
            px: 3,
          }}
        >
          Add New Job
        </Button>
      </Box>

      {error ? (
        <Box sx={{ p: 3, bgcolor: "#ffebee", borderRadius: 2 }}>
          <Typography color="error" sx={{ fontWeight: 600 }}>
            Error loading jobs: {error}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
            Ensure you have run the Supabase migration provided in the plan to
            create the jobs table.
          </Typography>
        </Box>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : jobs.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            p: 6,
            bgcolor: "#F9FAFB",
            borderRadius: 2,
            border: "1px dashed #E0E0E0",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No jobs found
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Click the &quot;Add New Job&quot; button to create your first job.
          </Typography>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField
              placeholder="Search jobs..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, bgcolor: "white" }}
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
            <FormControl size="small" sx={{ minWidth: 200, bgcolor: "white" }}>
              <InputLabel>Filter by Client</InputLabel>
              <Select
                value={selectedClientFilter}
                label="Filter by Client"
                onChange={(e) => setSelectedClientFilter(e.target.value)}
              >
                <MenuItem value="All">All Clients</MenuItem>
                {allClients.map((client) => (
                  <MenuItem key={client} value={client}>
                    {client}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer
            component={Paper}
            sx={{ borderRadius: 2, boxShadow: 1 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: "25%" }}>
                    Job Title
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "20%" }}>
                    Clients
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "45%" }}>
                    Description
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, width: "10%" }}
                    align="right"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      No jobs match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {job.title}
                      </TableCell>
                      <TableCell>
                        {job.client && job.client.length > 0 ? (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.5,
                            }}
                          >
                            {job.client.map((c: string) => (
                              <Chip
                                key={c}
                                label={c}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            color: "text.secondary",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            typography: "body2",
                            "& p": { m: 0 },
                          }}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(job.description),
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 0.5,
                          }}
                        >
                          <Tooltip title="View Job">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewJob(job);
                              }}
                            >
                              <Eye size={18} color="#78909C" />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && (
                            <Tooltip title="Delete Job">
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeleteClick(e, job)}
                              >
                                <Trash2 size={18} color="#d32f2f" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 500 }, p: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            pb: 2,
            borderBottom: "1px solid #E0E0E0",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Create New Job
          </Typography>
          <IconButton onClick={() => setIsDrawerOpen(false)}>
            <X size={20} />
          </IconButton>
        </Box>

        {user?.app_metadata?.role !== "ADMIN" ? (
          <Box
            sx={{
              textAlign: "center",
              p: 4,
              mt: 4,
              bgcolor: "#ffebee",
              borderRadius: 2,
              border: "1px solid #ffcdd2",
            }}
          >
            <Typography
              variant="h6"
              color="error"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You do not have permission to add jobs. Please ask an ADMIN to do
              so.
            </Typography>
          </Box>
        ) : (
          <AddJobForm onSuccess={handleSuccess} />
        )}
      </Drawer>

      <Drawer
        anchor="right"
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 600 }, p: 0 },
        }}
      >
        {selectedJob && (
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                p: 3,
                pb: 2,
                borderBottom: "1px solid #E0E0E0",
              }}
            >
              <Box sx={{ flex: 1, mr: 2 }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "#37474F", mb: 0.5 }}
                >
                  {selectedJob.title}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "#78909C",
                  }}
                >
                  <Calendar size={14} />
                  <Typography variant="body2" color="text.secondary">
                    Created{" "}
                    {new Date(selectedJob.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setIsViewDrawerOpen(false)}>
                <X size={20} />
              </IconButton>
            </Box>

            <Box sx={{ p: 3, overflow: "auto", flexGrow: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Users size={16} color="#78909C" />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#78909C",
                      textTransform: "uppercase",
                      fontSize: 12,
                    }}
                  >
                    Clients
                  </Typography>
                </Box>
                {selectedJob.client && selectedJob.client.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {selectedJob.client.map((c: string) => (
                      <Chip
                        key={c}
                        label={c}
                        size="small"
                        sx={{ bgcolor: "#E3F2FD", color: "#1565C0" }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    No clients assigned
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Briefcase size={16} color="#78909C" />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#78909C",
                      textTransform: "uppercase",
                      fontSize: 12,
                    }}
                  >
                    Job Description
                  </Typography>
                </Box>
                <Box
                  sx={{
                    color: "#37474F",
                    lineHeight: 1.8,
                    "& p": { mt: 0, mb: 1.5 },
                    "& ul, & ol": { pl: 3, mb: 1.5 },
                    "& li": { mb: 0.5 },
                    "& h1, & h2, & h3": {
                      color: "#37474F",
                      fontWeight: 600,
                      mt: 2,
                      mb: 1,
                    },
                    "& strong": { fontWeight: 600 },
                    typography: "body1",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedJob.description),
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        PaperProps={{
          sx: { borderRadius: 3, padding: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#37474F" }}>
          Delete Job?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{jobToDelete?.title}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDeleteDialogClose}
            sx={{ color: "#78909C", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
            disabled={isDeleting}
            sx={{ borderRadius: 2, fontWeight: 600, boxShadow: "none" }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
