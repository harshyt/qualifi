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
        { error: "Candidate ID is required" },
        { status: 400 },
      );
    }

    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Auth guard: ensure the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ownership check: only delete candidates belonging to this user
    const { data, error } = await supabase
      .from("candidates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) {
      logger.error("Error deleting candidate", {
        candidateId: id,
        userId: user.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to delete candidate" },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Candidate not found or not authorized to delete" },
        { status: 404 },
      );
    }

    logger.info("Candidate deleted", { candidateId: id, userId: user.id });
    return NextResponse.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    logger.error("Unexpected error in DELETE candidate route", {
      candidateId: id,
      error: String(error),
    });
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
