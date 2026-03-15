"use server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const clientsJson = formData.get("clients") as string;

  if (!title || !description) {
    return { error: "Missing required fields" };
  }

  let clients: string[] = [];
  try {
    if (clientsJson) {
      clients = JSON.parse(clientsJson);
    }
  } catch {
    clients = [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    if (user.user_metadata?.role !== "ADMIN") {
      return { error: "Unauthorized: Only ADMIN users can add jobs." };
    }

    const { error: dbError } = await supabase.from("jobs").insert({
      title,
      description,
      client: clients,
      user_id: user.id,
    });

    if (dbError) {
      console.error("DB Error inserting job:", dbError);
      return { error: "Failed to save job to database" };
    }

    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    console.error("Server Action Error:", error);
    return { error: "Internal Server Error" };
  }
}
