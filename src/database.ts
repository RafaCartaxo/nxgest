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

export const ts = customType<{ data: string; driverData: string }>({
  dataType() {
    return "timestamptz"
  },
  // Recebe string (texto) ou Date (binário) do driver; normaliza para ISO 'Z' (formato da app).
  fromDriver(v) {
    return new Date(v as string | Date).toISOString()
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
  telefoneComercio: text("telefone_comercio"),
  logradouro: text("logradouro").notNull(),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  comercioLogradouro: text("comercio_logradouro"),
  comercioNumero: text("comercio_numero"),
  comercioBairro: text("comercio_bairro"),
  comercioCidade: text("comercio_cidade"),
  comercioEstado: text("comercio_estado"),
  comercioLat: doublePrecision("comercio_lat"),
  comercioLng: doublePrecision("comercio_lng"),
  foto: text("foto"),
  createdAt: ts("created_at").notNull(),
  updatedAt: ts("updated_at").notNull(),
  deletedAt: ts("deleted_at"),
  userId: text("user_id"),
}, (t) => [
  uniqueIndex("idx_clientes_cpf").on(t.cpf, t.userId).where(sql`${t.cpf} IS NOT NULL AND ${t.deletedAt} IS NULL`),
  index("idx_clientes_user").on(t.userId, t.deletedAt),
])

export const contratos = pgTable("contratos", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").notNull(),
  valorBase: money("valor_base").notNull(),
  percentualJuros: money("percentual_juros").notNull(),
  valorFinal: money("valor_final").notNull(),
  quantidadeParcelas: integer("quantidade_parcelas").notNull(),
  dataInicio: date("data_inicio").notNull(),
  dataFinal: text("data_final").notNull().default(""),
  estado: text("estado").notNull().default("Ativo"),
  createdAt: ts("created_at").notNull(),
  updatedAt: ts("updated_at").notNull(),
  deletedAt: ts("deleted_at"),
  userId: text("user_id"),
}, (t) => [
  index("idx_contratos_cliente").on(t.clienteId),
  index("idx_contratos_user").on(t.userId, t.deletedAt),
])

export const parcelas = pgTable("parcelas", {
  id: text("id").primaryKey(),
  contratoId: text("contrato_id").notNull(),
  numero: integer("numero").notNull(),
  valorPrevisto: money("valor_previsto").notNull(),
  valorPago: money("valor_pago").notNull().default(0),
  saldoPendente: money("saldo_pendente").notNull(),
  estado: text("estado").notNull().default("Pendente"),
  dataVencimento: date("data_vencimento").notNull(),
  dataQuitacao: date("data_quitacao"),
  createdAt: ts("created_at").notNull(),
  updatedAt: ts("updated_at").notNull(),
  deletedAt: ts("deleted_at"),
}, (t) => [
  index("idx_parcelas_contrato").on(t.contratoId),
  index("idx_parcelas_venc").on(t.contratoId, t.dataVencimento, t.saldoPendente),
])

export const movimentacoesFinanceiras = pgTable("movimentacoes_financeiras", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(),
  valor: money("valor").notNull(),
  origem: text("origem").notNull(),
  origemId: text("origem_id").notNull(),
  descricao: text("descricao"),
  data: date("data").notNull(),
  createdAt: ts("created_at").notNull(),
  userId: text("user_id"),
}, (t) => [
  index("idx_movimentacoes_data").on(t.data),
  index("idx_movimentacoes_origem").on(t.origem, t.origemId),
  index("idx_movimentacoes_user").on(t.userId, t.data),
])

export const caixaConfig = pgTable("caixa_config", {
  userId: text("user_id").primaryKey(),
  caixaBase: money("caixa_base").notNull().default(0),
  updatedAt: ts("updated_at").notNull(),
})

