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
    ? "The candidate's resume text is provided at the end of this message. Extract all relevant information directly from it. Do not paraphrase, clean up, or interpret vague entries — preserve details and nuances exactly as written, as these often contain important signals. If a name or text appears in a non-Latin script, transliterate it to the closest Latin equivalent for the output."
    : "The candidate's resume is provided as an attached PDF. Extract all relevant information directly from it. Do not paraphrase, clean up, or interpret vague entries — preserve details and nuances exactly as written, as these often contain important signals. If a name or text appears in a non-Latin script, transliterate it to the closest Latin equivalent for the output."
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
CRITICAL: Use the analyze_resume tool to return your structured analysis.
You MUST include all fields, especially:
- verdict (REQUIRED): One of "SHORTLIST", "REJECT", or "PENDING" based on the rules above
- score (REQUIRED): Integer 0-100
All other fields are also required and must be populated from the resume.
`;
}

/**
 * Analyzes a resume against a job description using Claude.
 * - PDF files are sent as inline base64 documents (multimodal).
 * - DOC/DOCX files have text extracted via mammoth, then sent as a text part.
 * - Uses Claude's Tool Use feature for guaranteed structured output.
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

  const tools: Anthropic.Tool[] = [
    {
      name: "analyze_resume",
      description: "Submit the structured resume analysis results",
      input_schema: {
        type: "object" as const,
        properties: {
          name: {
            type: "string",
            description: "Candidate's full name",
          },
          email: {
            type: "string",
            description: "Candidate's email address",
          },
          phone: {
            type: "string",
            description:
              "Candidate's phone number, if available, otherwise empty string",
          },
          role: {
            type: "string",
            description:
              "The role they are applying for or their latest role title",
          },
          workExperience: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string" },
                company: { type: "string" },
                duration: { type: "string" },
                description: { type: "string" },
              },
              required: ["role", "company", "duration", "description"],
            },
            description: "List of work experiences",
          },
          education: {
            type: "array",
            items: {
              type: "object",
              properties: {
                degree: { type: "string" },
                institution: { type: "string" },
                year: { type: "string" },
              },
              required: ["degree", "institution", "year"],
            },
            description: "List of education entries",
          },
          skills: {
            type: "array",
            items: { type: "string" },
            description: "List of skills",
          },
          technologiesUsed: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                technologies: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["category", "technologies"],
            },
            description: "Technologies organized by category",
          },
          experienceLevel: {
            type: "string",
            enum: ["Junior", "Mid", "Senior", "Lead", "Unknown"],
            description: "Overall experience level",
          },
          score: {
            type: "number",
            description: "Candidate score from 0-100",
          },
          summary: {
            type: "string",
            description:
              "2-3 sentence executive summary a hiring manager can read in 10 seconds",
          },
          strengths: {
            type: "array",
            items: { type: "string" },
            description: "Specific strengths tied to the JD requirements",
          },
          gaps: {
            type: "array",
            items: { type: "string" },
            description: "Missing skills or experience gaps vs the JD",
          },
          redFlags: {
            type: "array",
            items: { type: "string" },
            description:
              "Concerns (e.g. frequent job changes, vague descriptions, inflated claims, unexplained gaps)",
          },
          interviewFocusAreas: {
            type: "array",
            items: { type: "string" },
            description:
              "Suggested topics or question areas to probe based on this candidate's profile",
          },
          cultureFitIndicators: {
            type: "array",
            items: { type: "string" },
            description:
              "Soft skills and collaboration signals observed in the resume",
          },
          verdict: {
            type: "string",
            description: "Screening decision (SHORTLIST, REJECT, or PENDING)",
          },
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
      },
    },
  ];

  let response: Anthropic.Message;
  const t0 = Date.now();
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools,
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

  // Extract tool use from response
  const toolUseBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUseBlock) {
    const textContent = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    throw new Error(
      `Claude did not use the analyze_resume tool. Response: ${textContent.slice(0, 200)}`,
    );
  }

  if (toolUseBlock.name !== "analyze_resume") {
    throw new Error(
      `Claude used wrong tool: ${toolUseBlock.name}. Expected: analyze_resume`,
    );
  }

  let parsed: unknown;
  try {
    parsed = toolUseBlock.input;
  } catch (err) {
    logger.error("Tool input extraction failed", {
      error: err instanceof Error ? err.message : String(err),
      toolInput: JSON.stringify(toolUseBlock.input).slice(0, 200),
    });
    throw new Error(
      `Failed to extract tool input: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }

  try {
    const validated = analysisResultSchema.parse(parsed);
    return validated;
  } catch (err) {
    logger.error("Schema validation failed", {
      error: err instanceof Error ? err.message : String(err),
      input: JSON.stringify(parsed).slice(0, 300),
    });
    throw new Error(
      `Claude output failed validation: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}
