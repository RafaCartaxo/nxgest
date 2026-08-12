import { eq } from "drizzle-orm"
import { db, rawQuery, usuarios } from "../../../../database.js"
import { MODULE_DEPENDENCIES, type ModuleId } from "../../domain/modules.js"
import type { ImpactoDesativacao, ImpactoModuloItem } from "../../domain/impacto.js"
import type { IImpactoDesativacaoQuery } from "../../application/ports/impacto-desativacao.port.js"
import { getLocalDateString, rangeDoDiaLocal } from "../../../../shared/utils/parseDateLocal.js"

/** Fecha o grafo para REMOÇÃO: módulos que dependem (transitivo) de um desligado. */
function cascataDesativacao(modulosAtuais: ModuleId[], novosModulos: ModuleId[]): ModuleId[] {
  const off = new Set<ModuleId>(modulosAtuais.filter((m) => !novosModulos.includes(m)))
  let mudou = true
  while (mudou) {
    mudou = false
    for (const m of modulosAtuais) {
      if (off.has(m)) continue
      const deps = MODULE_DEPENDENCIES[m] ?? []
      if (deps.some((d) => off.has(d))) {
        off.add(m)
        mudou = true
      }
    }
  }
  return [...off]
}

/** Placeholders seguros para `IN (...)`. */
function qIn(ids: string[]): { ph: string; args: string[] } {
  if (ids.length === 0) return { ph: "NULL", args: [] }
  return { ph: ids.map(() => "?").join(","), args: ids }
}

async function count(sql: string, ...args: string[]): Promise<number> {
  const { rows } = await rawQuery<{ c: number }>(sql, args)
  return Number(rows[0]?.c ?? 0)
}

/**
 * Impacto de desativar um conjunto de módulos numa empresa (guard BR-105).
 *
 * Contagens empresa-wide: todas as tabelas operacionais ligam por `"user_id"`
 * (operador) — o join passa por `usuarios.empresaId`. Reusa os predicados de
 * domínio (parcela pendente = `"saldo_pendente" > 0 AND "deleted_at" IS NULL`).
 *
 * - `clientes`/`rota`/`atendidos`/`gastos` → só confirmar (não bloqueiam);
 * - `contratos` (parcela em aberto), `cobrancas` (pendências), `caixa` (base
 *   aberta) → **bloqueiam** (409) sem `force` do super admin.
 */
export class ImpactoDesativacaoQuery implements IImpactoDesativacaoQuery {
  async calcular(empresaId: string, modulosAtuais: ModuleId[], novosModulos: string[]): Promise<ImpactoDesativacao> {
    const desligados = cascataDesativacao(modulosAtuais, novosModulos as ModuleId[])

    const impacto: ImpactoModuloItem[] = []
    let bloqueado = false

    const userRows = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.empresaId, empresaId))
    const userIds = userRows.map((r) => r.id)
    const { ph, args } = qIn(userIds)
    const hoje = getLocalDateString(new Date())
    const { inicio, fim } = rangeDoDiaLocal(hoje)

    if (desligados.includes("clientes")) {
      const n = await count(`SELECT COUNT(*) AS c FROM clientes WHERE "deleted_at" IS NULL AND "user_id" IN (${ph})`, ...args)
      impacto.push({ modulo: "clientes", contagem: n, bloqueia: false, detalhe: "clientes cadastrados" })
    }

    if (desligados.includes("contratos")) {
      const ativos = await count(`SELECT COUNT(*) AS c FROM contratos WHERE "deleted_at" IS NULL AND estado = 'Ativo' AND "user_id" IN (${ph})`, ...args)
      const pendentes = await count(
        `SELECT COUNT(*) AS c FROM parcelas p JOIN contratos ct ON ct.id = p."contrato_id" WHERE p."deleted_at" IS NULL AND p."saldo_pendente" > 0 AND ct."deleted_at" IS NULL AND ct."user_id" IN (${ph})`,
        ...args,
      )
      const n = pendentes
      impacto.push({ modulo: "contratos", contagem: n, bloqueia: n > 0, detalhe: `${ativos} contrato(s) ativo(s) · ${pendentes} parcela(s) em aberto` })
      if (n > 0) bloqueado = true
    }

    if (desligados.includes("cobrancas")) {
      const n = await count(
        `SELECT COUNT(DISTINCT cl.id) AS c FROM clientes cl JOIN contratos ct ON ct."cliente_id" = cl.id JOIN parcelas p ON p."contrato_id" = ct.id WHERE cl."deleted_at" IS NULL AND ct."deleted_at" IS NULL AND p."deleted_at" IS NULL AND p."saldo_pendente" > 0 AND ct."user_id" IN (${ph})`,
        ...args,
      )
      impacto.push({ modulo: "cobrancas", contagem: n, bloqueia: n > 0, detalhe: "cliente(s) com pendência de cobrança" })
      if (n > 0) bloqueado = true
    }

    if (desligados.includes("caixa")) {
      const n = await count(`SELECT COUNT(*) AS c FROM caixa_config WHERE "caixa_base" != 0 AND "user_id" IN (${ph})`, ...args)
      const aberto = n > 0
      impacto.push({ modulo: "caixa", contagem: aberto ? 1 : 0, bloqueia: aberto, detalhe: aberto ? "caixa base em aberto (saldo a fechar)" : "sem caixa em aberto" })
      if (aberto) bloqueado = true
    }

    if (desligados.includes("gastos")) {
      const n = await count(`SELECT COUNT(*) AS c FROM gastos WHERE "deleted_at" IS NULL AND data = ? AND "user_id" IN (${ph})`, hoje, ...args)
      impacto.push({ modulo: "gastos", contagem: n, bloqueia: false, detalhe: "gastos de hoje" })
    }

    if (desligados.includes("rota")) {
      const n = await count(
        `SELECT COUNT(*) AS c FROM historico_operacional h WHERE h."created_at" >= ? AND h."created_at" < ? AND h."user_id" IN (${ph})`,
        inicio, fim, ...args,
      )
      impacto.push({ modulo: "rota", contagem: n, bloqueia: false, detalhe: "visita(s) registrada(s) hoje" })
    }

    if (desligados.includes("atendidos")) {
      const n = await count(
        `SELECT COUNT(*) AS c FROM historico_operacional h WHERE h.tipo = 'visitado' AND h."created_at" >= ? AND h."created_at" < ? AND h."user_id" IN (${ph})`,
        inicio, fim, ...args,
      )
      impacto.push({ modulo: "atendidos", contagem: n, bloqueia: false, detalhe: "cliente(s) atendido(s) hoje" })
    }

    return { desligados, impacto, bloqueado }
  }
}
