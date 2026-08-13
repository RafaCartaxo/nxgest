export interface CobrancaItem {
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteLat: number | null
  clienteLng: number | null
  clienteLogradouro: string | null
  clienteNumero: string | null
  clienteBairro: string | null
  clienteCidade: string | null
  clienteEstado: string | null
  contratoId: string
  totalPendente: number
  quantidadeParcelas: number
  situacao: "atrasado" | "venceHoje"
  diasEmAtraso: number
  resultadoOperacional: string
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

export interface RegistrarVisitaInput {
  clienteId: string
  contratoId: string
  tipo: "visitado" | "nao_localizado" | "promessa"
  dataPromessa?: string | null
}

export interface RegistrarVisitaOutput {
  id: string
  clienteId: string
  contratoId: string
  tipo: string
  dataPromessa: string | null
  createdAt: string
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

export interface SnapshotAtraso {
  data: string
  clientesAtrasados: number
  contratosAtrasados: number
  valorAtrasado: number
}

export interface IOperacoesRepository {
  listarCobrancasDoDia(userId: string, operadorLat?: number, operadorLng?: number): Promise<CobrancaDoDiaResult>
  listarPagamentosDoDia(userId: string, dataInicio?: string, dataFim?: string): Promise<PagamentoDoDiaItem[]>
  listarParcelasHoje(userId: string): Promise<ParcelaHojeCliente[]>
  listarParcelasSemana(userId: string): Promise<ParcelaHojeCliente[]>
  registrarVisita(userId: string, input: RegistrarVisitaInput): Promise<RegistrarVisitaOutput>
  registrarSnapshotAtraso(userId: string, data?: string): Promise<void>
  listarHistoricoAtrasos(userId: string, dias?: number): Promise<SnapshotAtraso[]>
}
