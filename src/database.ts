import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import {
  pgTable,
  text,
  numeric,
  doublePrecision,
  integer,
  index,
  uniqueIndex,
  unique,
  customType,
  date,
} from "drizzle-orm/pg-core"
import { Pool, types } from "pg"
import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import { getLocalDateString } from "./shared/utils/parseDateLocal.js"

/**
 * Parsers de tipo do driver `pg` (PLAN-070):
 * - `numeric` (1700) → number: usado nos `rawQuery`; o drizzle converte via custom type `money`.
 * - `int8`/bigint (20) → number: `COUNT(*)`/agregações voltam como string no pg;
 *   normalizamos para number (o frontend espera números).
 */
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)))
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)))
// DATE (1082) via rawQuery: devolve a string 'YYYY-MM-DD' (o default do pg vira Date obj).
types.setTypeParser(1082, (v) => (v === null ? null : v))

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://nxgest:nxgest-dev@localhost:5433/nxgest",
  max: Number(process.env.PG_POOL_MAX ?? 10),
})

export const db = drizzle(pool)

/** Helper para SQL cru com bindings `?` posicionais (converte para `$1..$N` do pg). */
/**
 * Tipo customizado de dinheiro (PLAN-070 — modelo): NUMERIC(12,2) no banco,
 * number na fronteira JS (drizzle `fromDriver` converte a string do driver).
 * Colunas de agregação (SUM/COUNT) NÃO passam por aqui — usar Number() no uso.
 */
export const money = customType<{ data: number; driverData: string }>({
  dataType() {
    return "numeric(12,2)"
  },
  fromDriver(v) {
    return Number(v)
  },
  toDriver(v) {
    return String(v)
  },
})

export async function rawQuery<T>(text: string, params: unknown[] = []): Promise<{ rows: T[]; rowCount: number }> {
  let i = 0
  const sqlText = text.replace(/\?/g, () => `$${++i}`)
  const result = await pool.query(sqlText, params)
  return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 }
}

export const clientes = pgTable("clientes", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: text("cpf"),
  comercio: text("comercio").notNull(),
  telefone: text("telefone").notNull(),
  telefoneComercio: text("telefoneComercio"),
  logradouro: text("logradouro").notNull(),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  comercioLogradouro: text("comercioLogradouro"),
  comercioNumero: text("comercioNumero"),
  comercioBairro: text("comercioBairro"),
  comercioCidade: text("comercioCidade"),
  comercioEstado: text("comercioEstado"),
  comercioLat: doublePrecision("comercioLat"),
  comercioLng: doublePrecision("comercioLng"),
  foto: text("foto"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  deletedAt: text("deletedAt"),
  userId: text("userId"),
}, (t) => [
  uniqueIndex("idx_clientes_cpf").on(t.cpf, t.userId).where(sql`${t.cpf} IS NOT NULL AND ${t.deletedAt} IS NULL`),
  index("idx_clientes_user").on(t.userId, t.deletedAt),
])

