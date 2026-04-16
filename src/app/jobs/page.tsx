"use client";
import { useState, useMemo, useCallback } from "react";
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
  Menu,
  ListItemIcon,
  ListItemText,
  Skeleton,
  useTheme,
  useMediaQuery,
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
  Pencil,
  History,
  MoreVertical,
} from "lucide-react";
import dynamic from "next/dynamic";
import AddJobForm from "@/components/Dashboard/AddJobForm";
import { useAuth } from "@/components/Providers/AuthContext";
import { useJobs, type Job } from "@/hooks/useJobs";
import { useQueryClient } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { useDeleteJob } from "@/hooks/useDeleteJob";
import type { JobHistoryEntry } from "@/types/job";

const JobHistoryDrawer = dynamic(
  () => import("@/components/Dashboard/JobHistoryDrawer"),
  { ssr: false },
);

function JobsTableSkeleton() {
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={40}
          sx={{ borderRadius: 1, flexGrow: 1 }}
        />
        <Skeleton
          variant="rounded"
          width={200}
          height={40}
          sx={{ borderRadius: 1 }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#F9FAFB" }}>
            <TableRow>
              <TableCell sx={{ width: "15%" }}>
                <Skeleton variant="text" width={70} />
              </TableCell>
              <TableCell sx={{ width: "10%" }}>
                <Skeleton variant="text" width={50} />
              </TableCell>
              <TableCell sx={{ width: "10%" }}>
                <Skeleton variant="text" width={50} />
              </TableCell>
              <TableCell sx={{ width: "55%" }}>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell sx={{ width: "10%" }} align="right">
                <Skeleton variant="text" width={50} sx={{ ml: "auto" }} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton variant="text" width="80%" />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rounded"
                    width={60}
                    height={24}
                    sx={{ borderRadius: 2 }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rounded"
                    width={70}
                    height={24}
                    sx={{ borderRadius: 2 }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="95%" />
                  <Skeleton variant="text" width="60%" />
                </TableCell>
                <TableCell align="right">
                  <Skeleton
                    variant="circular"
                    width={28}
                    height={28}
                    sx={{ ml: "auto" }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function JobLibraryPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading, error: queryError } = useJobs();
  const loading = authLoading || isLoading;
  const error = queryError?.message || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState("All");

  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyJob, setHistoryJob] = useState<Job | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuJob, setMenuJob] = useState<Job | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob(() => {
    setIsDeleteDialogOpen(false);
    setJobToDelete(null);
  });

  const isAdmin = user?.app_metadata?.role === "ADMIN";

  const handleSuccess = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingJob(null);
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  }, [queryClient]);

  const handleViewJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setIsViewDrawerOpen(true);
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (jobToDelete) {
      deleteJob(jobToDelete.id);
    }
  }, [jobToDelete, deleteJob]);

  const handleDeleteDialogClose = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setJobToDelete(null);
  }, []);

  const handleEditJob = useCallback(() => {
    setEditingJob(selectedJob);
    setIsViewDrawerOpen(false);
    setIsDrawerOpen(true);
  }, [selectedJob]);

  const handleViewHistory = useCallback((job: Job) => {
    setHistoryJob(job);
    setIsHistoryDrawerOpen(true);
  }, []);

  const handleMenuOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>, job: Job) => {
      e.stopPropagation();
      setMenuAnchor(e.currentTarget);
      setMenuJob(job);
    },
    [],
  );

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuJob(null);
  }, []);

  const allClients = useMemo(
    () => Array.from(new Set(jobs.flatMap((job) => job.client || []))).sort(),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
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
  }, [jobs, searchTerm, selectedClientFilter]);
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
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              mb: 1,
            }}
          >
            Job Library
          </Typography>
          <Typography variant="body2" color="text.secondary">
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
        <Box
          sx={{
            p: 3,
            bgcolor: "#FFF1F2",
            border: "1px solid #FECDD3",
            borderRadius: 2,
          }}
        >
          <Typography color="error" sx={{ fontWeight: 600 }}>
            Error loading jobs: {error}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
            Ensure you have run the Supabase migration provided in the plan to
            create the jobs table.
          </Typography>
        </Box>
      ) : loading ? (
        <JobsTableSkeleton />
      ) : jobs.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            p: 6,
            bgcolor: "#F9FAFB",
            border: "1px solid #E2E8F0",
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
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
                  <TableCell sx={{ fontWeight: 600, width: "15%" }}>
                    Job Title
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "10%" }}>
                    Clients
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "10%" }}>
                    Profile
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "55%" }}>
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
                      colSpan={5}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      No jobs match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow
                      key={job.id}
                      hover
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewJob(job);
                      }}
                      sx={{
                        cursor: "pointer",
                      }}
                    >
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
                        {job.tags && job.tags.length > 0 ? (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.5,
                            }}
                          >
                            {job.tags.map((t: string) => (
                              <Chip
                                key={t}
                                label={t}
                                size="small"
                                variant="outlined"
                                color="secondary"
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
                            lineBreak: "anywhere",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(job.description),
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, job)}
                        >
                          <MoreVertical size={18} color="#78909C" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 180, boxShadow: 3 } }}
      >
        <MenuItem
          onClick={() => {
            handleViewJob(menuJob!);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Eye size={16} color="#78909C" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        {isAdmin && (
          <MenuItem
            onClick={() => {
              setEditingJob(menuJob);
              setIsDrawerOpen(true);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <Pencil size={16} color="#78909C" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {isAdmin && (menuJob?.change_history?.length ?? 0) > 0 && (
          <MenuItem
            onClick={() => {
              handleViewHistory(menuJob!);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <History size={16} color="#78909C" />
            </ListItemIcon>
            <ListItemText>Change History</ListItemText>
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem
            onClick={(e) => {
              handleDeleteClick(e, menuJob!);
              handleMenuClose();
            }}
            sx={{ color: "#d32f2f" }}
          >
            <ListItemIcon>
              <Trash2 size={16} color="#d32f2f" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingJob(null);
        }}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 500 },
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            p: 0,
            borderTopLeftRadius: { xs: 16, sm: 0 },
            borderTopRightRadius: { xs: 16, sm: 0 },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: { xs: 2, sm: 3 },
            pb: 2,
            borderBottom: "1px solid #E0E0E0",
            flexShrink: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            {editingJob ? "Edit Job" : "Create New Job"}
          </Typography>
          <IconButton
            onClick={() => {
              setIsDrawerOpen(false);
              setEditingJob(null);
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        {user?.app_metadata?.role !== "ADMIN" ? (
          <Box
            sx={{
              textAlign: "center",
              p: 4,
              m: { xs: 2, sm: 3 },
              mt: 4,
              bgcolor: "#FFF1F2",
              border: "1px solid #FECDD3",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body1"
              color="error"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Access Denied
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You do not have permission to add jobs. Please ask an ADMIN to do
              so.
            </Typography>
          </Box>
        ) : (
          <AddJobForm
            onSuccess={handleSuccess}
            initialData={editingJob ?? undefined}
          />
        )}
      </Drawer>

      <Drawer
        anchor="right"
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 600 },
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            p: 0,
            borderTopLeftRadius: { xs: 16, sm: 0 },
            borderTopRightRadius: { xs: 16, sm: 0 },
          },
        }}
      >
        {selectedJob && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                p: { xs: 2, sm: 3 },
                pb: 2,
                borderBottom: "1px solid #E0E0E0",
                flexShrink: 0,
              }}
            >
              <Box sx={{ flex: 1, mr: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    mb: 0.5,
                  }}
                >
                  {selectedJob.title}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "text.secondary",
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {isAdmin && (
                  <Tooltip title="Edit Job">
                    <IconButton onClick={handleEditJob} size="small">
                      <Pencil size={18} color="#78909C" />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton onClick={() => setIsViewDrawerOpen(false)}>
                  <X size={20} />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto", flexGrow: 1 }}>
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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      margin: "auto",
                      width: "100%",
                    }}
                  >
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
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: "#78909C",
                        textTransform: "uppercase",
                        fontSize: 12,
                      }}
                    >
                      Profile
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "auto",
                    width: "100%",
                  }}
                >
                  {selectedJob.client && selectedJob.client.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {selectedJob.client.map((c: string) => (
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
                      No clients assigned
                    </Typography>
                  )}
                  {selectedJob.tags && selectedJob.tags.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {selectedJob.tags.map((c: string) => (
                        <Chip
                          key={c}
                          label={c}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      No profile assigned
                    </Typography>
                  )}
                </Box>
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
                    color: "text.primary",
                    lineHeight: 1.8,
                    "& p": { mt: 0, mb: 1.5 },
                    "& ul, & ol": { pl: 3, mb: 1.5 },
                    "& li": { mb: 0.5 },
                    "& h1, & h2, & h3": {
                      color: "text.primary",
                      fontWeight: 600,
                      mt: 2,
                      mb: 1,
                    },
                    lineBreak: "anywhere",
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

      <JobHistoryDrawer
        open={isHistoryDrawerOpen}
        onClose={() => {
          setIsHistoryDrawerOpen(false);
          setHistoryJob(null);
        }}
        jobTitle={historyJob?.title ?? ""}
        history={(historyJob?.change_history ?? []) as JobHistoryEntry[]}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        PaperProps={{
          sx: { borderRadius: 3, padding: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "text.primary" }}>
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
            {isDeleting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Deleting...
              </Box>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
