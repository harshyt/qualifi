import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeCandidateResume } from "@/actions/analyze";

export const useAnalyzeResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await analyzeCandidateResume(formData);
      if (result.error) {
        throw new Error(JSON.stringify(result.error));
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
};
