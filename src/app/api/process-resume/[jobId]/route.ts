import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { analyzeResume } from "@/lib/claude";
import { logger } from "@/lib/logger";
import { getResumeJobById } from "@/lib/db/resumeJobs";
import { flipBatchIfComplete } from "@/lib/db/batches";
import type { RoleKey } from "@/constants/roles";
import { ROLE_CONFIGS } from "@/constants/roles";
import { del, get as blobGet } from "@vercel/blob";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!UUID_REGEX.test(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the resume_job (ownership enforced by RLS)
  const { data: job, error: fetchError } = await getResumeJobById(supabase, jobId, user.id);

  if (fetchError || !job) {
    return NextResponse.json(
      { error: "Resume job not found" },
      { status: 404 },
    );
  }

  if (job.status !== "queued") {
    // Already processing or done — idempotent, return current state
    return NextResponse.json({
      status: job.status,
      candidateId: job.candidate_id,
    });
  }

  // Mark as processing
  await supabase
    .from("resume_jobs")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  try {
    // Download PDF from Vercel Blob (private access requires SDK — plain fetch returns 403)
    const blobResult = await blobGet(job.blob_url, { access: "private" });
    if (!blobResult || blobResult.statusCode !== 200) {
      throw new Error(
        `Failed to fetch blob: ${blobResult?.statusCode ?? "not found"}`,
      );
    }
    const arrayBuffer = await new Response(blobResult.stream).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine mime type from file extension
    const ext = job.file_name.split(".").pop()?.toLowerCase() ?? "pdf";
    const mimeType =
      ext === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf";

    const isValidRoleKey = Object.keys(ROLE_CONFIGS).includes(job.role_key);
    const roleKey: RoleKey = isValidRoleKey
      ? (job.role_key as RoleKey)
      : "generic";

    // Run Claude analysis
    const analysis = await analyzeResume(
      buffer,
      mimeType,
      job.file_name,
      job.job_description,
      roleKey,
    );

    // Insert candidate
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
        analysis,
        user_id: user.id,
        job_id: job.job_id,
      })
      .select("id")
      .single();

    if (dbError) {
      throw new Error(`DB insert failed: ${dbError.message}`);
    }

    // Mark job done + store candidate_id
    await supabase
      .from("resume_jobs")
      .update({
        status: "done",
        candidate_id: candidate.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // Clean up blob (fire-and-forget, don't await)
    del(job.blob_url).catch((err) =>
      logger.error("Blob delete failed", {
        blobUrl: job.blob_url,
        error: String(err),
      }),
    );

    logger.info("Resume job processed", {
      jobId,
      candidateId: candidate.id,
      score: analysis.score,
      verdict: analysis.verdict,
    });

    // Flip batch to done if all jobs in this batch are now terminal
    if (job.batch_id) {
      flipBatchIfComplete(supabase, job.batch_id).catch((err) =>
        logger.error("flipBatch failed", { batchId: job.batch_id, error: String(err) }),
      );
    }

    return NextResponse.json({ status: "done", candidateId: candidate.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Resume job failed", { jobId, error: message });

    await supabase
      .from("resume_jobs")
      .update({
        status: "error",
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // Flip batch to done if all jobs in this batch are now terminal
    if (job.batch_id) {
      flipBatchIfComplete(supabase, job.batch_id).catch((err) =>
        logger.error("flipBatch failed", { batchId: job.batch_id, error: String(err) }),
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
