"use server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const clientsJson = formData.get("clients") as string;
  const roleKey = formData.get("roleKey") as string;

  const trimmedTitle = title?.trim();
  const trimmedDescription = description?.trim();

  if (!trimmedTitle || !trimmedDescription) {
    return { error: "Missing required fields" };
  }

  if (trimmedTitle.length > 200) {
    return { error: "Job title must be 200 characters or fewer" };
  }

  if (trimmedDescription.length > 50_000) {
    return { error: "Job description must be 50,000 characters or fewer" };
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
        logger.warn("Invalid clients format received, expected string[]", {});
        clients = [];
      }
    }
  } catch {
    logger.warn("Failed to parse clients JSON", {});
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
      title: trimmedTitle,
      description: trimmedDescription,
      client: clients,
      tags,
      user_id: user.id,
    });

    if (dbError) {
      logger.error("DB error inserting job", {
        userId: user.id,
        error: dbError.message,
      });
      return { error: "Failed to save job to database" };
    }

    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    logger.error("createJob server action error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: "Internal Server Error" };
  }
}

export async function updateJob(jobId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const clientsJson = formData.get("clients") as string;
  const roleKey = formData.get("roleKey") as string;

  const trimmedTitle = title?.trim();
  const trimmedDescription = description?.trim();

  if (!trimmedTitle || !trimmedDescription) {
    return { error: "Missing required fields" };
  }

  if (trimmedTitle.length > 200) {
    return { error: "Job title must be 200 characters or fewer" };
  }

  if (trimmedDescription.length > 50_000) {
    return { error: "Job description must be 50,000 characters or fewer" };
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
        logger.warn("Invalid clients format received, expected string[]", {});
        clients = [];
      }
    }
  } catch {
    logger.warn("Failed to parse clients JSON", {});
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
      return { error: "Unauthorized: Only ADMIN users can edit jobs." };
    }

    const { error: dbError } = await supabase
      .from("jobs")
      .update({
        title: trimmedTitle,
        description: trimmedDescription,
        client: clients,
        tags,
      })
      .eq("id", jobId)
      .eq("user_id", user.id);

    if (dbError) {
      logger.error("DB error updating job", {
        userId: user.id,
        jobId,
        error: dbError.message,
      });
      return { error: "Failed to update job in database" };
    }

    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    logger.error("updateJob server action error", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: "Internal Server Error" };
  }
}
