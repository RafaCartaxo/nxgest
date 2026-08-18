#!/usr/bin/env node
// Seed de demonstração — dataset fake realista para o NX Gest (versão PostgreSQL, PLAN-070).
//
// RESET TOTAL: apaga todos os dados operacionais, usuários e empresas, e recria:
//   - Super admin "NX Gest" (super@nxgest.com)
//   - 4 empresas × 2 admins (admin@cobranca.com = conta de sistema, 1º admin da E1)
//   - 4 empresas × 5 operadores
//   - 10 clientes por operador (endereços de João Pessoa/PB e região)
//   - 1 contrato por cliente (juros 20%, 15-25 parcelas), com mix de pagos/vencidos
//   - Gastos, movimentações financeiras e caixa_base por operador
//
// Senha padrão de todos os usuários: teste123!
// Emails no padrão <segundo-nome>.nx@uorak.com
//
// Uso: DATABASE_URL=postgres://... npx tsx scripts/seed-demo.mjs
// (o schema deve existir — rodar scripts/create-schema.mjs antes)
import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import pg from "pg"

const { Pool, types } = pg
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)))
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)))

// Conexão direta via `pg` (sem depender de TS/tsx) para rodar com `node` no container de staging.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://nxgest:nxgest-dev@localhost:5433/nxgest",
  max: 5,
})

const PASSWORD = "teste123!"
const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

const q = async (sql, params = []) => {
  let i = 0
  const s = sql.replace(/\?/g, () => `$${++i}`)
  await pool.query(s, params)
}

function dateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// "Dia útil" = +1 dia, pulando domingo (mesma regra do gerar-parcelas do sistema)
function nextBusinessDay(date) {
  const d = addDays(date, 1)
  if (d.getDay() === 0) return addDays(d, 1)
  return d
}

// Dia útil anterior (recua 1 dia, pulando domingo)
function prevBusinessDay(date) {
  const d = addDays(date, -1)
  if (d.getDay() === 0) return addDays(d, -1)
  return d
}

// Gera a data final (diária ou semanal) — mesma lógica do sistema (PLAN-076)
function calcularDataFinal(dataInicio, qtd, periodicidade = "diaria") {
  const intervalo = periodicidade === "semanal" ? 7 : 1
  let d = new Date(dataInicio)
  for (let i = 0; i < qtd; i++) {
    d = addDays(d, intervalo)
    if (d.getDay() === 0) d = addDays(d, 1)
  }
  return dateStr(d)
}

