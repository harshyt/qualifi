import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export function getBatchById(
  supabase: SupabaseClient,
  id: string,
  userId: string,
) {
  return supabase
    .from("bulk_batches")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
}

export function getActiveBatch(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("bulk_batches")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "processing")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function flipBatchIfComplete(
  supabase: SupabaseClient,
  batchId: string,
): Promise<void> {
  const { count } = await supabase
    .from("resume_jobs")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .in("status", ["queued", "processing"]);

  if (count === 0) {
    await supabase
      .from("bulk_batches")
      .update({ status: "done" })
      .eq("id", batchId);
    logger.info("Batch marked done", { batchId });
  }
}
