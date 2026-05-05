"use client";
import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  MenuItem,
  Divider,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import SearchField from "@/components/ui/SearchField";
import AppSelect from "@/components/ui/AppSelect";
import AppButton from "@/components/ui/AppButton";
import AppDrawer from "@/components/ui/AppDrawer";
import AppDialog from "@/components/ui/AppDialog";
import DataTable, { type ColumnDef } from "@/components/shared/DataTable";
import {
  Plus,
  X,
  Eye,
  Trash2,
  Briefcase,
  Calendar,
  Users,
  Pencil,
  History,
  MoreHorizontal,
} from "lucide-react";
import dynamic from "next/dynamic";
import AddJobForm from "@/components/Dashboard/AddJobForm";
import { useAuth } from "@/components/Providers/AuthContext";
import { useJobs, type Job } from "@/hooks/useJobs";
import { useQueryClient } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { useDeleteJob } from "@/hooks/useDeleteJob";
import type { JobHistoryEntry } from "@/types/job";
import { lightTokens } from "@/theme/tokens";

const JobHistoryDrawer = dynamic(
  () => import("@/components/Dashboard/JobHistoryDrawer"),
  { ssr: false },
);

const COLUMNS: ColumnDef<Job>[] = [
  {
    id: "title",
    label: "Job Title",
    width: 200,
    cellSx: { maxWidth: 200, whiteSpace: "wrap" },
    render: (row) => (
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
        {row.title}
      </Typography>
    ),
  },
  {
    id: "client",
    label: "Clients",
    width: 110,
    render: (row) =>
      row.client?.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {row.client.map((c) => (
            <Chip key={c} label={c} size="small" variant="outlined" />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.disabled">—</Typography>
      ),
  },
  {
    id: "tags",
    label: "Profile",
    width: 110,
    render: (row) =>
      row.tags?.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {row.tags.map((t) => (
            <Chip key={t} label={t} size="small" variant="outlined" color="secondary" />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.disabled">—</Typography>
      ),
  },
  {
    id: "description",
    label: "Description",
    width: 250,
    cellSx: { maxWidth: 250 },
    render: (row) => (
      <Box
        sx={{
          color: "text.secondary",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          fontSize: 14,
          "& p": { m: 0 },
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(row.description) }}
      />
    ),
  },
  {
    id: "date",
    label: "Created",
    width: 110,
    render: (row) => (
      <Typography variant="body2" color="text.secondary">
        {new Date(row.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Typography>
    ),
  },
  {
    id: "actions",
    label: "Actions",
    align: "center",
    width: 70,
    render: () => null,
  },
];

export default function JobLibraryPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [jobsPage, setJobsPage] = useState(0);
  const [jobsRowsPerPage, setJobsRowsPerPage] = useState(10);

  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: jobsData, isLoading, isFetching, error: queryError } = useJobs({
    page: jobsPage,
    rowsPerPage: jobsRowsPerPage,
  });
  const jobs = useMemo(() => jobsData?.jobs ?? [], [jobsData]);
  const jobsTotal = jobsData?.total ?? 0;
  const loading = authLoading || isLoading;

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

  const handleConfirmDelete = useCallback(() => {
    if (jobToDelete) deleteJob(jobToDelete.id);
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

  const handleMenuOpen = useCallback((e: React.MouseEvent<HTMLElement>, job: Job) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuJob(job);
  }, []);

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
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(s) ||
        job.description.toLowerCase().includes(s) ||
        job.client?.some((c) => c.toLowerCase().includes(s));
      const matchesClient =
        selectedClientFilter === "All" ||
        job.client?.includes(selectedClientFilter);
      return matchesSearch && matchesClient;
    });
  }, [jobs, searchTerm, selectedClientFilter]);

  const columns: ColumnDef<Job>[] = useMemo(
    () =>
      COLUMNS.map((col) =>
        col.id === "actions"
          ? {
              ...col,
              render: (row: Job) => (
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, row)}
                  sx={{ color: "text.secondary" }}
                >
                  <MoreHorizontal size={17} />
                </IconButton>
              ),
            }
          : col,
      ),
    [handleMenuOpen],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 2, sm: 0 },
          mb: 3,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
          >
            Job Library
          </Typography>
          {!loading && (
            <Chip
              label={`${jobsTotal} Total`}
              size="small"
              sx={{ bgcolor: "#EEF2FF", color: "#3B5BDB", fontWeight: 600, fontSize: 12, borderRadius: "12px" }}
            />
          )}
        </Box>
        <AppButton
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setIsDrawerOpen(true)}
        >
          Add New Job
        </AppButton>
      </Box>

      {/* Table card */}
      <Box
        sx={{
          border: "1px solid #E2E8F0",
          borderRadius: 2,
          bgcolor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Filter bar */}
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            borderBottom: "1px solid #E2E8F0",
            flexShrink: 0,
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            overflowX: "auto",
          }}
        >
          <SearchField
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200, flexGrow: 1 }}
          />
          <AppSelect
            label="Client"
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value as string)}
            size="small"
            fullWidth={false}
            formControlSx={{ minWidth: 160 }}
          >
            <MenuItem value="All">All Clients</MenuItem>
            {allClients.map((client) => (
              <MenuItem key={client} value={client}>
                {client}
              </MenuItem>
            ))}
          </AppSelect>
        </Box>

        {/* Error state */}
        {queryError ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error" sx={{ fontWeight: 600 }}>
              Error loading jobs: {queryError.message}
            </Typography>
          </Box>
        ) : (
          <DataTable<Job>
            columns={columns}
            rows={filteredJobs}
            total={jobsTotal}
            page={jobsPage}
            rowsPerPage={jobsRowsPerPage}
            onPageChange={setJobsPage}
            onRowsPerPageChange={(rpp) => { setJobsRowsPerPage(rpp); setJobsPage(0); }}
            loading={loading || isFetching}
            emptyMessage="No jobs found."
            ariaLabel="jobs table"
            onRowClick={handleViewJob}
          />
        )}
      </Box>

      {/* Row context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { elevation: 3, sx: { borderRadius: 2, minWidth: 160 } } }}
      >
        <MenuItem onClick={() => { handleViewJob(menuJob!); handleMenuClose(); }}>
          <ListItemIcon><Eye size={16} color={lightTokens.textSecondary} /></ListItemIcon>
          <ListItemText slotProps={{ primary: { variant: "body2", fontWeight: 500 } }}>View</ListItemText>
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => { setEditingJob(menuJob); setIsDrawerOpen(true); handleMenuClose(); }}>
            <ListItemIcon><Pencil size={16} color={lightTokens.textSecondary} /></ListItemIcon>
            <ListItemText slotProps={{ primary: { variant: "body2", fontWeight: 500 } }}>Edit</ListItemText>
          </MenuItem>
        )}
        {isAdmin && (menuJob?.change_history?.length ?? 0) > 0 && (
          <MenuItem onClick={() => { setHistoryJob(menuJob!); setIsHistoryDrawerOpen(true); handleMenuClose(); }}>
            <ListItemIcon><History size={16} color={lightTokens.textSecondary} /></ListItemIcon>
            <ListItemText slotProps={{ primary: { variant: "body2", fontWeight: 500 } }}>Change History</ListItemText>
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem
            onClick={(e) => { e.stopPropagation(); setJobToDelete(menuJob); setIsDeleteDialogOpen(true); handleMenuClose(); }}
            sx={{ color: lightTokens.dangerBase }}
          >
            <ListItemIcon><Trash2 size={16} color={lightTokens.dangerBase} /></ListItemIcon>
            <ListItemText slotProps={{ primary: { variant: "body2", fontWeight: 500, color: lightTokens.dangerBase } }}>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Create / Edit drawer */}
      <AppDrawer
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setEditingJob(null); }}
        paperSx={{ width: { xs: "100vw", sm: 500 }, height: "100vh", p: 0, gap: 0 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: { xs: 2, sm: 3 },
            pb: 2,
            borderBottom: `1px solid ${lightTokens.borderSubtle}`,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingJob ? "Edit Job" : "Create New Job"}
          </Typography>
          <IconButton onClick={() => { setIsDrawerOpen(false); setEditingJob(null); }}>
            <X size={20} />
          </IconButton>
        </Box>
        {user?.app_metadata?.role !== "ADMIN" ? (
          <Box sx={{ textAlign: "center", p: 4, m: { xs: 2, sm: 3 }, mt: 4, bgcolor: `${lightTokens.dangerBase}10`, border: `1px solid ${lightTokens.dangerBase}40`, borderRadius: 2 }}>
            <Typography variant="body1" color="error" gutterBottom sx={{ fontWeight: 600 }}>Access Denied</Typography>
            <Typography variant="body2" color="text.secondary">You do not have permission to add jobs.</Typography>
          </Box>
        ) : (
          <AddJobForm onSuccess={handleSuccess} initialData={editingJob ?? undefined} />
        )}
      </AppDrawer>

      {/* View drawer */}
      <AppDrawer
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        paperSx={{ width: { xs: "100vw", sm: 600 }, height: "100vh", p: 0, gap: 0 }}
      >
        {selectedJob && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                p: { xs: 2, sm: 3 },
                pb: 2,
                borderBottom: `1px solid ${lightTokens.borderSubtle}`,
                flexShrink: 0,
              }}
            >
              <Box sx={{ flex: 1, mr: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{selectedJob.title}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                  <Calendar size={14} />
                  <Typography variant="body2" color="text.secondary">
                    Created {new Date(selectedJob.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {isAdmin && (
                  <Tooltip title="Edit Job">
                    <IconButton onClick={handleEditJob} size="small">
                      <Pencil size={18} color={lightTokens.textSecondary} />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton onClick={() => setIsViewDrawerOpen(false)}><X size={20} /></IconButton>
              </Box>
            </Box>
            <Box sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto", flexGrow: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Users size={16} color={lightTokens.textSecondary} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: lightTokens.textSecondary, textTransform: "uppercase", fontSize: 12 }}>Clients</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: lightTokens.textSecondary, textTransform: "uppercase", fontSize: 12 }}>Profile</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  {selectedJob.client?.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {selectedJob.client.map((c) => <Chip key={c} label={c} size="small" variant="outlined" />)}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">No clients assigned</Typography>
                  )}
                  {selectedJob.tags?.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {selectedJob.tags.map((t) => <Chip key={t} label={t} size="small" color="secondary" variant="outlined" />)}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">No profile assigned</Typography>
                  )}
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Briefcase size={16} color={lightTokens.textSecondary} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: lightTokens.textSecondary, textTransform: "uppercase", fontSize: 12 }}>Job Description</Typography>
                </Box>
                <Box
                  sx={{ color: "text.primary", lineHeight: 1.8, "& p": { mt: 0, mb: 1.5 }, "& ul, & ol": { pl: 3, mb: 1.5 }, "& li": { mb: 0.5 }, "& h1, & h2, & h3": { fontWeight: 600, mt: 2, mb: 1 }, "& strong": { fontWeight: 600 }, typography: "body1" }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedJob.description) }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </AppDrawer>

      {/* History drawer */}
      <JobHistoryDrawer
        open={isHistoryDrawerOpen}
        onClose={() => { setIsHistoryDrawerOpen(false); setHistoryJob(null); }}
        jobTitle={historyJob?.title ?? ""}
        history={(historyJob?.change_history ?? []) as JobHistoryEntry[]}
      />

      {/* Delete dialog */}
      <AppDialog open={isDeleteDialogOpen} onClose={handleDeleteDialogClose} paperSx={{ p: 1 }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Job?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{jobToDelete?.title}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <AppButton onClick={handleDeleteDialogClose} sx={{ color: "text.secondary" }}>Cancel</AppButton>
          <AppButton onClick={handleConfirmDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Deleting...
              </Box>
            ) : "Delete"}
          </AppButton>
        </DialogActions>
      </AppDialog>
    </Box>
  );
}
