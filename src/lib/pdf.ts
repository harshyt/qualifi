import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Extracts plain text from a PDF buffer using the Gemini multimodal API.
 * This avoids all Node.js PDF parser compatibility issues with Next.js/Turbopack.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const base64Data = buffer.toString("base64");

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Data,
        mimeType: "application/pdf",
      },
    },
    "Extract all the text from this resume PDF exactly as it appears. Return only the raw extracted text — no commentary, no formatting, no markdown. Preserve names, contact info, job titles, dates, and all content.",
  ]);

  const text = result.response.text();
  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned empty text from PDF");
  }
  return text.trim();
}
