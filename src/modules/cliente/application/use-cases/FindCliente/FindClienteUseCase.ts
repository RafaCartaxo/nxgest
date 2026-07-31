import type { IClienteRepository } from "../../ports/cliente.repository.js"
import type { IContratoCountQuery } from "../../ports/contrato-count.query.js"
import type { IClienteSaldoQuery } from "../../ports/cliente-saldo.query.js"
import { ClienteNotFoundError } from "../../../domain/errors/cliente-not-found.error.js"

export class FindClienteUseCase {
  constructor(
    private readonly repository: IClienteRepository,
    private readonly contratoCountQuery?: IContratoCountQuery,
    private readonly clienteSaldoQuery?: IClienteSaldoQuery
  ) {}

  async execute(userId: string, id: string) {
    const cliente = await this.repository.findById(userId, id)

    if (!cliente) {
      throw new ClienteNotFoundError(id)
    }

    const totalContratos = await this.contratoCountQuery?.countByClienteId(userId, id) ?? 0
    const saldoDevedor = await this.clienteSaldoQuery?.sumByClienteId(userId, id) ?? 0

    return { ...cliente, totalContratos, saldoDevedor }
  }
}