export const auditoriaCaixa = pgTable("auditoria_caixa", {
  id: text("id").primaryKey(),
  operadorId: text("operador_id").notNull(),
  adminId: text("admin_id").notNull(),
  valorAnterior: money("valor_anterior").notNull(),
  valorNovo: money("valor_novo").notNull(),
  motivo: text("motivo").notNull(),
  data: date("data").notNull(),
  createdAt: ts("created_at").notNull(),
}, (t) => [
  index("idx_auditoria_caixa_operador").on(t.operadorId),
  index("idx_auditoria_caixa_data").on(t.data),
])

export const pagamentos = pgTable("pagamentos", {
  id: text("id").primaryKey(),
  contratoId: text("contrato_id").notNull(),
  valor: money("valor").notNull(),
  data: date("data").notNull(),
  createdAt: ts("created_at").notNull(),
  userId: text("user_id"),
  estornadoEm: text("estornado_em"),
  estornadoPor: text("estornado_por"),
  estornoMotivo: text("estorno_motivo"),
}, (t) => [
  index("idx_pagamentos_contrato").on(t.contratoId),
  index("idx_pagamentos_user").on(t.userId, t.data),
])

export const auditoriaEstornos = pgTable("auditoria_estornos", {
  id: text("id").primaryKey(),
  pagamentoId: text("pagamento_id").notNull(),
  operadorId: text("operador_id").notNull(),
  adminId: text("admin_id").notNull(),
  valor: money("valor").notNull(),
  motivo: text("motivo").notNull(),
  data: date("data").notNull(),
  createdAt: ts("created_at").notNull(),
}, (t) => [
  index("idx_auditoria_estornos_pagamento").on(t.pagamentoId),
  index("idx_auditoria_estornos_operador").on(t.operadorId),
])

export const pagamentoParcelas = pgTable("pagamento_parcelas", {
  id: text("id").primaryKey(),
  pagamentoId: text("pagamento_id").notNull(),
  parcelaId: text("parcela_id").notNull(),
  valor: money("valor").notNull(),
}, (t) => [
  index("idx_pagamento_parcelas_pagamento").on(t.pagamentoId),
  index("idx_pagamento_parcelas_parcela").on(t.parcelaId),
])

export const historicoOperacional = pgTable("historico_operacional", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").notNull(),
  contratoId: text("contrato_id").notNull(),
  tipo: text("tipo").notNull(),
  dataPromessa: date("data_promessa"),
  createdAt: ts("created_at").notNull(),
  userId: text("user_id"),
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
  createdAt: ts("created_at").notNull(),
  deletedAt: ts("deleted_at"),
  userId: text("user_id"),
}, (t) => [
  index("idx_gastos_data").on(t.data),
  index("idx_gastos_user").on(t.userId, t.data),
])

export const fechamentosSemanais = pgTable("fechamentos_semanais", {
  id: text("id").primaryKey(),
  dataInicio: date("data_inicio").notNull(),
  dataFim: date("data_fim").notNull(),
  totalRecebido: money("total_recebido").notNull(),
  totalGasto: money("total_gasto").notNull(),
  resultado: money("resultado").notNull(),
  caixaBase: money("caixa_base").notNull().default(0),
  saldoFechamento: money("saldo_fechamento").notNull().default(0),
  createdAt: ts("created_at").notNull(),
  userId: text("user_id"),
}, (t) => [
  index("idx_fechamentos_semanais_data").on(t.dataInicio),
  index("idx_fechamentos_user").on(t.userId, t.dataInicio),
  unique("idx_fechamentos_user_periodo").on(t.userId, t.dataInicio, t.dataFim),
])

export const snapshotsAtraso = pgTable("snapshots_atraso", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  data: date("data").notNull(),
  clientesAtrasados: integer("clientes_atrasados").notNull(),
  contratosAtrasados: integer("contratos_atrasados").notNull(),
  valorAtrasado: money("valor_atrasado").notNull(),
  createdAt: ts("created_at").notNull(),
}, (t) => [
  unique("snapshots_atraso_user_data").on(t.userId, t.data),
  index("idx_snapshots_atraso_data").on(t.userId, t.data),
])

