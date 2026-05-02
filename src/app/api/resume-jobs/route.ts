import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { getResumeJobsByIds } from "@/lib/db/resumeJobs";
import type { ResumeJob } from "@/types/resumeJob";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_REGEX.test(s));

  if (ids.length === 0) {
    return NextResponse.json({ jobs: [] });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: jobs, error } = await getResumeJobsByIds(supabase, ids, user.id);

  if (error) {
    logger.error("Failed to fetch resume jobs", {
      userId: user.id,
      error: error.message,
    });
    return NextResponse.json(
      { error: "Failed to fetch job statuses" },
      { status: 500 },
    );
  }

  return NextResponse.json({ jobs: jobs as Partial<ResumeJob>[] });
}
