import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export interface Job {
  id: string;
  title: string;
  description: string;
  client: string[];
  user_id: string;
  created_at: string;
  tags: string[];
}

export const useJobs = () => {
  return useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, description, client, user_id, created_at, tags")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as Job[];
    },
  });
};
