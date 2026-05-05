import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/components/Providers/AuthContext";

export const useRoleOptions = () => {
  const { user } = useAuth();

  return useQuery<string[]>({
    queryKey: ["candidate-role-options"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("candidates")
        .select("role")
        .order("role");
      if (error) throw new Error(error.message);
      const unique = Array.from(
        new Set((data ?? []).map((r: { role: string }) => r.role).filter(Boolean)),
      ).sort();
      return unique;
    },
  });
};
