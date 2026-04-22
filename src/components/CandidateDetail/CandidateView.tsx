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
  Avatar,
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
    email: string;
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

// Deterministic avatar color from name — same palette as DashboardTable
const AVATAR_COLORS = [
  { bg: "#EDE9FE", color: "#7C3AED" },
  { bg: "#FCE7F3", color: "#BE185D" },
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#D1FAE5", color: "#065F46" },
  { bg: "#FEF3C7", color: "#92400E" },
  { bg: "#FFE4E6", color: "#BE123C" },
  { bg: "#E0F2FE", color: "#0369A1" },
  { bg: "#F3E8FF", color: "#7E22CE" },
  { bg: "#DCFCE7", color: "#166534" },
  { bg: "#FEF9C3", color: "#854D0E" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStatusStyle(status: CandidateStatus) {
  switch (status) {
    case CandidateStatus.SHORTLIST:
      return { bg: "#F0FDF4", color: "#4CAF50", label: "Shortlisted" };
    case CandidateStatus.REJECT:
      return { bg: "#FFF1F2", color: "#F44336", label: "Rejected" };
    default:
      return { bg: "#FFF7ED", color: "#FF9800", label: "Pending Review" };
  }
}

const ScoreWidget = memo(function ScoreWidget({ score }: { score: number }) {
  let color = "#4CAF50";
  if (score < 50) color = "#F44336";
  else if (score < 75) color = "#FF9800";

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
        <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="5"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{ fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}
          >
            {score}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 10 }}
          >
            /100
          </Typography>
        </Box>
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          AI Match Score
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {score >= 75
            ? "Strong fit"
            : score >= 50
              ? "Moderate fit"
              : "Low fit"}
        </Typography>
      </Box>
    </Box>
  );
});

