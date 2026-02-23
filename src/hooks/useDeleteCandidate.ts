import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/candidate/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete candidate");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Candidate deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
