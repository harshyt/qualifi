import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/components/Providers/AuthContext";
import type { Candidate } from "@/components/Dashboard/DashboardTable";
import { CANDIDATE_COLUMNS } from "@/lib/db/candidates";
import { useEffect } from "react";

export const useCandidates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<Candidate[]>({
    queryKey: ["candidates", user?.id],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("candidates")
        .select(CANDIDATE_COLUMNS)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as Candidate[];
    },
  });

  // Seed individual candidate cache entries from list data
  useEffect(() => {
    if (query.data) {
      for (const candidate of query.data) {
        queryClient.setQueryData(["candidate", candidate.id], candidate);
      }
    }
  }, [query.data, queryClient]);

  return query;
};
