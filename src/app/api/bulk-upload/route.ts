import { getStorageProvider } from "@/lib/storage";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { ROLE_CONFIGS } from "@/constants/roles";
import type { ResumeJob } from "@/types/resumeJob";
import {
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from "@/lib/uploadConstants";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface FailedUpload {
  name: string;
  reason: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const jobId = formData.get("jobId");
  const jobDescription = formData.get("jobDescription");
  const rawRoleKey = (formData.get("roleKey") as string | null) ?? "generic";
  const roleKey = Object.keys(ROLE_CONFIGS).includes(rawRoleKey)
    ? rawRoleKey
    : "generic";

  if (typeof jobId !== "string" || typeof jobDescription !== "string") {
    return NextResponse.json(
      { error: "jobId and jobDescription are required" },
      { status: 400 },
    );
  }

  if (!UUID_REGEX.test(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const files = formData.getAll("resumes") as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES} files per batch` },
      { status: 400 },
    );
  }

  // Per-file validation: type, MIME, size
  const validationFailures: FailedUpload[] = [];
  const validFiles: File[] = [];
  for (const file of files) {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    if (
      !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])
    ) {
      validationFailures.push({
        name: file.name,
        reason: "Unsupported file type",
      });
      continue;
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      validationFailures.push({
        name: file.name,
        reason: "Unsupported MIME type",
      });
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      validationFailures.push({
        name: file.name,
        reason: `Exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit`,
      });
      continue;
    }
    validFiles.push(file);
  }

  if (validFiles.length === 0) {
    return NextResponse.json(
      { error: "No valid files to upload", failedUploads: validationFailures },
      { status: 400 },
    );
  }

  // Upload valid files in parallel
  const storage = getStorageProvider();
  const uploadResults = await Promise.allSettled(
    validFiles.map(async (file) => {
      const safeName = sanitizeFileName(file.name);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const blobUrl = await storage.upload(
        `resumes/${user.id}/${Date.now()}-${safeName}`,
        fileBuffer,
        file.type,
      );
      return { fileName: file.name, blobUrl };
    }),
  );

  const succeeded = uploadResults
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter(Boolean) as { fileName: string; blobUrl: string }[];

  const blobFailures: FailedUpload[] = uploadResults
    .map((r, i) =>
      r.status === "rejected"
        ? {
            name: validFiles[i].name,
            reason:
              r.reason instanceof Error ? r.reason.message : "Upload failed",
          }
        : null,
    )
    .filter(Boolean) as FailedUpload[];

  const failedUploads: FailedUpload[] = [
    ...validationFailures,
    ...blobFailures,
  ];

  if (succeeded.length === 0) {
    return NextResponse.json(
      { error: "All file uploads failed", failedUploads },
      { status: 500 },
    );
  }

  // Insert resume_jobs rows
  const rows = succeeded.map(({ fileName, blobUrl }) => ({
    user_id: user.id,
    job_id: jobId,
    job_description: jobDescription.slice(0, 15000),
    role_key: roleKey,
    file_name: fileName,
    blob_url: blobUrl,
    status: "queued" as const,
  }));

  const { data: jobs, error: dbError } = await supabase
    .from("resume_jobs")
    .insert(rows)
    .select("id, file_name, status, blob_url");

  if (dbError) {
    logger.error("Failed to insert resume_jobs", {
      userId: user.id,
      error: dbError.message,
    });
    // Clean up files that were successfully uploaded to avoid orphans
    void Promise.allSettled(succeeded.map(({ blobUrl }) => storage.delete(blobUrl)));
    return NextResponse.json(
      { error: "Failed to queue resume jobs" },
      { status: 500 },
    );
  }

  if (failedUploads.length > 0) {
    logger.info("Bulk upload partially failed", {
      userId: user.id,
      queued: jobs.length,
      rejected: failedUploads.length,
    });
  }
  logger.info("Bulk upload queued", { userId: user.id, count: jobs.length });

  return NextResponse.json({
    jobs: jobs as Pick<ResumeJob, "id" | "file_name" | "status">[],
    failedUploads,
  });
}
