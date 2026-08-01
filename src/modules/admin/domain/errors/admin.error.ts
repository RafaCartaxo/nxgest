export class OperadorNaoEncontradoError extends Error {
  constructor() {
    super("Operador não encontrado.")
    this.name = "OperadorNaoEncontradoError"
  }
}

export class NaoPodeAutoModificarError extends Error {
  constructor(message = "Você não pode modificar a si mesmo.") {
    super(message)
    this.name = "NaoPodeAutoModificarError"
  }
}

export class NaoPodeAlterarSuperAdminError extends Error {
  constructor() {
    super("Usuários super_admin não podem ser alterados ou removidos pela gestão de operadores.")
    this.name = "NaoPodeAlterarSuperAdminError"
  }
}

export class NaoPodeAtribuirSuperAdminError extends Error {
  constructor() {
    super("Apenas o seed inicial pode criar usuários com role super_admin.")
    this.name = "NaoPodeAtribuirSuperAdminError"
  }
}
