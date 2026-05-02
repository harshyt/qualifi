import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { getBatchById } from "@/lib/db/batches";
import { getJobStatusesByBatch } from "@/lib/db/resumeJobs";
import type { BulkBatch, BulkBatchCounts } from "@/types/bulkBatch";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: batch, error: batchError } = await getBatchById(supabase, id, user.id);

  if (batchError || !batch) {
    logger.info("Batch not found or unauthorized", { batchId: id, userId: user.id });
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // Aggregate resume_job status counts for this batch
  const { data: jobs, error: jobsError } = await getJobStatusesByBatch(supabase, id);

  if (jobsError) {
    logger.error("Failed to fetch resume_jobs for batch", { batchId: id, error: jobsError.message });
  }

  const counts: BulkBatchCounts = { done: 0, error: 0, processing: 0, queued: 0 };
  for (const job of jobs ?? []) {
    const s = job.status as keyof BulkBatchCounts;
    if (s in counts) counts[s]++;
  }

  logger.info("Batch status fetched", { batchId: id, status: batch.status, counts });
  return NextResponse.json({ batch: batch as BulkBatch, counts });
}
