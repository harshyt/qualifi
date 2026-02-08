import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useCandidate = (id: string) => {
  return useQuery({
    queryKey: ["candidate", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!id,
  });
};
