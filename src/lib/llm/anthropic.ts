import { analyzeResume as claudeAnalyzeResume } from "@/lib/claude";
import type { LLMProvider } from "@/lib/llm";
import type { RoleKey } from "@/constants/roles";
import type { AnalysisResult } from "@/types/analysis";

export class AnthropicProvider implements LLMProvider {
  analyzeResume(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    jobDescription: string,
    role: RoleKey = "generic",
  ): Promise<AnalysisResult> {
    return claudeAnalyzeResume(
      fileBuffer,
      mimeType,
      fileName,
      jobDescription,
      role,
    );
  }
}
