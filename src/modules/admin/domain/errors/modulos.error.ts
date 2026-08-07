import type { ImpactoDesativacao } from "../impacto.js"

export class ModulosInvalidosError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ModulosInvalidosError"
  }
}

export class CapacidadesInvalidasError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CapacidadesInvalidasError"
  }
}

export class MotivoObrigatorioError extends Error {
  constructor(message = "Para forçar a desativação informe um motivo (até 200 caracteres).") {
    super(message)
    this.name = "MotivoObrigatorioError"
  }
}

/** Guard BR-105: módulo financeiro com dado em aberto bloqueia sem `force`. */
export class ModuloComDadosEmAbertoError extends Error {
  constructor(public readonly impacto: ImpactoDesativacao) {
    super("Há dados financeiros em aberto nos módulos que seriam desativados. Confirme o impacto ou use force.")
    this.name = "ModuloComDadosEmAbertoError"
  }
}
