"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Drawer,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Plus, X } from "lucide-react";
import AddJobForm from "@/components/Dashboard/AddJobForm";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import DOMPurify from "isomorphic-dompurify";

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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

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
        .select("*")
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
    fetchJobs(); // Refresh the list
  };

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
        <Grid container spacing={3} columns={3} size={{ xs: 12, md: 6, lg: 3 }}>
          {jobs.map((job) => (
            <Card
              sx={{ height: "100%", borderRadius: 2, boxShadow: 1 }}
              key={job.id}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {job.title}
                </Typography>
                {job.client && job.client.length > 0 && (
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                    }}
                  >
                    {job.client.map((c: string) => (
                      <Chip key={c} label={c} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
                <Box
                  sx={{
                    color: "text.secondary",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
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
              </CardContent>
            </Card>
          ))}
        </Grid>
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
    </Box>
  );
}
