-- jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  client text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_history jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_select" ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "jobs_insert" ON jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jobs_update" ON jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "jobs_delete" ON jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Unknown',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'Unknown',
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('SHORTLIST', 'REJECT', 'PENDING')),
  score integer NOT NULL DEFAULT 0,
  resume_text text NOT NULL DEFAULT '',
  analysis jsonb,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS candidates_user_id_idx ON candidates(user_id);
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs(user_id);
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidates_all" ON candidates FOR ALL TO authenticated USING (auth.uid() = user_id);

-- bulk_batches table
CREATE TABLE IF NOT EXISTS bulk_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_title text NOT NULL DEFAULT 'Untitled Job',
  total_files integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'done')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bulk_batches_user_id_idx ON bulk_batches(user_id);
ALTER TABLE bulk_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bulk_batches_all" ON bulk_batches FOR ALL TO authenticated USING (auth.uid() = user_id);

-- resume_jobs table
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
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  error_message text,
  batch_id uuid REFERENCES bulk_batches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resume_jobs_user_id_idx ON resume_jobs(user_id);
CREATE INDEX IF NOT EXISTS resume_jobs_batch_id_idx ON resume_jobs(batch_id);
CREATE INDEX IF NOT EXISTS resume_jobs_user_status_idx ON resume_jobs(user_id, status);
ALTER TABLE resume_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resume_jobs_all" ON resume_jobs FOR ALL TO authenticated USING (auth.uid() = user_id);
