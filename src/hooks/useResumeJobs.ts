import { useQuery } from "@tanstack/react-query";
import type { ResumeJob, ResumeJobStatus } from "@/types/resumeJob";

const TERMINAL: ResumeJobStatus[] = ["done", "error"];

async function fetchResumeJobs(ids: string[]): Promise<Partial<ResumeJob>[]> {
  const res = await fetch(`/api/resume-jobs?ids=${ids.join(",")}`);
  if (!res.ok) throw new Error("Failed to fetch job statuses");
  const { jobs } = (await res.json()) as { jobs: Partial<ResumeJob>[] };
  return jobs;
}

export function useResumeJobs(jobIds: string[]) {
  const enabled = jobIds.length > 0;

  return useQuery({
    queryKey: ["resume-jobs", jobIds],
    queryFn: () => fetchResumeJobs(jobIds),
    enabled,
    retry: 1,
    refetchInterval: (query) => {
      if (!query.state.data) return 10000;
      const allDone = query.state.data.every(
        (j) => j.status && TERMINAL.includes(j.status as ResumeJobStatus),
      );
      return allDone ? false : 10000;
    },
    staleTime: 0,
  });
}
