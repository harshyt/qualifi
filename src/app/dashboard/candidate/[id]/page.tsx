"use client";
import CandidateView from "@/components/CandidateDetail/CandidateView";
import { useCandidate } from "@/hooks/useCandidate";
import { useParams } from "next/navigation";
import { CircularProgress, Box, Typography } from "@mui/material";

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: candidate, isLoading, error } = useCandidate(id);

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Typography color="error">
        Error loading candidate: {error.message}
      </Typography>
    );
  if (!candidate) return <Typography>Candidate not found</Typography>;

  return <CandidateView candidate={candidate} />;
}
