import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { RoleKey, ROLE_CONFIGS } from "@/constants/roles";
import { getServerEnv } from "@/lib/env";
import { analysisResultSchema, type AnalysisResult } from "@/types/analysis";
import { logger } from "@/lib/logger";

const client = new Anthropic({ apiKey: getServerEnv().ANTHROPIC_API_KEY });

function buildPrompt(
  role: RoleKey,
  jobDescription: string,
  isTextResume: boolean,
): string {
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
${
  isTextResume
    ? "The candidate's resume text is provided at the end of this message. Extract all relevant information directly from it. Do not paraphrase, clean up, or interpret vague entries — preserve details and nuances exactly as written, as these often contain important signals. If a name or text appears in a non-Latin script, transliterate it to the closest Latin equivalent for the JSON output."
    : "The candidate's resume is provided as an attached PDF. Extract all relevant information directly from it. Do not paraphrase, clean up, or interpret vague entries — preserve details and nuances exactly as written, as these often contain important signals. If a name or text appears in a non-Latin script, transliterate it to the closest Latin equivalent for the JSON output."
}

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
 * Analyzes a resume against a job description using Claude.
 * - PDF files are sent as inline base64 documents (multimodal).
 * - DOC/DOCX files have text extracted via mammoth, then sent as a text part.
 *
 * NOTE: `jobDescription` is untrusted user input and poses a prompt injection risk.
 * We apply truncation and markdown-delimiter stripping below to mitigate extreme payloads.
 */
export async function analyzeResume(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  jobDescription: string,
  role: RoleKey = "generic",
): Promise<AnalysisResult> {
  const safeJobDesc = jobDescription.slice(0, 15000).replace(/```/g, "");

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isDocx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx";

  let messages: Anthropic.MessageParam[];

  if (isDocx) {
    const { value: extractedText } = await mammoth.extractRawText({
      buffer: fileBuffer,
    });
    if (!extractedText.trim()) {
      throw new Error(
        "Could not extract text from the uploaded document. The file may be corrupted or image-based.",
      );
    }
    const safeResumeText = extractedText.slice(0, 15000).replace(/```/g, "");
    const prompt = buildPrompt(role, safeJobDesc, true);
    messages = [
      { role: "user", content: `${prompt}\n\nRESUME TEXT:\n${safeResumeText}` },
    ];
  } else {
    const prompt = buildPrompt(role, safeJobDesc, false);
    const base64Data = fileBuffer.toString("base64");
    messages = [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Data,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ];
  }

  let response: Anthropic.Message;
  const t0 = Date.now();
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Claude API call failed: ${message}`);
  }
  logger.info("Claude API call complete", {
    role,
    durationMs: Date.now() - t0,
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!textBlock) {
    throw new Error("Claude returned no text output.");
  }

  const cleanedText = textBlock.text.replace(/```json\n?|\n?```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    throw new Error(
      "Claude returned non-JSON output. The model may have violated the response format.",
    );
  }

  const validated = analysisResultSchema.parse(parsed);
  return validated;
}
