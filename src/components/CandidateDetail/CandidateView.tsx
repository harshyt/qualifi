"use client";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Divider,
  Grid,
  CircularProgress,
} from "@mui/material";
import { ArrowLeft, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUpdateCandidateStatus } from "@/hooks/useUpdateCandidateStatus";
import { CandidateStatus } from "@/types/candidate";
import { memo } from "react";

interface WorkExperience {
  role: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
}

interface CandidateViewProps {
  candidate: {
    id: string;
    name: string;
    role: string;
    created_at: string;
    analysis: {
      skills: string[];
      workExperience: WorkExperience[];
      education: Education[];
      summary: string;
      strengths: string[];
      gaps: string[];
      experienceLevel?: string;
      technologiesUsed?: { category: string; technologies: string[] }[];
      redFlags?: string[];
      interviewFocusAreas?: string[];
      cultureFitIndicators?: string[];
    };
    resumeText: string;
    score: number;
    status: CandidateStatus;
  };
}

function CandidateView({ candidate }: CandidateViewProps) {
  const router = useRouter();
  const { mutate, isPending } = useUpdateCandidateStatus();

  if (!candidate) return <Typography>Candidate not found</Typography>;

  return (
    <Box
      sx={{
        height: { xs: "auto", md: "calc(100vh - 100px)" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
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
              Applied for {candidate.role}
              {candidate.analysis?.experienceLevel &&
                ` • ${candidate.analysis.experienceLevel} Level`}
              {" • "}
              {new Date(candidate.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        {candidate.status === CandidateStatus.PENDING && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              width: { xs: "100%", sm: "auto" },
              mt: { xs: 1, sm: 0 },
            }}
          >
            <Button
              variant="outlined"
              color="error"
              fullWidth
              startIcon={
                isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <X size={18} />
                )
              }
              disabled={isPending}
              onClick={() =>
                mutate({ id: candidate.id, status: CandidateStatus.REJECT })
              }
            >
              {isPending ? "Updating..." : "Reject"}
            </Button>
            <Button
              variant="contained"
              color="success"
              fullWidth
              startIcon={
                isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Check size={18} />
                )
              }
              sx={{ color: "white" }}
              disabled={isPending}
              onClick={() =>
                mutate({ id: candidate.id, status: CandidateStatus.SHORTLIST })
              }
            >
              {isPending ? "Updating..." : "Shortlist"}
            </Button>
          </Box>
        )}
      </Box>

      <Grid
        container
        spacing={3}
        sx={{ flexGrow: 1, overflow: { xs: "visible", md: "hidden" } }}
      >
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ height: { xs: "auto", md: "100%" } }}
        >
          <Paper
            sx={{
              height: "100%",
              p: 3,
              overflow: { xs: "visible", md: "auto" },
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

            {candidate.analysis?.technologiesUsed &&
              candidate.analysis.technologiesUsed.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, color: "#78909C" }}
                  >
                    TECHNOLOGIES
                  </Typography>
                  {candidate.analysis.technologiesUsed.map((techGroup, i) => (
                    <Box key={i} sx={{ mb: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#546E7A",
                          display: "block",
                          mb: 0.5,
                          fontWeight: 600,
                        }}
                      >
                        {techGroup.category}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {techGroup.technologies.map((tech, j) => (
                          <Chip
                            key={j}
                            label={tech}
                            size="small"
                            sx={{
                              bgcolor: "#E3F2FD",
                              color: "#1565C0",
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

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
                  (exp: WorkExperience, i: number) => (
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
                {candidate.analysis.education.map(
                  (edu: Education, i: number) => (
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
                  ),
                )}
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

        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ height: { xs: "auto", md: "100%" } }}
        >
          <Paper
            sx={{
              height: "100%",
              p: 3,
              overflow: { xs: "visible", md: "auto" },
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
                  fontWeight: 800,
                  fontSize: { xs: "0.9rem", sm: "0.8125rem" },
                  py: { xs: 2.5, sm: 1 },
                  px: { xs: 1, sm: 0 },
                  borderRadius: { xs: 2, sm: 16 },
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

            {candidate.analysis?.redFlags &&
              candidate.analysis.redFlags.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#D32F2F",
                      mb: 1,
                      textTransform: "uppercase",
                      fontSize: 12,
                    }}
                  >
                    Red Flags
                  </Typography>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {candidate.analysis.redFlags.map(
                      (flag: string, i: number) => (
                        <Box
                          component="li"
                          key={i}
                          sx={{ mb: 1, color: "#B71C1C" }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: "#B71C1C", fontWeight: 500 }}
                          >
                            {flag}
                          </Typography>
                        </Box>
                      ),
                    )}
                  </ul>
                </Box>
              )}

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

            {candidate.analysis?.interviewFocusAreas &&
              candidate.analysis.interviewFocusAreas.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#1976D2",
                      mb: 1,
                      textTransform: "uppercase",
                      fontSize: 12,
                    }}
                  >
                    Interview Focus Areas
                  </Typography>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {candidate.analysis.interviewFocusAreas.map(
                      (area: string, i: number) => (
                        <li
                          key={i}
                          style={{ color: "#37474F", marginBottom: 8 }}
                        >
                          {area}
                        </li>
                      ),
                    )}
                  </ul>
                </Box>
              )}

            {candidate.analysis?.cultureFitIndicators &&
              candidate.analysis.cultureFitIndicators.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#F57C00",
                      mb: 1,
                      textTransform: "uppercase",
                      fontSize: 12,
                    }}
                  >
                    Culture Fit Indicators
                  </Typography>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {candidate.analysis.cultureFitIndicators.map(
                      (indicator: string, i: number) => (
                        <li
                          key={i}
                          style={{ color: "#37474F", marginBottom: 8 }}
                        >
                          {indicator}
                        </li>
                      ),
                    )}
                  </ul>
                </Box>
              )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export const MemoizedCandidateView = memo(CandidateView);
