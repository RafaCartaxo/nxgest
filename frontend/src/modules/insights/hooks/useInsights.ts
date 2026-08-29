import { useQuery } from "@tanstack/react-query"
import { getResumoInsights, type PeriodoInsight } from "../services/insights.service.js"

export const insightsKeys = {
  resumo: (periodo: PeriodoInsight) => ["insights", "resumo", periodo] as const,
}

/** Resumo de insights — staleTime longo e sem refetch no foco (pool PG, PLAN-080). */
export function useResumoInsights(periodo: PeriodoInsight) {
  return useQuery({
    queryKey: insightsKeys.resumo(periodo),
    queryFn: () => getResumoInsights(periodo),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}