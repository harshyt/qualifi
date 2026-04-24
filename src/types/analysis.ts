import { z } from "zod";

/**
 * Zod schema for the structured analysis result returned by Claude.
 * Used to validate the LLM's JSON output before persisting to the database.
 */
export const analysisResultSchema = z.object({
  name: z.string().default("Unknown"),
  email: z.string().default(""),
  phone: z.string().default(""),
  role: z.string().default("Unknown"),
  workExperience: z
    .array(
      z.object({
        role: z.string(),
        company: z.string(),
        duration: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        year: z.string(),
      }),
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  technologiesUsed: z
    .array(
      z.object({
        category: z.string(),
        technologies: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  experienceLevel: z
    .enum(["Junior", "Mid", "Senior", "Lead", "Unknown"])
    .default("Unknown"),
  score: z.number().min(0).max(100),
  summary: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  interviewFocusAreas: z.array(z.string()).default([]),
  cultureFitIndicators: z.array(z.string()).default([]),
  verdict: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .pipe(z.enum(["SHORTLIST", "REJECT", "PENDING"])),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
