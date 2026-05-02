import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { getActiveBatch } from "@/lib/db/batches";
import type { BulkBatch } from "@/types/bulkBatch";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: batch, error } = await getActiveBatch(supabase, user.id);

  if (error) {
    logger.error("Failed to fetch active batch", { userId: user.id, error: error.message });
    return NextResponse.json({ error: "Failed to fetch active batch" }, { status: 500 });
  }

  logger.info("Active batch fetched", { userId: user.id, batchId: batch?.id ?? null });
  return NextResponse.json({ batch: (batch as BulkBatch | null) ?? null });
}
