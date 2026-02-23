"use client";
import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import { ArrowLeft, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
// import { Candidate } from '@/lib/mockData';

interface CandidateViewProps {
  candidate: any; // Using any for flexibility with real Supabase data
}

export default function CandidateView({ candidate }: CandidateViewProps) {
  const router = useRouter();

  if (!candidate) return <Typography>Candidate not found</Typography>;

  return (
    <Box
      sx={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<ArrowLeft size={18} />}
            onClick={() => router.back()}
            sx={{ color: "#78909C" }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#37474F" }}>
              {candidate.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Applied for {candidate.role} •{" "}
              {new Date(candidate.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" color="error" startIcon={<X size={18} />}>
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Check size={18} />}
            sx={{ color: "white" }}
          >
            Shortlist
          </Button>
        </Box>
      </Box>

      {/* Split Screen */}
      <Grid container spacing={3} sx={{ flexGrow: 1, overflow: "hidden" }}>
        {/* Left: Resume */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          <Paper
            sx={{
              height: "100%",
              p: 3,
              overflow: "auto",
              bgcolor: "#FFFFFF",
              border: "1px solid #E0E0E0",
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600, color: "#37474F" }}
            >
              Resume Details
            </Typography>

            {candidate.analysis?.skills && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: "#78909C" }}
                >
                  SKILLS
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {candidate.analysis.skills.map((skill: string, i: number) => (
                    <Chip
                      key={i}
                      label={skill}
                      size="small"
                      sx={{ bgcolor: "#ECEFF1", color: "#455A64" }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {candidate.analysis?.workExperience && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: "#78909C" }}
                >
                  EXPERIENCE
                </Typography>
                {candidate.analysis.workExperience.map(
                  (exp: any, i: number) => (
                    <Box
                      key={i}
                      sx={{ mb: 2, pl: 2, borderLeft: "2px solid #ECEFF1" }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: "#37474F" }}
                      >
                        {exp.role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {exp.company} • {exp.duration}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.5, color: "#546E7A" }}
                      >
                        {exp.description}
                      </Typography>
                    </Box>
                  ),
                )}
              </Box>
            )}

            {candidate.analysis?.education && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: "#78909C" }}
                >
                  EDUCATION
                </Typography>
                {candidate.analysis.education.map((edu: any, i: number) => (
                  <Box key={i} sx={{ mb: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: "#37474F" }}
                    >
                      {edu.degree}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {edu.institution} • {edu.year}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="caption"
              sx={{ color: "#90A4AE", display: "block", mb: 1 }}
            >
              RAW TEXT EXTRACT
            </Typography>
            <Box
              sx={{
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: 12,
                color: "#78909C",
                bgcolor: "#F5F5F5",
                p: 2,
                borderRadius: 1,
              }}
            >
              {candidate.resumeText || "No resume text available."}
            </Box>
          </Paper>
        </Grid>

        {/* Right: Analysis */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          <Paper
            sx={{
              height: "100%",
              p: 3,
              overflow: "auto",
              bgcolor: "#FFFFFF",
              border: "1px solid #E0E0E0",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#37474F" }}
              >
                AI Analysis
              </Typography>
              <Chip
                label={`${candidate.score}/100 Match`}
                sx={{
                  bgcolor:
                    candidate.score >= 75
                      ? "#E8F5E9"
                      : candidate.score >= 50
                        ? "#FFF3E0"
                        : "#FFEBEE",
                  color:
                    candidate.score >= 75
                      ? "#2E7D32"
                      : candidate.score >= 50
                        ? "#E65100"
                        : "#C62828",
                  fontWeight: 700,
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: "#78909C",
                  mb: 1,
                  textTransform: "uppercase",
                  fontSize: 12,
                }}
              >
                Executive Summary
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "#37474F", lineHeight: 1.6 }}
              >
                {candidate.analysis?.summary || "Pending analysis..."}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: "#2E7D32",
                  mb: 1,
                  textTransform: "uppercase",
                  fontSize: 12,
                }}
              >
                Key Strengths
              </Typography>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {candidate.analysis?.strengths.map((str: string, i: number) => (
                  <li key={i} style={{ color: "#37474F", marginBottom: 8 }}>
                    {str}
                  </li>
                )) || <li style={{ color: "#78909C" }}>None identified</li>}
              </ul>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: "#C62828",
                  mb: 1,
                  textTransform: "uppercase",
                  fontSize: 12,
                }}
              >
                Possible Gaps
              </Typography>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {candidate.analysis?.gaps &&
                candidate.analysis.gaps.length > 0 ? (
                  candidate.analysis.gaps.map((gap: string, i: number) => (
                    <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                      <Typography variant="body2">• {gap}</Typography>
                    </Box>
                  ))
                ) : (
                  <li style={{ color: "#78909C" }}>None identified</li>
                )}
              </ul>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
