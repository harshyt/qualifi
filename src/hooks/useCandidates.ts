import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Candidate } from "@/components/Dashboard/DashboardTable";

export const useCandidates = () =>
  useQuery<Candidate[]>({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as Candidate[];
    },
  });