export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash"),
  role: text("role").notNull().default("operator"),
  createdAt: ts("created_at").notNull(),
  deletedAt: ts("deleted_at"),
  empresaId: text("empresa_id"),
  chefeId: text("chefe_id"),
  foto: text("foto"),
}, (t) => [
  index("idx_usuarios_empresa_role").on(t.empresaId, t.role),
])

export const authTokens = pgTable("auth_tokens", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id").notNull(),
  tipo: text("tipo").notNull(),
  hash: text("hash").notNull(),
  expiraEm: ts("expira_em").notNull(),
  usadoEm: ts("usado_em"),
  createdAt: ts("created_at").notNull(),
})

export const empresas = pgTable("empresas", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  createdAt: ts("created_at").notNull(),
  modulos: text("modulos"),
  capacidades: text("capacidades"),
  documento: text("documento"),
  nomeFantasia: text("nome_fantasia"),
  ativa: integer("ativa").notNull().default(1),
})

export const auditoriaModulos = pgTable("auditoria_modulos", {
  id: text("id").primaryKey(),
  empresaId: text("empresa_id").notNull(),
  adminId: text("admin_id").notNull(),
  tipo: text("tipo").notNull(),
  antes: text("antes"),
  depois: text("depois"),
  force: integer("force").notNull().default(0),
  motivo: text("motivo"),
  createdAt: ts("created_at").notNull(),
})

export const anexos = pgTable("anexos", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").notNull(),
  tipo: text("tipo").notNull().default("outro"),
  nomeOriginal: text("nome_original").notNull(),
  mime: text("mime").notNull(),
  tamanho: integer("tamanho").notNull(),
  caminho: text("caminho").notNull(),
  criadoPor: text("criado_por").notNull(),
  createdAt: ts("created_at").notNull(),
}, (t) => [
  index("idx_anexos_cliente").on(t.clienteId),
])

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  nomeResponsavel: text("nome_responsavel").notNull(),
  empresa: text("empresa").notNull(),
  email: text("email").notNull().unique(),
  telefone: text("telefone"),
  origem: text("origem").notNull().default("Site"),
  status: text("status").notNull().default("NOVO"),
  convertidoEmpresaId: text("convertido_empresa_id"),
  convertidoEm: ts("convertido_em"),
  convertidoPor: text("convertido_por"),
  descartadoEm: ts("descartado_em"),
  descartadoPor: text("descartado_por"),
  descarteMotivo: text("descarte_motivo"),
  createdAt: ts("created_at").notNull(),
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
      "id" TEXT PRIMARY KEY, "nome" TEXT NOT NULL, "created_at" TIMESTAMPTZ NOT NULL, "modulos" TEXT DEFAULT '["clientes","contratos","caixa","gastos","rota","cobrancas","atendidos"]',
      "capacidades" TEXT, "documento" TEXT, "nome_fantasia" TEXT, "ativa" INTEGER NOT NULL DEFAULT 1
    );
CREATE TABLE IF NOT EXISTS "usuarios" (
      "id" TEXT PRIMARY KEY, "nome" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE, "senha_hash" TEXT,
      "role" TEXT NOT NULL DEFAULT 'operator', "created_at" TIMESTAMPTZ NOT NULL, "deleted_at" TIMESTAMPTZ,
      "empresa_id" TEXT REFERENCES "empresas"("id"), "chefe_id" TEXT, "foto" TEXT
    );