// Gera parcelas (diárias ou semanais) — mesma lógica do sistema (PLAN-076)
function gerarParcelas(contratoId, valorFinal, qtd, dataInicio, periodicidade = "diaria") {
  const intervalo = periodicidade === "semanal" ? 7 : 1
  const parcelaBase = Math.floor((valorFinal / qtd) * 100) / 100
  const residual = Math.round((valorFinal - parcelaBase * qtd) * 100) / 100
  const now = TODAY.toISOString()
  let vencimento = new Date(dataInicio)
  const out = []
  for (let i = 0; i < qtd; i++) {
    const numero = i + 1
    const valorPrevisto = numero === qtd ? Math.round((parcelaBase + residual) * 100) / 100 : parcelaBase
    vencimento = addDays(vencimento, intervalo)
    if (vencimento.getDay() === 0) vencimento = addDays(vencimento, 1)
    out.push({
      id: randomUUID(),
      contratoId,
      numero,
      valorPrevisto,
      valorPago: 0,
      saldoPendente: valorPrevisto,
      estado: "Pendente",
      dataVencimento: dateStr(vencimento),
      dataQuitacao: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }
  return out
}

// Gera um CPF válido (algoritmo real de dígitos verificadores)
function gerarCpf() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const calc = (digits) => {
    const sum = digits.reduce((acc, d, i) => acc + d * (digits.length + 1 - i), 0)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  const d1 = calc(base)
  const d2 = calc([...base, d1])
  return base.join("") + d1 + d2
}

// ---------- Dados fixos: empresas, admins e operadores ----------
const empresas = [
  "CrediFácil Cobranças",
  "Paraíba Gestão de Crédito",
  "Nordeste Recuperadora",
  "Capital Fomento",
]

// Emails padrão: <segundo-nome>.nx@uorak.com (segundos nomes únicos globalmente)
const admins = [
  { empresa: 0, nome: "Rafael Cartaxo Borges", email: "admin@cobranca.com" }, // conta de sistema
  { empresa: 0, nome: "Maria Clara Vasconcelos", email: "clara.nx@uorak.com" },
  { empresa: 1, nome: "José Eduardo Lima", email: "eduardo.nx@uorak.com" },
  { empresa: 1, nome: "Fernanda Luiza Sales", email: "luiza.nx@uorak.com" },
  { empresa: 2, nome: "Paulo Henrique Rocha", email: "henrique.nx@uorak.com" },
  { empresa: 2, nome: "Juliana Beatriz Nunes", email: "beatriz.nx@uorak.com" },
  { empresa: 3, nome: "Carlos Augusto Melo", email: "augusto.nx@uorak.com" },
  { empresa: 3, nome: "Patrícia Regina Dantas", email: "regina.nx@uorak.com" },
]

const operadores = [
  { empresa: 0, nome: "João Pedro Oliveira", email: "pedro.nx@uorak.com" },
  { empresa: 0, nome: "Ana Sofia Ferreira", email: "sofia.nx@uorak.com" },
  { empresa: 0, nome: "Lucas Gabriel Santos", email: "gabriel.nx@uorak.com" },
  { empresa: 0, nome: "Camila Vitória Costa", email: "vitoria.nx@uorak.com" },
  { empresa: 0, nome: "Matheus Davi Alves", email: "davi.nx@uorak.com" },
  { empresa: 1, nome: "Bruno Rafael Sousa", email: "rafael.nx@uorak.com" },
  { empresa: 1, nome: "Larissa Emília Campos", email: "emilia.nx@uorak.com" },
  { empresa: 1, nome: "Thiago André Ramos", email: "andre.nx@uorak.com" },
  { empresa: 1, nome: "Bianca Larissa Melo", email: "larissa.nx@uorak.com" },
  { empresa: 1, nome: "Diego Samuel Tavares", email: "samuel.nx@uorak.com" },
  { empresa: 2, nome: "Felipe Rodrigo Barros", email: "rodrigo.nx@uorak.com" },
  { empresa: 2, nome: "Natália Cristina Rangel", email: "cristina.nx@uorak.com" },
  { empresa: 2, nome: "Vinícius César Lopes", email: "cesar.nx@uorak.com" },
  { empresa: 2, nome: "Amanda Letícia Farias", email: "leticia.nx@uorak.com" },
  { empresa: 2, nome: "Gustavo Otávio Pereira", email: "otavio.nx@uorak.com" },
  { empresa: 3, nome: "Renata Isabela Nóbrega", email: "isabela.nx@uorak.com" },
  { empresa: 3, nome: "Marcos Paulo Vilela", email: "paulo.nx@uorak.com" },
  { empresa: 3, nome: "Letícia Bianca Guedes", email: "bianca.nx@uorak.com" },
  { empresa: 3, nome: "Gabriel Nina Duarte", email: "nina.nx@uorak.com" },
  { empresa: 3, nome: "Cláudia Valentina Sales", email: "valentina.nx@uorak.com" },
]

// ---------- Dados variáveis: endereços de João Pessoa/PB e região ----------
const bairrosJP = [
  "Manaíra", "Tambaú", "Bessa", "Mangabeira", "Bancários", "Valentina",
  "Altiplano", "Torre", "Centro", "Jaguaribe", "Cabo Branco",
  "Jardim Oceania", "Miramar", "Castelo Branco", "Cruz das Armas",
  "Oitizeiro", "Funcionários", "Água Fria", "João Paulo II", "Brisamar",
]
const cidadesPB = ["João Pessoa", "Cabedelo", "Bayeux", "Santa Rita", "Conde", "Lucena"]
const ruas = [
  "Av. Epitácio Pessoa", "Rua das Trincheiras", "Av. Pres. Epitácio Pessoa",
  "Rua Diogo Dias", "Av. João Maurício", "Rua Severino Lucena",
  "Av. Getúlio Vargas", "Rua Coração de Jesus", "Rua da Areia",
  "Av. Tancredo Neves", "Rua Miguel Couto", "Av. Senador Ruy Carneiro",
  "Rua Cardoso Vieira", "Rua das Acácias", "Av. Hilton Souto Maior",
]
const primeirosNomes = [
  "Antônio", "Carlos", "Francisco", "José", "Maria", "Ana", "Luiz", "Pedro",
  "Paulo", "Marcos", "João", "José", "Maria", "Sandra", "Lúcia", "Rosa",
  "Valdir", "Sebastião", "Joana", "Eliane", "Cícero", "Josélia", "Alcides",
  "Marinete", "Gilberto", "Cristiane", "Edvaldo", "Marlene", "Washington", "Ivone",
]
const sobrenomes = [
  "da Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa",
  "Ferreira", "Almeida", "Nascimento", "Carvalho", "Gomes", "Martins",
  "Rodrigues", "Barbosa", "Araújo", "Moreira", "Cardoso", "Correia", "Dantas",
]
const comercios = [
  "Padaria Pão Dourado", "Mercadinho São José", "Farmácia Vida", "Restaurante Sabor Caseiro",
  "Loja de Roupas Estilo", "Supermercado Bom Preço", "Lanchonete do Zé", "Açougue Boi Forte",
  "Distribuidora de Bebidas Central", "Oficina Mecânica JP", "Pet Shop Amigo Fiel",
  "Papelaria Escolar", "Salão de Beleza Brilho", "Borracheiro Estrada", "Vidraçaria Cristal",
  "Loja de Variedades Popular", "Pastelaria da Praça", "Hortifruti Verde Vida",
  "Farmácia São Bento", "Mercadinho Bom Jesus",
]
const categoriasGasto = [
  "Combustível", "Alimentação", "Material de escritório", "Recarga", "Manutenção",
]

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ---------- Reset total ----------
// Timestamps no INÍCIO do dia local (TODAY 00:00) — `TODAY.toISOString()` cai sempre
// dentro do range do dia local (rangeDoDiaLocal usa as fronteiras do relógio local).
// Antes usava MEIO-DIA local, o que gerava created_at "no futuro" relativo a execuções
// de madrugada UTC (00:00–12:00Z) — cenários que criam entidades com `now` e consultam
// listas `ORDER BY created_at DESC LIMIT N` perdiam a entidade recém-criada (fora da
// página 1). Com 00:00 local, todo `now` de runtime fica > seed (determinístico).
const nowISO = TODAY.toISOString()
// Ordem filho→pai (respeita as FKs — PLAN-070 modelo).
const RESET_TABLES = [
  "pagamento_parcelas", "auditoria_estornos", "pagamentos", "parcelas",
  "historico_operacional", "anexos", "caixa_config", "auditoria_caixa",
  "auditoria_modulos", "contratos", "clientes", "movimentacoes_financeiras",
  "gastos", "fechamentos_semanais", "snapshots_atraso", "auth_tokens",
  "leads", "convites", "usuarios", "empresas",
]
for (const table of RESET_TABLES) await q(`DELETE FROM "${table}"`)

// ---------- Usuários ----------
const hash = bcrypt.hashSync(PASSWORD, 10)
const superId = randomUUID()
await q("INSERT INTO usuarios (id, nome, email, \"senha_hash\", role, \"created_at\", \"empresa_id\") VALUES ($1, $2, $3, $4, 'super_admin', $5, NULL)",
  [superId, "NX Gest", "super@nxgest.com", hash, nowISO])

const empresaIds = empresas.map(() => randomUUID())
for (const [i, nome] of empresas.entries()) {
  await q("INSERT INTO empresas (id, nome, \"created_at\") VALUES ($1, $2, $3)", [empresaIds[i], nome, nowISO])
}

for (const a of admins) {
  await q("INSERT INTO usuarios (id, nome, email, \"senha_hash\", role, \"created_at\", \"empresa_id\") VALUES ($1, $2, $3, $4, 'admin', $5, $6)",
    [randomUUID(), a.nome, a.email, hash, nowISO, empresaIds[a.empresa]])
}
const operadorIds = {}
for (const o of operadores) {
  const id = randomUUID()
  operadorIds[o.email] = id
  await q("INSERT INTO usuarios (id, nome, email, \"senha_hash\", role, \"created_at\", \"empresa_id\") VALUES ($1, $2, $3, $4, 'operator', $5, $6)",
    [id, o.nome, o.email, hash, nowISO, empresaIds[o.empresa]])
}

// Total emprestado por operador (para definir caixa base ao final — cobertura + margem)
const totalEmprestado = {}
for (const o of operadores) totalEmprestado[operadorIds[o.email]] = 0

// ---------- Clientes, contratos, pagamentos, movimentações ----------
const SQL_CLIENTE = `INSERT INTO clientes (id, nome, cpf, comercio, telefone, "telefone_comercio", logradouro, numero,
    complemento, bairro, cidade, estado, lat, lng, "comercio_logradouro", "comercio_numero",
    "comercio_bairro", "comercio_cidade", "comercio_estado", "comercio_lat", "comercio_lng",
    "created_at", "updated_at", "user_id")
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
const SQL_CONTRATO = `INSERT INTO contratos (id, "cliente_id", "valor_base", "percentual_juros", "valor_final", "quantidade_parcelas",
    "data_inicio", "data_final", periodicidade, estado, "created_at", "updated_at", "user_id")
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
const SQL_PARCELA = `INSERT INTO parcelas (id, "contrato_id", numero, "valor_previsto", "valor_pago", "saldo_pendente", estado,
    "data_vencimento", "data_quitacao", "created_at", "updated_at")
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
const SQL_PAGAMENTO = `INSERT INTO pagamentos (id, "contrato_id", valor, data, "created_at", "user_id") VALUES (?, ?, ?, ?, ?, ?)`
const SQL_PAG_PARCELA = `INSERT INTO pagamento_parcelas (id, "pagamento_id", "parcela_id", valor) VALUES (?, ?, ?, ?)`
const SQL_MOV = `INSERT INTO "movimentacoes_financeiras" (id, tipo, valor, origem, "origem_id", descricao, data, "created_at", "user_id")
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
const SQL_GASTO = `INSERT INTO gastos (id, valor, categoria, observacao, data, "created_at", "user_id") VALUES (?, ?, ?, ?, ?, ?, ?)`
const SQL_HISTORICO = `INSERT INTO historico_operacional (id, "cliente_id", "contrato_id", tipo, "data_promessa", "created_at", "user_id")
  VALUES (?, ?, ?, ?, ?, ?, ?)`

const cpfsUsados = new Set()
let totalClientes = 0
let totalContratos = 0
let totalPagamentos = 0
let totalMov = 0
let totalGastos = 0

for (const op of operadores) {
  const opId = operadorIds[op.email]

  // 10 clientes por operador
  for (let c = 0; c < 10; c++) {
    let cpf = gerarCpf()
    while (cpfsUsados.has(cpf)) cpf = gerarCpf()
    cpfsUsados.add(cpf)

    const nome = `${pick(primeirosNomes)} ${pick(sobrenomes)}`
    const cidade = Math.random() < 0.8 ? "João Pessoa" : pick(cidadesPB)
    const bairro = cidade === "João Pessoa" ? pick(bairrosJP) : "Centro"
    const logradouro = pick(ruas)
    const numero = String(rnd(10, 999))
    const telefone = `83${rnd(90000, 99999)}${rnd(1000, 9999)}`
    const lat = Number((Math.random() * 0.12 + -7.12).toFixed(6))
    const lng = Number((Math.random() * 0.14 + -34.88).toFixed(6))

    const clienteId = randomUUID()
    await q(SQL_CLIENTE, [
      clienteId, nome, cpf, pick(comercios), telefone, telefone, logradouro, numero,
      "", bairro, cidade, "PB", null, null,
      logradouro, numero, bairro, cidade, "PB", lat, lng,
      nowISO, nowISO, opId,
    ])
    totalClientes++

    // 1 contrato por cliente: juros 20%, 15-25 parcelas
    const qtd = rnd(15, 25)
    const valorBase = rnd(40, 60) * 50 // R$ 2.000 a R$ 3.000
    const valorFinal = Math.round(valorBase * 1.2 * 100) / 100
    totalEmprestado[opId] += valorBase

    // Fraciona os vencidos: alguns recém-criados, outros com atraso/pagamentos
    const fracaoVencida = Math.random()
    const vencidas = Math.max(1, Math.round(qtd * (fracaoVencida < 0.3 ? 0.35 : fracaoVencida)))
    // Recua "vencidas" dias úteis a partir de hoje para que as primeiras
    // parcelas caiam no passado (atrasadas) e o restante no futuro.
    let dataInicio = new Date(TODAY)
    for (let i = 0; i < vencidas; i++) dataInicio = prevBusinessDay(dataInicio)
    const dataInicioStr = dateStr(dataInicio)

    const contratoId = randomUUID()
    await q(SQL_CONTRATO, [
      contratoId, clienteId, valorBase, 20, valorFinal, qtd,
      dataInicioStr, calcularDataFinal(dataInicio, qtd), "diaria", "Ativo",
      nowISO, nowISO, opId,
    ])
    totalContratos++

    // Movimentação de criação do contrato (saída do valor base)
    await q(SQL_MOV, [
      randomUUID(), "saida", valorBase, "Contrato", contratoId,
      `Criação de contrato - ${qtd}x R$ ${(valorFinal / qtd).toFixed(2)}`,
      dataInicioStr, nowISO, opId,
    ])
    totalMov++

    // Parcelas
    const parcelas = gerarParcelas(contratoId, valorFinal, qtd, dataInicio)
    const parcelasPagas = Math.min(vencidas, Math.random() < 0.3 ? vencidas : rnd(0, vencidas))
    for (let i = 0; i < parcelas.length; i++) {
      const p = parcelas[i]
      const paga = i < parcelasPagas
      await q(SQL_PARCELA, [
        p.id, p.contratoId, p.numero, p.valorPrevisto,
        paga ? p.valorPrevisto : 0,
        paga ? 0 : p.valorPrevisto,
        paga ? "Paga" : "Pendente",
        p.dataVencimento,
        paga ? p.dataVencimento : null,
        nowISO, nowISO,
      ])
      if (paga) {
        const pagId = randomUUID()
        await q(SQL_PAGAMENTO, [pagId, contratoId, p.valorPrevisto, p.dataVencimento, nowISO, opId])
        await q(SQL_PAG_PARCELA, [randomUUID(), pagId, p.id, p.valorPrevisto])
        await q(SQL_MOV, [
          randomUUID(), "entrada", p.valorPrevisto, "Pagamento", pagId,
          `Pagamento parcela ${p.numero}/${qtd}`,
          p.dataVencimento, nowISO, opId,
        ])
        totalPagamentos++
        totalMov++
      }
    }

    // Se todas as parcelas foram pagas, contrato finalizado
    if (parcelasPagas >= qtd) {
      await q("UPDATE contratos SET estado = 'Finalizado' WHERE id = $1", [contratoId])
    }
    // Histórico operacional (visitas/promessas) para alguns contratos
    if (Math.random() < 0.4) {
      const tipo = Math.random() < 0.5 ? "visitado" : Math.random() < 0.6 ? "nao_localizado" : "promessa"
      const dataPromessa = tipo === "promessa" ? dateStr(addDays(TODAY, rnd(1, 5))) : null
      await q(SQL_HISTORICO, [randomUUID(), clienteId, contratoId, tipo, dataPromessa, nowISO, opId])
    }
  }

  // Gastos por operador (1-3)
  const numGastos = rnd(1, 3)
  for (let g = 0; g < numGastos; g++) {
    const valor = rnd(15, 80) + Math.round(Math.random() * 90) / 100
    const diasAtras = rnd(0, 6)
    await q(SQL_GASTO, [
      randomUUID(), valor, pick(categoriasGasto), null,
      dateStr(addDays(TODAY, -diasAtras)), nowISO, opId,
    ])
    await q(SQL_MOV, [
      randomUUID(), "saida", valor, "Gasto", randomUUID(),
      pick(categoriasGasto), dateStr(addDays(TODAY, -diasAtras)), nowISO, opId,
    ])
    totalGastos++
    totalMov++
  }
}

// ---------- Contrato SEMANAL de exemplo (PLAN-076) — primeiro cliente do primeiro operador ----------
{
  const opId = operadorIds[operadores[0].email]
  const row = (await pool.query(
    `SELECT c.id, c.nome FROM clientes c WHERE c."user_id" = $1 AND c."deleted_at" IS NULL ORDER BY c."created_at" ASC LIMIT 1`,
    [opId]
  )).rows[0]
  if (row) {
    const qtdSem = 4
    const valorBaseSem = 400
    const valorFinalSem = Math.round(valorBaseSem * 1.2 * 100) / 100
    // Inicia na próxima segunda-feira (evita domingo — BR semanal)
    let dataInicioSem = new Date(TODAY)
    while (dataInicioSem.getDay() !== 1) dataInicioSem = addDays(dataInicioSem, 1)
    const dataInicioSemStr = dateStr(dataInicioSem)
    const contratoSemId = randomUUID()
    await q(SQL_CONTRATO, [
      contratoSemId, row.id, valorBaseSem, 20, valorFinalSem, qtdSem,
      dataInicioSemStr, calcularDataFinal(dataInicioSem, qtdSem, "semanal"), "semanal", "Ativo",
      nowISO, nowISO, opId,
    ])
    totalContratos++
    await q(SQL_MOV, [
      randomUUID(), "saida", valorBaseSem, "Contrato", contratoSemId,
      `Criação de contrato semanal - ${qtdSem}x R$ ${(valorFinalSem / qtdSem).toFixed(2)}`,
      dataInicioSemStr, nowISO, opId,
    ])
    totalMov++
    const parcelasSem = gerarParcelas(contratoSemId, valorFinalSem, qtdSem, dataInicioSem, "semanal")
    for (const p of parcelasSem) {
      await q(SQL_PARCELA, [
        p.id, p.contratoId, p.numero, p.valorPrevisto,
        0, p.valorPrevisto, "Pendente",
        p.dataVencimento, null, nowISO, nowISO,
      ])
    }
  }
}

// ---------- Caixa base por operador (cobertura dos empréstimos + margem) ----------
for (const op of operadores) {
  const opId = operadorIds[op.email]
  const emprestado = totalEmprestado[opId] || 0
  // Base cobre o total emprestado com ~15% de margem (caixa realista e positivo)
  const caixaBase = Math.round((emprestado * 1.15 + rnd(0, 1000)) * 100) / 100
  await q("INSERT INTO caixa_config (\"user_id\", \"caixa_base\", \"updated_at\") VALUES ($1, $2, $3)", [opId, caixaBase, nowISO])
}

// ---------- Resumo ----------
const totalUsers = (await pool.query("SELECT COUNT(*) AS n FROM usuarios")).rows[0].n
const totalEmp = (await pool.query("SELECT COUNT(*) AS n FROM empresas")).rows[0].n
console.log("=== Seed de demonstração concluído ===")
console.log(`Empresas: ${totalEmp} | Usuários: ${totalUsers} (1 super + ${admins.length} admins + ${operadores.length} operadores)`)
console.log(`Clientes: ${totalClientes} | Contratos: ${totalContratos} | Pagamentos: ${totalPagamentos} | Gastos: ${totalGastos} | Movimentações: ${totalMov}`)
console.log(`Senha padrão: ${PASSWORD}`)
console.log(`Super admin: NX Gest (super@nxgest.com)`)
console.log(`Admin de sistema: admin@cobranca.com`)
await pool.end()
