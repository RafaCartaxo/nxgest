import type { IClienteRepository } from "../../ports/cliente.repository.js"
import type { IContratoCountQuery } from "../../ports/contrato-count.query.js"
import type { IClienteSaldoQuery } from "../../ports/cliente-saldo.query.js"
import type { IClienteFinanceiroQuery } from "../../ports/cliente-financeiro.query.js"
import { ClienteNotFoundError } from "../../../domain/errors/cliente-not-found.error.js"

export class FindClienteUseCase {
  constructor(
    private readonly repository: IClienteRepository,
    private readonly contratoCountQuery?: IContratoCountQuery,
    private readonly clienteSaldoQuery?: IClienteSaldoQuery,
    private readonly clienteFinanceiroQuery?: IClienteFinanceiroQuery
  ) {}

  async execute(userId: string, id: string) {
    const cliente = await this.repository.findById(userId, id)

    if (!cliente) {
      throw new ClienteNotFoundError(id)
    }

    const totalContratos = await this.contratoCountQuery?.countByClienteId(userId, id) ?? 0
    const saldoDevedor = await this.clienteSaldoQuery?.sumByClienteId(userId, id) ?? 0
    const financeiro = await this.clienteFinanceiroQuery?.resumoByClienteId(userId, id)

    return { ...cliente, totalContratos, saldoDevedor, ...financeiro }
  }
}
