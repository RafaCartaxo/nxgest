import { eq, like, sql, count, and, isNull } from "drizzle-orm"
import { db, clientes, contratos } from "../../../../database.js"
import type { Cliente } from "../../domain/cliente.entity.js"
import type {
  IClienteRepository,
  FindAllParams,
  FindAllResult,
} from "../../application/ports/cliente.repository.js"

type ClienteRow = typeof clientes.$inferSelect

function rowToCliente(row: ClienteRow): Cliente {
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.cpf ?? undefined,
    comercio: row.comercio,
    telefone: row.telefone,
    telefoneComercio: row.telefoneComercio ?? undefined,
    endereco: {
      logradouro: row.logradouro,
      numero: row.numero ?? undefined,
      complemento: row.complemento ?? undefined,
      bairro: row.bairro ?? undefined,
      cidade: row.cidade ?? undefined,
      estado: row.estado ?? undefined,
    },
    enderecoComercio: row.comercioLogradouro ? {
      logradouro: row.comercioLogradouro,
      numero: row.comercioNumero ?? undefined,
      bairro: row.comercioBairro ?? undefined,
      cidade: row.comercioCidade ?? undefined,
      estado: row.comercioEstado ?? undefined,
    } : undefined,
    localizacaoComercio:
      row.comercioLat !== null && row.comercioLng !== null
        ? { lat: row.comercioLat, lng: row.comercioLng }
        : null,
    localizacao:
      row.lat !== null && row.lng !== null
        ? { lat: row.lat, lng: row.lng }
        : null,
    foto: row.foto ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}

export class ClienteRepository implements IClienteRepository {
  async save(userId: string, cliente: Cliente): Promise<void> {
    await db.insert(clientes).values({
      userId,
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf ?? null,
      comercio: cliente.comercio,
      telefone: cliente.telefone,
      telefoneComercio: cliente.telefoneComercio ?? null,
      logradouro: cliente.endereco.logradouro,
      numero: cliente.endereco.numero ?? null,
      complemento: cliente.endereco.complemento ?? null,
      bairro: cliente.endereco.bairro ?? null,
      cidade: cliente.endereco.cidade ?? null,
      estado: cliente.endereco.estado ?? null,
      lat: cliente.localizacao?.lat ?? null,
      lng: cliente.localizacao?.lng ?? null,
      comercioLogradouro: cliente.enderecoComercio?.logradouro ?? null,
      comercioNumero: cliente.enderecoComercio?.numero ?? null,
      comercioBairro: cliente.enderecoComercio?.bairro ?? null,
      comercioCidade: cliente.enderecoComercio?.cidade ?? null,
      comercioEstado: cliente.enderecoComercio?.estado ?? null,
      comercioLat: cliente.localizacaoComercio?.lat ?? null,
      comercioLng: cliente.localizacaoComercio?.lng ?? null,
      foto: cliente.foto ?? null,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
      deletedAt: null,
    })
  }

  async findByCpf(userId: string, cpf: string): Promise<Cliente | null> {
    const rows = await db
      .select()
      .from(clientes)
      .where(and(eq(clientes.userId, userId), eq(clientes.cpf, cpf), isNull(clientes.deletedAt)))
      .limit(1)
    if (rows.length === 0) return null
    return rowToCliente(rows[0])
  }

  async findById(userId: string, id: string): Promise<Cliente | null> {
    const rows = await db
      .select()
      .from(clientes)
      .where(and(eq(clientes.userId, userId), eq(clientes.id, id), isNull(clientes.deletedAt)))
      .limit(1)

    if (rows.length === 0) return null

    return rowToCliente(rows[0])
  }

  async findAll(userId: string, params: FindAllParams): Promise<FindAllResult> {
    const conditions = [sql`${clientes.deletedAt} IS NULL`, eq(clientes.userId, userId)]

    if (params.nome) {
      conditions.push(sql`${clientes.nome} ILIKE ${`%${params.nome}%`}`)
    }

    const where = sql.join(conditions, sql` AND `)

    const totalResult = await db
      .select({ total: count() })
      .from(clientes)
      .where(where)

    const total = totalResult[0].total

    const offset = (params.page - 1) * params.limit

    const orderColumn =
      params.sort in clientes
        ? clientes[params.sort as keyof typeof clientes]
        : clientes.createdAt

    const rows = await db
      .select()
      .from(clientes)
      .where(where)
      .orderBy(params.order === "desc" ? sql`${orderColumn} DESC` : sql`${orderColumn} ASC`)
      .limit(params.limit)
      .offset(offset)

    return {
      data: rows.map(rowToCliente),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    }
  }

