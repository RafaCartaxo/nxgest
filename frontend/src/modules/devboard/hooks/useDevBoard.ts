import { useQuery } from "@tanstack/react-query"
import { listRuns, listPRs, listDependabot } from "../services/devboard.service.js"

export function useRuns(limit = 10) {
  return useQuery({
    queryKey: ["devboard", "runs", limit],
    queryFn: () => listRuns(limit),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function usePRs() {
  return useQuery({
    queryKey: ["devboard", "prs"],
    queryFn: listPRs,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useDependabot() {
  return useQuery({
    queryKey: ["devboard", "dependabot"],
    queryFn: listDependabot,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
