import type { ImpactoDesativacao } from "../../domain/impacto.js"
import type { ModuleId } from "../../domain/modules.js"

/**
 * Port do cálculo de impacto de desativação (guard BR-105).
 * Implementado em `infrastructure/queries/impacto-desativacao.query.impl.ts`.
 */
export interface IImpactoDesativacaoQuery {
  /**
   * @param empresaId Empresa-alvo.
   * @param modulosAtuais Conjunto efetivo atual (já normalizado — `null`/legado = todos).
   * @param novosModulos Conjunto solicitado (já validado pelo grafo).
   */
  calcular(empresaId: string, modulosAtuais: ModuleId[], novosModulos: string[]): Promise<ImpactoDesativacao>
}
