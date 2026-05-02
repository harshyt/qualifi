import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { ResumeJobStatus } from "@/types/resumeJob";

export interface BatchJob {
  id: string;
  file_name: string;
  status: ResumeJobStatus;
  error_message: string | null;
}

const TERMINAL: ResumeJobStatus[] = ["done", "error"];

export function useBatchJobs(batchId: string) {
  return useQuery<BatchJob[]>({
    queryKey: ["batch-jobs", batchId],
    enabled: !!batchId,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("resume_jobs")
        .select("id, file_name, status, error_message")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as BatchJob[];
    },
    staleTime: 0,
    refetchInterval: (query) => {
      const jobs = query.state.data;
      if (!jobs || jobs.length === 0) return 5_000;
      return jobs.every((j) => TERMINAL.includes(j.status)) ? false : 5_000;
    },
  });
}