CREATE TABLE IF NOT EXISTS "clientes" (
      "id" TEXT PRIMARY KEY, "nome" TEXT NOT NULL, "cpf" TEXT, "comercio" TEXT NOT NULL,
      "telefone" TEXT NOT NULL, "telefone_comercio" TEXT, "logradouro" TEXT NOT NULL,
      "numero" TEXT, "complemento" TEXT, "bairro" TEXT, "cidade" TEXT, "estado" TEXT,
      "lat" DOUBLE PRECISION, "lng" DOUBLE PRECISION,
      "comercio_logradouro" TEXT, "comercio_numero" TEXT, "comercio_bairro" TEXT,
      "comercio_cidade" TEXT, "comercio_estado" TEXT, "comercio_lat" DOUBLE PRECISION, "comercio_lng" DOUBLE PRECISION,
      "foto" TEXT, "created_at" TIMESTAMPTZ NOT NULL, "updated_at" TIMESTAMPTZ NOT NULL, "deleted_at" TIMESTAMPTZ, "user_id" TEXT
    );
CREATE TABLE IF NOT EXISTS "leads" (
      "id" TEXT PRIMARY KEY, "nome_responsavel" TEXT NOT NULL, "empresa" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE, "telefone" TEXT, "origem" TEXT NOT NULL DEFAULT 'Site',
      "status" TEXT NOT NULL DEFAULT 'NOVO', "convertido_empresa_id" TEXT, "convertido_em" TIMESTAMPTZ,
      "convertido_por" TEXT, "descartado_em" TIMESTAMPTZ, "descartado_por" TEXT, "descarte_motivo" TEXT,
      "created_at" TIMESTAMPTZ NOT NULL
    );
CREATE TABLE IF NOT EXISTS "contratos" (
      "id" TEXT PRIMARY KEY, "cliente_id" TEXT NOT NULL REFERENCES "clientes"("id"), "valor_base" NUMERIC(12,2) NOT NULL,
      "percentual_juros" NUMERIC(12,2) NOT NULL, "valor_final" NUMERIC(12,2) NOT NULL,
      "quantidade_parcelas" INTEGER NOT NULL, "data_inicio" DATE NOT NULL, "data_final" TEXT NOT NULL DEFAULT '',
      "estado" TEXT NOT NULL DEFAULT 'Ativo', "created_at" TIMESTAMPTZ NOT NULL, "updated_at" TIMESTAMPTZ NOT NULL,
      "deleted_at" TIMESTAMPTZ, "user_id" TEXT
    );
CREATE TABLE IF NOT EXISTS "parcelas" (
      "id" TEXT PRIMARY KEY, "contrato_id" TEXT NOT NULL REFERENCES "contratos"("id"), "numero" INTEGER NOT NULL,
      "valor_previsto" NUMERIC(12,2) NOT NULL, "valor_pago" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "saldo_pendente" NUMERIC(12,2) NOT NULL, "estado" TEXT NOT NULL DEFAULT 'Pendente',
      "data_vencimento" DATE NOT NULL, "data_quitacao" DATE, "created_at" TIMESTAMPTZ NOT NULL,
      "updated_at" TIMESTAMPTZ NOT NULL, "deleted_at" TIMESTAMPTZ
    );
CREATE TABLE IF NOT EXISTS "pagamentos" (
      "id" TEXT PRIMARY KEY, "contrato_id" TEXT NOT NULL REFERENCES "contratos"("id"), "valor" NUMERIC(12,2) NOT NULL,
      "data" DATE NOT NULL, "created_at" TIMESTAMPTZ NOT NULL, "user_id" TEXT,
      "estornado_em" TEXT, "estornado_por" TEXT, "estorno_motivo" TEXT
    );
CREATE TABLE IF NOT EXISTS "pagamento_parcelas" (
      "id" TEXT PRIMARY KEY, "pagamento_id" TEXT NOT NULL REFERENCES "pagamentos"("id"), "parcela_id" TEXT NOT NULL REFERENCES "parcelas"("id"),
      "valor" NUMERIC(12,2) NOT NULL
    );
