#!/usr/bin/env node
// Seed de demonstração — dataset fake realista para o NX Gest.
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
// Uso: npm run seed:demo   (backend PARADO — o banco é reescrito)
import Database from "better-sqlite3"
import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import { copyFileSync } from "node:fs"

const DB_PATH = process.env.DB_PATH ?? "gestao.db"
const PASSWORD = "teste123!"
const TODAY = new Date()
TODAY.setHours(12, 0, 0, 0)

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

function calcularDataFinal(dataInicio, qtd) {
  let d = new Date(dataInicio)
  for (let i = 0; i < qtd; i++) d = nextBusinessDay(d)
  return dateStr(d)
}

// Gera parcelas diárias (mesma lógica do sistema), a partir de dataInicio
function gerarParcelas(contratoId, valorFinal, qtd, dataInicio) {
  const parcelaBase = Math.floor((valorFinal / qtd) * 100) / 100
  const residual = Math.round((valorFinal - parcelaBase * qtd) * 100) / 100
  const now = new Date().toISOString()
  let vencimento = new Date(dataInicio)
  const out = []
  for (let i = 0; i < qtd; i++) {
    const numero = i + 1
    const valorPrevisto = numero === qtd ? Math.round((parcelaBase + residual) * 100) / 100 : parcelaBase
    vencimento = nextBusinessDay(vencimento)
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

// ---------- Conecta e faz backup ----------
const ts = new Date().toISOString().replace(/[:.]/g, "-")
copyFileSync(DB_PATH, `${DB_PATH}.backup-${ts}`)
const sqlite = new Database(DB_PATH)
sqlite.pragma("foreign_keys = ON")
sqlite.pragma("journal_mode = WAL")
const nowISO = new Date().toISOString()

// ---------- Reset total ----------
sqlite.exec(`
  DELETE FROM pagamento_parcelas;
  DELETE FROM pagamentos;
  DELETE FROM parcelas;
  DELETE FROM contratos;
  DELETE FROM clientes;
  DELETE FROM movimentacoesFinanceiras;
  DELETE FROM gastos;
  DELETE FROM fechamentos_semanais;
  DELETE FROM snapshots_atraso;
  DELETE FROM historico_operacional;
  DELETE FROM caixa_config;
  DELETE FROM auditoria_caixa;
  DELETE FROM usuarios;
  DELETE FROM empresas;
`)

// ---------- Usuários ----------
const hash = bcrypt.hashSync(PASSWORD, 10)
const superId = randomUUID()
sqlite.prepare("INSERT INTO usuarios (id, nome, email, senhaHash, role, createdAt, empresaId) VALUES (?, ?, ?, ?, 'super_admin', ?, NULL)")
  .run(superId, "NX Gest", "super@nxgest.com", hash, nowISO)

const empresaIds = empresas.map(() => randomUUID())
const stmtEmpresa = sqlite.prepare("INSERT INTO empresas (id, nome, createdAt) VALUES (?, ?, ?)")
for (const [i, nome] of empresas.entries()) stmtEmpresa.run(empresaIds[i], nome, nowISO)

const stmtUser = sqlite.prepare("INSERT INTO usuarios (id, nome, email, senhaHash, role, createdAt, empresaId) VALUES (?, ?, ?, ?, ?, ?, ?)")
for (const a of admins) {
  stmtUser.run(randomUUID(), a.nome, a.email, hash, "admin", nowISO, empresaIds[a.empresa])
}
const operadorIds = {}
for (const o of operadores) {
  const id = randomUUID()
  operadorIds[o.email] = id
  stmtUser.run(id, o.nome, o.email, hash, "operator", nowISO, empresaIds[o.empresa])
}

// Total emprestado por operador (para definir caixa base ao final — cobertura + margem)
const totalEmprestado = {}
for (const o of operadores) totalEmprestado[operadorIds[o.email]] = 0

// ---------- Clientes, contratos, pagamentos, movimentações ----------
const stmtCliente = sqlite.prepare(`
  INSERT INTO clientes (id, nome, cpf, comercio, telefone, telefoneComercio, logradouro, numero,
    complemento, bairro, cidade, estado, lat, lng, comercioLogradouro, comercioNumero,
    comercioBairro, comercioCidade, comercioEstado, comercioLat, comercioLng,
    createdAt, updatedAt, userId)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const stmtContrato = sqlite.prepare(`
  INSERT INTO contratos (id, clienteId, valorBase, percentualJuros, valorFinal, quantidadeParcelas,
    dataInicio, dataFinal, estado, createdAt, updatedAt, userId)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const stmtParcela = sqlite.prepare(`
  INSERT INTO parcelas (id, contratoId, numero, valorPrevisto, valorPago, saldoPendente, estado,
    dataVencimento, dataQuitacao, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const stmtPagamento = sqlite.prepare(`
  INSERT INTO pagamentos (id, contratoId, valor, data, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?)
`)
const stmtPagParcela = sqlite.prepare(`
  INSERT INTO pagamento_parcelas (id, pagamentoId, parcelaId, valor) VALUES (?, ?, ?, ?)
`)
const stmtMov = sqlite.prepare(`
  INSERT INTO movimentacoesFinanceiras (id, tipo, valor, origem, origemId, descricao, data, createdAt, userId)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const stmtGasto = sqlite.prepare(`
  INSERT INTO gastos (id, valor, categoria, observacao, data, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?)
`)
const stmtHistorico = sqlite.prepare(`
  INSERT INTO historico_operacional (id, clienteId, contratoId, tipo, dataPromessa, createdAt, userId)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

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
    stmtCliente.run(
      clienteId, nome, cpf, pick(comercios), telefone, telefone, logradouro, numero,
      "", bairro, cidade, "PB", null, null,
      logradouro, numero, bairro, cidade, "PB", lat, lng,
      nowISO, nowISO, opId
    )
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
    stmtContrato.run(
      contratoId, clienteId, valorBase, 20, valorFinal, qtd,
      dataInicioStr, calcularDataFinal(dataInicio, qtd), "Ativo",
      nowISO, nowISO, opId
    )
    totalContratos++

    // Movimentação de criação do contrato (saída do valor base)
    stmtMov.run(
      randomUUID(), "saida", valorBase, "Contrato", contratoId,
      `Criação de contrato - ${qtd}x R$ ${(valorFinal / qtd).toFixed(2)}`,
      dataInicioStr, nowISO, opId
    )
    totalMov++

    // Parcelas
    const parcelas = gerarParcelas(contratoId, valorFinal, qtd, dataInicio)
    const parcelasPagas = Math.min(vencidas, Math.random() < 0.3 ? vencidas : rnd(0, vencidas))
    for (let i = 0; i < parcelas.length; i++) {
      const p = parcelas[i]
      const paga = i < parcelasPagas
      stmtParcela.run(
        p.id, p.contratoId, p.numero, p.valorPrevisto,
        paga ? p.valorPrevisto : 0,
        paga ? 0 : p.valorPrevisto,
        paga ? "Paga" : "Pendente",
        p.dataVencimento,
        paga ? p.dataVencimento : null,
        nowISO, nowISO
      )
      if (paga) {
        const pagId = randomUUID()
        stmtPagamento.run(pagId, contratoId, p.valorPrevisto, p.dataVencimento, nowISO, opId)
        stmtPagParcela.run(randomUUID(), pagId, p.id, p.valorPrevisto)
        stmtMov.run(
          randomUUID(), "entrada", p.valorPrevisto, "Pagamento", pagId,
          `Pagamento parcela ${p.numero}/${qtd}`,
          p.dataVencimento, nowISO, opId
        )
        totalPagamentos++
        totalMov++
      }
    }

    // Se todas as parcelas foram pagas, contrato finalizado
    if (parcelasPagas >= qtd) {
      sqlite.prepare("UPDATE contratos SET estado = 'Finalizado' WHERE id = ?").run(contratoId)
    }

    // Histórico operacional (visitas/promessas) para alguns contratos
    if (Math.random() < 0.4) {
      const tipo = Math.random() < 0.5 ? "visitado" : Math.random() < 0.6 ? "nao_localizado" : "promessa"
      const dataPromessa = tipo === "promessa" ? dateStr(addDays(TODAY, rnd(1, 5))) : null
      stmtHistorico.run(randomUUID(), clienteId, contratoId, tipo, dataPromessa, nowISO, opId)
    }
  }

  // Gastos por operador (1-3)
  const numGastos = rnd(1, 3)
  for (let g = 0; g < numGastos; g++) {
    const valor = rnd(15, 80) + Math.round(Math.random() * 90) / 100
    const diasAtras = rnd(0, 6)
    stmtGasto.run(
      randomUUID(), valor, pick(categoriasGasto), null,
      dateStr(addDays(TODAY, -diasAtras)), nowISO, opId
    )
    stmtMov.run(
      randomUUID(), "saida", valor, "Gasto", randomUUID(),
      pick(categoriasGasto), dateStr(addDays(TODAY, -diasAtras)), nowISO, opId
    )
    totalGastos++
    totalMov++
  }
}

// ---------- Caixa base por operador (cobertura dos empréstimos + margem) ----------
const stmtCaixa = sqlite.prepare("INSERT INTO caixa_config (userId, caixaBase, updatedAt) VALUES (?, ?, ?)")
for (const op of operadores) {
  const opId = operadorIds[op.email]
  const emprestado = totalEmprestado[opId] || 0
  // Base cobre o total emprestado com ~15% de margem (caixa realista e positivo)
  const caixaBase = Math.round((emprestado * 1.15 + rnd(0, 1000)) * 100) / 100
  stmtCaixa.run(opId, caixaBase, nowISO)
}

// ---------- Resumo ----------
const totalUsers = sqlite.prepare("SELECT COUNT(*) AS n FROM usuarios").get().n
const totalEmp = sqlite.prepare("SELECT COUNT(*) AS n FROM empresas").get().n
console.log("=== Seed de demonstração concluído ===")
console.log(`Backup: ${DB_PATH}.backup-${ts}`)
console.log(`Empresas: ${totalEmp} | Usuários: ${totalUsers} (1 super + ${admins.length} admins + ${operadores.length} operadores)`)
console.log(`Clientes: ${totalClientes} | Contratos: ${totalContratos} | Pagamentos: ${totalPagamentos} | Gastos: ${totalGastos} | Movimentações: ${totalMov}`)
console.log(`Senha padrão: ${PASSWORD}`)
console.log(`Super admin: NX Gest (super@nxgest.com)`)
console.log(`Admin de sistema: admin@cobranca.com`)
sqlite.close()
