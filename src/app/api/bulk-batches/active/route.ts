import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
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

  const { data: batch, error } = await supabase
    .from("bulk_batches")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "processing")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch active batch", { userId: user.id, error: error.message });
    return NextResponse.json({ error: "Failed to fetch active batch" }, { status: 500 });
  }

  logger.info("Active batch fetched", { userId: user.id, batchId: batch?.id ?? null });
  return NextResponse.json({ batch: (batch as BulkBatch | null) ?? null });
}
