CREATE TABLE IF NOT EXISTS resume_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  job_description text NOT NULL,
  role_key text NOT NULL DEFAULT 'generic',
  file_name text NOT NULL,
  blob_url text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'done', 'error')),
  candidate_id uuid,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resume_jobs_user_id_idx ON resume_jobs(user_id);

ALTER TABLE resume_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resume_jobs"
  ON resume_jobs
  FOR ALL
  USING (auth.uid() = user_id);
