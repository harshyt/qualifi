import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncEmails } from "@/actions/email"; // Ensure this action exists and is exported
import { toast } from "sonner";

export const useSyncEmails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await syncEmails();
      if (!result.success) {
        throw new Error(result.error || "Sync failed");
      }
      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Emails synced successfully");
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
};
