import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteJob = (onSuccessCallback?: () => void) => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete job");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Job deleted successfully");
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
