"use server";
import { extractTextFromPDF } from "@/lib/pdf";
import { analyzeResume } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

// This is a simplified action. In a real scenario, you'd upload the file to Supabase Storage first,
// then process it. For this MVP, we process in memory if possible, or assume file is passed as FormData.

export async function analyzeCandidateResume(formData: FormData) {
  const file = formData.get("resume") as File;
  const jobId = formData.get("jobId") as string;

  if (!file || !jobId) {
    return { error: "Missing file or jobId" };
  }

  try {
    // 1. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract Text
    const text = await extractTextFromPDF(buffer);

    // 3. Get Job Description (Mocked or fetched from Supabase)
    // For now, let's use a mock JD if not found, or fetch from DB
    // const { data: job } = await supabase.from('jobs').select('description').eq('id', jobId).single();
    // const jd = job?.description || "Generic Job Description...";
    const jd = "Software Engineer. Requirements: React, Node.js, TypeScript."; // Mock JD

    // 4. Analyze
    const analysis = await analyzeResume(text, jd);

    if (!analysis) {
      return { error: "Analysis failed" };
    }

    // 5. Save results to Supabase
    const { data: candidate, error: dbError } = await supabase
      .from("candidates")
      .insert({
        name: "Candidate (Upload)", // Parsing name from resume is harder without dedicated extraction, using placeholder or filename
        email: "placeholder@example.com", // Parsing email is also complex, using placeholder
        role: "Unknown",
        status: "PENDING",
        score: analysis.score,
        resume_text: text,
        analysis: analysis,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return { error: "Failed to save candidate to database" };
    }

    return { success: true, analysis, candidate };
  } catch (error) {
    console.error("Analysis Action Error:", error);
    return { error: "Internal Server Error" };
  }
}
