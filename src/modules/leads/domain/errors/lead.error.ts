/** E-mail já existe no domínio operacional (usuário) — trata sem duplicar (LD-15). */
export class LeadEmailJaUsuarioError extends Error {
  constructor() {
    super("Este e-mail já pertence a um cliente do sistema.")
    this.name = "LeadEmailJaUsuarioError"
  }
}

export class LeadNaoEncontradoError extends Error {
  constructor() {
    super("Lead não encontrado.")
    this.name = "LeadNaoEncontradoError"
  }
}

/** Estado não permite a ação (ex.: converter sem confirmação, descartar já convertido). */
export class LeadStatusInvalidoError extends Error {
  constructor() {
    super("Estado do lead não permite esta ação.")
    this.name = "LeadStatusInvalidoError"
  }
}