export const contratos = pgTable("contratos", {
  id: text("id").primaryKey(),
  clienteId: text("clienteId").notNull(),
  valorBase: money("valorBase").notNull(),
  percentualJuros: money("percentualJuros").notNull(),
  valorFinal: money("valorFinal").notNull(),
  quantidadeParcelas: integer("quantidadeParcelas").notNull(),
  dataInicio: date("dataInicio").notNull(),
  dataFinal: text("dataFinal").notNull().default(""),
  estado: text("estado").notNull().default("Ativo"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  deletedAt: text("deletedAt"),
  userId: text("userId"),
}, (t) => [
  index("idx_contratos_cliente").on(t.clienteId),
  index("idx_contratos_user").on(t.userId, t.deletedAt),
])

export const parcelas = pgTable("parcelas", {
  id: text("id").primaryKey(),
  contratoId: text("contratoId").notNull(),
  numero: integer("numero").notNull(),
  valorPrevisto: money("valorPrevisto").notNull(),
  valorPago: money("valorPago").notNull().default(0),
  saldoPendente: money("saldoPendente").notNull(),
  estado: text("estado").notNull().default("Pendente"),
  dataVencimento: date("dataVencimento").notNull(),
  dataQuitacao: date("dataQuitacao"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  deletedAt: text("deletedAt"),
}, (t) => [
  index("idx_parcelas_contrato").on(t.contratoId),
  index("idx_parcelas_venc").on(t.contratoId, t.dataVencimento, t.saldoPendente),
])

export const movimentacoesFinanceiras = pgTable("movimentacoesFinanceiras", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(),
  valor: money("valor").notNull(),
  origem: text("origem").notNull(),
  origemId: text("origemId").notNull(),
  descricao: text("descricao"),
  data: date("data").notNull(),
  createdAt: text("createdAt").notNull(),
  userId: text("userId"),
}, (t) => [
  index("idx_movimentacoes_data").on(t.data),
  index("idx_movimentacoes_origem").on(t.origem, t.origemId),
  index("idx_movimentacoes_user").on(t.userId, t.data),
])

export const caixaConfig = pgTable("caixa_config", {
  userId: text("userId").primaryKey(),
  caixaBase: money("caixaBase").notNull().default(0),
  updatedAt: text("updatedAt").notNull(),
})

export const auditoriaCaixa = pgTable("auditoria_caixa", {
  id: text("id").primaryKey(),
  operadorId: text("operadorId").notNull(),
  adminId: text("adminId").notNull(),
  valorAnterior: money("valorAnterior").notNull(),
  valorNovo: money("valorNovo").notNull(),
  motivo: text("motivo").notNull(),
  data: date("data").notNull(),
  createdAt: text("createdAt").notNull(),
}, (t) => [
  index("idx_auditoria_caixa_operador").on(t.operadorId),
  index("idx_auditoria_caixa_data").on(t.data),
])

export const pagamentos = pgTable("pagamentos", {
  id: text("id").primaryKey(),
  contratoId: text("contratoId").notNull(),
  valor: money("valor").notNull(),
  data: date("data").notNull(),
  createdAt: text("createdAt").notNull(),
  userId: text("userId"),
  estornadoEm: text("estornadoEm"),
  estornadoPor: text("estornadoPor"),
  estornoMotivo: text("estornoMotivo"),
}, (t) => [
  index("idx_pagamentos_contrato").on(t.contratoId),
  index("idx_pagamentos_user").on(t.userId, t.data),
])

export const auditoriaEstornos = pgTable("auditoria_estornos", {
  id: text("id").primaryKey(),
  pagamentoId: text("pagamentoId").notNull(),
  operadorId: text("operadorId").notNull(),
  adminId: text("adminId").notNull(),
  valor: money("valor").notNull(),
  motivo: text("motivo").notNull(),
  data: date("data").notNull(),
  createdAt: text("createdAt").notNull(),
}, (t) => [
  index("idx_auditoria_estornos_pagamento").on(t.pagamentoId),
  index("idx_auditoria_estornos_operador").on(t.operadorId),
])

export const pagamentoParcelas = pgTable("pagamento_parcelas", {
  id: text("id").primaryKey(),
  pagamentoId: text("pagamentoId").notNull(),
  parcelaId: text("parcelaId").notNull(),
  valor: money("valor").notNull(),
}, (t) => [
  index("idx_pagamento_parcelas_pagamento").on(t.pagamentoId),
  index("idx_pagamento_parcelas_parcela").on(t.parcelaId),
])

export const historicoOperacional = pgTable("historico_operacional", {
  id: text("id").primaryKey(),
  clienteId: text("clienteId").notNull(),
  contratoId: text("contratoId").notNull(),
  tipo: text("tipo").notNull(),
  dataPromessa: date("dataPromessa"),
  createdAt: text("createdAt").notNull(),
  userId: text("userId"),
}, (t) => [
  index("idx_historico_operacional_dia").on(t.clienteId, t.contratoId, t.createdAt),
  index("idx_historico_user").on(t.userId, t.createdAt),
])

export const gastos = pgTable("gastos", {
  id: text("id").primaryKey(),
  valor: money("valor").notNull(),
  categoria: text("categoria").notNull(),
  observacao: text("observacao"),
  data: date("data").notNull(),
  createdAt: text("createdAt").notNull(),
  deletedAt: text("deletedAt"),
  userId: text("userId"),
}, (t) => [
  index("idx_gastos_data").on(t.data),
  index("idx_gastos_user").on(t.userId, t.data),
])

export const fechamentosSemanais = pgTable("fechamentos_semanais", {
  id: text("id").primaryKey(),
  dataInicio: date("dataInicio").notNull(),
  dataFim: date("dataFim").notNull(),
  totalRecebido: money("totalRecebido").notNull(),
  totalGasto: money("totalGasto").notNull(),
  resultado: money("resultado").notNull(),
  caixaBase: money("caixaBase").notNull().default(0),
  saldoFechamento: money("saldoFechamento").notNull().default(0),
  createdAt: text("createdAt").notNull(),
  userId: text("userId"),
}, (t) => [
  index("idx_fechamentos_semanais_data").on(t.dataInicio),
  index("idx_fechamentos_user").on(t.userId, t.dataInicio),
  unique("idx_fechamentos_user_periodo").on(t.userId, t.dataInicio, t.dataFim),
])

export const snapshotsAtraso = pgTable("snapshots_atraso", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  data: date("data").notNull(),
  clientesAtrasados: integer("clientesAtrasados").notNull(),
  contratosAtrasados: integer("contratosAtrasados").notNull(),
  valorAtrasado: money("valorAtrasado").notNull(),
  createdAt: text("createdAt").notNull(),
}, (t) => [
  unique("snapshots_atraso_user_data").on(t.userId, t.data),
  index("idx_snapshots_atraso_data").on(t.userId, t.data),
])

