import { useQuery } from "@tanstack/react-query";
import type { BulkBatch } from "@/types/bulkBatch";

interface ActiveBatchResponse {
  batch: BulkBatch | null;
}

export function useActiveBatch() {
  return useQuery<ActiveBatchResponse>({
    queryKey: ["active-batch"],
    queryFn: () =>
      fetch("/api/bulk-batches/active").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch active batch");
        return r.json() as Promise<ActiveBatchResponse>;
      }),
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}