const SectionLabel = memo(function SectionLabel({
  children,
  color = "#64748B",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        fontWeight: 700,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        fontSize: 11,
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
});

function CandidateView({ candidate }: CandidateViewProps) {
  const router = useRouter();
  const { mutate, isPending } = useUpdateCandidateStatus();

  if (!candidate) return <Typography>Candidate not found</Typography>;

  const { bg: avatarBg, color: avatarColor } = getAvatarColor(candidate.name);
  const statusStyle = getStatusStyle(candidate.status);

  return (
    <Box
      sx={{
        height: { xs: "auto", md: "calc(100vh - 100px)" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
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
        {/* Left: back + avatar + info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<ArrowLeft size={18} />}
            onClick={() => router.back()}
            sx={{ color: "text.secondary", minWidth: "auto" }}
          >
            Back
          </Button>

          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: avatarBg,
              color: avatarColor,
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {getInitials(candidate.name)}
          </Avatar>

          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
              >
                {candidate.name}
              </Typography>
              <Chip
                label={statusStyle.label}
                size="small"
                sx={{
                  bgcolor: statusStyle.bg,
                  color: statusStyle.color,
                  fontWeight: 700,
                  fontSize: 11,
                  border: `1px solid ${statusStyle.color}30`,
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25 }}
            >
              {candidate.role}
              {candidate.analysis?.experienceLevel &&
                ` · ${candidate.analysis.experienceLevel}`}
              {candidate.email && ` · ${candidate.email}`}
            </Typography>
          </Box>
        </Box>

        {/* Right: actions */}
        {candidate.status === CandidateStatus.PENDING && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              width: { xs: "100%", sm: "auto" },
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
                  <X size={16} />
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
                  <Check size={16} />
                )
              }
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

      {/* ── Two-column body ── */}
      <Grid
        container
        spacing={2.5}
        sx={{ flexGrow: 1, overflow: { xs: "visible", md: "hidden" } }}
      >
        {/* Left column: resume details */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ height: { xs: "auto", md: "100%" } }}
        >
          <Paper
            sx={{
              height: "100%",
              p: 3,
              overflow: { xs: "visible", md: "auto" },
            }}
          >
            {/* Executive Summary */}
            {candidate.analysis?.summary && (
              <Box sx={{ mb: 3 }}>
                <SectionLabel>Executive Summary</SectionLabel>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ lineHeight: 1.7 }}
                >
                  {candidate.analysis.summary}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* Work Experience */}
            {candidate.analysis?.workExperience &&
              candidate.analysis.workExperience.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <SectionLabel>Work Experience</SectionLabel>
                  {candidate.analysis.workExperience.map((exp, i) => (
                    <Box
                      key={i}
                      sx={{
                        mb: 2.5,
                        pl: 2,
                        borderLeft: "2px solid #E2E8F0",
                        "&:last-child": { mb: 0 },
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        {exp.role}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {exp.company} · {exp.duration}
                      </Typography>
                      {exp.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {exp.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

            {/* Education */}
            {candidate.analysis?.education &&
              candidate.analysis.education.length > 0 && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Box sx={{ mb: 3 }}>
                    <SectionLabel>Education</SectionLabel>
                    {candidate.analysis.education.map((edu, i) => (
                      <Box key={i} sx={{ mb: 1.5, "&:last-child": { mb: 0 } }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: "text.primary" }}
                        >
                          {edu.degree}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {edu.institution} · {edu.year}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}

            {/* Raw Resume Text */}
            <Divider sx={{ my: 2.5 }} />
            <Box>
              <SectionLabel>Raw Text Extract</SectionLabel>
              <Box
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: "text.secondary",
                  bgcolor: "#F8FAFC",
                  p: 2,
                  borderRadius: 1.5,
                  border: "1px solid #E2E8F0",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {candidate.resumeText || "No resume text available."}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right column: AI analysis */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ height: { xs: "auto", md: "100%" } }}
        >
          <Paper
            sx={{
              height: "100%",
              p: 3,
              overflow: { xs: "visible", md: "auto" },
            }}
          >
            {/* Score widget */}
            <Box sx={{ mb: 3 }}>
              <ScoreWidget score={candidate.score} />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Key Strengths */}
            <Box sx={{ mb: 3 }}>
              <SectionLabel color="#4CAF50">Strengths</SectionLabel>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {candidate.analysis?.strengths &&
                candidate.analysis.strengths.length > 0 ? (
                  candidate.analysis.strengths.map((s, i) => (
                    <Box component="li" key={i} sx={{ mb: 0.75 }}>
                      <Typography variant="body2" color="text.primary">
                        {s}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box component="li">
                    <Typography variant="body2" color="text.secondary">
                      None identified
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Possible Gaps */}
            {candidate.analysis?.gaps && candidate.analysis.gaps.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <SectionLabel color="#FF9800">Skill Gaps</SectionLabel>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {candidate.analysis.gaps.map((gap, i) => (
                    <Box component="li" key={i} sx={{ mb: 0.75 }}>
                      <Typography variant="body2" color="text.primary">
                        {gap}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Red Flags */}
            {candidate.analysis?.redFlags &&
              candidate.analysis.redFlags.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <SectionLabel color="#F44336">Red Flags</SectionLabel>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {candidate.analysis.redFlags.map((flag, i) => (
                      <Box component="li" key={i} sx={{ mb: 0.75 }}>
                        <Typography variant="body2" sx={{ color: "#F44336" }}>
                          {flag}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

            {/* Interview Focus */}
            {candidate.analysis?.interviewFocusAreas &&
              candidate.analysis.interviewFocusAreas.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <SectionLabel color="primary.main">Interview Focus</SectionLabel>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {candidate.analysis.interviewFocusAreas.map((area, i) => (
                      <Box component="li" key={i} sx={{ mb: 0.75 }}>
                        <Typography variant="body2" color="text.primary">
                          {area}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

            {/* Culture Fit */}
            {candidate.analysis?.cultureFitIndicators &&
              candidate.analysis.cultureFitIndicators.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <SectionLabel color="#FF9800">Culture Fit</SectionLabel>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {candidate.analysis.cultureFitIndicators.map(
                      (indicator, i) => (
                        <Box component="li" key={i} sx={{ mb: 0.75 }}>
                          <Typography variant="body2" color="text.primary">
                            {indicator}
                          </Typography>
                        </Box>
                      ),
                    )}
                  </Box>
                </Box>
              )}

            {/* Tech Stack — moved from left column */}
            {candidate.analysis?.technologiesUsed &&
              candidate.analysis.technologiesUsed.length > 0 && (
                <>
                  <Divider sx={{ mb: 3 }} />
                  <Box>
                    <SectionLabel>Tech Stack</SectionLabel>
                    {candidate.analysis.technologiesUsed.map((group, i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: "text.secondary",
                            textTransform: "uppercase",
                            fontSize: 10,
                            letterSpacing: "0.05em",
                            display: "block",
                            mb: 0.75,
                          }}
                        >
                          {group.category}
                        </Typography>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
                        >
                          {group.technologies.map((tech, j) => (
                            <Chip
                              key={j}
                              label={tech}
                              size="small"
                              sx={{
                                bgcolor: "#EFF6FF",
                                color: "#1D4ED8",
                                fontWeight: 500,
                                fontSize: 12,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </>
              )}

            {/* Skills (general) */}
            {candidate.analysis?.skills &&
              candidate.analysis.skills.length > 0 && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Box>
                    <SectionLabel>Skills</SectionLabel>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {candidate.analysis.skills.map((skill, i) => (
                        <Chip
                          key={i}
                          label={skill}
                          size="small"
                          sx={{
                            bgcolor: "#F1F5F9",
                            color: "#475569",
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </>
              )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export const MemoizedCandidateView = memo(CandidateView);
