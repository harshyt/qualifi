export type ResumeJobStatus = 'queued' | 'processing' | 'done' | 'error';

export interface ResumeJob {
  id: string;
  user_id: string;
  job_id: string;
  file_name: string;
  blob_url: string;
  status: ResumeJobStatus;
  candidate_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
