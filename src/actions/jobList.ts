"use server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function fetchJobsForSelect() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, client")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching jobs:", error);
      return { error: error.message };
    }

    return { jobs: data };
  } catch (error: unknown) {
    console.error("Error fetching jobs for select:", error);
    return { error: (error as Error).message || "Failed to fetch jobs" };
  }
}
