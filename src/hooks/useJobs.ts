import { useQuery } from "@tanstack/react-query";
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

export const useJobs = () => {
  const { user } = useAuth();

  return useQuery<Job[]>({
    queryKey: ["jobs", user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes — jobs change infrequently
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, title, description, client, user_id, created_at, tags, change_history",
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as Job[];
    },
  });
};
