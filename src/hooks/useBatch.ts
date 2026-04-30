import { useQuery } from "@tanstack/react-query";
import type { BulkBatch, BulkBatchCounts } from "@/types/bulkBatch";

interface BatchResponse {
  batch: BulkBatch;
  counts: BulkBatchCounts;
}

export function useBatch(batchId: string) {
  return useQuery<BatchResponse>({
    queryKey: ["batch", batchId],
    queryFn: () =>
      fetch(`/api/bulk-batches/${batchId}`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch batch");
        return r.json() as Promise<BatchResponse>;
      }),
    refetchInterval: (query) => {
      const batch = query.state.data?.batch;
      return batch?.status === "done" ? false : 10_000;
    },
    staleTime: 0,
    retry: 1,
  });
}
