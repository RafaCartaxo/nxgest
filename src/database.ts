import Database from "better-sqlite3"
import type { Database as DatabaseType } from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core"
import { getLocalDateString } from "./shared/utils/parseDateLocal.js"
import { randomUUID } from "node:crypto"
import bcrypt from "bcryptjs"

const sqlite: DatabaseType = new Database(process.env.DB_PATH ?? "gestao.db")
export { sqlite }
sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

export const db = drizzle(sqlite)

export const clientes = sqliteTable("clientes", {
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
  lat: real("lat"),
  lng: real("lng"),
  comercioLogradouro: text("comercioLogradouro"),
  comercioNumero: text("comercioNumero"),
  comercioBairro: text("comercioBairro"),
  comercioCidade: text("comercioCidade"),
  comercioEstado: text("comercioEstado"),
  comercioLat: real("comercioLat"),
  comercioLng: real("comercioLng"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  deletedAt: text("deletedAt"),
  userId: text("userId"),
})

export const contratos = sqliteTable("contratos", {
  id: text("id").primaryKey(),
  clienteId: text("clienteId").notNull(),
  valorBase: real("valorBase").notNull(),
  percentualJuros: real("percentualJuros").notNull(),
  valorFinal: real("valorFinal").notNull(),
  quantidadeParcelas: integer("quantidadeParcelas").notNull(),
  dataInicio: text("dataInicio").notNull(),
  dataFinal: text("dataFinal").notNull(),
  estado: text("estado").notNull().default("Ativo"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  deletedAt: text("deletedAt"),
  userId: text("userId"),
})

export const parcelas = sqliteTable("parcelas", {
  id: text("id").primaryKey(),
  contratoId: text("contratoId").notNull(),
  numero: integer("numero").notNull(),
  valorPrevisto: real("valorPrevisto").notNull(),
  valorPago: real("valorPago").notNull().default(0),
  saldoPendente: real("saldoPendente").notNull(),
  estado: text("estado").notNull().default("Pendente"),
  dataVencimento: text("dataVencimento").notNull(),
  dataQuitacao: text("dataQuitacao"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  deletedAt: text("deletedAt"),
})

export const movimentacoesFinanceiras = sqliteTable("movimentacoesFinanceiras", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(),
  valor: real("valor").notNull(),
  origem: text("origem").notNull(),
  origemId: text("origemId").notNull(),
  descricao: text("descricao"),
  data: text("data").notNull(),
  createdAt: text("createdAt").notNull(),
  userId: text("userId"),
})

export const caixaConfig = sqliteTable("caixa_config", {
  userId: text("userId").primaryKey(),
  caixaBase: real("caixaBase").notNull().default(0),
  updatedAt: text("updatedAt").notNull(),
})

export const auditoriaCaixa = sqliteTable("auditoria_caixa", {
  id: text("id").primaryKey(),
  operadorId: text("operadorId").notNull(),
  adminId: text("adminId").notNull(),
  valorAnterior: real("valorAnterior").notNull(),
  valorNovo: real("valorNovo").notNull(),
  motivo: text("motivo").notNull(),
  data: text("data").notNull(),
  createdAt: text("createdAt").notNull(),
})

export const pagamentos = sqliteTable("pagamentos", {
  id: text("id").primaryKey(),
  contratoId: text("contratoId").notNull(),
  valor: real("valor").notNull(),
  data: text("data").notNull(),
  createdAt: text("createdAt").notNull(),
  userId: text("userId"),
  estornadoEm: text("estornadoEm"),
  estornadoPor: text("estornadoPor"),
  estornoMotivo: text("estornoMotivo"),
})

export const auditoriaEstornos = sqliteTable("auditoria_estornos", {
  id: text("id").primaryKey(),
  pagamentoId: text("pagamentoId").notNull(),
  operadorId: text("operadorId").notNull(),
  adminId: text("adminId").notNull(),
  valor: real("valor").notNull(),
  motivo: text("motivo").notNull(),
  data: text("data").notNull(),
  createdAt: text("createdAt").notNull(),
})

export const pagamentoParcelas = sqliteTable("pagamento_parcelas", {
  id: text("id").primaryKey(),
  pagamentoId: text("pagamentoId").notNull(),
  parcelaId: text("parcelaId").notNull(),
  valor: real("valor").notNull(),
})

export const historicoOperacional = sqliteTable("historico_operacional", {
  id: text("id").primaryKey(),
  clienteId: text("clienteId").notNull(),
  contratoId: text("contratoId").notNull(),
  tipo: text("tipo").notNull(),
  dataPromessa: text("dataPromessa"),
  createdAt: text("createdAt").notNull(),
  userId: text("userId"),
})

export const gastos = sqliteTable("gastos", {
  id: text("id").primaryKey(),
  valor: real("valor").notNull(),
  categoria: text("categoria").notNull(),
  observacao: text("observacao"),
  data: text("data").notNull(),
  createdAt: text("createdAt").notNull(),
  deletedAt: text("deletedAt"),
  userId: text("userId"),
})

export const fechamentosSemanais = sqliteTable("fechamentos_semanais", {
  id: text("id").primaryKey(),
  dataInicio: text("dataInicio").notNull(),
  dataFim: text("dataFim").notNull(),
  totalRecebido: real("totalRecebido").notNull(),
  totalGasto: real("totalGasto").notNull(),
  resultado: real("resultado").notNull(),
  caixaBase: real("caixaBase").notNull().default(0),
  saldoFechamento: real("saldoFechamento").notNull().default(0),
  createdAt: text("createdAt").notNull(),
  userId: text("userId"),
})

export const snapshotsAtraso = sqliteTable("snapshots_atraso", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  data: text("data").notNull(),
  clientesAtrasados: integer("clientesAtrasados").notNull(),
  contratosAtrasados: integer("contratosAtrasados").notNull(),
  valorAtrasado: real("valorAtrasado").notNull(),
  createdAt: text("createdAt").notNull(),
})

export const usuarios = sqliteTable("usuarios", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senhaHash").notNull(),
  role: text("role").notNull().default("operator"),
  createdAt: text("createdAt").notNull(),
  deletedAt: text("deletedAt"),
  empresaId: text("empresaId"),
})

