import type { RoleKey } from "@/constants/roles";
import type { AnalysisResult } from "@/types/analysis";
import { AnthropicProvider } from "@/lib/llm/anthropic";
import { GeminiProvider } from "@/lib/llm/gemini";

export interface LLMProvider {
  analyzeResume(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    jobDescription: string,
    role?: RoleKey,
  ): Promise<AnalysisResult>;
}

export function getLLMProvider(): LLMProvider {
  if (process.env.LLM_PROVIDER === "gemini") {
    return new GeminiProvider();
  }
  return new AnthropicProvider();
}
