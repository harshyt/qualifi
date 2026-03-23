"use server";
import { extractTextFromPDF } from "@/lib/pdf";
import { analyzeResume } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { RoleKey, ROLE_CONFIGS } from "@/constants/roles";
import { ZodError } from "zod";

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

    const text = await extractTextFromPDF(buffer);
    const rawRoleKey = formData.get("roleKey") as string;
    const isValidRoleKey = Object.keys(ROLE_CONFIGS).includes(rawRoleKey);
    const roleKey: RoleKey = isValidRoleKey
      ? (rawRoleKey as RoleKey)
      : "generic";

    const analysis = await analyzeResume(text, jobDescription, roleKey);

    const { data: candidate, error: dbError } = await supabase
      .from("candidates")
      .insert({
        name: analysis.name,
        email: analysis.email,
        phone: analysis.phone,
        role: analysis.role,
        status: "PENDING",
        score: analysis.score,
        resume_text: text,
        analysis: analysis,
        user_id: user.id,
        job_id: jobId,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB Error inserting candidate:", dbError);
      return { error: "Failed to save candidate to database" };
    }

    return { success: true, analysis, candidate };
  } catch (error) {
    console.error("Analysis Error:", error);

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
