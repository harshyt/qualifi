"use client";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Grid,
  CircularProgress,
  Avatar,
} from "@mui/material";
import AppButton from "@/components/ui/AppButton";
import ScoreRing from "@/components/ui/ScoreRing";
import VerdictBadge from "@/components/ui/VerdictBadge";
import { ArrowLeft, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUpdateCandidateStatus } from "@/hooks/useUpdateCandidateStatus";
import { CandidateStatus } from "@/types/candidate";
import { lightTokens } from "@/theme/tokens";
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

// Deterministic avatar color from name — same palette as CandidateTable
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

const SectionLabel = memo(function SectionLabel({
  children,
  color = "#6B6560",
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
          <AppButton
            startIcon={<ArrowLeft size={18} />}
            onClick={() => router.back()}
            sx={{ color: "text.secondary", minWidth: "auto" }}
          >
            Back
          </AppButton>

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
              <VerdictBadge verdict={candidate.status} size="sm" />
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
            <AppButton
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
            </AppButton>
            <AppButton
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
            </AppButton>
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
                        borderLeft: "2px solid #E8E5E0",
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
                  bgcolor: "#F5F4F2",
                  p: 2,
                  borderRadius: 1.5,
                  border: "1px solid #E8E5E0",
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
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <ScoreRing score={candidate.score} size={88} />
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                >
                  AI Match Score
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {candidate.score >= 75
                    ? "Strong fit"
                    : candidate.score >= 50
                      ? "Moderate fit"
                      : "Low fit"}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Key Strengths */}
            <Box sx={{ mb: 3 }}>
              <SectionLabel color={lightTokens.successBase}>
                Strengths
              </SectionLabel>
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
                <SectionLabel color={lightTokens.warningBase}>
                  Skill Gaps
                </SectionLabel>
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
                  <SectionLabel color={lightTokens.dangerBase}>
                    Red Flags
                  </SectionLabel>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {candidate.analysis.redFlags.map((flag, i) => (
                      <Box component="li" key={i} sx={{ mb: 0.75 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: lightTokens.dangerBase }}
                        >
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
                  <SectionLabel color="primary.main">
                    Interview Focus
                  </SectionLabel>
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
                  <SectionLabel color={lightTokens.warningBase}>
                    Culture Fit
                  </SectionLabel>
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
                                bgcolor: lightTokens.brandSubtle,
                                color: lightTokens.brandBase,
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
                            bgcolor: lightTokens.bgSurfaceAlt,
                            color: lightTokens.textSecondary,
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