CREATE TABLE IF NOT EXISTS "auditoria_estornos" (
      "id" TEXT PRIMARY KEY, "pagamento_id" TEXT NOT NULL REFERENCES "pagamentos"("id"), "operador_id" TEXT NOT NULL REFERENCES "usuarios"("id"),
      "admin_id" TEXT NOT NULL REFERENCES "usuarios"("id"), "valor" NUMERIC(12,2) NOT NULL, "motivo" TEXT NOT NULL,
      "data" DATE NOT NULL, "created_at" TIMESTAMPTZ NOT NULL
    );
CREATE TABLE IF NOT EXISTS "historico_operacional" (
      "id" TEXT PRIMARY KEY, "cliente_id" TEXT NOT NULL REFERENCES "clientes"("id"), "contrato_id" TEXT NOT NULL REFERENCES "contratos"("id"),
      "tipo" TEXT NOT NULL, "data_promessa" DATE, "created_at" TIMESTAMPTZ NOT NULL, "user_id" TEXT
    );
CREATE TABLE IF NOT EXISTS "anexos" (
      "id" TEXT PRIMARY KEY, "cliente_id" TEXT NOT NULL REFERENCES "clientes"("id"), "tipo" TEXT NOT NULL DEFAULT 'outro',
      "nome_original" TEXT NOT NULL, "mime" TEXT NOT NULL, "tamanho" INTEGER NOT NULL,
      "caminho" TEXT NOT NULL, "criado_por" TEXT NOT NULL, "created_at" TIMESTAMPTZ NOT NULL
    );
CREATE TABLE IF NOT EXISTS "caixa_config" (
      "user_id" TEXT PRIMARY KEY REFERENCES "usuarios"("id"), "caixa_base" NUMERIC(12,2) NOT NULL DEFAULT 0, "updated_at" TIMESTAMPTZ NOT NULL
    );
CREATE TABLE IF NOT EXISTS "auditoria_caixa" (
      "id" TEXT PRIMARY KEY, "operador_id" TEXT NOT NULL REFERENCES "usuarios"("id"), "admin_id" TEXT NOT NULL REFERENCES "usuarios"("id"),
      "valor_anterior" NUMERIC(12,2) NOT NULL, "valor_novo" NUMERIC(12,2) NOT NULL,
      "motivo" TEXT NOT NULL, "data" DATE NOT NULL, "created_at" TIMESTAMPTZ NOT NULL
    );
CREATE TABLE IF NOT EXISTS "auditoria_modulos" (
      "id" TEXT PRIMARY KEY, "empresa_id" TEXT NOT NULL, "admin_id" TEXT NOT NULL REFERENCES "usuarios"("id"), "tipo" TEXT NOT NULL,
      "antes" TEXT, "depois" TEXT, "force" INTEGER NOT NULL DEFAULT 0, "motivo" TEXT, "created_at" TIMESTAMPTZ NOT NULL
    );
CREATE TABLE IF NOT EXISTS "movimentacoes_financeiras" (
      "id" TEXT PRIMARY KEY, "tipo" TEXT NOT NULL, "valor" NUMERIC(12,2) NOT NULL,
      "origem" TEXT NOT NULL, "origem_id" TEXT NOT NULL, "descricao" TEXT, "data" DATE NOT NULL,
      "created_at" TIMESTAMPTZ NOT NULL, "user_id" TEXT
    );
CREATE TABLE IF NOT EXISTS "gastos" (
      "id" TEXT PRIMARY KEY, "valor" NUMERIC(12,2) NOT NULL, "categoria" TEXT NOT NULL,
      "observacao" TEXT, "data" DATE NOT NULL, "created_at" TIMESTAMPTZ NOT NULL, "deleted_at" TIMESTAMPTZ, "user_id" TEXT
    );
