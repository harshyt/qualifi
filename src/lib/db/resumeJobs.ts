import type { SupabaseClient } from "@supabase/supabase-js";

export function getResumeJobById(
  supabase: SupabaseClient,
  jobId: string,
  userId: string,
) {
  return supabase
    .from("resume_jobs")
    .select("*, batch_id")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();
}

export function getJobStatusesByBatch(
  supabase: SupabaseClient,
  batchId: string,
) {
  return supabase.from("resume_jobs").select("status").eq("batch_id", batchId);
}

export function countPendingJobsInBatch(
  supabase: SupabaseClient,
  batchId: string,
) {
  return supabase
    .from("resume_jobs")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .in("status", ["queued", "processing"]);
}

export function getResumeJobsByIds(
  supabase: SupabaseClient,
  ids: string[],
  userId: string,
) {
  return supabase
    .from("resume_jobs")
    .select("id, file_name, status, candidate_id, error_message")
    .in("id", ids)
    .eq("user_id", userId);
}
