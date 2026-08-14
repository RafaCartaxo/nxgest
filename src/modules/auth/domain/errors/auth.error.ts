export class CredenciaisInvalidasError extends Error {
  constructor() {
    super("E-mail ou senha inválidos.")
    this.name = "CredenciaisInvalidasError"
  }
}

export class EmailDuplicadoError extends Error {
  constructor() {
    super("E-mail já cadastrado.")
    this.name = "EmailDuplicadoError"
  }
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuário não encontrado.")
    this.name = "UsuarioNaoEncontradoError"
  }
}

export class SenhaAtualIncorretaError extends Error {
  constructor() {
    super("Senha atual incorreta.")
    this.name = "SenhaAtualIncorretaError"
  }
}

/** Login de conta convidada (senha não definida) → 403 ACCOUNT_PENDING (PLAN-065). */
export class ContaConvidadaError extends Error {
  constructor() {
    super("Ativação pendente — defina sua senha pelo link recebido no e-mail.")
    this.name = "ContaConvidadaError"
  }
}

/** Login de conta suspensa (N3 — PLAN-075): credencial válida, conta bloqueada. */
export class ContaSuspensaError extends Error {
  constructor() {
    super("Conta suspensa. Fale com o administrador da sua empresa.")
    this.name = "ContaSuspensaError"
  }
}

export class TokenInvalidoError extends Error {
  constructor() {
    super("Token inválido ou já utilizado.")
    this.name = "TokenInvalidoError"
  }
}

export class TokenExpiradoError extends Error {
  constructor() {
    super("Token expirado.")
    this.name = "TokenExpiradoError"
  }
}