export const empresas = sqliteTable("empresas", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  createdAt: text("createdAt").notNull(),
})

export async function createTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT,
      comercio TEXT NOT NULL,
      telefone TEXT NOT NULL,
      telefoneComercio TEXT,
      logradouro TEXT NOT NULL,
      numero TEXT,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      lat REAL,
      lng REAL,
      comercioLogradouro TEXT,
      comercioNumero TEXT,
      comercioBairro TEXT,
      comercioCidade TEXT,
      comercioEstado TEXT,
      comercioLat REAL,
      comercioLng REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      userId TEXT
    );

    CREATE TABLE IF NOT EXISTS contratos (
      id TEXT PRIMARY KEY,
      clienteId TEXT NOT NULL,
      valorBase REAL NOT NULL,
      percentualJuros REAL NOT NULL,
      valorFinal REAL NOT NULL,
      quantidadeParcelas INTEGER NOT NULL,
      dataInicio TEXT NOT NULL,
      dataFinal TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Ativo',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      userId TEXT,
      FOREIGN KEY (clienteId) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS parcelas (
      id TEXT PRIMARY KEY,
      contratoId TEXT NOT NULL,
      numero INTEGER NOT NULL,
      valorPrevisto REAL NOT NULL,
      valorPago REAL NOT NULL DEFAULT 0,
      saldoPendente REAL NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Pendente',
      dataVencimento TEXT NOT NULL,
      dataQuitacao TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      FOREIGN KEY (contratoId) REFERENCES contratos(id)
    );

    CREATE TABLE IF NOT EXISTS movimentacoesFinanceiras (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      valor REAL NOT NULL,
      origem TEXT NOT NULL,
      origemId TEXT NOT NULL,
      descricao TEXT,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      userId TEXT
    );

    CREATE TABLE IF NOT EXISTS caixa_config (
      userId TEXT PRIMARY KEY,
      caixaBase REAL NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auditoria_caixa (
      id TEXT PRIMARY KEY,
      operadorId TEXT NOT NULL,
      adminId TEXT NOT NULL,
      valorAnterior REAL NOT NULL,
      valorNovo REAL NOT NULL,
      motivo TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_auditoria_caixa_operador ON auditoria_caixa(operadorId);
    CREATE INDEX IF NOT EXISTS idx_auditoria_caixa_data ON auditoria_caixa(data);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf, userId) WHERE cpf IS NOT NULL AND deletedAt IS NULL;
    CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoesFinanceiras(data);
    CREATE INDEX IF NOT EXISTS idx_movimentacoes_origem ON movimentacoesFinanceiras(origem, origemId);
    CREATE INDEX IF NOT EXISTS idx_parcelas_contrato ON parcelas(contratoId);
    CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contratos(clienteId);

    CREATE TABLE IF NOT EXISTS pagamentos (
      id TEXT PRIMARY KEY,
      contratoId TEXT NOT NULL,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      userId TEXT,
      FOREIGN KEY (contratoId) REFERENCES contratos(id)
    );

    CREATE TABLE IF NOT EXISTS pagamento_parcelas (
      id TEXT PRIMARY KEY,
      pagamentoId TEXT NOT NULL,
      parcelaId TEXT NOT NULL,
      valor REAL NOT NULL,
      FOREIGN KEY (pagamentoId) REFERENCES pagamentos(id),
      FOREIGN KEY (parcelaId) REFERENCES parcelas(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pagamentos_contrato ON pagamentos(contratoId);
    CREATE INDEX IF NOT EXISTS idx_pagamento_parcelas_pagamento ON pagamento_parcelas(pagamentoId);
    CREATE INDEX IF NOT EXISTS idx_pagamento_parcelas_parcela ON pagamento_parcelas(parcelaId);

    CREATE TABLE IF NOT EXISTS auditoria_estornos (
      id TEXT PRIMARY KEY,
      pagamentoId TEXT NOT NULL,
      operadorId TEXT NOT NULL,
      adminId TEXT NOT NULL,
      valor REAL NOT NULL,
      motivo TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_auditoria_estornos_pagamento ON auditoria_estornos(pagamentoId);
    CREATE INDEX IF NOT EXISTS idx_auditoria_estornos_operador ON auditoria_estornos(operadorId);

    CREATE TABLE IF NOT EXISTS historico_operacional (
      id TEXT PRIMARY KEY,
      clienteId TEXT NOT NULL,
      contratoId TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('visitado', 'nao_localizado', 'promessa')),
      dataPromessa TEXT,
      createdAt TEXT NOT NULL,
      userId TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_historico_operacional_dia
      ON historico_operacional(clienteId, contratoId, createdAt);

    CREATE TABLE IF NOT EXISTS gastos (
      id TEXT PRIMARY KEY,
      valor REAL NOT NULL,
      categoria TEXT NOT NULL,
      observacao TEXT,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      deletedAt TEXT,
      userId TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_gastos_data ON gastos(data);

    CREATE TABLE IF NOT EXISTS fechamentos_semanais (
      id TEXT PRIMARY KEY,
      dataInicio TEXT NOT NULL,
      dataFim TEXT NOT NULL,
      totalRecebido REAL NOT NULL,
      totalGasto REAL NOT NULL,
      resultado REAL NOT NULL,
      caixaBase REAL NOT NULL DEFAULT 0,
      saldoFechamento REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      userId TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_fechamentos_semanais_data ON fechamentos_semanais(dataInicio);

    CREATE TABLE IF NOT EXISTS snapshots_atraso (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      data TEXT NOT NULL,
      clientesAtrasados INTEGER NOT NULL,
      contratosAtrasados INTEGER NOT NULL,
      valorAtrasado REAL NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE (userId, data)
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_atraso_data ON snapshots_atraso(userId, data DESC);

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senhaHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operator',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      deletedAt TEXT,
      empresaId TEXT
    );

    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

  `)

  // Migracao: adicionar coluna empresaId em bancos existentes (ignorar se ja existe)
  try { sqlite.exec("ALTER TABLE usuarios ADD COLUMN empresaId TEXT") } catch { /* ja existe */ }

  // Migracao: remover CHECK constraint de role para permitir super_admin
  try {
    sqlite.exec("DROP TABLE IF EXISTS usuarios_new")
    sqlite.exec("BEGIN IMMEDIATE")
    sqlite.exec(`
      CREATE TABLE usuarios_new (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senhaHash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'operator',
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        deletedAt TEXT,
        empresaId TEXT
      )
    `)
    sqlite.exec("INSERT INTO usuarios_new (id, nome, email, senhaHash, role, createdAt, deletedAt, empresaId) SELECT id, nome, email, senhaHash, role, createdAt, deletedAt, empresaId FROM usuarios")
    sqlite.exec("DROP TABLE usuarios")
    sqlite.exec("ALTER TABLE usuarios_new RENAME TO usuarios")
    sqlite.exec("COMMIT")
  } catch {
    try { sqlite.exec("ROLLBACK") } catch {}
  }

  // Migracao: adicionar coluna dataFinal em bancos existentes (ignorar se ja existe)
  try {
    sqlite.exec("ALTER TABLE contratos ADD COLUMN dataFinal TEXT NOT NULL DEFAULT ''")
    const semDataFinal = sqlite.prepare(
      "SELECT id, dataInicio, quantidadeParcelas FROM contratos WHERE dataFinal = ''"
    ).all() as { id: string; dataInicio: string; quantidadeParcelas: number }[]
    for (const row of semDataFinal) {
      const data = new Date(row.dataInicio)
      data.setDate(data.getDate() + row.quantidadeParcelas)
      if (data.getDay() === 0) {
        data.setDate(data.getDate() + 1)
      }
      const dataFinal = getLocalDateString(data)
      sqlite.prepare("UPDATE contratos SET dataFinal = ? WHERE id = ?").run(dataFinal, row.id)
    }
  } catch {
    // coluna ja existe (banco novo ou migracao ja aplicada)
  }

  // Migracao: normalizar datas ISO 8601 completas para date-only nas movimentacoes
  sqlite.exec(`
    UPDATE movimentacoesFinanceiras
    SET data = substr(data, 1, 10)
    WHERE length(data) > 10
  `)

  // Migracao: remover movimentacoes fantasma do ajuste manual do Caixa Base
  // O ajuste de Caixa Base nao deve gravar movimentacao (a base ja e contada via
  // caixaBase). Sem esta limpeza, saldo/lucro ficam dobrados em dados ja criados.
  // Nao toca no "Ajuste de valor base do contrato" (legitimo, outra descricao).
  sqlite.exec(`
    DELETE FROM movimentacoesFinanceiras
    WHERE origem = 'Ajuste' AND descricao = 'Ajuste manual do Caixa Base'
  `)

  // Migracao: adicionar coluna saldoFechamento em fechamentos_semanais existentes
  try {
    sqlite.exec("ALTER TABLE fechamentos_semanais ADD COLUMN saldoFechamento REAL NOT NULL DEFAULT 0")
  } catch {
    // coluna ja existe
  }

  // Migracao: adicionar coluna caixaBase em fechamentos_semanais existentes
  try {
    sqlite.exec("ALTER TABLE fechamentos_semanais ADD COLUMN caixaBase REAL NOT NULL DEFAULT 0")
  } catch {
    // coluna ja existe
  }

  // Migracao: adicionar coluna telefoneComercio em clientes existentes
  try {
    sqlite.exec("ALTER TABLE clientes ADD COLUMN telefoneComercio TEXT")
  } catch {
    // coluna ja existe
  }

  // Migracao: adicionar colunas de endereco do comercio em clientes existentes
  try { sqlite.exec("ALTER TABLE clientes ADD COLUMN comercioLogradouro TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE clientes ADD COLUMN comercioNumero TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE clientes ADD COLUMN comercioBairro TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE clientes ADD COLUMN comercioCidade TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE clientes ADD COLUMN comercioEstado TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE clientes ADD COLUMN comercioLat REAL") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE clientes ADD COLUMN comercioLng REAL") } catch { /* ja existe */ }

  // Migracao: colunas de estorno de pagamento (PLAN-028)
  try { sqlite.exec("ALTER TABLE pagamentos ADD COLUMN estornadoEm TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE pagamentos ADD COLUMN estornadoPor TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE pagamentos ADD COLUMN estornoMotivo TEXT") } catch { /* ja existe */ }

  // Migracao: adicionar coluna userId nas tabelas operacionais (ignorar se ja existe)
  try { sqlite.exec("ALTER TABLE clientes ADD COLUMN userId TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE contratos ADD COLUMN userId TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE pagamentos ADD COLUMN userId TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE movimentacoesFinanceiras ADD COLUMN userId TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE caixa_config ADD COLUMN userId TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE historico_operacional ADD COLUMN userId TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE gastos ADD COLUMN userId TEXT") } catch { /* ja existe */ }
  try { sqlite.exec("ALTER TABLE fechamentos_semanais ADD COLUMN userId TEXT") } catch { /* ja existe */ }

  // Migracao: recriar indice unico de CPF como composto (cpf, userId)
  // Antes: global — impedia mesmo CPF entre operadores diferentes
  // Depois: por operador — permite mesmo CPF em operadores diferentes
  try {
    sqlite.exec("DROP INDEX IF EXISTS idx_clientes_cpf")
    sqlite.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf, userId) WHERE cpf IS NOT NULL AND deletedAt IS NULL")
  } catch { /* indice ja atualizado */ }

  // Migracao: caixa_config passa a ter 1 linha por usuario (PK = userId)
  // Antes: PK id='default' (1 linha global) + userId — operador sem config => 404 no ajuste.
  // Depois: 1 linha por userId, criada sob demanda via getOrCreateCaixaConfig.
  // Rebuild (SQLite nao altera PK). Linha orfa (userId NULL) => vira do primeiro
  // admin/super_admin ativo; sem admin => descartada (getOrCreate recria).
  try {
    sqlite.exec("DROP TABLE IF EXISTS caixa_config_new")
    sqlite.exec("BEGIN IMMEDIATE")
    sqlite.exec(`
      CREATE TABLE caixa_config_new (
        userId TEXT PRIMARY KEY,
        caixaBase REAL NOT NULL DEFAULT 0,
        updatedAt TEXT NOT NULL
      )
    `)
    sqlite.exec(`
      INSERT INTO caixa_config_new (userId, caixaBase, updatedAt)
      SELECT
        COALESCE(
          cc.userId,
          (SELECT u.id FROM usuarios u WHERE u.role IN ('admin','super_admin') AND u.deletedAt IS NULL LIMIT 1)
        ),
        cc.caixaBase,
        cc.updatedAt
      FROM caixa_config cc
      WHERE COALESCE(
        cc.userId,
        (SELECT u.id FROM usuarios u WHERE u.role IN ('admin','super_admin') AND u.deletedAt IS NULL LIMIT 1)
      ) IS NOT NULL
    `)
    sqlite.exec("DROP TABLE caixa_config")
    sqlite.exec("ALTER TABLE caixa_config_new RENAME TO caixa_config")
    sqlite.exec("COMMIT")
  } catch {
    try { sqlite.exec("ROLLBACK") } catch {}
  }

  // Seed: admin default (se ainda nao existir)
  const adminExists = sqlite.prepare("SELECT id FROM usuarios WHERE email = ?").get("admin@cobranca.com")
  if (!adminExists) {
    const adminId = randomUUID()
    const hash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD ?? "admin123", 10)
    sqlite.prepare(
      "INSERT OR IGNORE INTO usuarios (id, nome, email, senhaHash, role) VALUES (?, ?, ?, ?, ?)"
    ).run(adminId, "Admin", "admin@cobranca.com", hash, "admin")

    // Backfill: associar dados existentes ao admin
    const tables = [
      "clientes", "contratos", "pagamentos", "movimentacoesFinanceiras",
      "caixa_config", "historico_operacional", "gastos", "fechamentos_semanais"
    ]
    for (const table of tables) {
      sqlite.prepare(`UPDATE ${table} SET userId = ? WHERE userId IS NULL`).run(adminId)
    }
  }

  // Seed: super_admin (se ainda nao existir)
  const superEmail = process.env.SUPER_ADMIN_EMAIL ?? "super@nxgestao.com"
  const superPassword = process.env.SUPER_ADMIN_DEFAULT_PASSWORD ?? "super123"
  const superExists = sqlite.prepare("SELECT id FROM usuarios WHERE email = ?").get(superEmail)
  if (!superExists) {
    const superId = randomUUID()
    const superHash = bcrypt.hashSync(superPassword, 10)
    sqlite.prepare(
      "INSERT OR IGNORE INTO usuarios (id, nome, email, senhaHash, role, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))"
    ).run(superId, "Super Admin", superEmail, superHash, "super_admin")
  }

  // Seed: empresa "Desenvolvimento" + backfill do admin existente
  // Só cria quando o banco não tem nenhuma empresa ainda (dev/reset). Se já há
  // empresas (ex.: seed-demo), não cria a "Desenvolvimento" fantasma a cada boot.
  const devEmpresaRow = sqlite.prepare("SELECT id FROM empresas WHERE nome = ?").get("Desenvolvimento") as { id: string } | undefined
  const totalEmpresas = (sqlite.prepare("SELECT COUNT(*) AS total FROM empresas").get() as { total: number }).total
  if (!devEmpresaRow && totalEmpresas === 0) {
    const devEmpresaId = randomUUID()
    sqlite.prepare(
      "INSERT OR IGNORE INTO empresas (id, nome, createdAt) VALUES (?, ?, datetime('now'))"
    ).run(devEmpresaId, "Desenvolvimento")

    // Vincular admin@cobranca.com à empresa Desenvolvimento
    sqlite.prepare(
      "UPDATE usuarios SET empresaId = ? WHERE email = ? AND empresaId IS NULL"
    ).run(devEmpresaId, "admin@cobranca.com")

    // Vincular operadores órfãos ao mesmo admin/empresa
    const adminRow = sqlite.prepare(
      "SELECT id, empresaId FROM usuarios WHERE email = ?"
    ).get("admin@cobranca.com") as { id: string; empresaId: string } | undefined

    if (adminRow) {
      sqlite.prepare(
        "UPDATE usuarios SET empresaId = ? WHERE empresaId IS NULL AND id != ? AND role != 'super_admin'"
      ).run(adminRow.empresaId, adminRow.id)
    }
  }
}
