export interface JobFieldDiff {
  field: "title" | "description" | "client" | "tags";
  label: "Title" | "Description" | "Clients" | "Profile";
  before: string;
  after: string;
}

export interface JobHistoryEntry {
  /** ISO-8601 UTC timestamp */
  changedAt: string;
  /** user_metadata.full_name ?? email */
  changedBy: string;
  /** Only fields that actually changed are included */
  diffs: JobFieldDiff[];
}