  async update(userId: string, id: string, data: Partial<Cliente>): Promise<Cliente | null> {
    const existing = await this.findById(userId, id)
    if (!existing) return null

    const updateData: Record<string, unknown> = {}

    if (data.nome !== undefined) updateData.nome = data.nome
    if (data.cpf !== undefined) updateData.cpf = data.cpf ?? null
    if (data.comercio !== undefined) updateData.comercio = data.comercio
    if (data.telefone !== undefined) updateData.telefone = data.telefone
    if (data.telefoneComercio !== undefined) updateData.telefoneComercio = data.telefoneComercio ?? null
    if (data.endereco !== undefined) {
      if (data.endereco.logradouro !== undefined) updateData.logradouro = data.endereco.logradouro
      if (data.endereco.numero !== undefined) updateData.numero = data.endereco.numero ?? null
      if (data.endereco.complemento !== undefined) updateData.complemento = data.endereco.complemento
      if (data.endereco.bairro !== undefined) updateData.bairro = data.endereco.bairro ?? null
      if (data.endereco.cidade !== undefined) updateData.cidade = data.endereco.cidade
      if (data.endereco.estado !== undefined) updateData.estado = data.endereco.estado
    }
    if (data.enderecoComercio !== undefined) {
      if (data.enderecoComercio === null) {
        updateData.comercioLogradouro = null
        updateData.comercioNumero = null
        updateData.comercioBairro = null
        updateData.comercioCidade = null
        updateData.comercioEstado = null
      } else {
        if (data.enderecoComercio.logradouro !== undefined) updateData.comercioLogradouro = data.enderecoComercio.logradouro
        if (data.enderecoComercio.numero !== undefined) updateData.comercioNumero = data.enderecoComercio.numero ?? null
        if (data.enderecoComercio.bairro !== undefined) updateData.comercioBairro = data.enderecoComercio.bairro ?? null
        if (data.enderecoComercio.cidade !== undefined) updateData.comercioCidade = data.enderecoComercio.cidade
        if (data.enderecoComercio.estado !== undefined) updateData.comercioEstado = data.enderecoComercio.estado
      }
    }
    if (data.localizacao !== undefined) {
      if (data.localizacao === null) {
        updateData.lat = null
        updateData.lng = null
      } else {
        updateData.lat = data.localizacao.lat
        updateData.lng = data.localizacao.lng
      }
    }
    if (data.foto !== undefined) updateData.foto = data.foto ?? null
    if (data.localizacaoComercio !== undefined) {
      if (data.localizacaoComercio === null) {
        updateData.comercioLat = null
        updateData.comercioLng = null
      } else {
        updateData.comercioLat = data.localizacaoComercio.lat
        updateData.comercioLng = data.localizacaoComercio.lng
      }
    }
    if (data.updatedAt !== undefined) updateData.updatedAt = data.updatedAt

    if (Object.keys(updateData).length === 0) {
      return existing
    }

    await db.update(clientes).set(updateData).where(and(eq(clientes.userId, userId), eq(clientes.id, id)))

    return this.findById(userId, id)
  }

  async softDelete(userId: string, id: string): Promise<void> {
    await db
      .update(clientes)
      .set({
        deletedAt: new Date().toISOString(),
      })
      .where(and(eq(clientes.userId, userId), eq(clientes.id, id)))
  }

  async hasActiveContracts(userId: string, clienteId: string): Promise<boolean> {
    const rows = await db
      .select({ total: count() })
      .from(contratos)
      .where(
        and(
          eq(contratos.userId, userId),
          eq(contratos.clienteId, clienteId),
          isNull(contratos.deletedAt)
        )
      )
    return rows[0].total > 0
  }
}
