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
