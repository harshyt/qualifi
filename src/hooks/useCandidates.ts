import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/components/Providers/AuthContext";
import type { Candidate } from "@/components/Dashboard/DashboardTable";

export const useCandidates = () => {
  const { user } = useAuth();

  return useQuery<Candidate[]>({
    queryKey: ["candidates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("candidates")
        .select(
          "id, name, role, score, status, created_at, email, job_id, user_id, analysis",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as Candidate[];
    },
  });
};
