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

    // PLAN-083 Fase 1.5: agregados independentes em paralelo (antes em série).
    const [totalContratos, saldoDevedor, financeiro] = await Promise.all([
      this.contratoCountQuery?.countByClienteId(userId, id) ?? Promise.resolve(0),
      this.clienteSaldoQuery?.sumByClienteId(userId, id) ?? Promise.resolve(0),
      this.clienteFinanceiroQuery?.resumoByClienteId(userId, id),
    ])

    return { ...cliente, totalContratos, saldoDevedor, ...financeiro }
  }
}
