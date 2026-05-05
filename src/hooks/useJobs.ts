import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/components/Providers/AuthContext";
import type { JobHistoryEntry } from "@/types/job";

export interface Job {
  id: string;
  title: string;
  description: string;
  client: string[];
  user_id: string;
  created_at: string;
  tags: string[];
  change_history: JobHistoryEntry[];
}

interface UseJobsParams {
  page: number;
  rowsPerPage: number;
}

export const useJobs = ({ page, rowsPerPage }: UseJobsParams) => {
  const { user } = useAuth();

  return useQuery<{ jobs: Job[]; total: number }>({
    queryKey: ["jobs", page, rowsPerPage],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await supabase
        .from("jobs")
        .select(
          "id, title, description, client, user_id, created_at, tags, change_history",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);

      return { jobs: (data ?? []) as Job[], total: count ?? 0 };
    },
  });
};
