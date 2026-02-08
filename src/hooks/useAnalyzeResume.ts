import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeCandidateResume } from "@/actions/analyze";
import { toast } from "sonner";

export const useAnalyzeResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await analyzeCandidateResume(formData);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Resume analyzed and saved!");
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });
};
