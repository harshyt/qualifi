import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { ResumeJob } from '@/types/resumeJob';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('ids') ?? '';
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_REGEX.test(s));

  if (ids.length === 0) {
    return NextResponse.json({ jobs: [] });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: jobs, error } = await supabase
    .from('resume_jobs')
    .select('id, file_name, status, candidate_id, error_message, updated_at')
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: jobs as Partial<ResumeJob>[] });
}
