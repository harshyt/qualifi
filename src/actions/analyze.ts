"use server";
import { analyzeResume } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { RoleKey, ROLE_CONFIGS } from "@/constants/roles";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export async function analyzeCandidateResume(formData: FormData) {
  const file = formData.get("resume") as File;
  const jobId = formData.get("jobId") as string;
  const jobDescription = formData.get("jobDescription") as string;

  if (!file || !jobId || !jobDescription) {
    return { error: "Missing file, jobId, or job description" };
  }

  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawRoleKey = formData.get("roleKey") as string;
    const isValidRoleKey = Object.keys(ROLE_CONFIGS).includes(rawRoleKey);
    const roleKey: RoleKey = isValidRoleKey
      ? (rawRoleKey as RoleKey)
      : "generic";

    const analysis = await analyzeResume(buffer, jobDescription, roleKey);

    const { data: candidate, error: dbError } = await supabase
      .from("candidates")
      .insert({
        name: analysis.name,
        email: analysis.email,
        phone: analysis.phone,
        role: analysis.role,
        status: "PENDING",
        score: analysis.score,
        resume_text: "",
        analysis: analysis,
        user_id: user.id,
        job_id: jobId,
      })
      .select()
      .single();

    if (dbError) {
      logger.error("DB error inserting candidate", {
        userId: user.id,
        jobId,
        error: dbError.message,
      });
      return { error: "Failed to save candidate to database" };
    }

    logger.info("Candidate analysis complete", {
      userId: user.id,
      candidateId: candidate.id,
      jobId,
      score: analysis.score,
      verdict: analysis.verdict,
    });

    return { success: true, analysis, candidate };
  } catch (error) {
    logger.error("Analysis error", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof ZodError) {
      return {
        error: "AI returned an invalid response. Please try again.",
      };
    }

    return {
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
}
