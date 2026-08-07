export interface AtualizarModulosInput {
  empresaId: string
  /** Array de módulos (validado pelo grafo de dependências). */
  modulos: unknown
  force?: boolean
  motivo?: unknown
  adminId: string
}
