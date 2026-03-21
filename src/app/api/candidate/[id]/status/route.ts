import { CandidateStatus } from "@/types/candidate";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const ALLOWED_STATUSES = [CandidateStatus.REJECT, CandidateStatus.SHORTLIST];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // 1. Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { error: "Candidate ID and status are required" },
        { status: 400 },
      );
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

    // 4. Perform update and append .select() to retrieve modified rows
    const { data, error } = await supabase
      .from("candidates")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating candidate status:", error);
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

    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