export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senhaHash"),
  role: text("role").notNull().default("operator"),
  createdAt: text("createdAt").notNull(),
  deletedAt: text("deletedAt"),
  empresaId: text("empresaId"),
  chefeId: text("chefeId"),
  foto: text("foto"),
}, (t) => [
  index("idx_usuarios_empresa_role").on(t.empresaId, t.role),
])

export const authTokens = pgTable("auth_tokens", {
  id: text("id").primaryKey(),
  subjectId: text("subjectId").notNull(),
  tipo: text("tipo").notNull(),
  hash: text("hash").notNull(),
  expiraEm: text("expiraEm").notNull(),
  usadoEm: text("usadoEm"),
  createdAt: text("createdAt").notNull(),
})

export const empresas = pgTable("empresas", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  createdAt: text("createdAt").notNull(),
  modulos: text("modulos"),
  capacidades: text("capacidades"),
  documento: text("documento"),
  nomeFantasia: text("nomeFantasia"),
  ativa: integer("ativa").notNull().default(1),
})

export const auditoriaModulos = pgTable("auditoria_modulos", {
  id: text("id").primaryKey(),
  empresaId: text("empresaId").notNull(),
  adminId: text("adminId").notNull(),
  tipo: text("tipo").notNull(),
  antes: text("antes"),
  depois: text("depois"),
  force: integer("force").notNull().default(0),
  motivo: text("motivo"),
  createdAt: text("createdAt").notNull(),
})

export const anexos = pgTable("anexos", {
  id: text("id").primaryKey(),
  clienteId: text("clienteId").notNull(),
  tipo: text("tipo").notNull().default("outro"),
  nomeOriginal: text("nomeOriginal").notNull(),
  mime: text("mime").notNull(),
  tamanho: integer("tamanho").notNull(),
  caminho: text("caminho").notNull(),
  criadoPor: text("criadoPor").notNull(),
  createdAt: text("createdAt").notNull(),
}, (t) => [
  index("idx_anexos_cliente").on(t.clienteId),
])

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  nomeResponsavel: text("nomeResponsavel").notNull(),
  empresa: text("empresa").notNull(),
  email: text("email").notNull().unique(),
  telefone: text("telefone"),
  origem: text("origem").notNull().default("Site"),
  status: text("status").notNull().default("NOVO"),
  convertidoEmpresaId: text("convertidoEmpresaId"),
  convertidoEm: text("convertidoEm"),
  convertidoPor: text("convertidoPor"),
  descartadoEm: text("descartadoEm"),
  descartadoPor: text("descartadoPor"),
  descarteMotivo: text("descarteMotivo"),
  createdAt: text("createdAt").notNull(),
}, (t) => [
  index("idx_leads_status").on(t.status),
  index("idx_leads_email").on(t.email),
])

/**
 * Migrations idempotentes (PLAN-070) — `CREATE TABLE IF NOT EXISTS` + índices.
 * Reproduzível de banco vazio; roda no boot e em `scripts/create-schema.mjs`.
 * NOTA: datas date-only ficam DATE; timestamps (createdAt/updatedAt/...) TEXT;
 * monetário NUMERIC(12,2) via custom type `money`; IDs text.
 */