CREATE TABLE IF NOT EXISTS "fechamentos_semanais" (
      "id" TEXT PRIMARY KEY, "data_inicio" DATE NOT NULL, "data_fim" DATE NOT NULL,
      "total_recebido" NUMERIC(12,2) NOT NULL, "total_gasto" NUMERIC(12,2) NOT NULL,
      "resultado" NUMERIC(12,2) NOT NULL, "caixa_base" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "saldo_fechamento" NUMERIC(12,2) NOT NULL DEFAULT 0, "created_at" TIMESTAMPTZ NOT NULL, "user_id" TEXT
    );
CREATE TABLE IF NOT EXISTS "snapshots_atraso" (
      "id" TEXT PRIMARY KEY, "user_id" TEXT NOT NULL, "data" DATE NOT NULL,
      "clientes_atrasados" INTEGER NOT NULL, "contratos_atrasados" INTEGER NOT NULL,
      "valor_atrasado" NUMERIC(12,2) NOT NULL, "created_at" TIMESTAMPTZ NOT NULL
    );
CREATE TABLE IF NOT EXISTS "auth_tokens" (
      "id" TEXT PRIMARY KEY, "subject_id" TEXT NOT NULL, "tipo" TEXT NOT NULL, "hash" TEXT NOT NULL,
      "expira_em" TIMESTAMPTZ NOT NULL, "usado_em" TIMESTAMPTZ, "created_at" TIMESTAMPTZ NOT NULL
    );
