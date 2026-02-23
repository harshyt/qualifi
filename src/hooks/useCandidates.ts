import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useCandidates = () => {
  return useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown;
    },
  });
};
