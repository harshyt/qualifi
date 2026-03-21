import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Candidate ID and status are required" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("candidates")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating candidate status:", error);
      return NextResponse.json(
        { error: "Failed to update candidate status" },
        { status: 500 },
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
