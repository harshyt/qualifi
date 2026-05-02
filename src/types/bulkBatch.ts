export type BulkBatchStatus = "processing" | "done";

export interface BulkBatch {
  id: string;
  user_id: string;
  job_id: string;
  job_title: string;
  total_files: number;
  status: BulkBatchStatus;
  created_at: string;
}

export interface BulkBatchCounts {
  done: number;
  error: number;
  processing: number;
  queued: number;
}

export interface BatchResponse {
  batch: BulkBatch;
  counts: BulkBatchCounts;
}
