import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Candidate ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("candidates").delete().eq("id", id);

    if (error) {
      console.error("Error deleting candidate:", error);
      return NextResponse.json(
        { error: "Failed to delete candidate" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