export async function runMigrations(): Promise<void> {
  // NOTA: identificadores em aspas duplas — o PG dobra para minúsculas o que vem sem
  // aspas, e o drizzle/pg-core consulta exatamente os nomes camelCase definidos aqui.
  const ddl = `
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE TABLE IF NOT EXISTS "empresas" (
      "id" TEXT PRIMARY KEY, "nome" TEXT NOT NULL, "createdAt" TEXT NOT NULL, "modulos" TEXT DEFAULT '["clientes","contratos","caixa","gastos","rota","cobrancas","atendidos"]',
      "capacidades" TEXT, "documento" TEXT, "nomeFantasia" TEXT, "ativa" INTEGER NOT NULL DEFAULT 1
    );
CREATE TABLE IF NOT EXISTS "usuarios" (
      "id" TEXT PRIMARY KEY, "nome" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE, "senhaHash" TEXT,
      "role" TEXT NOT NULL DEFAULT 'operator', "createdAt" TEXT NOT NULL, "deletedAt" TEXT,
      "empresaId" TEXT REFERENCES "empresas"("id"), "chefeId" TEXT, "foto" TEXT
    );
CREATE TABLE IF NOT EXISTS "clientes" (
      "id" TEXT PRIMARY KEY, "nome" TEXT NOT NULL, "cpf" TEXT, "comercio" TEXT NOT NULL,
      "telefone" TEXT NOT NULL, "telefoneComercio" TEXT, "logradouro" TEXT NOT NULL,
      "numero" TEXT, "complemento" TEXT, "bairro" TEXT, "cidade" TEXT, "estado" TEXT,
      "lat" DOUBLE PRECISION, "lng" DOUBLE PRECISION,
      "comercioLogradouro" TEXT, "comercioNumero" TEXT, "comercioBairro" TEXT,
      "comercioCidade" TEXT, "comercioEstado" TEXT, "comercioLat" DOUBLE PRECISION, "comercioLng" DOUBLE PRECISION,
      "foto" TEXT, "createdAt" TEXT NOT NULL, "updatedAt" TEXT NOT NULL, "deletedAt" TEXT, "userId" TEXT
    );
CREATE TABLE IF NOT EXISTS "leads" (
      "id" TEXT PRIMARY KEY, "nomeResponsavel" TEXT NOT NULL, "empresa" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE, "telefone" TEXT, "origem" TEXT NOT NULL DEFAULT 'Site',
      "status" TEXT NOT NULL DEFAULT 'NOVO', "convertidoEmpresaId" TEXT, "convertidoEm" TEXT,
      "convertidoPor" TEXT, "descartadoEm" TEXT, "descartadoPor" TEXT, "descarteMotivo" TEXT,
      "createdAt" TEXT NOT NULL
    );
CREATE TABLE IF NOT EXISTS "contratos" (
      "id" TEXT PRIMARY KEY, "clienteId" TEXT NOT NULL REFERENCES "clientes"("id"), "valorBase" NUMERIC(12,2) NOT NULL,
      "percentualJuros" NUMERIC(12,2) NOT NULL, "valorFinal" NUMERIC(12,2) NOT NULL,
      "quantidadeParcelas" INTEGER NOT NULL, "dataInicio" DATE NOT NULL, "dataFinal" TEXT NOT NULL DEFAULT '',
      "estado" TEXT NOT NULL DEFAULT 'Ativo', "createdAt" TEXT NOT NULL, "updatedAt" TEXT NOT NULL,
      "deletedAt" TEXT, "userId" TEXT
    );
CREATE TABLE IF NOT EXISTS "parcelas" (
      "id" TEXT PRIMARY KEY, "contratoId" TEXT NOT NULL REFERENCES "contratos"("id"), "numero" INTEGER NOT NULL,
      "valorPrevisto" NUMERIC(12,2) NOT NULL, "valorPago" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "saldoPendente" NUMERIC(12,2) NOT NULL, "estado" TEXT NOT NULL DEFAULT 'Pendente',
      "dataVencimento" DATE NOT NULL, "dataQuitacao" DATE, "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL, "deletedAt" TEXT
    );
CREATE TABLE IF NOT EXISTS "pagamentos" (
      "id" TEXT PRIMARY KEY, "contratoId" TEXT NOT NULL REFERENCES "contratos"("id"), "valor" NUMERIC(12,2) NOT NULL,
      "data" DATE NOT NULL, "createdAt" TEXT NOT NULL, "userId" TEXT,
      "estornadoEm" TEXT, "estornadoPor" TEXT, "estornoMotivo" TEXT
    );
CREATE TABLE IF NOT EXISTS "pagamento_parcelas" (
      "id" TEXT PRIMARY KEY, "pagamentoId" TEXT NOT NULL REFERENCES "pagamentos"("id"), "parcelaId" TEXT NOT NULL REFERENCES "parcelas"("id"),
      "valor" NUMERIC(12,2) NOT NULL
    );
CREATE TABLE IF NOT EXISTS "auditoria_estornos" (
      "id" TEXT PRIMARY KEY, "pagamentoId" TEXT NOT NULL REFERENCES "pagamentos"("id"), "operadorId" TEXT NOT NULL REFERENCES "usuarios"("id"),
      "adminId" TEXT NOT NULL REFERENCES "usuarios"("id"), "valor" NUMERIC(12,2) NOT NULL, "motivo" TEXT NOT NULL,
      "data" DATE NOT NULL, "createdAt" TEXT NOT NULL
    );
CREATE TABLE IF NOT EXISTS "historico_operacional" (
      "id" TEXT PRIMARY KEY, "clienteId" TEXT NOT NULL REFERENCES "clientes"("id"), "contratoId" TEXT NOT NULL REFERENCES "contratos"("id"),
      "tipo" TEXT NOT NULL, "dataPromessa" DATE, "createdAt" TEXT NOT NULL, "userId" TEXT
    );
CREATE TABLE IF NOT EXISTS "anexos" (
      "id" TEXT PRIMARY KEY, "clienteId" TEXT NOT NULL REFERENCES "clientes"("id"), "tipo" TEXT NOT NULL DEFAULT 'outro',
      "nomeOriginal" TEXT NOT NULL, "mime" TEXT NOT NULL, "tamanho" INTEGER NOT NULL,
      "caminho" TEXT NOT NULL, "criadoPor" TEXT NOT NULL, "createdAt" TEXT NOT NULL
    );
CREATE TABLE IF NOT EXISTS "caixa_config" (
      "userId" TEXT PRIMARY KEY REFERENCES "usuarios"("id"), "caixaBase" NUMERIC(12,2) NOT NULL DEFAULT 0, "updatedAt" TEXT NOT NULL
    );
CREATE TABLE IF NOT EXISTS "auditoria_caixa" (
      "id" TEXT PRIMARY KEY, "operadorId" TEXT NOT NULL REFERENCES "usuarios"("id"), "adminId" TEXT NOT NULL REFERENCES "usuarios"("id"),
      "valorAnterior" NUMERIC(12,2) NOT NULL, "valorNovo" NUMERIC(12,2) NOT NULL,
      "motivo" TEXT NOT NULL, "data" DATE NOT NULL, "createdAt" TEXT NOT NULL
    );
CREATE TABLE IF NOT EXISTS "auditoria_modulos" (
      "id" TEXT PRIMARY KEY, "empresaId" TEXT NOT NULL, "adminId" TEXT NOT NULL REFERENCES "usuarios"("id"), "tipo" TEXT NOT NULL,
      "antes" TEXT, "depois" TEXT, "force" INTEGER NOT NULL DEFAULT 0, "motivo" TEXT, "createdAt" TEXT NOT NULL
    );
CREATE TABLE IF NOT EXISTS "movimentacoesFinanceiras" (
      "id" TEXT PRIMARY KEY, "tipo" TEXT NOT NULL, "valor" NUMERIC(12,2) NOT NULL,
      "origem" TEXT NOT NULL, "origemId" TEXT NOT NULL, "descricao" TEXT, "data" DATE NOT NULL,
      "createdAt" TEXT NOT NULL, "userId" TEXT
    );
CREATE TABLE IF NOT EXISTS "gastos" (
      "id" TEXT PRIMARY KEY, "valor" NUMERIC(12,2) NOT NULL, "categoria" TEXT NOT NULL,
      "observacao" TEXT, "data" DATE NOT NULL, "createdAt" TEXT NOT NULL, "deletedAt" TEXT, "userId" TEXT
    );
CREATE TABLE IF NOT EXISTS "fechamentos_semanais" (
      "id" TEXT PRIMARY KEY, "dataInicio" DATE NOT NULL, "dataFim" DATE NOT NULL,
      "totalRecebido" NUMERIC(12,2) NOT NULL, "totalGasto" NUMERIC(12,2) NOT NULL,
      "resultado" NUMERIC(12,2) NOT NULL, "caixaBase" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "saldoFechamento" NUMERIC(12,2) NOT NULL DEFAULT 0, "createdAt" TEXT NOT NULL, "userId" TEXT
    );
CREATE TABLE IF NOT EXISTS "snapshots_atraso" (
      "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "data" DATE NOT NULL,
      "clientesAtrasados" INTEGER NOT NULL, "contratosAtrasados" INTEGER NOT NULL,
      "valorAtrasado" NUMERIC(12,2) NOT NULL, "createdAt" TEXT NOT NULL
    );
CREATE TABLE IF NOT EXISTS "auth_tokens" (
      "id" TEXT PRIMARY KEY, "subjectId" TEXT NOT NULL, "tipo" TEXT NOT NULL, "hash" TEXT NOT NULL,
      "expiraEm" TEXT NOT NULL, "usadoEm" TEXT, "createdAt" TEXT NOT NULL
    );
-- Índices (espelham os do SQLite; justificados em PLAN-070 Fase F)
    CREATE UNIQUE INDEX IF NOT EXISTS "idx_clientes_cpf" ON "clientes"("cpf", "userId") WHERE "cpf" IS NOT NULL AND "deletedAt" IS NULL;
    CREATE INDEX IF NOT EXISTS "idx_clientes_user" ON "clientes"("userId", "deletedAt");
    -- Busca ILIKE com curinga inicial (Fase F — PLAN-070): GIN pg_trgm
    CREATE INDEX IF NOT EXISTS "idx_clientes_nome_trgm" ON "clientes" USING GIN ("nome" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "idx_movimentacoes_data" ON "movimentacoesFinanceiras"("data");
    CREATE INDEX IF NOT EXISTS "idx_movimentacoes_origem" ON "movimentacoesFinanceiras"("origem", "origemId");
    CREATE INDEX IF NOT EXISTS "idx_movimentacoes_user" ON "movimentacoesFinanceiras"("userId", "data");
    CREATE INDEX IF NOT EXISTS "idx_parcelas_contrato" ON "parcelas"("contratoId");
    CREATE INDEX IF NOT EXISTS "idx_parcelas_venc" ON "parcelas"("contratoId", "dataVencimento", "saldoPendente");
    CREATE INDEX IF NOT EXISTS "idx_parcelas_venc_partial" ON "parcelas"("contratoId", "dataVencimento", "saldoPendente") WHERE "saldoPendente" > 0 AND "deletedAt" IS NULL;
    CREATE INDEX IF NOT EXISTS "idx_contratos_cliente" ON "contratos"("clienteId");
    CREATE INDEX IF NOT EXISTS "idx_contratos_user" ON "contratos"("userId", "deletedAt");
    CREATE INDEX IF NOT EXISTS "idx_pagamentos_contrato" ON "pagamentos"("contratoId");
    CREATE INDEX IF NOT EXISTS "idx_pagamentos_user" ON "pagamentos"("userId", "data");
    CREATE INDEX IF NOT EXISTS "idx_pagamento_parcelas_pagamento" ON "pagamento_parcelas"("pagamentoId");
    CREATE INDEX IF NOT EXISTS "idx_pagamento_parcelas_parcela" ON "pagamento_parcelas"("parcelaId");
    CREATE INDEX IF NOT EXISTS "idx_auditoria_caixa_operador" ON "auditoria_caixa"("operadorId");
    CREATE INDEX IF NOT EXISTS "idx_auditoria_caixa_data" ON "auditoria_caixa"("data");
    CREATE INDEX IF NOT EXISTS "idx_auditoria_estornos_pagamento" ON "auditoria_estornos"("pagamentoId");
    CREATE INDEX IF NOT EXISTS "idx_auditoria_estornos_operador" ON "auditoria_estornos"("operadorId");
    CREATE INDEX IF NOT EXISTS "idx_historico_operacional_dia" ON "historico_operacional"("clienteId", "contratoId", "createdAt");
    CREATE INDEX IF NOT EXISTS "idx_historico_user" ON "historico_operacional"("userId", "createdAt");
    CREATE INDEX IF NOT EXISTS "idx_gastos_data" ON "gastos"("data");
    CREATE INDEX IF NOT EXISTS "idx_gastos_user" ON "gastos"("userId", "data");
    CREATE INDEX IF NOT EXISTS "idx_fechamentos_semanais_data" ON "fechamentos_semanais"("dataInicio");
    CREATE INDEX IF NOT EXISTS "idx_fechamentos_user" ON "fechamentos_semanais"("userId", "dataInicio");
    CREATE UNIQUE INDEX IF NOT EXISTS "idx_fechamentos_user_periodo" ON "fechamentos_semanais"("userId", "dataInicio", "dataFim");
    CREATE UNIQUE INDEX IF NOT EXISTS "snapshots_atraso_user_data" ON "snapshots_atraso"("userId", "data");
    CREATE INDEX IF NOT EXISTS "idx_snapshots_atraso_data" ON "snapshots_atraso"("userId", "data");
    CREATE INDEX IF NOT EXISTS "idx_usuarios_empresa_role" ON "usuarios"("empresaId", "role");
    CREATE INDEX IF NOT EXISTS "idx_anexos_cliente" ON "anexos"("clienteId");
    CREATE INDEX IF NOT EXISTS "idx_leads_status" ON "leads"("status");
    CREATE INDEX IF NOT EXISTS "idx_leads_email" ON "leads"("email");
  `
  await pool.query(ddl)
}

