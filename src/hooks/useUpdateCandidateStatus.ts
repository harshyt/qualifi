"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CandidateStatus } from "@/types/candidate";

export const useUpdateCandidateStatus = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: CandidateStatus;
    }) => {
      const response = await fetch(`/api/candidate/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`Candidate marked as ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
