export type JobFieldDiff =
  | { field: "title"; label: "Title"; before: string; after: string }
  | {
      field: "description";
      label: "Description";
      before: string;
      after: string;
    }
  | { field: "client"; label: "Clients"; before: string; after: string }
  | { field: "tags"; label: "Profile"; before: string; after: string };

export interface JobHistoryEntry {
  /** ISO-8601 UTC timestamp */
  changedAt: string;
  /** user_metadata.full_name ?? email */
  changedBy: string;
  /** Only fields that actually changed are included */
  diffs: JobFieldDiff[];
}