/** Seed básico de boot (idempotente — PLAN-070): admin, super_admin, empresa Desenvolvimento. */
export async function seedBasico(): Promise<void> {
  // Admin default
  const admin = await pool.query("SELECT id FROM usuarios WHERE email = $1", ["admin@cobranca.com"])
  if (admin.rowCount === 0) {
    const adminId = randomUUID()
    const hash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD ?? "admin123", 10)
    await pool.query(
      "INSERT INTO usuarios (id, nome, email, \"senhaHash\", role, \"createdAt\") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
      [adminId, "Admin", "admin@cobranca.com", hash, "admin", new Date().toISOString()],
    )
    const tables = [
      "clientes", "contratos", "pagamentos", "movimentacoesFinanceiras",
      "caixa_config", "historico_operacional", "gastos", "fechamentos_semanais",
    ]
    for (const table of tables) {
      await pool.query(`UPDATE "${table}" SET "userId" = $1 WHERE "userId" IS NULL`, [adminId])
    }
  }

  // Super admin
  const superEmail = process.env.SUPER_ADMIN_EMAIL ?? "super@nxgest.com"
  const superPassword = process.env.SUPER_ADMIN_DEFAULT_PASSWORD ?? "super123"
  const superRow = await pool.query("SELECT id FROM usuarios WHERE email = $1", [superEmail])
  if (superRow.rowCount === 0) {
    const superId = randomUUID()
    const superHash = bcrypt.hashSync(superPassword, 10)
    await pool.query(
      "INSERT INTO usuarios (id, nome, email, \"senhaHash\", role, \"createdAt\") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
      [superId, "Super Admin", superEmail, superHash, "super_admin", new Date().toISOString()],
    )
  }

  // Empresa "Desenvolvimento" + vínculo do admin + operadores órfãos
  const devEmpresa = await pool.query("SELECT id FROM empresas WHERE nome = $1", ["Desenvolvimento"])
  const totalEmpresas = await pool.query("SELECT COUNT(*) AS total FROM empresas")
  if (devEmpresa.rowCount === 0 && Number(totalEmpresas.rows[0].total) === 0) {
    const devEmpresaId = randomUUID()
    await pool.query(
      "INSERT INTO empresas (id, nome, \"createdAt\") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [devEmpresaId, "Desenvolvimento", new Date().toISOString()],
    )
    await pool.query("UPDATE usuarios SET \"empresaId\" = $1 WHERE email = $2 AND \"empresaId\" IS NULL", [devEmpresaId, "admin@cobranca.com"])
    const adminRow = await pool.query<{ id: string; empresaId: string | null }>(
      "SELECT id, \"empresaId\" FROM usuarios WHERE email = $1", ["admin@cobranca.com"],
    )
    if (adminRow.rows[0]?.empresaId) {
      await pool.query(
        "UPDATE usuarios SET \"empresaId\" = $1 WHERE \"empresaId\" IS NULL AND id != $2 AND role != 'super_admin'",
        [adminRow.rows[0].empresaId, adminRow.rows[0].id],
      )
    }
  }
}
