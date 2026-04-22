"use server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import type { JobHistoryEntry, JobFieldDiff } from "@/types/job";

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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateJob(jobId: string, formData: FormData) {
  if (!UUID_REGEX.test(jobId)) {
    return { error: "Invalid job ID" };
  }

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

    // Fetch current row to compute diffs
    const { data: currentJob, error: fetchError } = await supabase
      .from("jobs")
      .select("title, description, client, tags, change_history, user_id")
      .eq("id", jobId)
      .single();

    if (fetchError || !currentJob) {
      logger.error("DB error fetching job for diff", {
        jobId,
        error: fetchError?.message,
      });
      return { error: "Job not found" };
    }

    // Build field diffs
    const arrKey = (a: string[]) => JSON.stringify([...(a ?? [])].sort());

    const diffs: JobFieldDiff[] = [];

    if (currentJob.title !== trimmedTitle) {
      diffs.push({
        field: "title",
        label: "Title",
        before: currentJob.title,
        after: trimmedTitle,
      });
    }
    if (currentJob.description !== trimmedDescription) {
      diffs.push({
        field: "description",
        label: "Description",
        before: currentJob.description,
        after: trimmedDescription,
      });
    }
    if (arrKey(currentJob.client) !== arrKey(clients)) {
      diffs.push({
        field: "client",
        label: "Clients",
        before: (currentJob.client ?? []).join(", ") || "(none)",
        after: clients.join(", ") || "(none)",
      });
    }
    if (arrKey(currentJob.tags) !== arrKey(tags)) {
      diffs.push({
        field: "tags",
        label: "Profile",
        before: (currentJob.tags ?? []).join(", ") || "(none)",
        after: tags.join(", ") || "(none)",
      });
    }

    const existingHistory: JobHistoryEntry[] = Array.isArray(
      currentJob.change_history,
    )
      ? (currentJob.change_history as JobHistoryEntry[])
      : [];

    const updatedHistory: JobHistoryEntry[] =
      diffs.length > 0
        ? [
            {
              changedAt: new Date().toISOString(),
              changedBy:
                (user.user_metadata?.full_name as string | undefined) ??
                user.email ??
                "Unknown",
              diffs,
            },
            ...existingHistory,
          ]
        : existingHistory;

    const { data: updatedRows, error: dbError } = await supabase
      .from("jobs")
      .update({
        title: trimmedTitle,
        description: trimmedDescription,
        client: clients,
        tags,
        change_history: updatedHistory,
      })
      .eq("id", jobId)
      .eq("user_id", user.id)
      .select("id");

    if (dbError) {
      logger.error("DB error updating job", {
        userId: user.id,
        jobId,
        error: dbError.message,
      });
      return { error: "Failed to update job in database" };
    }

    if (!updatedRows || updatedRows.length === 0) {
      logger.error("No rows updated — job not found or not owned", {
        userId: user.id,
        jobId,
      });
      return { error: "Job not found or not owned by user" };
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
