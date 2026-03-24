import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 },
      );
    }

    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Check that the user is authenticated and is an ADMIN
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.app_metadata?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Only ADMIN users can delete jobs." },
        { status: 403 },
      );
    }

    // Relying on Database 'ON DELETE SET NULL' cascade rule for efficiency
    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      logger.error("Error deleting job", {
        jobId: id,
        userId: user.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to delete job" },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Job not found or not authorized to delete" },
        { status: 404 },
      );
    }

    logger.info("Job deleted", { jobId: id, userId: user.id });
    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    logger.error("Unexpected error in DELETE job route", {
      jobId: id,
      error: String(error),
    });
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
