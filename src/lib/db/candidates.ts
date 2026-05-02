// Shared column list for the candidates table — used by useCandidates and useBatchCandidates
export const CANDIDATE_COLUMNS =
  "id, name, role, score, status, created_at, email, job_id, user_id, analysis" as const;
