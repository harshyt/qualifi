import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeCandidateResume } from "@/actions/analyze";
import { toast } from "sonner";

export const useAnalyzeResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await analyzeCandidateResume(formData);
      if (result.error) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : JSON.stringify(result.error),
        );
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Resume analysis failed. Please try again.");
    },
  });
};
