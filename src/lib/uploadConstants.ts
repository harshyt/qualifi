export const MAX_FILES = 20;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;
export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
export const UPLOAD_CONCURRENCY = 5;
export const BLOB_UPLOAD_TIMEOUT_MS = 60_000;
