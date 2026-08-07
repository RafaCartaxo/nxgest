/**
 * Port da trilha de mudanças de módulos/capacidades (BR-105).
 * Implementado em `infrastructure/repositories/auditoria-modulos.repository.impl.ts`.
 */
export interface AuditoriaModulosInput {
  empresaId: string
  adminId: string
  tipo: "modulos" | "capacidades"
  /** Valor serializado antes da mudança (`null` = ausente). */
  antes: string | null
  /** Valor serializado depois da mudança (`null` = ausente). */
  depois: string | null
  force: boolean
  motivo?: string | null
}

export interface IAuditoriaModulosWriter {
  registrar(input: AuditoriaModulosInput): Promise<void>
}
