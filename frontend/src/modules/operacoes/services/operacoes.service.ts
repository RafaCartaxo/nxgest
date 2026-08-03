import { apiRequest } from "../../../api/client.js"

export const ResultadoOperacional = {
  PENDENTE: "PENDENTE",
  VISITADO: "VISITADO",
  NAO_ENCONTRADO: "NAO_ENCONTRADO",
  PROMESSA: "PROMESSA",
} as const

export type ResultadoOperacionalType = (typeof ResultadoOperacional)[keyof typeof ResultadoOperacional]

export interface CobrancaItem {
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteLat: number | null
  clienteLng: number | null
  clienteLogradouro: string
  clienteNumero: string | null
  clienteBairro: string | null
  clienteCidade: string | null
  clienteEstado: string | null
  contratoId: string
  totalPendente: number
  quantidadeParcelas: number
  situacao: "atrasado" | "venceHoje"
  resultadoOperacional: ResultadoOperacionalType
  proximaParcela: number
  proximoNumeroParcela: number
  totalParcelasContrato: number
  saldoTotal: number
}

export interface CobrancaDoDiaResult {
  indicadores: {
    aReceberHoje: number
    recebidoHoje: number
    clientesParaCobrar: number
    atrasado: number
    aVencer: number
  }
  cobrancas: CobrancaItem[]
}

export interface PagamentoDoDiaItem {
  pagamentoId: string
  valor: number
  clienteId: string
  clienteNome: string
  contratoId: string
  data: string
  createdAt: string
}

export async function listarCobrancasDoDia(operadorLat?: number, operadorLng?: number): Promise<CobrancaDoDiaResult> {
  const params = new URLSearchParams()
  if (typeof operadorLat === "number" && typeof operadorLng === "number") {
    params.set("sort", "distancia")
    params.set("lat", String(operadorLat))
    params.set("lng", String(operadorLng))
  }
  const qs = params.toString()
  return apiRequest<CobrancaDoDiaResult>("GET", `/operacoes/cobrancas${qs ? `?${qs}` : ""}`)
}

export async function listarPagamentosHoje(dataInicio?: string, dataFim?: string): Promise<PagamentoDoDiaItem[]> {
  const params = new URLSearchParams()
  if (dataInicio) params.set("dataInicio", dataInicio)
  if (dataFim) params.set("dataFim", dataFim)
  const qs = params.toString()
  return apiRequest<PagamentoDoDiaItem[]>("GET", `/operacoes/pagamentos-hoje${qs ? `?${qs}` : ""}`)
}

export interface ParcelaDoDia {
  numero: number
  valorPrevisto: number
  saldoPendente: number
}

export interface ParcelaHojeCliente {
  clienteId: string
  clienteNome: string
  contratoId: string
  parcelas: ParcelaDoDia[]
}

export async function listarParcelasHoje(): Promise<ParcelaHojeCliente[]> {
  return apiRequest<ParcelaHojeCliente[]>("GET", "/operacoes/parcelas-hoje")
}

export async function listarParcelasSemana(): Promise<ParcelaHojeCliente[]> {
  return apiRequest<ParcelaHojeCliente[]>("GET", "/operacoes/parcelas-semana")
}

export interface RegistrarVisitaInput {
  clienteId: string
  contratoId: string
  tipo: "visitado" | "nao_localizado" | "promessa"
  dataPromessa?: string | null
}

export async function registrarVisita(input: RegistrarVisitaInput): Promise<void> {
  await apiRequest("POST", "/operacoes/visitas", input)
}
