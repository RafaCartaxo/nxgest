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
