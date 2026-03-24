import { GoogleGenerativeAI } from "@google/generative-ai";
import { RoleKey, ROLE_CONFIGS } from "@/constants/roles";
import { getServerEnv } from "@/lib/env";
import { analysisResultSchema, type AnalysisResult } from "@/types/analysis";
import { logger } from "@/lib/logger";

const genAI = new GoogleGenerativeAI(getServerEnv().GEMINI_API_KEY);

function buildPrompt(role: RoleKey, jobDescription: string): string {
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS["generic"];

  return `
You are a ${config.persona} conducting a thorough resume screening for a ${config.title} position.

Your task is to deeply analyze the candidate's resume against the provided Job Description (JD).
Go beyond keyword matching — infer the candidate's actual experience level, quality of work,
technology depth, and identify any risks or highlights a hiring manager would care about.

---
JOB DESCRIPTION:
${jobDescription}

---
RESUME:
The candidate's resume is provided as an attached PDF. Extract all relevant information directly from it. Do not paraphrase, clean up, or interpret vague entries — preserve details and nuances exactly as written, as these often contain important signals. If a name or text appears in a non-Latin script, transliterate it to the closest Latin equivalent for the JSON output.

---
ROLE-SPECIFIC EVALUATION CRITERIA:
${config.evaluationCriteria}

---
SCORING RUBRIC (0–100):
${config.scoringRubric}

---
VERDICT RULES:
- SHORTLIST: Score >= 70 AND no critical gaps in must-have skills from the JD
- REJECT: Score < 50 OR missing 2+ must-have skills from the JD
- PENDING: Everything else — good potential but needs human review

---
Return ONLY a raw JSON object. No markdown, no code fences, no explanation outside the JSON.
Use this exact structure:

{
  "name": string (candidate's full name),
  "email": string (candidate's email address),
  "phone": string (candidate's phone number, if available, otherwise empty string),
  "role": string (the role they are applying for or their latest role title),
  "workExperience": { "role": string, "company": string, "duration": string, "description": string }[],
  "education": { "degree": string, "institution": string, "year": string }[],
  "skills": string[],
  "technologiesUsed": { "category": string, "technologies": string[] }[],
  "experienceLevel": "Junior" | "Mid" | "Senior" | "Lead" | "Unknown",
  "score": number (0-100),
  "summary": string (2-3 sentence executive summary a hiring manager can read in 10 seconds),
  "strengths": string[] (specific strengths tied to the JD requirements),
  "gaps": string[] (missing skills or experience gaps vs the JD),
  "redFlags": string[] (concerns: e.g. frequent job changes, vague descriptions, inflated claims, unexplained gaps),
  "interviewFocusAreas": string[] (suggested topics or question areas to probe based on this candidate's profile),
  "cultureFitIndicators": string[] (soft skills and collaboration signals observed in the resume),
  "verdict": "SHORTLIST" | "REJECT" | "PENDING"
}
`;
}

/**
 * Analyzes a resume PDF against a job description in a single Gemini multimodal call.
 * The PDF is sent as inline base64 data alongside the analysis prompt, eliminating
 * a separate text-extraction call.
 *
 * NOTE: `jobDescription` is untrusted user input and poses a prompt injection risk.
 * We apply truncation and markdown-delimiter stripping below to mitigate extreme payloads.
 */
export async function analyzeResume(
  pdfBuffer: Buffer,
  jobDescription: string,
  role: RoleKey = "generic",
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // Sanitize the job description to minimize injection severity and limit token exhaustion.
  const safeJobDesc = jobDescription.slice(0, 15000).replace(/```/g, "");

  const prompt = buildPrompt(role, safeJobDesc);
  const base64Data = pdfBuffer.toString("base64");

  let response;
  const t0 = Date.now();
  try {
    response = await model.generateContent([
      { inlineData: { data: base64Data, mimeType: "application/pdf" } },
      prompt,
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Gemini API call failed: ${message}`);
  }
  logger.info("Gemini API call complete", {
    role,
    durationMs: Date.now() - t0,
  });

  const text = response.response.text();
  const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    throw new Error(
      "Gemini returned non-JSON output. The model may have violated the response format.",
    );
  }

  // Validate the AI response against our schema before trusting it
  // ZodError is intentionally uncaught here — analyze.ts handles it specifically
  const validated = analysisResultSchema.parse(parsed);
  return validated;
}
