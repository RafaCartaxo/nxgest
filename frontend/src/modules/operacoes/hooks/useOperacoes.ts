import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import {
  listarCobrancasDoDia,
  listarPagamentosHoje,
  registrarVisita,
  type RegistrarVisitaInput,
} from "../services/operacoes.service.js"
import { listGastos } from "../../gasto/services/gasto.service.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"

// PLAN-083 Fase 8.1: fonte única de queries das telas operacionais.
// Query keys compartilhadas → Rota/Cobranças/Atendidos/Dashboard deduplicam os mesmos requests.
export const operacoesKeys = {
  cobrancas: () => ["operacoes", "cobrancas"] as const,
  pagamentosHoje: () => ["operacoes", "pagamentos", "hoje"] as const,
  gastosHoje: () => ["gastos", "hoje"] as const,
}

/** Invalida tudo que um pagamento/visita altera — substitui o `eventBus` operacao:atualizada. */
export function invalidateOperacoes(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["operacoes"] })
  queryClient.invalidateQueries({ queryKey: ["caixa", "status"] })
  queryClient.invalidateQueries({ queryKey: ["gastos", "hoje"] })
}

/** Cobranças do dia (sort por distância opcional via coords — GPS). */
export function useCobrancas(enabled: boolean, getCoords?: () => { lat: number | null; lng: number | null; gpsAtivo: boolean }) {
  return useQuery({
    queryKey: operacoesKeys.cobrancas(),
    queryFn: () => {
      const c = getCoords ? getCoords() : { lat: null, lng: null, gpsAtivo: false }
      return listarCobrancasDoDia(
        c.gpsAtivo && typeof c.lat === "number" ? c.lat : undefined,
        c.gpsAtivo && typeof c.lng === "number" ? c.lng : undefined,
      )
    },
    enabled,
  })
}

export function usePagamentosHoje(enabled: boolean) {
  return useQuery({
    queryKey: operacoesKeys.pagamentosHoje(),
    queryFn: () => listarPagamentosHoje(),
    enabled,
  })
}

/** Total gasto hoje (dashboard). */
export function useGastosHoje(enabled: boolean) {
  return useQuery({
    queryKey: operacoesKeys.gastosHoje(),
    queryFn: async () => {
      const hoje = getLocalDateString(new Date())
      const r = await listGastos({ dataInicio: hoje, dataFim: hoje, limit: 1 })
      return r.totalPeriodo
    },
    enabled,
  })
}

export function useRegistrarVisita() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegistrarVisitaInput) => registrarVisita(input),
    onSuccess: () => invalidateOperacoes(queryClient),
  })
}
