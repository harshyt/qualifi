import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/Providers/AuthContext";
import type { UserOption } from "@/app/api/users/route";

export type { UserOption };

export const useUsers = () => {
  const { user } = useAuth();

  return useQuery<UserOption[]>({
    queryKey: ["users"],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<UserOption[]>;
    },
  });
};
