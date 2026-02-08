import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  console.log({ model });
  const prompt = `
    Act as a Senior Software Engineer. Compare the Resume vs Job Description.
    
    Job Description:
    ${jobDescription}

    Resume:
    ${resumeText}

    Return ONLY JSON (no markdown formatting) with the following structure:
    {
      "score": number (0-100),
      "summary": string (brief executive summary),
      "strengths": string[] (list of key matching strengths),
      "gaps": string[] (list of missing skills or gaps),
      "verdict": "SHORTLIST" | "REJECT" | "PENDING"
    }
  `;

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    // Clean up markdown code blocks if present
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}
