import { CandidateStatus } from "@/types/candidate";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const ALLOWED_STATUSES = [CandidateStatus.REJECT, CandidateStatus.SHORTLIST];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = body;

    // 1. Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { error: "Candidate ID and status are required" },
        { status: 400 },
      );
    }

    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 2. Validate against explicit ALLOWED_STATUSES list
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // 3. Authorization Check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4. Perform update scoped to this user's candidates only
    const { data, error } = await supabase
      .from("candidates")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) {
      logger.error("Error updating candidate status", {
        candidateId: id,
        userId: user.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: "Failed to update candidate status" },
        { status: 500 },
      );
    }

    // 5. Verify the row was actually modified (handles non-existent or blocked-by-RLS entries)
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    logger.info("Candidate status updated", {
      candidateId: id,
      userId: user.id,
      status,
    });
    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    logger.error("Unexpected error in PATCH status route", {
      candidateId: id,
      error: String(error),
    });
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