-- Índices (espelham os do SQLite; justificados em PLAN-070 Fase F)
    CREATE UNIQUE INDEX IF NOT EXISTS "idx_clientes_cpf" ON "clientes"("cpf", "user_id") WHERE "cpf" IS NOT NULL AND "deleted_at" IS NULL;
    CREATE INDEX IF NOT EXISTS "idx_clientes_user" ON "clientes"("user_id", "deleted_at");
    -- Busca ILIKE com curinga inicial (Fase F — PLAN-070): GIN pg_trgm
    CREATE INDEX IF NOT EXISTS "idx_clientes_nome_trgm" ON "clientes" USING GIN ("nome" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "idx_movimentacoes_data" ON "movimentacoes_financeiras"("data");
    CREATE INDEX IF NOT EXISTS "idx_movimentacoes_origem" ON "movimentacoes_financeiras"("origem", "origem_id");
    CREATE INDEX IF NOT EXISTS "idx_movimentacoes_user" ON "movimentacoes_financeiras"("user_id", "data");
    CREATE INDEX IF NOT EXISTS "idx_parcelas_contrato" ON "parcelas"("contrato_id");
    CREATE INDEX IF NOT EXISTS "idx_parcelas_venc" ON "parcelas"("contrato_id", "data_vencimento", "saldo_pendente");
    CREATE INDEX IF NOT EXISTS "idx_parcelas_venc_partial" ON "parcelas"("contrato_id", "data_vencimento", "saldo_pendente") WHERE "saldo_pendente" > 0 AND "deleted_at" IS NULL;
    CREATE INDEX IF NOT EXISTS "idx_contratos_cliente" ON "contratos"("cliente_id");
    CREATE INDEX IF NOT EXISTS "idx_contratos_user" ON "contratos"("user_id", "deleted_at");
    CREATE INDEX IF NOT EXISTS "idx_pagamentos_contrato" ON "pagamentos"("contrato_id");
    CREATE INDEX IF NOT EXISTS "idx_pagamentos_user" ON "pagamentos"("user_id", "data");
    CREATE INDEX IF NOT EXISTS "idx_pagamento_parcelas_pagamento" ON "pagamento_parcelas"("pagamento_id");
    CREATE INDEX IF NOT EXISTS "idx_pagamento_parcelas_parcela" ON "pagamento_parcelas"("parcela_id");
    CREATE INDEX IF NOT EXISTS "idx_auditoria_caixa_operador" ON "auditoria_caixa"("operador_id");
    CREATE INDEX IF NOT EXISTS "idx_auditoria_caixa_data" ON "auditoria_caixa"("data");
    CREATE INDEX IF NOT EXISTS "idx_auditoria_estornos_pagamento" ON "auditoria_estornos"("pagamento_id");
    CREATE INDEX IF NOT EXISTS "idx_auditoria_estornos_operador" ON "auditoria_estornos"("operador_id");
    CREATE INDEX IF NOT EXISTS "idx_historico_operacional_dia" ON "historico_operacional"("cliente_id", "contrato_id", "created_at");
    CREATE INDEX IF NOT EXISTS "idx_historico_user" ON "historico_operacional"("user_id", "created_at");
    CREATE INDEX IF NOT EXISTS "idx_gastos_data" ON "gastos"("data");
    CREATE INDEX IF NOT EXISTS "idx_gastos_user" ON "gastos"("user_id", "data");
    CREATE INDEX IF NOT EXISTS "idx_fechamentos_semanais_data" ON "fechamentos_semanais"("data_inicio");
    CREATE INDEX IF NOT EXISTS "idx_fechamentos_user" ON "fechamentos_semanais"("user_id", "data_inicio");
    CREATE UNIQUE INDEX IF NOT EXISTS "idx_fechamentos_user_periodo" ON "fechamentos_semanais"("user_id", "data_inicio", "data_fim");
    CREATE UNIQUE INDEX IF NOT EXISTS "snapshots_atraso_user_data" ON "snapshots_atraso"("user_id", "data");
    CREATE INDEX IF NOT EXISTS "idx_snapshots_atraso_data" ON "snapshots_atraso"("user_id", "data");
    CREATE INDEX IF NOT EXISTS "idx_usuarios_empresa_role" ON "usuarios"("empresa_id", "role");
    CREATE INDEX IF NOT EXISTS "idx_anexos_cliente" ON "anexos"("cliente_id");
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
      "INSERT INTO usuarios (id, nome, email, \"senha_hash\", role, \"created_at\") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
      [adminId, "Admin", "admin@cobranca.com", hash, "admin", new Date().toISOString()],
    )
    const tables = [
      "clientes", "contratos", "pagamentos", "movimentacoes_financeiras",
      "caixa_config", "historico_operacional", "gastos", "fechamentos_semanais",
    ]
    for (const table of tables) {
      await pool.query(`UPDATE "${table}" SET "user_id" = $1 WHERE "user_id" IS NULL`, [adminId])
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
      "INSERT INTO usuarios (id, nome, email, \"senha_hash\", role, \"created_at\") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
      [superId, "Super Admin", superEmail, superHash, "super_admin", new Date().toISOString()],
    )
  }

  // Empresa "Desenvolvimento" + vínculo do admin + operadores órfãos
  const devEmpresa = await pool.query("SELECT id FROM empresas WHERE nome = $1", ["Desenvolvimento"])
  const totalEmpresas = await pool.query("SELECT COUNT(*) AS total FROM empresas")
  if (devEmpresa.rowCount === 0 && Number(totalEmpresas.rows[0].total) === 0) {
    const devEmpresaId = randomUUID()
    await pool.query(
      "INSERT INTO empresas (id, nome, \"created_at\") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [devEmpresaId, "Desenvolvimento", new Date().toISOString()],
    )
    await pool.query("UPDATE usuarios SET \"empresa_id\" = $1 WHERE email = $2 AND \"empresa_id\" IS NULL", [devEmpresaId, "admin@cobranca.com"])
    const adminRow = await pool.query<{ id: string; empresaId: string | null }>(
      "SELECT id, \"empresa_id\" FROM usuarios WHERE email = $1", ["admin@cobranca.com"],
    )
    if (adminRow.rows[0]?.empresaId) {
      await pool.query(
        "UPDATE usuarios SET \"empresa_id\" = $1 WHERE \"empresa_id\" IS NULL AND id != $2 AND role != 'super_admin'",
        [adminRow.rows[0].empresaId, adminRow.rows[0].id],
      )
    }
  }
}
