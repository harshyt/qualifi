import {
  GoogleGenerativeAI,
  SchemaType,
  type Part,
} from "@google/generative-ai";
import mammoth from "mammoth";
import type { LLMProvider } from "@/lib/llm";
import type { RoleKey } from "@/constants/roles";
import { ROLE_CONFIGS } from "@/constants/roles";
import { analysisResultSchema, type AnalysisResult } from "@/types/analysis";
import { logger } from "@/lib/logger";

function buildGeminiPrompt(
  role: RoleKey,
  jobDescription: string,
  isTextResume: boolean,
): string {
  const config = ROLE_CONFIGS[role] ?? ROLE_CONFIGS["generic"];
  const today = new Date().toISOString().split("T")[0];

  return `Today's date is ${today}. Use this as the sole reference when evaluating employment dates and tenure durations.

DATE EVALUATION RULES (follow strictly):
- Any end date on or before ${today} is a past date. Do NOT flag it, speculate about it, or treat it as suspicious in any way.
- Only flag an end date if it is strictly after ${today} — that is a genuinely future date.
- Do NOT speculate about when the resume was written. You have no evidence of this.
- Do NOT raise concerns about an end date simply because it is recent.

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
    ? "The candidate's resume text is provided at the end of this message. Extract all relevant information directly from it. Do not paraphrase, clean up, or interpret vague entries — preserve details and nuances exactly as written. If a name or text appears in a non-Latin script, transliterate it to the closest Latin equivalent."
    : "The candidate's resume is provided as an attached PDF. Extract all relevant information directly from it. Do not paraphrase, clean up, or interpret vague entries — preserve details and nuances exactly as written. If a name or text appears in a non-Latin script, transliterate it to the closest Latin equivalent."
}

---
ROLE-SPECIFIC EVALUATION CRITERIA:
${config.evaluationCriteria}

---
SCORING RUBRIC (0–100):
${config.scoringRubric}

---
OUTPUT BREVITY:
Be concise and signal-focused. For strengths and redFlags return only the most impactful items (up to 7 each). For gaps, only list skills explicitly required or strongly expected by the JD (up to 7). For interviewFocusAreas and cultureFitIndicators, be thorough as these are used during the actual interview.

---
RED FLAG SCOPE:
Red flags MUST cover both categories:
1. MANDATORY — Missing required skills: For every skill the JD marks as required/must-have, flag it if completely absent from the resume.
2. Work pattern concerns: frequent unexplained job changes, employment gaps, vague roles, seniority mismatch.

---
VERDICT RULES:
- SHORTLIST: Score >= 70 AND no critical gaps in must-have skills
- REJECT: Score < 50 OR missing 2+ must-have skills
- PENDING: Everything else

---
CRITICAL: Return your complete structured analysis as a JSON object matching the required schema exactly.`;
}

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    email: { type: SchemaType.STRING },
    phone: { type: SchemaType.STRING },
    role: { type: SchemaType.STRING },
    workExperience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          role: { type: SchemaType.STRING },
          company: { type: SchemaType.STRING },
          duration: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
        },
        required: ["role", "company", "duration", "description"],
      },
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          degree: { type: SchemaType.STRING },
          institution: { type: SchemaType.STRING },
          year: { type: SchemaType.STRING },
        },
        required: ["degree", "institution", "year"],
      },
    },
    skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    technologiesUsed: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          technologies: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["category", "technologies"],
      },
    },
    experienceLevel: { type: SchemaType.STRING },
    score: { type: SchemaType.NUMBER },
    summary: { type: SchemaType.STRING },
    strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    gaps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    redFlags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    interviewFocusAreas: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    cultureFitIndicators: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    verdict: { type: SchemaType.STRING },
  },
  required: [
    "name",
    "email",
    "phone",
    "role",
    "workExperience",
    "education",
    "skills",
    "technologiesUsed",
    "experienceLevel",
    "score",
    "summary",
    "strengths",
    "gaps",
    "redFlags",
    "interviewFocusAreas",
    "cultureFitIndicators",
    "verdict",
  ],
};

export class GeminiProvider implements LLMProvider {
  async analyzeResume(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    jobDescription: string,
    role: RoleKey = "generic",
  ): Promise<AnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const safeJobDesc = jobDescription.slice(0, 15000).replace(/```/g, "");
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const isDocx =
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        // @ts-expect-error responseSchema is not in all SDK type defs but is supported
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    let parts: Part[];

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
      const prompt = buildGeminiPrompt(role, safeJobDesc, true);
      parts = [{ text: `${prompt}\n\nRESUME TEXT:\n${safeResumeText}` }];
    } else {
      const prompt = buildGeminiPrompt(role, safeJobDesc, false);
      const base64Data = fileBuffer.toString("base64");
      parts = [
        { inlineData: { mimeType: "application/pdf", data: base64Data } },
        { text: prompt },
      ];
    }

    const t0 = Date.now();
    let responseText: string;
    try {
      const result = await model.generateContent(parts);
      responseText = result.response.text();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini API call failed: ${message}`);
    }
    logger.info("Gemini API call complete", {
      role,
      durationMs: Date.now() - t0,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Gemini returned invalid JSON: ${responseText.slice(0, 200)}`,
      );
    }

    try {
      return analysisResultSchema.parse(parsed);
    } catch (err) {
      logger.error("Gemini output failed schema validation", {
        error: err instanceof Error ? err.message : String(err),
        input: JSON.stringify(parsed).slice(0, 300),
      });
      throw new Error(
        `Gemini output failed validation: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }
}
