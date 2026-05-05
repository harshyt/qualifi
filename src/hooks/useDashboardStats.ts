import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/Providers/AuthContext";

export interface MonthlyCount {
  month: string;
  candidates: number;
  jobs: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalCandidates: number;
  totalJobs: number;
  candidatesThisMonth: number;
  jobsThisMonth: number;
  monthlyCounts: MonthlyCount[];
}

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json() as Promise<DashboardStats>;
    },
  });
};
