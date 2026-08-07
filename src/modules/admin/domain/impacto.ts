import type { ModuleId } from "./modules.js"

/** Impacto de desligar um módulo (guard BR-105). */
export interface ImpactoModuloItem {
  modulo: ModuleId
  /** Contagem principal do módulo (0 = sem dado relevante; caixa usa 0/1). */
  contagem: number
  /** Financeiro com dado pendente → desativação bloqueada (409) sem `force`. */
  bloqueia: boolean
  /** Resumo curto do que existe (exibido na confirmação da UI). */
  detalhe: string
}

export interface ImpactoDesativacao {
  /** Conjunto efetivamente desligado (inclui cascata de dependências). */
  desligados: ModuleId[]
  impacto: ImpactoModuloItem[]
  /** Algum módulo financeiro com dado pendente (bloqueia sem `force`). */
  bloqueado: boolean
}
