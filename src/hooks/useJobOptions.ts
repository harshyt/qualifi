import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/components/Providers/AuthContext";

export interface JobOption {
  id: string;
  title: string;
}

export const useJobOptions = () => {
  const { user } = useAuth();

  return useQuery<JobOption[]>({
    queryKey: ["job-options"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title")
        .order("title");
      if (error) throw new Error(error.message);
      return (data ?? []) as JobOption[];
    },
  });
};
