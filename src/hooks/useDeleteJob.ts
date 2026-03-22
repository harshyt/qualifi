import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteJob = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete job";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            // Keep the default "Failed to delete job" message
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response is empty (204 No Content or zero length)
      if (
        response.status === 204 ||
        response.headers.get("Content-Length") === "0" ||
        !response.body
      ) {
        return null;
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Job deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
