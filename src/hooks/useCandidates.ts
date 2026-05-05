import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useAuth } from "@/components/Providers/AuthContext";
import type { Candidate } from "@/components/candidates/CandidateTable";
import { useEffect } from "react";
import type { FilterTab } from "@/components/candidates/CandidateStatusFilter";

export interface CandidateFilters {
  status: FilterTab;
  roles: string[];
  uploaderIds: string[];
  jobIds: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export const DEFAULT_CANDIDATE_FILTERS: CandidateFilters = {
  status: "ALL",
  roles: [],
  uploaderIds: [],
  jobIds: [],
  dateFrom: null,
  dateTo: null,
};

interface UseCandidatesParams {
  page: number;
  rowsPerPage: number;
  filters?: CandidateFilters;
}

export const useCandidates = ({
  page,
  rowsPerPage,
  filters = DEFAULT_CANDIDATE_FILTERS,
}: UseCandidatesParams) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<{ candidates: Candidate[]; total: number }>({
    queryKey: ["candidates", page, rowsPerPage, filters],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("rowsPerPage", String(rowsPerPage));
      params.set("status", filters.status);
      filters.roles.forEach((r) => params.append("roles", r));
      filters.uploaderIds.forEach((id) => params.append("uploaderIds", id));
      filters.jobIds.forEach((id) => params.append("jobIds", id));
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const res = await fetch(`/api/candidates?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to fetch candidates");
      }
      return res.json() as Promise<{ candidates: Candidate[]; total: number }>;
    },
  });

  // Seed individual candidate cache entries
  useEffect(() => {
    if (query.data) {
      for (const candidate of query.data.candidates) {
        queryClient.setQueryData(["candidate", candidate.id], candidate);
      }
    }
  }, [query.data, queryClient]);

  return query;
};
