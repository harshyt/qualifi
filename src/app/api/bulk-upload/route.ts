import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { ResumeJob } from '@/types/resumeJob';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const jobId = formData.get('jobId');
  const jobDescription = formData.get('jobDescription');
  const roleKey = (formData.get('roleKey') as string | null) ?? 'generic';

  if (typeof jobId !== 'string' || typeof jobDescription !== 'string') {
    return NextResponse.json({ error: 'jobId and jobDescription are required' }, { status: 400 });
  }

  const files = formData.getAll('resumes') as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }
  if (files.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 files per batch' }, { status: 400 });
  }

  // Upload all files to Vercel Blob in parallel
  const uploadResults = await Promise.allSettled(
    files.map(async (file) => {
      const blob = await put(
        `resumes/${user.id}/${Date.now()}-${file.name}`,
        file,
        { access: 'public' },
      );
      return { fileName: file.name, blobUrl: blob.url };
    }),
  );

  const succeeded = uploadResults
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean) as { fileName: string; blobUrl: string }[];

  const failed = uploadResults
    .map((r, i) => (r.status === 'rejected' ? files[i].name : null))
    .filter(Boolean) as string[];

  if (succeeded.length === 0) {
    return NextResponse.json({ error: 'All file uploads failed' }, { status: 500 });
  }

  // Insert resume_jobs rows
  const rows = succeeded.map(({ fileName, blobUrl }) => ({
    user_id: user.id,
    job_id: jobId,
    job_description: jobDescription.slice(0, 15000),
    role_key: roleKey,
    file_name: fileName,
    blob_url: blobUrl,
    status: 'queued' as const,
  }));

  const { data: jobs, error: dbError } = await supabase
    .from('resume_jobs')
    .insert(rows)
    .select('id, file_name, status, blob_url');

  if (dbError) {
    logger.error('Failed to insert resume_jobs', { userId: user.id, error: dbError.message });
    return NextResponse.json({ error: 'Failed to queue resume jobs' }, { status: 500 });
  }

  logger.info('Bulk upload queued', { userId: user.id, count: jobs.length });

  return NextResponse.json({
    jobs: jobs as Pick<ResumeJob, 'id' | 'file_name' | 'status'>[],
    failedUploads: failed,
  });
}
