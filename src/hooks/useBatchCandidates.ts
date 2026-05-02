import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/components/Providers/AuthContext";
import type { Candidate } from "@/components/Dashboard/DashboardTable";
import { CANDIDATE_COLUMNS } from "@/lib/db/candidates";

export function useBatchCandidates(batchId: string) {
  const { user } = useAuth();

  return useQuery<Candidate[]>({
    queryKey: ["batch-candidates", batchId, user?.id],
    enabled: !!user && !!batchId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();

      // Step 1: get candidate_ids for this batch from resume_jobs
      const { data: jobs, error: jobsError } = await supabase
        .from("resume_jobs")
        .select("candidate_id")
        .eq("batch_id", batchId)
        .not("candidate_id", "is", null);

      if (jobsError) throw new Error(jobsError.message);

      const candidateIds = (jobs ?? [])
        .map((j: { candidate_id: string | null }) => j.candidate_id)
        .filter(Boolean) as string[];

      if (candidateIds.length === 0) return [];

      // Step 2: fetch those candidates
      const { data, error } = await supabase
        .from("candidates")
        .select(CANDIDATE_COLUMNS)
        .in("id", candidateIds)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as Candidate[];
    },
  });
}
