"use server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const clientsJson = formData.get("clients") as string;
  const roleKey = formData.get("roleKey") as string;

  if (!title || !description) {
    return { error: "Missing required fields" };
  }

  let clients: string[] = [];
  const tags: string[] = roleKey ? [roleKey] : [];
  try {
    if (clientsJson) {
      const parsed: unknown = JSON.parse(clientsJson);
      if (
        Array.isArray(parsed) &&
        parsed.every((item: unknown) => typeof item === "string")
      ) {
        clients = parsed as string[];
      } else {
        console.warn(
          "Invalid clients format, expected string[]. Defaulting to [].",
        );
        clients = [];
      }
    }
  } catch {
    console.warn("Failed to parse clients JSON. Defaulting to [].");
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

    if (user.app_metadata?.role !== "ADMIN") {
      return { error: "Unauthorized: Only ADMIN users can add jobs." };
    }

    const { error: dbError } = await supabase.from("jobs").insert({
      title,
      description,
      client: clients,
      tags,
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
