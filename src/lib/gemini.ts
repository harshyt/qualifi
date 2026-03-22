import { GoogleGenerativeAI } from "@google/generative-ai";
import { RoleKey, ROLE_CONFIGS } from "@/constants/roles";

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  throw new Error("GEMINI_API_KEY is required for GoogleGenerativeAI");
}
const genAI = new GoogleGenerativeAI(geminiKey);

function buildPrompt(
  role: RoleKey,
  jobDescription: string,
  resumeText: string,
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
${resumeText}

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
 * Analyzes a resume against a job description.
 * NOTE: `resumeText` and `jobDescription` are untrusted inputs from the user/candidate
 * and pose a direct prompt injection risk. Ensure upstream validation when possible.
 * We apply basic sanitization and truncation below to mitigate extreme payload executions.
 */
export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  role: RoleKey = "generic",
) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // Basic sanitization to minimize injection severity and limit token exhaustion.
  const safeResumeText = resumeText.slice(0, 15000).replace(/```/g, "");
  const safeJobDesc = jobDescription.slice(0, 15000).replace(/```/g, "");

  const prompt = buildPrompt(role, safeJobDesc, safeResumeText);

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}
