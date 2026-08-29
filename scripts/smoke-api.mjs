#!/usr/bin/env node
/**
 * Smoke test da API — valida os fluxos reais usados pelo frontend (07-CASOS-DE-USO-API).
 *
 * Uso: node scripts/smoke-api.mjs [--baseUrl http://localhost:3002]
 *
 * Requer instância isolada (ex.: DATABASE_URL=postgres://... PORT=3002 npx tsx src/main.ts)
 * com o seed aplicado (senha padrão teste123!).
 *
 * Não testa rate limit (429) — bloquearia o IP da própria execução.
 */
import pg from "pg"
import { createHash, randomUUID } from "node:crypto"

const { Pool, types } = pg
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)))
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)))

const SMOKE_POOL = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://nxgest:nxgest-dev@localhost:5433/nxgest",
  max: 2,
})

/** Leituras diretas no banco isolado (auditoria). Retorna -1 se indisponível. */
async function auditoriaCount(tipo, empresaId) {
  try {
    const { rows } = await SMOKE_POOL.query("SELECT COUNT(*)::int AS c FROM auditoria_modulos WHERE tipo = $1 AND \"empresa_id\" = $2", [tipo, empresaId])
    return rows[0]?.c ?? 0
  } catch {
    return -1
  }
}

/** Conta tokens de `auth_tokens` (PLAN-065) por sujeito/tipo. -1 se indisponível. */
async function authTokensCount(subjectId, tipo, naoUsadosOnly = false) {
  try {
    const sql = `SELECT COUNT(*)::int AS c FROM auth_tokens WHERE \"subject_id\" = $1 AND tipo = $2${naoUsadosOnly ? " AND \"usado_em\" IS NULL" : ""}`
    const { rows } = await SMOKE_POOL.query(sql, [subjectId, tipo])
    return rows[0]?.c ?? 0
  } catch {
    return -1
  }
}

/** Insere um token conhecido (raw) p/ testar ativar/reset sem ler o console. */
async function inserirAuthToken(subjectId, tipo, rawToken, expiraEm, usadoEm = null) {
  const hash = createHash("sha256").update(rawToken).digest("hex")
  await SMOKE_POOL.query(
    "INSERT INTO auth_tokens (id, \"subject_id\", tipo, hash, \"expira_em\", \"usado_em\", \"created_at\") VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [randomUUID(), subjectId, tipo, hash, expiraEm, usadoEm, new Date().toISOString()],
  )
}

/** Conta convites de `convites` (N2) por usuário/status. -1 se indisponível. */
async function convitesCount(usuarioId, statuses = ["PENDENTE"]) {
  try {
    const sql = `SELECT COUNT(*)::int AS c FROM convites WHERE "usuario_id" = $1${statuses.length ? " AND status = ANY($2)" : ""}`
    const { rows } = await SMOKE_POOL.query(sql, statuses.length ? [usuarioId, statuses] : [usuarioId])
    return rows[0]?.c ?? 0
  } catch {
    return -1
  }
}

/** Insere um convite PENDENTE conhecido na tabela `convites` (P-04/N2). */
async function inserirConvite(usuarioId, emailAlvo, rawToken, expiraEm) {
  const hash = createHash("sha256").update(rawToken).digest("hex")
  await SMOKE_POOL.query(
    "INSERT INTO convites (id, \"usuario_id\", \"email_alvo\", \"criado_por\", \"role_alvo\", idioma, status, \"token_hash\", \"criado_em\", \"expira_em\") VALUES ($1, $2, $3, NULL, NULL, 'pt-BR', 'PENDENTE', $4, $5, $6)",
    [randomUUID(), usuarioId, emailAlvo, hash, new Date().toISOString(), expiraEm],
  )
}

/** Ativa um usuário convidado pelo fluxo real (convite → POST /auth/ativar). */
async function ativarUsuario(usuarioId, email, senha = SENHA) {
  const raw = `rawtoken-smoke-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  await inserirConvite(usuarioId, email, raw, new Date(Date.now() + 3600e3).toISOString())
  const r = await req("POST", "/api/auth/ativar", { body: { token: raw, senha } })
  if (r.status !== 200) throw new Error(`ativar usuário falhou: ${r.status} ${JSON.stringify(r.data)?.slice(0, 200)}`)
}

/** Hash SHA-256 de um token (para comparar o que está no banco — SE-06). */
function sha256(token) {
  return createHash("sha256").update(token).digest("hex")
}
const baseUrlIdx = process.argv.indexOf("--baseUrl")
const baseUrlArg = baseUrlIdx !== -1 ? process.argv[baseUrlIdx + 1] : undefined
const BASE = baseUrlArg || "http://localhost:3002"

const SENHA = "teste123!"
const results = []
let pass = 0
let fail = 0

function t(id, name, fn) {
  return (async () => {
    const start = Date.now()
    try {
      await fn()
      results.push({ id, name, ok: true, ms: Date.now() - start })
      pass++
    } catch (e) {
      results.push({ id, name, ok: false, ms: Date.now() - start, err: e.message })
      fail++
    }
  })()
}

async function req(method, path, { token, body, query } = {}) {
  const qs = query ? "?" + new URLSearchParams(query).toString() : ""
  const headers = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(BASE + path + qs, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch { /* 204/empty */ }
  return { status: res.status, data }
}

/** Requisição multipart (formdata) — uploads de anexos. */
async function reqForm(path, { token, fields }) {
  const form = new FormData()
  for (const f of fields) {
    if (f.buffer) form.append(f.key, new Blob([f.buffer], { type: f.type }), f.filename)
    else form.append(f.key, f.value)
  }
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(BASE + path, { method: "POST", headers, body: form })
  let data = null
  try { data = await res.json() } catch { /* empty */ }
  return { status: res.status, data }
}

function expect(r, status, ctx) {
  if (r.status !== status) {
    throw new Error(`${ctx}: esperava ${status}, recebi ${r.status} ${JSON.stringify(r.data)?.slice(0, 200)}`)
  }
  return r
}

const CPF_A = "39053344705"  // CPF válido
const CPF_B = "11144477735"  // CPF válido (diferente)

async function main() {
  // ---------- LOGIN ----------
  const adminLogin = await req("POST", "/api/auth/login", { body: { email: "admin@cobranca.com", senha: SENHA } })
  const superLogin = await req("POST", "/api/auth/login", { body: { email: "super@nxgest.com", senha: SENHA } })
  const opLogin = await req("POST", "/api/auth/login", { body: { email: "gabriel.nx@uorak.com", senha: SENHA } })
  const adminToken = adminLogin.data?.token
  const superToken = superLogin.data?.token
  const opToken = opLogin.data?.token
  const gabrielId = opLogin.data?.usuario?.id

  await t("AUTH-002", "Login válido admin (200, role)", async () => {
    expect(adminLogin, 200, "login admin")
    if (adminLogin.data.usuario.role !== "admin") throw new Error("role não é admin")
  })
  await t("AUTH-003", "Login inválido (401)", async () => {
    const r = await req("POST", "/api/auth/login", { body: { email: "gabriel.nx@uorak.com", senha: "errada" } })
    expect(r, 401, "login inválido")
  })
  await t("AUTH-005", "GET /auth/me (200)", async () => {
    const r = await req("GET", "/api/auth/me", { token: opToken })
    expect(r, 200, "me")
  })
  await t("AUTH-006", "GET /auth/me sem token (401)", async () => {
    const r = await req("GET", "/api/auth/me")
    expect(r, 401, "me sem token")
  })

  // ---------- SAÚDE ----------
  await t("HEA-001", "GET /api/health (200)", async () => {
    const r = await req("GET", "/api/health")
    expect(r, 200, "health")
  })

  // ---------- PERMISSÃO: operator em rotas admin ----------
  await t("ADM-057", "Operator em /admin/operadores (403)", async () => {
    const r = await req("GET", "/api/admin/operadores", { token: opToken })
    expect(r, 403, "operator admin list")
  })
  await t("CAX-045", "Operator em /caixa/ajuste (403)", async () => {
    const r = await req("POST", "/api/caixa/ajuste", { token: opToken, body: { valor: 100, motivo: "x" } })
    expect(r, 403, "operator ajuste")
  })
  await t("PAG-033", "Operator em estornar (403)", async () => {
    const r = await req("POST", "/api/pagamentos/00000000-0000-4000-8000-000000000000/estornar", { token: opToken, body: { motivo: "x" } })
    expect(r, 403, "operator estorno")
  })
  await t("EMP-070", "Admin (não super) em /admin/empresas (403)", async () => {
    const r = await req("GET", "/api/admin/empresas", { token: adminToken })
    expect(r, 403, "admin empresas")
  })

  // ---------- OPERADOR: dashboard / operações ----------
  await t("OPS-018", "GET /operacoes/cobrancas (200)", async () => {
    const r = await req("GET", "/api/operacoes/cobrancas", { token: opToken })
    expect(r, 200, "cobrancas")
    if (!Array.isArray(r.data.cobrancas)) throw new Error("cobrancas não é array")
    if (typeof r.data.indicadores?.aReceberHoje !== "number") throw new Error("indicadores incompletos")
    if (r.data.cobrancas.length > 0) {
      const item = r.data.cobrancas[0]
      if (typeof item.diasEmAtraso !== "number") throw new Error("cobrancas[0].diasEmAtraso ausente (PLAN-047)")
      if (item.situacao === "atrasado" && item.diasEmAtraso < 1) throw new Error("atrasado sem diasEmAtraso >= 1")
      if (item.situacao === "venceHoje" && item.diasEmAtraso !== 0) throw new Error("venceHoje com diasEmAtraso != 0")
    }
  })
  await t("OPS-020", "GET /operacoes/parcelas-hoje (200)", async () => {
    const r = await req("GET", "/api/operacoes/parcelas-hoje", { token: opToken })
    expect(r, 200, "parcelas-hoje")
  })
  await t("OPS-021", "GET /operacoes/parcelas-semana (200, exclui hoje)", async () => {
    const r = await req("GET", "/api/operacoes/parcelas-semana", { token: opToken })
    expect(r, 200, "parcelas-semana")
  })
  await t("OPS-019", "GET /operacoes/pagamentos-hoje (200)", async () => {
    const r = await req("GET", "/api/operacoes/pagamentos-hoje", { token: opToken })
    expect(r, 200, "pagamentos-hoje")
    if (Array.isArray(r.data) && r.data.length > 0) {
      const p = r.data[0]
      if (typeof p.parcelasPagas !== "object" || !Array.isArray(p.parcelasPagas)) throw new Error("parcelasPagas deve ser array")
      if (typeof p.totalParcelasContrato !== "number") throw new Error("totalParcelasContrato deve ser número")
    }
  })
  await t("OPS-022", "GET /operacoes/historico-atrasos (200)", async () => {
    const r = await req("GET", "/api/operacoes/historico-atrasos", { token: opToken })
    expect(r, 200, "historico-atrasos")
  })

  // ---------- OPERADOR: visita ----------
  let cobranca
  await t("OPS-035", "Pega 1ª cobrança pendente (p/ visitar)", async () => {
    const r = await req("GET", "/api/operacoes/cobrancas", { token: opToken })
    expect(r, 200, "cobrancas")
    // Escolhe uma cobrança SEM visita do dia (PENDENTE): se pegar uma que o seed já
    // visitou com created_at = meio-dia local (futuro relativo ao smoke de madrugada),
    // a subquery `ORDER BY created_at DESC LIMIT 1` prefere a do seed → OPS-040 falharia.
    cobranca = r.data.cobrancas.find((c) => c.resultadoOperacional === "PENDENTE") ?? r.data.cobrancas[0]
    if (!cobranca) throw new Error("nenhuma cobrança pendente no seed")
  })
  await t("OPS-040", "Registrar visita visitado (201) e marca VISITADO na lista", async () => {
    const r = await req("POST", "/api/operacoes/visitas", { token: opToken, body: { clienteId: cobranca.clienteId, contratoId: cobranca.contratoId, tipo: "visitado" } })
    expect(r, 201, "visita visitado")
    const after = await req("GET", "/api/operacoes/cobrancas", { token: opToken })
    expect(after, 200, "cobrancas pós-visita")
    const item = after.data.cobrancas.find((c) => c.clienteId === cobranca.clienteId && c.contratoId === cobranca.contratoId)
    if (!item) throw new Error("cobrança sumiu da lista (API devolve marcadas; front filtra PENDENTE)")
    if (item.resultadoOperacional !== "VISITADO") throw new Error(`resultadoOperacional=${item.resultadoOperacional} (esperava VISITADO)`)
  })
  await t("OPS-N1", "Promessa sem dataPromessa (422, gap 9)", async () => {
    const r = await req("POST", "/api/operacoes/visitas", { token: opToken, body: { clienteId: cobranca.clienteId, contratoId: cobranca.contratoId, tipo: "promessa" } })
    expect(r, 422, "promessa sem data")
  })
  await t("OPS-N2", "Promessa com dataPromessa (201)", async () => {
    const r = await req("POST", "/api/operacoes/visitas", { token: opToken, body: { clienteId: cobranca.clienteId, contratoId: cobranca.contratoId, tipo: "promessa", dataPromessa: "2026-08-05" } })
    expect(r, 201, "promessa com data")
  })
  await t("OPS-041", "Tipo inválido (422)", async () => {
    const r = await req("POST", "/api/operacoes/visitas", { token: opToken, body: { clienteId: cobranca.clienteId, contratoId: cobranca.contratoId, tipo: "invalido" } })
    expect(r, 422, "tipo inválido")
  })

  // ---------- OPERADOR: cliente ----------
  let clienteId, clienteSemContrato
  await t("CLI-007", "POST /clientes válido (201, endereco aninhado)", async () => {
    const r = await req("POST", "/api/clientes", {
      token: opToken,
      body: { nome: "Cliente Smoke", telefone: "83988887777", cpf: CPF_A, comercio: "Comércio Smoke", endereco: { logradouro: "Rua das Flores", numero: "100", bairro: "Centro", cidade: "João Pessoa", estado: "PB" } },
    })
    expect(r, 201, "criar cliente")
    clienteId = r.data.id
    clienteSemContrato = r.data.id
  })
  await t("CLI-008", "CPF duplicado (409)", async () => {
    const r = await req("POST", "/api/clientes", { token: opToken, body: { nome: "Duplicado", telefone: "83988887777", cpf: CPF_A, comercio: "X", endereco: { logradouro: "Rua A" } } })
    expect(r, 409, "cpf duplicado")
  })
  await t("CLI-009", "CPF inválido (422)", async () => {
    const r = await req("POST", "/api/clientes", { token: opToken, body: { nome: "Invalido", telefone: "83988887777", cpf: "12345678900", comercio: "X", endereco: { logradouro: "Rua A" } } })
    expect(r, 422, "cpf inválido")
  })
  await t("CLI-014", "POST /clientes sem endereço pessoal (201, BR-044)", async () => {
    const r = await req("POST", "/api/clientes", { token: opToken, body: { nome: "Cliente Sem Endereço", telefone: "83988889999", cpf: "44116530603", comercio: "Comércio X" } })
    expect(r, 201, "criar cliente sem endereço pessoal")
    const g = await req("GET", `/api/clientes/${r.data.id}`, { token: opToken })
    expect(g, 200, "buscar cliente sem endereço")
    if (g.data.endereco.logradouro != null) throw new Error("logradouro deveria ser null")
  })
  await t("CLI-010", "GET /clientes (200, escopado)", async () => {
    const r = await req("GET", "/api/clientes", { token: opToken })
    expect(r, 200, "listar clientes")
  })
  await t("CLI-011", "GET /clientes/:id (200 + situação financeira)", async () => {
    const r = await req("GET", `/api/clientes/${clienteId}`, { token: opToken })
    expect(r, 200, "detalhe cliente")
    const c = r.data
    for (const f of ["saldoDevedor", "valorEmAtraso", "parcelasEmAtraso", "diasEmAtraso", "valorVenceHoje", "lucroPrevisto", "lucroRealizado"]) {
      if (typeof c[f] !== "number") throw new Error(`cliente detalhe: campo ${f} ausente/não-numérico (BR-096/098)`)
    }
    if (c.ultimoPagamento != null && (typeof c.ultimoPagamento.data !== "string" || typeof c.ultimoPagamento.valor !== "number")) {
      throw new Error("cliente detalhe: ultimoPagamento com shape inválido (BR-097)")
    }
  })
  await t("CLI-013", "PATCH /clientes/:id (200)", async () => {
    const r = await req("PATCH", `/api/clientes/${clienteId}`, { token: opToken, body: { nome: "Cliente Smoke Editado" } })
    expect(r, 200, "editar cliente")
  })

  // ---------- PLAN-083 Fase 6: busca sem acento + multi-campo (QP-11/12) ----------
  const BUS_CPF = "76171855960"
  let busId
  await t("BUS-PREP", "cria clientes de busca (nome com acento + comércio)", async () => {
    const a = await req("POST", "/api/clientes", { token: opToken, body: { nome: "João Gomes", telefone: "83988880101", cpf: BUS_CPF, comercio: "Padaria Açaí", endereco: { logradouro: "Rua A" } } })
    expect(a, 201, "criar cliente acentuado")
    busId = a.data.id
  })
  await t("BUS-UNACCENT", "busca sem acento: ?q=joao acha 'João Gomes' (e ?q=João)", async () => {
    const r1 = await req("GET", `/api/clientes?q=joao`, { token: opToken })
    expect(r1, 200, "busca joao")
    if (!r1.data.data.some((c) => c.id === busId)) throw new Error("q=joao não achou cliente acentuado")
    const r2 = await req("GET", `/api/clientes?q=${encodeURIComponent("João")}`, { token: opToken })
    expect(r2, 200, "busca João")
    if (!r2.data.data.some((c) => c.id === busId)) throw new Error("q=João não achou cliente")
  })
  await t("BUS-MULTI", "busca multi-campo: ?q=acai (comércio) e ?q=<parte do CPF>", async () => {
    const r1 = await req("GET", `/api/clientes?q=acai`, { token: opToken })
    expect(r1, 200, "busca acai")
    if (!r1.data.data.some((c) => c.id === busId)) throw new Error("q=acai não achou por comércio")
    const r2 = await req("GET", `/api/clientes?q=${BUS_CPF.slice(0, 5)}`, { token: opToken })
    expect(r2, 200, "busca por CPF")
    if (!r2.data.data.some((c) => c.id === busId)) throw new Error("busca por CPF não achou cliente")
  })

  // ---------- PLAN-055: localização (GPS) — persistência (P1..P7) ----------
  let geoCli
  await t("GEO-001", "Criar com localizacao (principal) + localizacaoComercio (P1)", async () => {
    const r = await req("POST", "/api/clientes", {
      token: opToken,
      body: {
        nome: "Geo Smoke", telefone: "83988886666", comercio: "Comércio Geo",
        endereco: { logradouro: "Rua Principal", numero: "1", bairro: "Centro", cidade: "JP", estado: "PB" },
        localizacao: { lat: -7.11, lng: -34.86 },
        enderecoComercio: { logradouro: "Av Comercio", numero: "10", bairro: "Bairro", cidade: "JP", estado: "PB" },
        localizacaoComercio: { lat: -7.12, lng: -34.87 },
      },
    })
    expect(r, 201, "criar com localização")
    geoCli = r.data.id
  })
  await t("GEO-002", "GET reflete localizacao + localizacaoComercio (P1)", async () => {
    const r = await req("GET", `/api/clientes/${geoCli}`, { token: opToken })
    expect(r, 200, "detalhe geo")
    if (!r.data.localizacao || r.data.localizacao.lat !== -7.11) throw new Error("localizacao principal ausente (PLAN-055)")
    if (!r.data.localizacaoComercio || r.data.localizacaoComercio.lat !== -7.12) throw new Error("localizacaoComercio ausente")
  })
  await t("GEO-003", "PATCH texto do comércio sem localizacaoComercio → coords MANTIDAS (semântica backend; fix envia null)", async () => {
    const r = await req("PATCH", `/api/clientes/${geoCli}`, { token: opToken, body: { enderecoComercio: { logradouro: "Av Comercio Editada", numero: "10", bairro: "Bairro", cidade: "JP", estado: "PB" } } })
    expect(r, 200, "patch texto comércio")
    const got = await req("GET", `/api/clientes/${geoCli}`, { token: opToken })
    if (!got.data.localizacaoComercio) throw new Error("coords deveriam MANTER sem localizacaoComercio:null (fix é enviar null no frontend)")
  })
  await t("GEO-004", "PATCH localizacaoComercio: null → coords do comércio ZERADAS (P3)", async () => {
    const r = await req("PATCH", `/api/clientes/${geoCli}`, { token: opToken, body: { localizacaoComercio: null } })
    expect(r, 200, "limpar coords comércio")
    const got = await req("GET", `/api/clientes/${geoCli}`, { token: opToken })
    if (got.data.localizacaoComercio !== null) throw new Error("coords do comércio não zeraram")
  })
  await t("GEO-005", "PATCH localizacao: null → coords do principal ZERADAS (P2)", async () => {
    const r = await req("PATCH", `/api/clientes/${geoCli}`, { token: opToken, body: { localizacao: null } })
    expect(r, 200, "limpar coords principal")
    const got = await req("GET", `/api/clientes/${geoCli}`, { token: opToken })
    if (got.data.localizacao !== null) throw new Error("coords do principal não zeraram")
  })
  await t("GEO-006", "PATCH só localizacaoComercio nova → substitui e mantém texto (P5)", async () => {
    await req("PATCH", `/api/clientes/${geoCli}`, { token: opToken, body: { localizacaoComercio: { lat: -7.99, lng: -34.99 } } })
    const got = await req("GET", `/api/clientes/${geoCli}`, { token: opToken })
    if (got.data.localizacaoComercio?.lat !== -7.99) throw new Error("coords não substituíram")
    if (!got.data.enderecoComercio?.logradouro) throw new Error("texto do comércio não deveria mudar")
  })
  await t("GEO-007", "Criar com localizacaoComercio SEM texto do comércio é permitido (S7 — navega por ponto)", async () => {
    const r = await req("POST", "/api/clientes", {
      token: opToken,
      body: { nome: "Geo S7", telefone: "83988885555", comercio: "X", endereco: { logradouro: "Rua S7", cidade: "JP", estado: "PB" }, localizacaoComercio: { lat: -7.2, lng: -34.8 } },
    })
    expect(r, 201, "coords sem texto (S7)")
  })

  // ---------- EDIÇÃO DE CLIENTE (P8 — foto/gps/endereço) ----------
  let cliEditId
  const cliFoto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA=="
  await t("CLI-E0", "Setup: cliente de edição (com endereço completo)", async () => {
    const r = await req("POST", "/api/clientes", {
      token: opToken,
      body: { nome: "Cliente Edit", telefone: "83988889999", comercio: "Edit Comércio", endereco: { logradouro: "Rua Edit", numero: "5", bairro: "Centro", cidade: "João Pessoa", estado: "PB" }, enderecoComercio: { logradouro: "Av Edit", numero: "10", bairro: "Bairro", cidade: "JP", estado: "PB" } },
    })
    expect(r, 201, "criar cliente edit")
    cliEditId = r.data.id
  })
  await t("CLI-E1", "PATCH cliente sem foto/GPS (foto:null + coords null) = 200 (regressão P8)", async () => {
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, {
      token: opToken,
      body: { foto: null, enderecoComercio: null, localizacao: null, localizacaoComercio: null },
    })
    expect(r, 200, "edição sem foto/GPS")
  })
  await t("CLI-E2", "PATCH cliente com foto dataURL (200) + GET reflete", async () => {
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, { token: opToken, body: { foto: cliFoto } })
    expect(r, 200, "salvar foto")
    const g = await req("GET", `/api/clientes/${cliEditId}`, { token: opToken })
    expect(g, 200, "detalhe")
    if (g.data.foto !== cliFoto) throw new Error("foto não refletida")
  })
  await t("CLI-E3", "PATCH cliente com enderecoComercio + localizacaoComercio (200) + GET reflete", async () => {
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, {
      token: opToken,
      body: { enderecoComercio: { logradouro: "Av Nova", numero: "99", bairro: "Novo", cidade: "JP", estado: "PB" }, localizacaoComercio: { lat: -7.11, lng: -34.87 } },
    })
    expect(r, 200, "edição completa")
    const g = await req("GET", `/api/clientes/${cliEditId}`, { token: opToken })
    expect(g, 200, "detalhe")
    if (g.data.enderecoComercio?.logradouro !== "Av Nova") throw new Error("enderecoComercio não refletido")
    if (g.data.localizacaoComercio?.lat !== -7.11) throw new Error("localizacaoComercio não refletida")
  })
  await t("CLI-E4", "PATCH foto:null remove (200) + GET foto null", async () => {
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, { token: opToken, body: { foto: null } })
    expect(r, 200, "remover foto")
    const g = await req("GET", `/api/clientes/${cliEditId}`, { token: opToken })
    if (g.data.foto != null) throw new Error("foto não removida")
  })
  await t("CLI-E5", "PATCH foto não-dataURL = 422 (validação P8)", async () => {
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, { token: opToken, body: { foto: "https://exemplo.com/foto.jpg" } })
    expect(r, 422, "foto inválida")
  })

  // PLAN-058: foto de alta resolução + segurança by-design (allowlist MIME + magic bytes)
  const b64 = (buf) => Buffer.from(buf).toString("base64")
  const fotoGrande = `data:image/jpeg;base64,${b64([0xff, 0xd8, 0xff, 0xe0, ...new Array(150 * 1024).fill(0x00)])}`
  await t("CLI-E6", "PATCH foto grande válida (~150KB decod.) = 200 (cap elevado PLAN-058)", async () => {
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, { token: opToken, body: { foto: fotoGrande } })
    expect(r, 200, "foto grande")
  })
  await t("CLI-E7", "PATCH foto data:image/svg+xml = 422 (allowlist exclui svg)", async () => {
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, { token: opToken, body: { foto: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" } })
    expect(r, 422, "svg rejeitado")
  })
  await t("CLI-E8", "PATCH foto mascarada (base64 de texto como jpeg) = 422 (magic bytes)", async () => {
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, { token: opToken, body: { foto: `data:image/jpeg;base64,${b64("isto não é uma imagem de verdade")}` } })
    expect(r, 422, "conteúdo mascarado rejeitado")
  })
  await t("CLI-E9", "PATCH foto > 1MB decodificados = 422 (teto)", async () => {
    const gigante = `data:image/jpeg;base64,${b64([0xff, 0xd8, 0xff, ...new Array(1100 * 1024).fill(0x00)])}`
    const r = await req("PATCH", `/api/clientes/${cliEditId}`, { token: opToken, body: { foto: gigante } })
    expect(r, 422, "foto acima do teto")
  })

  // cliente de OUTRO operador (sofia) → 404 para gabriel
  let sofiaClientId
  await t("CLI-012", "Cliente de outro operador (404)", async () => {
    const sofiaLogin = await req("POST", "/api/auth/login", { body: { email: "sofia.nx@uorak.com", senha: SENHA } })
    expect(sofiaLogin, 200, "login sofia")
    const criado = await req("POST", "/api/clientes", {
      token: sofiaLogin.data.token,
      body: { nome: "Cliente da Sofia", telefone: "83999998888", cpf: CPF_B, comercio: "Comércio Sofia", endereco: { logradouro: "Rua B", cidade: "João Pessoa", estado: "PB" } },
    })
    expect(criado, 201, "criar cliente como sofia")
    sofiaClientId = criado.data.id
    const r = await req("GET", `/api/clientes/${sofiaClientId}`, { token: opToken })
    expect(r, 404, "cliente de outro operador")
  })
  await t("CLI-016", "DELETE cliente com contratos (409)", async () => {
    // cobranca.clienteId = cliente do gabriel COM contratos pendentes
    const r = await req("DELETE", `/api/clientes/${cobranca.clienteId}`, { token: opToken })
    expect(r, 409, "delete cliente com contrato")
  })

  // ---------- ANEXOS (PLAN-042) ----------
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
  const pdfBuffer = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(512, 0x20)])
  let anexoId
  await t("ANE-089", "POST anexo imagem (201) + lista reflete", async () => {
    const r = await reqForm(`/api/clientes/${clienteId}/anexos`, {
      token: opToken,
      fields: [
        { key: "arquivo", filename: "comprovante.jpg", type: "image/jpeg", buffer: jpegBuffer },
        { key: "tipo", value: "comprovante-residencia" },
      ],
    })
    expect(r, 201, "upload imagem")
    anexoId = r.data.id
    if (r.data.mime !== "image/jpeg") throw new Error("mime real não detectado")
    const lista = await req("GET", `/api/clientes/${clienteId}/anexos`, { token: opToken })
    expect(lista, 200, "listar anexos")
    if (!lista.data.some((a) => a.id === anexoId)) throw new Error("anexo não está na lista")
  })
  await t("ANE-090", "POST anexo PDF (201)", async () => {
    const r = await reqForm(`/api/clientes/${clienteId}/anexos`, {
      token: opToken,
      fields: [{ key: "arquivo", filename: "conta.pdf", type: "application/pdf", buffer: pdfBuffer }],
    })
    expect(r, 201, "upload pdf")
    if (r.data.mime !== "application/pdf") throw new Error("mime pdf não detectado")
  })
  await t("ANE-092", "Tipo inválido por MIME real (422 ANEXO_TIPO)", async () => {
    const r = await reqForm(`/api/clientes/${clienteId}/anexos`, {
      token: opToken,
      fields: [{ key: "arquivo", filename: "fake.exe", type: "application/octet-stream", buffer: Buffer.from("MZ\x90\x00") }],
    })
    expect(r, 422, "tipo inválido")
    if (r.data.code !== "ANEXO_TIPO") throw new Error("code esperado ANEXO_TIPO")
  })
  await t("ANE-091", "Imagem >1MB (422 ANEXO_LIMITE)", async () => {
    const big = Buffer.concat([jpegBuffer, Buffer.alloc(2 * 1024 * 1024, 0x00)])
    const r = await reqForm(`/api/clientes/${clienteId}/anexos`, {
      token: opToken,
      fields: [{ key: "arquivo", filename: "gigante.jpg", type: "image/jpeg", buffer: big }],
    })
    expect(r, 422, "limite imagem")
    if (r.data.code !== "ANEXO_LIMITE") throw new Error("code esperado ANEXO_LIMITE")
  })
  await t("ANE-093", "GET file autenticado (200) + DELETE (204)", async () => {
    const res = await fetch(`${BASE}/api/clientes/${clienteId}/anexos/${anexoId}/file`, {
      headers: { Authorization: `Bearer ${opToken}` },
    })
    if (res.status !== 200) throw new Error(`file: esperava 200, recebi ${res.status}`)
    const del = await req("DELETE", `/api/clientes/${clienteId}/anexos/${anexoId}`, { token: opToken })
    expect(del, 204, "remover anexo")
    const depois = await req("GET", `/api/clientes/${clienteId}/anexos`, { token: opToken })
    if (depois.data.some((a) => a.id === anexoId)) throw new Error("anexo não foi removido")
  })
  await t("ANE-X1", "Escopo: anexos de cliente de outro operador (404)", async () => {
    const sofia = await req("POST", "/api/auth/login", { body: { email: "sofia.nx@uorak.com", senha: SENHA } })
    expect(sofia, 200, "login sofia")
    const r = await req("GET", `/api/clientes/${clienteId}/anexos`, { token: sofia.data.token })
    expect(r, 404, "fora do escopo")
  })

  await t("CLI-015", "DELETE cliente sem contratos (204)", async () => {
    const r = await req("DELETE", `/api/clientes/${clienteSemContrato}`, { token: opToken })
    expect(r, 204, "delete cliente sem contrato")
  })

  // ---------- SETUP: caixa base alta (via admin — dependência do contrato) ----------
  await t("CAX-044", "Admin ajusta caixa do operador (201 + auditoria)", async () => {
    const r = await req("POST", "/api/caixa/ajuste", { token: adminToken, body: { valor: 100000, motivo: "Smoke test — caixa para contrato" }, query: { usuarioId: gabrielId } })
    expect(r, 201, "ajuste caixa")
    const aud = await req("GET", "/api/caixa/auditoria", { token: adminToken, query: { usuarioId: gabrielId } })
    expect(aud, 200, "auditoria")
    if (!aud.data.data?.some((a) => a.valorNovo === 100000)) throw new Error("ajuste não registrado na auditoria")
  })

  // ---------- OPERADOR: contrato ----------
  let contratoId
  let saldoAntes
  let clienteContratoId
  await t("CTR-PRE", "Cliente novo para o contrato (201)", async () => {
    const r = await req("POST", "/api/clientes", {
      token: opToken,
      body: { nome: "Cliente Contrato", telefone: "83977776666", comercio: "Comércio Contrato", endereco: { logradouro: "Rua C", cidade: "João Pessoa", estado: "PB" } },
    })
    expect(r, 201, "criar cliente para contrato")
    clienteContratoId = r.data.id
  })
  await t("CAX-042", "GET /caixa antes (baseline)", async () => {
    const r = await req("GET", "/api/caixa", { token: opToken })
    expect(r, 200, "caixa antes")
    saldoAntes = r.data.saldoAtual
  })
  await t("CTR-017", "POST /contratos válido (201, percentualJuros)", async () => {
    const r = await req("POST", "/api/contratos", {
      token: opToken,
      body: { clienteId: clienteContratoId, valorBase: 500, percentualJuros: 20, quantidadeParcelas: 4, dataInicio: "2026-08-04" },
    })
    expect(r, 201, "criar contrato")
    contratoId = r.data.id
    if (r.data.valorFinal !== 600) throw new Error(`valorFinal=${r.data.valorFinal} (esperava 600)`)
  })
  await t("CTR-COH1", "Coerência: saldo caiu valorBase após contrato", async () => {
    const r = await req("GET", "/api/caixa", { token: opToken })
    expect(r, 200, "caixa após contrato")
    const diff = saldoAntes - r.data.saldoAtual
    if (Math.abs(diff - 500) > 0.01) throw new Error(`saldo caiu ${diff} (esperava 500)`)
  })
  await t("CTR-018", "Caixa insuficiente (422)", async () => {
    const r = await req("POST", "/api/contratos", { token: opToken, body: { clienteId: clienteContratoId, valorBase: 999999999, percentualJuros: 20, quantidadeParcelas: 1, dataInicio: "2026-08-04" } })
    expect(r, 422, "caixa insuficiente")
  })
  await t("CTR-019", "Cliente inexistente (404)", async () => {
    const r = await req("POST", "/api/contratos", { token: opToken, body: { clienteId: "00000000-0000-4000-8000-000000000000", valorBase: 100, percentualJuros: 20, quantidadeParcelas: 1, dataInicio: "2026-08-04" } })
    expect(r, 404, "cliente inexistente")
  })
  await t("CTR-017B", "POST /contratos semanal (201, mesmo dia da semana)", async () => {
    // 2026-08-03 é segunda-feira (dataInicio válida p/ semanal)
    const r = await req("POST", "/api/contratos", {
      token: opToken,
      body: { clienteId: clienteContratoId, valorBase: 400, percentualJuros: 20, quantidadeParcelas: 3, periodicidade: "semanal", dataInicio: "2026-08-03" },
    })
    expect(r, 201, "criar contrato semanal")
    if (r.data.periodicidade !== "semanal") throw new Error(`periodicidade=${r.data.periodicidade} (esperava semanal)`)
    if (r.data.quantidadeParcelas !== 3) throw new Error("qtd parcelas semanal não bate")
    const datas = (r.data.parcelas ?? []).map((p) => p.dataVencimento)
    if (datas.length !== 3) throw new Error("semanal deveria gerar 3 parcelas")
    if (datas[0] !== "2026-08-10" || datas[1] !== "2026-08-17" || datas[2] !== "2026-08-24") {
      throw new Error(`vencimentos semanais errados: ${datas.join(",")} (esperava 10/17/24/08)`)
    }
    const dom = (d) => new Date(d + "T12:00:00Z").getDay() === 0
    if (datas.some(dom)) throw new Error("parcela semanal caiu num domingo (BR-042)")
  })
  await t("CTR-017C", "POST /contratos semanal com dataInicio domingo (422)", async () => {
    // 2026-08-02 é domingo
    const r = await req("POST", "/api/contratos", {
      token: opToken,
      body: { clienteId: clienteContratoId, valorBase: 400, percentualJuros: 20, quantidadeParcelas: 3, periodicidade: "semanal", dataInicio: "2026-08-02" },
    })
    expect(r, 422, "semanal em domingo deve ser 422 (BR-040-A)")
  })
  await t("CTR-010", "GET /contratos (200 + situação de atraso)", async () => {
    const r = await req("GET", "/api/contratos", { token: opToken })
    expect(r, 200, "listar contratos")
    for (const c of r.data?.data ?? []) {
      for (const f of ["saldoPendente", "parcelasPagas", "emAtraso", "parcelasEmAtraso", "diasEmAtraso"]) {
        if (typeof c[f] !== "number") throw new Error(`contrato lista: campo ${f} ausente/não-numérico (BR-099)`)
      }
    }
  })
  await t("CTR-011", "GET /contratos/:id (200, parcelas sem domingo)", async () => {
    const r = await req("GET", `/api/contratos/${contratoId}`, { token: opToken })
    expect(r, 200, "detalhe contrato")
    const dom = (d) => new Date(d + "T12:00:00Z").getDay() === 0
    if (r.data.parcelas?.some((p) => dom(p.dataVencimento))) throw new Error("parcela caiu num domingo (BR-042)")
    if (r.data.quantidadeParcelas !== 4) throw new Error("qtd parcelas não bate")
  })
  await t("CTR-023", "PATCH /contratos/:id sem pagamentos (200)", async () => {
    const r = await req("PATCH", `/api/contratos/${contratoId}`, { token: opToken, body: { quantidadeParcelas: 5 } })
    expect(r, 200, "editar contrato sem pagamentos")
  })
  await t("CTR-023B", "PATCH para semanal regenera parcelas (200, +7*i)", async () => {
    // contratoId foi criado em 2026-08-04 (segunda) — válido p/ semanal
    const r = await req("PATCH", `/api/contratos/${contratoId}`, { token: opToken, body: { periodicidade: "semanal", quantidadeParcelas: 3 } })
    expect(r, 200, "editar para semanal")
    if (r.data.periodicidade !== "semanal") throw new Error(`periodicidade=${r.data.periodicidade} (esperava semanal)`)
    const datas = (r.data.parcelas ?? []).map((p) => p.dataVencimento)
    const dom = (d) => new Date(d + "T12:00:00Z").getDay() === 0
    if (datas.length !== 3 || datas.some(dom)) throw new Error("parcelas semanais inválidas (BR-039/042)")
  })
  await t("CTR-023C", "PATCH diário→semanal com dataInicio domingo (422, BR-040-A)", async () => {
    // Contrato diário que inicia em domingo (2026-08-02) — diário permite; semanal não.
    const c = await req("POST", "/api/contratos", {
      token: opToken,
      body: { clienteId: clienteContratoId, valorBase: 300, percentualJuros: 20, quantidadeParcelas: 4, periodicidade: "diaria", dataInicio: "2026-08-02" },
    })
    expect(c, 201, "criar contrato diário iniciando em domingo")
    const r = await req("PATCH", `/api/contratos/${c.data.id}`, { token: opToken, body: { periodicidade: "semanal" } })
    expect(r, 422, "editar para semanal com dataInicio domingo deve ser 422 (BR-040-A)")
  })

  // ---------- OPERADOR: pagamento ----------
  let pagamentoId
  let recebidoAntes
  await t("CAX-042B", "GET /caixa recebidoHoje antes (baseline)", async () => {
    const r = await req("GET", "/api/caixa", { token: opToken })
    expect(r, 200, "caixa")
    recebidoAntes = r.data.recebidoHoje
  })
  await t("PAG-015", "POST /pagamentos/preview (200)", async () => {
    const r = await req("POST", "/api/pagamentos/preview", { token: opToken, body: { contratoId, valor: 120 } })
    expect(r, 200, "preview pagamento")
  })
  await t("PAG-027", "POST /pagamentos (201, parcela antiga primeiro)", async () => {
    const r = await req("POST", "/api/pagamentos", { token: opToken, body: { contratoId, valor: 120 } })
    expect(r, 201, "registrar pagamento")
    pagamentoId = r.data.id
  })
  await t("PAG-COH", "Coerência: recebidoHoje subiu 120", async () => {
    const r = await req("GET", "/api/caixa", { token: opToken })
    expect(r, 200, "caixa pós pagamento")
    const diff = r.data.recebidoHoje - recebidoAntes
    if (Math.abs(diff - 120) > 0.01) throw new Error(`recebidoHoje subiu ${diff} (esperava 120)`)
  })
  await t("PAG-028", "Pagamento excede saldo (422)", async () => {
    const r = await req("POST", "/api/pagamentos", { token: opToken, body: { contratoId, valor: 999999 } })
    expect(r, 422, "pagamento excede saldo")
  })
  await t("PAG-031", "GET /pagamentos/contrato/:id (200)", async () => {
    const r = await req("GET", `/api/pagamentos/contrato/${contratoId}`, { token: opToken })
    expect(r, 200, "pagamentos do contrato")
  })
  await t("PAG-030", "Preview não persiste (movimentações inalteradas)", async () => {
    const antes = await req("GET", "/api/caixa/movimentacoes", { token: opToken })
    await req("POST", "/api/pagamentos/preview", { token: opToken, body: { contratoId, valor: 120 } })
    const depois = await req("GET", "/api/caixa/movimentacoes", { token: opToken })
    expect(antes, 200, "mov antes"); expect(depois, 200, "mov depois")
    if (antes.data.data.length !== depois.data.data.length) throw new Error("preview gravou movimentação")
  })

  // ---------- OPERADOR: gasto ----------
  let gastoId
  await t("GST-051", "POST /gastos (201)", async () => {
    const r = await req("POST", "/api/gastos", { token: opToken, body: { valor: 50, categoria: "Transporte", data: "2026-08-03" } })
    expect(r, 201, "criar gasto")
    gastoId = r.data.id
  })
  await t("GST-052", "POST /gastos sem categoria (422)", async () => {
    const r = await req("POST", "/api/gastos", { token: opToken, body: { valor: 10, data: "2026-08-03" } })
    expect(r, 422, "gasto sem categoria")
  })
  await t("GST-053", "GET /gastos (200)", async () => {
    const r = await req("GET", "/api/gastos", { token: opToken })
    expect(r, 200, "listar gastos")
  })
  await t("GST-054", "DELETE /gastos/:id (204)", async () => {
    const r = await req("DELETE", `/api/gastos/${gastoId}`, { token: opToken })
    expect(r, 204, "excluir gasto")
  })

  // ---------- OPERADOR: caixa (movimentações / auditoria / liquidar) ----------
  await t("CAX-026", "GET /caixa/movimentacoes (200)", async () => {
    const r = await req("GET", "/api/caixa/movimentacoes", { token: opToken })
    expect(r, 200, "movimentações")
  })
  await t("CAX-027", "GET /caixa/auditoria (200, escopada)", async () => {
    const r = await req("GET", "/api/caixa/auditoria", { token: opToken })
    expect(r, 200, "auditoria")
  })
  await t("CAX-049", "POST /caixa/liquidar (201)", async () => {
    const r = await req("POST", "/api/caixa/liquidar", { token: opToken })
    expect(r, 201, "liquidar semana")
  })
  await t("CAX-050", "Re-liquidação (409)", async () => {
    const r = await req("POST", "/api/caixa/liquidar", { token: opToken })
    expect(r, 409, "re-liquidar")
  })

  // ---------- OPERADOR: senha ----------
  await t("AUTH-075", "PATCH /auth/senha válido (200) + login novo funciona", async () => {
    const r = await req("PATCH", "/api/auth/senha", { token: opToken, body: { senhaAtual: SENHA, novaSenha: "novaSenha123" } })
    expect(r, 200, "trocar senha")
    const novo = await req("POST", "/api/auth/login", { body: { email: "gabriel.nx@uorak.com", senha: "novaSenha123" } })
    expect(novo, 200, "login com nova senha")
    const antigo = await req("POST", "/api/auth/login", { body: { email: "gabriel.nx@uorak.com", senha: SENHA } })
    expect(antigo, 401, "login com senha antiga deve falhar")
    // volta pra senha original (não sujar o seed)
    await req("PATCH", "/api/auth/senha", { token: novo.data.token, body: { senhaAtual: "novaSenha123", novaSenha: SENHA } })
  })
  await t("AUTH-076", "Senha atual incorreta (422)", async () => {
    const r = await req("PATCH", "/api/auth/senha", { token: opToken, body: { senhaAtual: "errada", novaSenha: "novaSenha123" } })
    expect(r, 422, "senha atual errada")
  })
  await t("AUTH-077", "Nova senha < 6 (422)", async () => {
    const r = await req("PATCH", "/api/auth/senha", { token: opToken, body: { senhaAtual: SENHA, novaSenha: "123" } })
    expect(r, 422, "senha curta")
  })

  // ---------- FOTO (PLAN-041) ----------
  const fotoDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA=="
  await t("FOT-001", "PATCH /auth/foto com data URL (200) + me reflete", async () => {
    const r = await req("PATCH", "/api/auth/foto", { token: opToken, body: { foto: fotoDataUrl } })
    expect(r, 200, "salvar foto")
    const me = await req("GET", "/api/auth/me", { token: opToken })
    expect(me, 200, "me")
    if (me.data.foto !== fotoDataUrl) throw new Error("me.foto não refletiu a foto")
  })
  await t("FOT-002", "PATCH /auth/foto null remove (200)", async () => {
    const r = await req("PATCH", "/api/auth/foto", { token: opToken, body: { foto: null } })
    expect(r, 200, "remover foto")
    const me = await req("GET", "/api/auth/me", { token: opToken })
    if (me.data.foto !== null) throw new Error("me.foto não foi removida")
  })
  await t("FOT-003", "foto fora de data:image (422 FOTO_TIPO)", async () => {
    const r = await req("PATCH", "/api/auth/foto", { token: opToken, body: { foto: "https://exemplo.com/foto.jpg" } })
    expect(r, 422, "tipo inválido")
  })
  await t("FOT-004", "foto > 1MB decodificados (422 FOTO_LIMITE)", async () => {
    const gigante = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, ...new Array(1100 * 1024).fill(0x00)]).toString("base64")
    const r = await req("PATCH", "/api/auth/foto", { token: opToken, body: { foto: gigante } })
    expect(r, 422, "limite")
    if (r.data.code !== "FOTO_LIMITE") throw new Error(`code esperado FOTO_LIMITE, recebi ${r.data.code}`)
  })
  await t("FOT-005", "foto grande válida (~150KB decod.) = 200 (cap elevado PLAN-058)", async () => {
    const grande = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(150 * 1024).fill(0x00)]).toString("base64")
    const r = await req("PATCH", "/api/auth/foto", { token: opToken, body: { foto: grande } })
    expect(r, 200, "foto grande")
    const me = await req("GET", "/api/auth/me", { token: opToken })
    if (me.data.foto !== grande) throw new Error("me.foto não refletiu")
    await req("PATCH", "/api/auth/foto", { token: opToken, body: { foto: null } })
  })
  await t("FOT-006", "foto data:image/svg+xml (422 FOTO_TIPO)", async () => {
    const r = await req("PATCH", "/api/auth/foto", { token: opToken, body: { foto: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" } })
    expect(r, 422, "svg rejeitado")
    if (r.data.code !== "FOTO_TIPO") throw new Error(`code esperado FOTO_TIPO, recebi ${r.data.code}`)
  })
  await t("FOT-007", "foto mascarada (texto como jpeg) (422 FOTO_TIPO)", async () => {
    const r = await req("PATCH", "/api/auth/foto", { token: opToken, body: { foto: `data:image/jpeg;base64,${Buffer.from("isto não é uma imagem de verdade").toString("base64")}` } })
    expect(r, 422, "conteúdo mascarado rejeitado")
  })

  // ---------- ADMIN: dashboard / operadores ----------
  await t("ADM-037", "GET /admin/dashboard (200)", async () => {
    const r = await req("GET", "/api/admin/dashboard", { token: adminToken })
    expect(r, 200, "dashboard")
    for (const k of ["totalAdmins", "totalSocios", "totalOperadores", "totalClientes", "contratosAtivos"]) {
      if (typeof r.data[k] !== "number") throw new Error(`dashboard sem ${k}`)
    }
  })
  await t("EQ-088", "GET /admin/equipe (200, Σ operadores = totais)", async () => {
    const r = await req("GET", "/api/admin/equipe", { token: adminToken })
    expect(r, 200, "equipe")
    if (!Array.isArray(r.data.operadores)) throw new Error("operadores não é array")
    const sum = (k) => r.data.operadores.reduce((s, o) => s + o[k], 0)
    if (sum("totalClientes") !== r.data.totais.totalClientes) throw new Error("Σ clientes != total")
    if (sum("contratosAtivos") !== r.data.totais.contratosAtivos) throw new Error("Σ contratos != total")
    if (Math.abs(sum("recebidoHoje") - r.data.totais.recebidoHoje) > 0.01) throw new Error("Σ recebido != total")
    // coerência com o dashboard da mesma empresa (agregado)
    const dash = await req("GET", "/api/admin/dashboard", { token: superToken, query: { empresaId: adminLogin.data.usuario.empresaId } })
    expect(dash, 200, "dashboard da empresa")
    if (r.data.totais.totalClientes !== dash.data.totalClientes) throw new Error(`equipe totalClientes=${r.data.totais.totalClientes} × dashboard=${dash.data.totalClientes}`)
    // BR-091: admin self também agrega a equipe (regressão do PLAN-032 corrigida 05/08)
    const dashSelf = await req("GET", "/api/admin/dashboard", { token: adminToken })
    expect(dashSelf, 200, "dashboard admin self")
    if (dashSelf.data.totalClientes !== r.data.totais.totalClientes) throw new Error(`BR-091: admin self totalClientes=${dashSelf.data.totalClientes} × equipe=${r.data.totais.totalClientes}`)
    if (Math.abs(dashSelf.data.recebidoHoje - r.data.totais.recebidoHoje) > 0.01) throw new Error(`BR-091: admin self recebidoHoje=${dashSelf.data.recebidoHoje} × equipe=${r.data.totais.recebidoHoje}`)
  })
  await t("EQ-089", "Equipe: operator 403 / super sem empresaId 400", async () => {
    const op = await req("GET", "/api/admin/equipe", { token: opToken })
    expect(op, 403, "operator equipe")
    const superSem = await req("GET", "/api/admin/equipe", { token: superToken })
    expect(superSem, 400, "super sem empresaId")
  })
  await t("EQ-090", "Super admin equipe com empresaId (200)", async () => {
    const r = await req("GET", "/api/admin/equipe", { token: superToken, query: { empresaId: adminLogin.data.usuario.empresaId } })
    expect(r, 200, "super equipe")
    if (r.data.operadores.length < 1) throw new Error("sem operadores")
  })
  await t("ADM-056", "GET /admin/operadores (200)", async () => {
    const r = await req("GET", "/api/admin/operadores", { token: adminToken })
    expect(r, 200, "operadores")
  })
  await t("ADM-058", "GET /admin/operadores/:id (200)", async () => {
    const r = await req("GET", `/api/admin/operadores/${gabrielId}`, { token: adminToken })
    expect(r, 200, "detalhe operador")
  })
  await t("ADM-059", "Operador de outra empresa (404)", async () => {
    const ops = await req("GET", "/api/admin/operadores", { token: superToken })
    const rafael = ops.data.find((o) => o.email === "rafael.nx@uorak.com") // empresa 1
    if (!rafael) throw new Error("rafael não achado")
    const r = await req("GET", `/api/admin/operadores/${rafael.id}`, { token: adminToken })
    expect(r, 404, "operador outra empresa")
  })

  // admin → contexto do operador (contrato + estorno)
  await t("ADM-028", "GET /contratos?usuarioId= (contexto do operador, 200)", async () => {
    const r = await req("GET", "/api/contratos", { token: adminToken, query: { usuarioId: gabrielId } })
    expect(r, 200, "contratos do operador")
  })
  await t("ADM-029", "GET /contratos/:id?usuarioId= (modo admin, 200)", async () => {
    const r = await req("GET", `/api/contratos/${contratoId}`, { token: adminToken, query: { usuarioId: gabrielId } })
    expect(r, 200, "contrato modo admin")
  })
  await t("PAG-032", "Admin estorna pagamento do operador (201)", async () => {
    const r = await req("POST", `/api/pagamentos/${pagamentoId}/estornar`, { token: adminToken, body: { motivo: "Smoke — estorno de teste" }, query: { usuarioId: gabrielId } })
    expect(r, 201, "estornar pagamento")
  })
  await t("PAG-COH2", "Coerência: movimentação reversa (Cancelamento) existe", async () => {
    // Filtra por origem=Cancelamento — independe de paginação/horário (o estorno grava
    // created_at = now; o seed grava meio-dia local, o que empurrava o Cancelamento
    // pra fora da página 1 quando o CI rodava antes das 12:00Z).
    const r = await req("GET", "/api/caixa/movimentacoes", { token: adminToken, query: { usuarioId: gabrielId, origem: "Cancelamento" } })
    expect(r, 200, "movimentações pós estorno")
    if (!r.data.data.some((m) => m.origem === "Cancelamento")) throw new Error("sem movimentação de Cancelamento após estorno")
  })
  await t("EST-C1", "Estornado: GET /pagamentos/contrato retorna estornadoEm + motivo", async () => {
    const r = await req("GET", `/api/pagamentos/contrato/${contratoId}`, { token: opToken })
    expect(r, 200, "pagamentos pós estorno")
    const p = r.data.find((x) => x.id === pagamentoId)
    if (!p) throw new Error("pagamento não listado")
    if (!p.estornadoEm) throw new Error("estornadoEm ausente na listagem")
    if (!p.estornoMotivo) throw new Error("estornoMotivo ausente na listagem")
  })
  await t("PAG-034", "Duplo estorno (409)", async () => {
    const r = await req("POST", `/api/pagamentos/${pagamentoId}/estornar`, { token: adminToken, body: { motivo: "de novo" }, query: { usuarioId: gabrielId } })
    expect(r, 409, "duplo estorno")
  })

  // ---------- ADMIN: CRUD operador ----------
  let novoOpId
  const novoEmail = `smoke.${Date.now()}@uorak.com`
  await t("ADM-060", "POST /admin/operadores (201, convidado) + ativação via convite + login", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Smoke Operador", email: novoEmail, role: "operator" } })
    expect(r, 201, "criar operador")
    novoOpId = r.data.id
    if (r.data.status !== "convidado") throw new Error(`status=${r.data.status}`)
    await ativarUsuario(novoOpId, novoEmail)
    const login = await req("POST", "/api/auth/login", { body: { email: novoEmail, senha: SENHA } })
    expect(login, 200, "login novo operador")
  })
  await t("ADM-061", "E-mail duplicado (409)", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Duplicado", email: novoEmail, role: "operator" } })
    expect(r, 409, "email duplicado")
  })
  await t("ADM-N3", "senha no create é ignorada (P-04) → 201 convidado, senhaHash NULL", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Curta", email: `curta.${Date.now()}@uorak.com`, senha: "123", role: "operator" } })
    expect(r, 201, "senha ignorada no create")
    if (r.data.status !== "convidado") throw new Error(`status=${r.data.status}`)
    const { rows } = await SMOKE_POOL.query("SELECT \"senha_hash\" FROM usuarios WHERE id = $1", [r.data.id])
    if (rows[0]?.["senha_hash"] !== null) throw new Error("senhaHash deveria ser NULL")
  })
  await t("ADM-062", "Role inválido (400)", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Role", email: `role.${Date.now()}@uorak.com`, role: "super_admin" } })
    expect(r, 400, "role inválido")
  })
  await t("ADM-063", "PATCH /admin/operadores/:id (200, dados básicos; senha não muda — P-04)", async () => {
    const r = await req("PATCH", `/api/admin/operadores/${novoOpId}`, { token: adminToken, body: { nome: "Smoke Editado" } })
    expect(r, 200, "editar operador")
    if (r.data.nome !== "Smoke Editado") throw new Error(`nome=${r.data.nome}`)
    const loginOriginal = await req("POST", "/api/auth/login", { body: { email: novoEmail, senha: SENHA } })
    expect(loginOriginal, 200, "senha original continua valendo")
    const loginOutra = await req("POST", "/api/auth/login", { body: { email: novoEmail, senha: "outraSenha456" } })
    expect(loginOutra, 401, "senha 'nova' ignorada no PATCH")
  })
  await t("ADM-064", "Auto-rebaixar (403)", async () => {
    const me = await req("GET", "/api/auth/me", { token: adminToken })
    const r = await req("PATCH", `/api/admin/operadores/${me.data.id}`, { token: adminToken, body: { role: "operator" } })
    expect(r, 403, "auto-rebaixar")
  })
  await t("ADM-066", "Auto-remover (403)", async () => {
    const me = await req("GET", "/api/auth/me", { token: adminToken })
    const r = await req("DELETE", `/api/admin/operadores/${me.data.id}`, { token: adminToken })
    expect(r, 403, "auto-remover")
  })
  await t("ADM-065", "DELETE /admin/operadores/:id (204)", async () => {
    const r = await req("DELETE", `/api/admin/operadores/${novoOpId}`, { token: adminToken })
    expect(r, 204, "remover operador")
  })

  // ---------- SUPER ADMIN: empresas ----------
  await t("EMP-038", "GET /admin/empresas (200)", async () => {
    const r = await req("GET", "/api/admin/empresas", { token: superToken })
    expect(r, 200, "empresas")
    if (!Array.isArray(r.data) || r.data.length < 1) throw new Error("sem empresas")
  })
  await t("EMP-039", "GET /admin/empresas/:id (200)", async () => {
    const list = await req("GET", "/api/admin/empresas", { token: superToken })
    const id = list.data[0].id
    const r = await req("GET", `/api/admin/empresas/${id}`, { token: superToken })
    expect(r, 200, "detalhe empresa")
  })
  await t("EMP-040", "GET /admin/empresas/:id inexistente (404)", async () => {
    const r = await req("GET", "/api/admin/empresas/00000000-0000-4000-8000-000000000000", { token: superToken })
    expect(r, 404, "empresa inexistente")
  })
  let novaEmpresaId
  let novaEmpresaAdminEmail
  await t("EMP-073", "POST /admin/empresas (201, CNPJ válido) + admin convidado ativado + login + dashboard", async () => {
    const nome = `Empresa Smoke ${Date.now()}`
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome, documento: "11222333000181", nomeFantasia: "Smoke Fantasia", ativa: true, adminNome: "Admin Smoke", adminEmail: `smoke.${Date.now()}@empresa.com` } })
    expect(r, 201, "criar empresa")
    novaEmpresaId = r.data.empresa.id
    novaEmpresaAdminEmail = r.data.admin.email
    if (r.data.empresa.documento !== "11222333000181") throw new Error("documento não persistido")
    if (r.data.empresa.ativa !== true) throw new Error("ativa não persistido")
    await ativarUsuario(r.data.admin.id, novaEmpresaAdminEmail)
    const login = await req("POST", "/api/auth/login", { body: { email: novaEmpresaAdminEmail, senha: SENHA } })
    expect(login, 200, "login admin da nova empresa")
    const dash = await req("GET", "/api/admin/dashboard", { token: superToken, query: { empresaId: novaEmpresaId } })
    expect(dash, 200, "dashboard da nova empresa")
  })
  await t("EMP-095", "PATCH /admin/empresas/:id (200, opcionais) + GET reflete", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken, body: { nomeFantasia: "Smoke Atualizada", ativa: false } })
    expect(r, 200, "patch dados")
    if (r.data.nomeFantasia !== "Smoke Atualizada") throw new Error("nomeFantasia não refletiu")
    if (r.data.ativa !== false) throw new Error("ativa=false não refletiu")
    const inexistente = await req("PATCH", "/api/admin/empresas/00000000-0000-4000-8000-000000000000", { token: superToken, body: { ativa: false } })
    expect(inexistente, 404, "empresa inexistente")
    // restaura ativa — BR-106: empresa inativa bloqueia login (os testes seguintes dependem)
    const volta = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken, body: { ativa: true } })
    expect(volta, 200, "reativar novaEmpresa")
  })
  await t("EMP-095b", "POST /admin/empresas SEM opcionais (201, não bloqueia)", async () => {
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome: `Empresa Min ${Date.now()}`, adminNome: "Admin Min", adminEmail: `min.${Date.now()}@empresa.com` } })
    expect(r, 201, "empresa sem opcionais")
  })
  await t("EMP-074", "Admin email duplicado (409)", async () => {
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome: "Duplicada", adminNome: "X", adminEmail: "admin@cobranca.com" } })
    expect(r, 409, "email admin duplicado")
  })

  // ---------- DOCUMENTO DA EMPRESA: CPF ou CNPJ (P11) ----------
  const docEmpresaCpf = "39053344705"
  await t("EMP-096", "POST empresa com CPF válido (201, dígitos persistidos)", async () => {
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome: `Empresa CPF ${Date.now()}`, documento: docEmpresaCpf, adminNome: "Admin CPF", adminEmail: `cpf.${Date.now()}@empresa.com` } })
    expect(r, 201, "empresa com CPF")
    if (r.data.empresa.documento !== docEmpresaCpf) throw new Error("CPF não persistido em dígitos")
  })
  await t("EMP-097", "POST empresa com documento inválido (422)", async () => {
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome: `Empresa Inv ${Date.now()}`, documento: "11222333000182", adminNome: "Admin Inv", adminEmail: `inv.${Date.now()}@empresa.com` } })
    expect(r, 422, "documento inválido")
  })
  await t("EMP-098", "PATCH empresa documento CPF (200) e inválido (422)", async () => {
    const ok = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken, body: { documento: docEmpresaCpf } })
    expect(ok, 200, "patch documento CPF")
    if (ok.data.documento !== docEmpresaCpf) throw new Error("CPF não persistido")
    const bad = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken, body: { documento: "11111111111111" } })
    expect(bad, 422, "documento inválido no patch")
  })

  // ---------- MÓDULOS (PLAN-031, whitelabel) ----------
  await t("MOD-096", "login/me retornam modulos da empresa (todos por padrão)", async () => {
    const r = await req("GET", "/api/auth/me", { token: adminToken })
    expect(r, 200, "me")
    const expected = ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"]
    const got = [...(r.data.modulos ?? [])].sort()
    if (JSON.stringify(got) !== JSON.stringify([...expected].sort())) throw new Error(`modulos=${JSON.stringify(r.data.modulos)}`)
  })
  await t("MOD-091", "PATCH modulos válido (200) + GET/:id reflete + /me do tenant reflete", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["clientes", "contratos", "caixa"] } })
    expect(r, 200, "patch modulos")
    const g = await req("GET", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken })
    expect(g, 200, "get empresa")
    if (JSON.stringify(g.data.modulos?.sort()) !== JSON.stringify(["caixa", "clientes", "contratos"])) throw new Error("GET/:id não refletiu")
    const login = await req("POST", "/api/auth/login", { body: { email: novaEmpresaAdminEmail, senha: SENHA } })
    expect(login, 200, "login tenant")
    if (JSON.stringify(login.data.usuario.modulos?.sort()) !== JSON.stringify(["caixa", "clientes", "contratos"])) throw new Error("login não refletiu modulos")
    await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"] } })
  })
  await t("MOD-092", "Dependência gastos sem caixa (422)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["gastos"] } })
    expect(r, 422, "gastos sem caixa")
  })
  await t("MOD-093", "Módulo inexistente (422)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["nao_existe"] } })
    expect(r, 422, "modulo inexistente")
  })
  await t("MOD-094", "Array vazio = só central (200)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: [] } })
    expect(r, 200, "array vazio")
    await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"] } })
  })
  await t("MOD-095", "Admin (não super) em PATCH modulos (403)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: adminToken, body: { modulos: [] } })
    expect(r, 403, "admin sem permissão")
  })
  const MODULOS_ALL = ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos", "insights"]
  await t("MOD-097", "Enforcement: módulo off → 403 MODULE_DISABLED; ativo → 200 (P024)", async () => {
    const tenantLogin = await req("POST", "/api/auth/login", { body: { email: novaEmpresaAdminEmail, senha: SENHA } })
    expect(tenantLogin, 200, "login tenant")
    const tenantToken = tenantLogin.data.token
    try {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["clientes", "contratos"] } })
      const caixa = await req("GET", "/api/caixa", { token: tenantToken })
      expect(caixa, 403, "caixa off")
      if (caixa.data?.code !== "MODULE_DISABLED") throw new Error(`code=${caixa.data?.code}`)
      const gastos = await req("GET", "/api/gastos", { token: tenantToken })
      expect(gastos, 403, "gastos off")
      const visitas = await req("POST", "/api/operacoes/visitas", { token: tenantToken, body: { clienteId: "x", contratoId: "x", tipo: "visitado" } })
      expect(visitas, 403, "rota off")
      const clientes = await req("GET", "/api/clientes", { token: tenantToken })
      expect(clientes, 200, "clientes on")
      const contratos = await req("GET", "/api/contratos", { token: tenantToken })
      expect(contratos, 200, "contratos on")
    } finally {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    }
  })
  await t("MOD-098", "Sócio respeita módulos + efeito imediato + sem bypass ?empresaId (P024)", async () => {
    const tenantLogin = await req("POST", "/api/auth/login", { body: { email: novaEmpresaAdminEmail, senha: SENHA } })
    expect(tenantLogin, 200, "login tenant")
    const socioEmail = `msocio.${Date.now()}@uorak.com`
    const created = await req("POST", "/api/admin/operadores", { token: tenantLogin.data.token, body: { nome: "Sócio MOD", email: socioEmail, role: "socio" } })
    expect(created, 201, "criar sócio nova empresa")
    await ativarUsuario(created.data.id, socioEmail)
    const socioLogin = await req("POST", "/api/auth/login", { body: { email: socioEmail, senha: SENHA } })
    expect(socioLogin, 200, "login sócio")
    const socioTok = socioLogin.data.token
    expect(await req("GET", "/api/caixa", { token: socioTok }), 200, "caixa on (antes)")
    try {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["clientes", "contratos"] } })
      const depois = await req("GET", "/api/caixa", { token: socioTok })
      expect(depois, 403, "sócio: caixa off (efeito imediato, mesmo token)")
      if (depois.data?.code !== "MODULE_DISABLED") throw new Error(`code=${depois.data?.code}`)
      expect(await req("GET", `/api/caixa?empresaId=${novaEmpresaId}`, { token: socioTok }), 403, "sócio não contorna com ?empresaId=")
    } finally {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    }
  })
  await t("MOD-099", "Só central (modulos: []) → 403 em rotas operacionais (P024)", async () => {
    const tAdmin = await req("POST", "/api/auth/login", { body: { email: novaEmpresaAdminEmail, senha: SENHA } })
    expect(tAdmin, 200, "login tenant")
    const tok = tAdmin.data.token
    try {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: [] } })
      expect(await req("GET", "/api/clientes", { token: tok }), 403, "clientes off")
      expect(await req("GET", "/api/contratos", { token: tok }), 403, "contratos off")
      expect(await req("GET", "/api/caixa", { token: tok }), 403, "caixa off")
    } finally {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    }
  })
  await t("MOD-100", "Dependência rota ⇒ cobrancas (422) (grafo refinado, PLAN-045)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["clientes", "contratos", "rota"] } })
    expect(r, 422, "rota sem cobrancas")
    if (!(r.data?.message ?? "").includes("cobrancas")) throw new Error(`message=${r.data?.message}`)
    await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
  })
  await t("MOD-101", "Dependência atendidos ⇒ cobrancas (422) (grafo refinado, PLAN-045)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["clientes", "contratos", "atendidos"] } })
    expect(r, 422, "atendidos sem cobrancas")
    if (!(r.data?.message ?? "").includes("cobrancas")) throw new Error(`message=${r.data?.message}`)
    await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
  })

  // ---------- CAPACIDADES (recursos finos do whitelabel) ----------
  let novaTenantToken
  await t("CAP-100", "Setup: login do admin da novaEmpresa (token p/ capacidades)", async () => {
    const login = await req("POST", "/api/auth/login", { body: { email: novaEmpresaAdminEmail, senha: SENHA } })
    expect(login, 200, "login tenant novaEmpresa")
    novaTenantToken = login.data.token
  })

  await t("CAP-101", "PATCH capacidades válido (200) + GET/:id + /me refletem", async () => {
    const set = ["cliente:whatsapp", "cliente:anexos"]
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: set } })
    expect(r, 200, "patch capacidades")
    const g = await req("GET", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken })
    expect(g, 200, "get empresa")
    if (JSON.stringify(g.data.capacidades?.sort()) !== JSON.stringify([...set].sort())) throw new Error(`GET/:id não refletiu: ${JSON.stringify(g.data.capacidades)}`)
    const me = await req("GET", "/api/auth/me", { token: novaTenantToken })
    expect(me, 200, "me tenant")
    if (JSON.stringify(me.data.capacidades?.sort()) !== JSON.stringify([...set].sort())) throw new Error(`/me não refletiu: ${JSON.stringify(me.data.capacidades)}`)
  })

  await t("CAP-102", "Capacidade com módulo dono desativado (422)", async () => {
    try {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL.filter((m) => m !== "rota") } })
      const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: ["rota:whatsapp"] } })
      expect(r, 422, "capacidade com dono off")
      if (!(r.data?.message ?? "").includes("rota")) throw new Error(`message=${r.data?.message}`)
    } finally {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    }
  })

  await t("CAP-103", "Capacidade inexistente (422)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: ["nao:existe"] } })
    expect(r, 422, "capacidade inexistente")
  })

  await t("CAP-104", "Array vazio = nenhuma capacidade (200) + /me reflete", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: [] } })
    expect(r, 200, "array vazio")
    const me = await req("GET", "/api/auth/me", { token: novaTenantToken })
    expect(me, 200, "me")
    if (JSON.stringify(me.data.capacidades) !== "[]") throw new Error(`capacidades=${JSON.stringify(me.data.capacidades)}`)
  })

  await t("CAP-105", "Admin (não super) em PATCH capacidades (403)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: adminToken, body: { capacidades: [] } })
    expect(r, 403, "admin sem permissão")
  })

  await t("CAP-106", "Não vaza entre tenants (empresa 0 /me segue null)", async () => {
    await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: ["cliente:whatsapp"] } })
    const me = await req("GET", "/api/auth/me", { token: adminToken })
    expect(me, 200, "me empresa 0")
    if (me.data.capacidades !== null) throw new Error(`empresa 0 vazou capacidades: ${JSON.stringify(me.data.capacidades)}`)
    await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: null } })
  })

  await t("CAP-107", "PATCH null limpa override (volta todas ativas)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: null } })
    expect(r, 200, "null limpa")
    const g = await req("GET", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken })
    expect(g, 200, "get")
    if (g.data.capacidades !== null) throw new Error(`capacidades=${JSON.stringify(g.data.capacidades)}`)
  })

  await t("CAP-108", "Capacidade com dono off persiste inerte; reativa junto", async () => {
    try {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: ["rota:whatsapp"] } })
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL.filter((m) => m !== "rota") } })
      const g = await req("GET", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken })
      expect(g, 200, "get após dono off")
      if (JSON.stringify(g.data.capacidades) !== '["rota:whatsapp"]') throw new Error(`capacidades=${JSON.stringify(g.data.capacidades)}`)
      if (g.data.modulos.includes("rota")) throw new Error("rota ainda ativa")
    } finally {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    }
    const g2 = await req("GET", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken })
    if (JSON.stringify(g2.data.capacidades) !== '["rota:whatsapp"]') throw new Error(`capacidades=${JSON.stringify(g2.data.capacidades)}`)
    await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: null } })
  })

  await t("CAP-109", "Duplicatas normalizadas (200)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: ["cliente:whatsapp", "cliente:whatsapp", "cliente:ligar"] } })
    expect(r, 200, "duplicata")
    const g = await req("GET", `/api/admin/empresas/${novaEmpresaId}`, { token: superToken })
    if (JSON.stringify(g.data.capacidades?.sort()) !== JSON.stringify(["cliente:ligar", "cliente:whatsapp"])) throw new Error(`capacidades=${JSON.stringify(g.data.capacidades)}`)
    await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: null } })
  })

  await t("CAP-110", "cliente:anexos off → GET/POST /clientes/:id/anexos (403 CAPABILITY_DISABLED)", async () => {
    const cli = await req("POST", "/api/clientes", { token: novaTenantToken, body: { nome: "Cliente Anexos", telefone: "83988880001", cpf: "52998224725", comercio: "Com", endereco: { logradouro: "Rua X" } } })
    expect(cli, 201, "criar cliente p/ anexos")
    const cliId = cli.data.id
    try {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/capacidades`, { token: superToken, body: { capacidades: [] } })
      const g = await req("GET", `/api/clientes/${cliId}/anexos`, { token: novaTenantToken })
      expect(g, 403, "anexos off GET")
      if (g.data?.code !== "CAPABILITY_DISABLED") throw new Error(`code=${g.data?.code}`)
} finally {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    }
  })

  // INSIGHTS (PLAN-080 F1) — resumo agregado + enforcement de módulo
  const insToken = (await req("POST", "/api/auth/login", { body: { email: novaEmpresaAdminEmail, senha: SENHA } })).data.token
  await t("INS-01", "resumo insights válido → 200 shape (semana = 7 pontos)", async () => {
    const r = await req("GET", "/api/insights/resumo?periodo=semana", { token: insToken })
    expect(r, 200, "resumo semana")
    if (r.data.periodo !== "semana") throw new Error(`periodo=${r.data.periodo}`)
    if (!Array.isArray(r.data.serie) || r.data.serie.length !== 7) throw new Error(`serie.length=${r.data.serie?.length}`)
    for (const item of r.data.serie) {
      if (typeof item.data !== "string" || typeof item.recebido !== "number" || typeof item.previsto !== "number") {
        throw new Error(`shape inválido: ${JSON.stringify(item)}`)
      }
    }
  })
  await t("INS-02", "periodo inválido → 422", async () => {
    const r = await req("GET", "/api/insights/resumo?periodo=ano", { token: insToken })
    expect(r, 422, "periodo inválido")
  })
  await t("INS-03", "módulo insights off → 403 MODULE_DISABLED (W1)", async () => {
    const semInsights = MODULOS_ALL.filter((m) => m !== "insights")
    try {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: semInsights } })
      const r = await req("GET", "/api/insights/resumo", { token: insToken })
      expect(r, 403, "insights off")
      if (r.data?.code !== "MODULE_DISABLED") throw new Error(`code=${r.data?.code}`)
    } finally {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    }
  })
  await t("INS-04", "W2: desligar contratos NÃO desliga insights (dependsOn: [])", async () => {
    try {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: ["insights"] } })
      const r = await req("GET", "/api/insights/resumo", { token: insToken })
      expect(r, 200, "insights segue on sem contratos")
    } finally {
      await req("PATCH", `/api/admin/empresas/${novaEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    }
  })
  await t("INS-05", "carteira insights → 200 shape (classe 3 + gastos + contribuição)", async () => {
    const r = await req("GET", "/api/insights/carteira", { token: insToken })
    expect(r, 200, "carteira")
    const c = r.data?.carteira
    if (typeof c?.emAtraso !== "number" || typeof c?.aVencer !== "number" || typeof c?.pagas !== "number" || typeof c?.total !== "number") {
      throw new Error(`carteira shape inválido: ${JSON.stringify(r.data)}`)
    }
    if (!Array.isArray(r.data?.gastosPorCategoria)) throw new Error("gastosPorCategoria deve ser array")
    if (!Array.isArray(r.data?.contribuicaoOperadores)) throw new Error("contribuicaoOperadores deve ser array")
  })

  // ---------- GUARD DE DESATIVAÇÃO COM DADOS (BR-105) + IMPACTO ----------
  let guardEmpresaId, guardAdminToken, guardClienteId, guardContratoId
  await t("MOD-G-S", "Setup: empresa de guarda com cliente + contrato (3 parcelas em aberto)", async () => {
    const nome = `Empresa Guard ${Date.now()}`
    const email = `guard.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome, adminNome: "Guard Admin", adminEmail: email } })
    expect(r, 201, "criar empresa guarda")
    guardEmpresaId = r.data.empresa.id
    await ativarUsuario(r.data.admin.id, email)
    const login = await req("POST", "/api/auth/login", { body: { email, senha: SENHA } })
    expect(login, 200, "login admin guarda")
    guardAdminToken = login.data.token
    await req("GET", "/api/caixa", { token: guardAdminToken })
    const fundo = await req("POST", "/api/caixa/ajuste", { token: guardAdminToken, body: { valor: 5000, motivo: "smoke fundo guarda" } })
    expect(fundo, 201, "fundear caixa guarda (contrato exige saldo)")
    const cli = await req("POST", "/api/clientes", { token: guardAdminToken, body: { nome: "Cliente Guard", telefone: "83988880002", cpf: "39053344705", comercio: "Com", endereco: { logradouro: "Rua A", numero: "10", bairro: "Centro", cidade: "São Paulo", estado: "SP" } } })
    expect(cli, 201, "criar cliente guarda")
    guardClienteId = cli.data.id
    const con = await req("POST", "/api/contratos", { token: guardAdminToken, body: { clienteId: cli.data.id, valorBase: 1200, percentualJuros: 0, quantidadeParcelas: 3, dataInicio: "2026-08-04" } })
    expect(con, 201, "criar contrato guarda")
    guardContratoId = con.data.id
  })

  // Remover `clientes` ⇒ cascata também desliga contratos/cobrancas/rota/atendidos (grafo).
  const semClientesCascata = MODULOS_ALL.filter((m) => !["clientes", "contratos", "cobrancas", "rota", "atendidos"].includes(m))
  // Remover `caixa` ⇒ cascata desliga gastos (gastos depende de caixa).
  const semCaixaCascata = MODULOS_ALL.filter((m) => !["caixa", "gastos"].includes(m))
  await t("MOD-G-1", "Desativar clientes com dados → 409 MODULE_HAS_ACTIVE_DATA + impacto (DOC-1 contagens)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semClientesCascata } })
    expect(r, 409, "clientes com dados")
    if (r.data?.code !== "MODULE_HAS_ACTIVE_DATA") throw new Error(`code=${r.data?.code}`)
    const imp = r.data?.impacto ?? {}
    if (imp.bloqueado !== true) throw new Error(`impacto.bloqueado=${imp.bloqueado}`)
    const cli = imp.impacto?.find((i) => i.modulo === "clientes")
    const con = imp.impacto?.find((i) => i.modulo === "contratos")
    if (cli?.contagem !== 1) throw new Error(`clientes contagem=${cli?.contagem}`)
    if (con?.contagem !== 3) throw new Error(`contratos parcelas em aberto=${con?.contagem}`)
    if (con?.bloqueia !== true) throw new Error("contratos deveria bloquear")
  })

  await t("MOD-G-6", "Idempotência: PATCH com conjunto atual → 200 sem guard", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    expect(r, 200, "mesmo conjunto")
    if (r.data?.impacto?.desligados?.length !== 0) throw new Error(`desligados=${JSON.stringify(r.data?.impacto?.desligados)}`)
  })

  await t("IMP-001", "GET impacto (prévia) com dados → bloqueado + contagens exatas", async () => {
    const r = await req("GET", `/api/admin/empresas/${guardEmpresaId}/impacto`, { token: superToken, query: { modulos: JSON.stringify(semClientesCascata) } })
    expect(r, 200, "impacto preview")
    if (r.data.bloqueado !== true) throw new Error("bloqueado deveria ser true")
    if (!r.data.desligados.includes("clientes")) throw new Error("desligados sem clientes")
    const con = r.data.impacto?.find((i) => i.modulo === "contratos")
    if (con?.contagem !== 3) throw new Error(`contratos=${con?.contagem}`)
  })

  await t("IMP-002", "GET impacto com conjunto igual → desligados vazio", async () => {
    const r = await req("GET", `/api/admin/empresas/${guardEmpresaId}/impacto`, { token: superToken, query: { modulos: JSON.stringify(MODULOS_ALL) } })
    expect(r, 200, "impacto preview igual")
    if (r.data.desligados.length !== 0) throw new Error(`desligados=${JSON.stringify(r.data.desligados)}`)
  })

  await t("IMP-003", "GET impacto sem query modulos → 422", async () => {
    const r = await req("GET", `/api/admin/empresas/${guardEmpresaId}/impacto`, { token: superToken })
    expect(r, 422, "sem modulos")
  })

  await t("IMP-004", "GET impacto com JSON inválido → 422", async () => {
    const r = await req("GET", `/api/admin/empresas/${guardEmpresaId}/impacto`, { token: superToken, query: { modulos: "{nao-json" } })
    expect(r, 422, "json inválido")
  })

  let guardEmpresa2Id, guardAdmin2Token
  await t("MOD-G-S2", "Setup: empresa de guarda 2 sem dados", async () => {
    const email = `guard2.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome: `Empresa Guard2 ${Date.now()}`, adminNome: "Guard2 Admin", adminEmail: email } })
    expect(r, 201, "criar empresa guarda 2")
    guardEmpresa2Id = r.data.empresa.id
    await ativarUsuario(r.data.admin.id, email)
    const login = await req("POST", "/api/auth/login", { body: { email, senha: SENHA } })
    expect(login, 200, "login guarda 2")
    guardAdmin2Token = login.data.token
  })

  await t("MOD-G-2", "Desativar módulo SEM dados → 200 (sem guard)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresa2Id}/modulos`, { token: superToken, body: { modulos: semClientesCascata } })
    expect(r, 200, "sem dados")
    if (r.data?.impacto?.bloqueado !== false) throw new Error(`bloqueado=${r.data?.impacto?.bloqueado}`)
    await req("PATCH", `/api/admin/empresas/${guardEmpresa2Id}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
  })

  await t("MOD-G-8", "clientes só com cadastros (sem contrato) → 200 com impacto de confirmação", async () => {
    const cli = await req("POST", "/api/clientes", { token: guardAdmin2Token, body: { nome: "Cliente Guard2", telefone: "83988880003", cpf: "11144477735", comercio: "Com", endereco: { logradouro: "Rua B" } } })
    expect(cli, 201, "criar cliente guarda 2")
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresa2Id}/modulos`, { token: superToken, body: { modulos: semClientesCascata } })
    expect(r, 200, "clientes só cadastro")
    const cliImp = r.data?.impacto?.impacto?.find((i) => i.modulo === "clientes")
    if (cliImp?.contagem !== 1 || cliImp?.bloqueia !== false) throw new Error(`clientes impacto=${JSON.stringify(cliImp)}`)
    await req("PATCH", `/api/admin/empresas/${guardEmpresa2Id}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
  })

  await t("MOD-G-3", "force → 200 ecoando impacto + auditoria gravada", async () => {
    const antes = await auditoriaCount("modulos", guardEmpresaId)
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semClientesCascata, force: true, motivo: "smoke guard force" } })
    expect(r, 200, "force sobrepõe")
    if (r.data?.impacto?.bloqueado !== true) throw new Error(`impacto não ecoado: ${JSON.stringify(r.data?.impacto?.bloqueado)}`)
    if (r.data?.modulos?.includes("clientes")) throw new Error("clientes ainda ativo após force")
    if (await auditoriaCount("modulos", guardEmpresaId) !== antes + 1) throw new Error("auditoria de modulos não gravada")
  })

  await t("MOD-G-5", "Reativar após force → dados preservados + /me e endpoints voltam a 200", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    expect(r, 200, "reativar todos")
    const cli = await req("GET", `/api/clientes/${guardClienteId}`, { token: guardAdminToken })
    expect(cli, 200, "cliente preservado")
    if (cli.data.id !== guardClienteId) throw new Error("cliente divergiu")
    const me = await req("GET", "/api/auth/me", { token: guardAdminToken })
    expect(me, 200, "me")
    if (me.data.modulos?.length !== MODULOS_ALL.length) throw new Error(`modulos=${JSON.stringify(me.data.modulos)}`)
  })

  await t("MOD-G-4", "Caixa com caixaBase ≠ 0 → 409 (sem force)", async () => {
    await req("GET", "/api/caixa", { token: guardAdminToken })
    const aj = await req("POST", "/api/caixa/ajuste", { token: guardAdminToken, body: { valor: 500, motivo: "smoke guard caixa" } })
    expect(aj, 201, "ajuste caixa guarda")
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semCaixaCascata } })
    expect(r, 409, "caixa aberto")
    if (r.data?.impacto?.impacto?.find((i) => i.modulo === "caixa")?.bloqueia !== true) throw new Error("caixa deveria bloquear")
  })

  await t("MOD-G-7", "Caixa aberto → 409 MESMO com force (caixa nunca força)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semCaixaCascata, force: true, motivo: "tentativa force caixa" } })
    expect(r, 409, "caixa com force")
    if (r.data?.code !== "MODULE_HAS_ACTIVE_DATA") throw new Error(`code=${r.data?.code}`)
  })

  await t("MOD-G-9", "Clientes com contrato ativo → 409 e impacto evidencia a cascata (contratos)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semClientesCascata } })
    expect(r, 409, "cascata bloqueia")
    const con = r.data?.impacto?.impacto?.find((i) => i.modulo === "contratos")
    if (!con || con.bloqueia !== true) throw new Error(`cascata não evidenciada: ${JSON.stringify(r.data?.impacto)}`)
  })

  await t("MOD-G-10", "Remover todos os módulos com dados → 409 (só central)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: [] } })
    expect(r, 409, "tudo off com dados")
    if (r.data?.code !== "MODULE_HAS_ACTIVE_DATA") throw new Error(`code=${r.data?.code}`)
  })

  await t("MOD-G-11", "Admin (não super) em PATCH /modulos com force (403)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: adminToken, body: { modulos: MODULOS_ALL, force: true } })
    expect(r, 403, "admin sem permissão")
  })

  await t("MOD-G-12", "force SEM motivo → 422 (BR-105)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semClientesCascata, force: true } })
    expect(r, 422, "force sem motivo")
    if (!(r.data?.message ?? "").toLowerCase().includes("motivo")) throw new Error(`message=${r.data?.message}`)
  })

  await t("MOD-G-13", "force com motivo > 200 caracteres → 422 (BR-105)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semClientesCascata, force: true, motivo: "x".repeat(201) } })
    expect(r, 422, "motivo longo")
    if (!(r.data?.message ?? "").includes("200")) throw new Error(`message=${r.data?.message}`)
  })

  await t("MOD-G-14", "force com motivo só espaços → 422 (BR-105)", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semClientesCascata, force: true, motivo: "   " } })
    expect(r, 422, "motivo só espaço")
    if (!(r.data?.message ?? "").toLowerCase().includes("motivo")) throw new Error(`message=${r.data?.message}`)
  })

  // ---------- EMPRESA INATIVA (BR-106): suspensão bloqueia acesso ----------
  let suspEmpresaId, suspAdminEmail
  await t("SUSP-S", "Setup: empresa dedicada de suspensão", async () => {
    const email = `susp.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome: `Empresa Susp ${Date.now()}`, adminNome: "Susp Admin", adminEmail: email } })
    expect(r, 201, "criar empresa susp")
    suspEmpresaId = r.data.empresa.id
    suspAdminEmail = email
    await ativarUsuario(r.data.admin.id, email)
  })

  await t("SUSP-1", "Empresa inativa → login 403 EMPRESA_INATIVA", async () => {
    const susp = await req("PATCH", `/api/admin/empresas/${suspEmpresaId}`, { token: superToken, body: { ativa: false } })
    expect(susp, 200, "suspender empresa")
    const login = await req("POST", "/api/auth/login", { body: { email: suspAdminEmail, senha: SENHA } })
    expect(login, 403, "login empresa inativa")
    if (login.data?.code !== "EMPRESA_INATIVA") throw new Error(`code=${login.data?.code}`)
  })

  await t("SUSP-2", "Token antigo: rota operacional → 403 EMPRESA_INATIVA", async () => {
    await req("PATCH", `/api/admin/empresas/${suspEmpresaId}`, { token: superToken, body: { ativa: true } })
    const login = await req("POST", "/api/auth/login", { body: { email: suspAdminEmail, senha: SENHA } })
    expect(login, 200, "login antes de suspender")
    const tok = login.data.token
    await req("PATCH", `/api/admin/empresas/${suspEmpresaId}`, { token: superToken, body: { ativa: false } })
    const r = await req("GET", "/api/clientes", { token: tok })
    expect(r, 403, "rota bloqueada com token antigo")
    if (r.data?.code !== "EMPRESA_INATIVA") throw new Error(`code=${r.data?.code}`)
  })

  await t("SUSP-3", "Reativar → login volta a 200", async () => {
    const re = await req("PATCH", `/api/admin/empresas/${suspEmpresaId}`, { token: superToken, body: { ativa: true } })
    expect(re, 200, "reativar")
    const login = await req("POST", "/api/auth/login", { body: { email: suspAdminEmail, senha: SENHA } })
    expect(login, 200, "login após reativar")
  })

  await t("SUSP-4", "Super admin não é afetado + auditoria tipo empresa gravada", async () => {
    await req("PATCH", `/api/admin/empresas/${suspEmpresaId}`, { token: superToken, body: { ativa: false } })
    const me = await req("GET", "/api/auth/me", { token: superToken })
    expect(me, 200, "super /me intacto")
    await req("PATCH", `/api/admin/empresas/${suspEmpresaId}`, { token: superToken, body: { ativa: true } })
    if (await auditoriaCount("empresa", suspEmpresaId) < 2) throw new Error("auditoria de suspensão não gravada")
  })

  // ---------- SUSPENSÃO DE USUÁRIO (PLAN-075 N3): conta ativa suspensa bloqueia login + token ----------
  let suspUsrId, suspUsrEmail, suspUsrToken
  await t("SUSP-USR-S", "Setup: operador ativo dedicado à suspensão de usuário", async () => {
    suspUsrEmail = `suspusr.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Susp Usr", email: suspUsrEmail, role: "operator" } })
    expect(r, 201, "criar operador suspensão")
    suspUsrId = r.data.id
    await ativarUsuario(suspUsrId, suspUsrEmail)
    const login = await req("POST", "/api/auth/login", { body: { email: suspUsrEmail, senha: SENHA } })
    expect(login, 200, "login antes de suspender")
    suspUsrToken = login.data.token
  })

  await t("SUSP-USR-1", "Suspender usuário ativo → login 403 CONTA_SUSPENSA", async () => {
    const susp = await req("PATCH", `/api/admin/operadores/${suspUsrId}/suspender`, { token: adminToken })
    expect(susp, 200, "suspender usuário")
    const login = await req("POST", "/api/auth/login", { body: { email: suspUsrEmail, senha: SENHA } })
    expect(login, 403, "login usuário suspenso")
    if (login.data?.code !== "CONTA_SUSPENSA") throw new Error(`code=${login.data?.code}`)
  })

  await t("SUSP-USR-2", "Token pré-suspensão: rota operacional → 403 CONTA_SUSPENSA; /me → 200 status suspenso", async () => {
    const r = await req("GET", "/api/clientes", { token: suspUsrToken })
    expect(r, 403, "rota bloqueada com token antigo")
    if (r.data?.code !== "CONTA_SUSPENSA") throw new Error(`code=${r.data?.code}`)
    const me = await req("GET", "/api/auth/me", { token: suspUsrToken })
    expect(me, 200, "/me liberado p/ exibir status")
    if (me.data?.status !== "suspenso") throw new Error(`status=${me.data?.status}`)
  })

  await t("SUSP-USR-3", "Reativar → login volta a 200", async () => {
    const re = await req("PATCH", `/api/admin/operadores/${suspUsrId}/reativar`, { token: adminToken })
    expect(re, 200, "reativar usuário")
    const login = await req("POST", "/api/auth/login", { body: { email: suspUsrEmail, senha: SENHA } })
    expect(login, 200, "login após reativar")
  })

  await t("SUSP-USR-4", "Auto-suspensão (403) + convidado não suspende (409)", async () => {
    const me = await req("GET", "/api/auth/me", { token: adminToken })
    const self = await req("PATCH", `/api/admin/operadores/${me.data.id}/suspender`, { token: adminToken })
    expect(self, 403, "auto-suspensão")
    if (self.data?.code !== "FORBIDDEN") throw new Error(`code=${self.data?.code}`)
    const conv = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Conv Susp", email: `suspconv.${Date.now()}@uorak.com`, role: "operator" } })
    expect(conv, 201, "criar convidado")
    const r = await req("PATCH", `/api/admin/operadores/${conv.data.id}/suspender`, { token: adminToken })
    expect(r, 409, "convidado não suspende")
  })

  await t("SUSP-USR-5", "Suspender usuário inexistente (404)", async () => {
    const r = await req("PATCH", "/api/admin/operadores/00000000-0000-4000-8000-000000000000/suspender", { token: adminToken })
    expect(r, 404, "usuário inexistente")
  })

  // ---------- COMBINAÇÕES SUSPENSÃO × AÇÕES (suspenso × edição/reassign/email/reativar) ----------
  // Cada cenário cria seus próprios usuários (isolamento) e reativa no fim quando
  // precisa evitar vazar estado suspenso para as seções seguintes.
  const criarUsuarioSusp = async (role, chefeId) => {
    const email = `suspcmb.${role}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: `SUSP CMB ${role}`, email, role, chefeId } })
    expect(r, 201, `criar ${role} (combinado)`)
    await ativarUsuario(r.data.id, email)
    return { id: r.data.id, email }
  }
  const suspenderOp = (id, token = adminToken) => req("PATCH", `/api/admin/operadores/${id}/suspender`, { token })
  const reativarOp = (id, token = adminToken) => req("PATCH", `/api/admin/operadores/${id}/reativar`, { token })

  await t("SUSP-USR-6", "Suspenso (admin c/ subordinado) → rebaixar role = 422 OPERATOR_HAS_SUBORDINATES", async () => {
    const a = await criarUsuarioSusp("admin")
    const sub = await criarUsuarioSusp("operator", a.id)
    const susp = await suspenderOp(a.id)
    expect(susp, 200, "suspender admin")
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "operator" } })
    expect(r, 422, "rebaixar suspenso com subordinado")
    if (r.data.code !== "OPERATOR_HAS_SUBORDINATES") throw new Error(`code=${r.data.code}`)
    if (r.data.subordinados !== 1) throw new Error(`subordinados=${r.data.subordinados}`)
    // Suspensão preservada após a tentativa de rebaixamento.
    const g = await req("GET", `/api/admin/operadores/${a.id}`, { token: adminToken })
    if (!g.data.suspensoEm) throw new Error("suspensoEm deveria permanecer")
    await reativarOp(a.id)
  })

  await t("SUSP-USR-7", "Suspenso (admin c/ subordinado) → rebaixar com reatribuirParaChefeId = 200; subordinado migra; suspensão preservada", async () => {
    const a = await criarUsuarioSusp("admin")
    const sub = await criarUsuarioSusp("operator", a.id)
    const novoChefe = await criarUsuarioSusp("admin")
    await suspenderOp(a.id)
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "operator", reatribuirParaChefeId: novoChefe.id } })
    expect(r, 200, "reassign atômico em suspenso")
    if (r.data.role !== "operator") throw new Error(`role=${r.data.role}`)
    if (!r.data.suspensoEm) throw new Error("suspensoEm deveria ser preservado no reassign")
    // Subordinado migrou para o novo chefe.
    const gSub = await req("GET", `/api/admin/operadores/${sub.id}`, { token: adminToken })
    if (gSub.data.chefeId !== novoChefe.id) throw new Error(`chefeId=${gSub.data.chefeId}`)
  })

  await t("SUSP-USR-8", "Editar dados de suspenso (nome/telefone) → 200; login segue 403 CONTA_SUSPENSA", async () => {
    const op = await criarUsuarioSusp("operator")
    await suspenderOp(op.id)
    const r = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: adminToken, body: { nome: "Susp Editado", telefone: "83999998888" } })
    expect(r, 200, "editar suspenso")
    if (r.data.nome !== "Susp Editado") throw new Error(`nome=${r.data.nome}`)
    const login = await req("POST", "/api/auth/login", { body: { email: op.email, senha: SENHA } })
    expect(login, 403, "login segue bloqueado")
    if (login.data.code !== "CONTA_SUSPENSA") throw new Error(`code=${login.data.code}`)
  })

  await t("SUSP-USR-9", "Reativar → login 200 → rebaixar sem subordinados = 200", async () => {
    const a = await criarUsuarioSusp("admin")
    await suspenderOp(a.id)
    const re = await reativarOp(a.id)
    expect(re, 200, "reativar")
    const login = await req("POST", "/api/auth/login", { body: { email: a.email, senha: SENHA } })
    expect(login, 200, "login após reativar")
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "operator" } })
    expect(r, 200, "rebaixar após reativar (sem subordinados)")
  })

  await t("SUSP-USR-10", "Trocar e-mail de suspenso (ativo) → email_pendente + verificação; login antigo segue 403 enquanto suspenso", async () => {
    const op = await criarUsuarioSusp("operator")
    await suspenderOp(op.id)
    const novoEmail = `suspnova.${Date.now()}@uorak.com`
    const r = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: adminToken, body: { email: novoEmail } })
    expect(r, 200, "trocar email de suspenso (ativo)")
    const g = await req("GET", `/api/admin/operadores/${op.id}`, { token: adminToken })
    if (g.data.emailPendente !== novoEmail) throw new Error(`emailPendente=${g.data.emailPendente}`)
    if (g.data.email === novoEmail) throw new Error("email não deveria trocar direto (conta ativa → pendente)")
    const login = await req("POST", "/api/auth/login", { body: { email: op.email, senha: SENHA } })
    expect(login, 403, "login antigo segue bloqueado (suspenso)")
  })

  await t("SUSP-USR-11", "Suspenso (sócio c/ subordinados) → super rebaixa com reassign = 200; subordinados migram", async () => {
    const s = await criarUsuarioSusp("socio")
    const sub = await criarUsuarioSusp("operator", s.id)
    const novoChefe = await criarUsuarioSusp("admin")
    await suspenderOp(s.id, superToken)
    const r = await req("PATCH", `/api/admin/operadores/${s.id}`, { token: superToken, body: { role: "operator", reatribuirParaChefeId: novoChefe.id } })
    expect(r, 200, "super reassign sócio suspenso")
    if (r.data.role !== "operator") throw new Error(`role=${r.data.role}`)
    const gSub = await req("GET", `/api/admin/operadores/${sub.id}`, { token: superToken })
    if (gSub.data.chefeId !== novoChefe.id) throw new Error(`chefeId=${gSub.data.chefeId}`)
  })

  await t("SUSP-USR-12", "Token de suspenso não age em rotas de admin (reativar próprio/outro) → 403 CONTA_SUSPENSA", async () => {
    const op = await criarUsuarioSusp("operator")
    const alvo = await criarUsuarioSusp("operator")
    const tokenOp = (await req("POST", "/api/auth/login", { body: { email: op.email, senha: SENHA } })).data.token
    await suspenderOp(op.id)
    // Token do suspenso (mesmo que ainda vivo) é bloqueado no authMiddleware.
    const r1 = await req("PATCH", `/api/admin/operadores/${op.id}/reativar`, { token: tokenOp })
    expect(r1, 403, "suspenso não reativa a si")
    if (r1.data.code !== "CONTA_SUSPENSA") throw new Error(`code=${r1.data.code}`)
    const r2 = await req("PATCH", `/api/admin/operadores/${alvo.id}/suspender`, { token: tokenOp })
    expect(r2, 403, "suspenso não suspende outro")
    if (r2.data.code !== "CONTA_SUSPENSA") throw new Error(`code=${r2.data.code}`)
  })

  // ---------- PERSISTÊNCIA DESATIVAÇÃO/ATIVAÇÃO (full cycle — garantir que a mudança é FEITA e RESPEITADA) ----------
  await t("PERS-1", "Force desativa clientes → GET/:id + /me sem clientes + rota 403", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: semClientesCascata, force: true, motivo: "smoke PERS-1" } })
    expect(r, 200, "force desativa")
    const g = await req("GET", `/api/admin/empresas/${guardEmpresaId}`, { token: superToken })
    expect(g, 200, "get empresa")
    if (g.data.modulos.includes("clientes")) throw new Error("clientes ainda ativo no GET/:id")
    const me = await req("GET", "/api/auth/me", { token: guardAdminToken })
    expect(me, 200, "me tenant")
    if (me.data.modulos.includes("clientes")) throw new Error("clientes ainda ativo no /me")
    const rota = await req("GET", "/api/clientes", { token: guardAdminToken })
    expect(rota, 403, "enforcement clientes off")
    if (rota.data?.code !== "MODULE_DISABLED") throw new Error(`code=${rota.data?.code}`)
  })

  await t("PERS-2", "Reativa clientes → GET/:id + /me com clientes + rota 200", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    expect(r, 200, "reativa")
    const g = await req("GET", `/api/admin/empresas/${guardEmpresaId}`, { token: superToken })
    if (!g.data.modulos.includes("clientes")) throw new Error("clientes não reativado no GET/:id")
    const me = await req("GET", "/api/auth/me", { token: guardAdminToken })
    if (!me.data.modulos.includes("clientes")) throw new Error("clientes não reativado no /me")
    const rota = await req("GET", "/api/clientes", { token: guardAdminToken })
    expect(rota, 200, "enforcement clientes on")
  })

  await t("PERS-3", "Desativa recurso cliente:anexos → GET/:id + /me refletem + anexos 403", async () => {
    const caps = ["cliente:whatsapp", "cliente:ligar", "cliente:navegar", "rota:whatsapp", "rota:ligar", "rota:navegar", "pagamento:comprovante_whatsapp"]
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/capacidades`, { token: superToken, body: { capacidades: caps } })
    expect(r, 200, "desativa anexos")
    const g = await req("GET", `/api/admin/empresas/${guardEmpresaId}`, { token: superToken })
    if (g.data.capacidades.includes("cliente:anexos")) throw new Error("anexos ainda ativo no GET/:id")
    const me = await req("GET", "/api/auth/me", { token: guardAdminToken })
    if (me.data.capacidades.includes("cliente:anexos")) throw new Error("anexos ainda ativo no /me")
    const anexos = await req("GET", `/api/clientes/${guardClienteId}/anexos`, { token: guardAdminToken })
    expect(anexos, 403, "anexos off → 403")
    if (anexos.data?.code !== "CAPABILITY_DISABLED") throw new Error(`code=${anexos.data?.code}`)
  })

  await t("PERS-4", "Reativa recurso (null) → /me volta + anexos 200", async () => {
    const r = await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/capacidades`, { token: superToken, body: { capacidades: null } })
    expect(r, 200, "reativa recursos")
    const me = await req("GET", "/api/auth/me", { token: guardAdminToken })
    if (me.data.capacidades !== null) throw new Error(`capacidades=${JSON.stringify(me.data.capacidades)}`)
    const anexos = await req("GET", `/api/clientes/${guardClienteId}/anexos`, { token: guardAdminToken })
    expect(anexos, 200, "anexos on → 200")
  })

  await t("PERS-5", "Idempotência: repetir PATCH → GET/:id inalterado", async () => {
    await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    const g1 = await req("GET", `/api/admin/empresas/${guardEmpresaId}`, { token: superToken })
    await req("PATCH", `/api/admin/empresas/${guardEmpresaId}/modulos`, { token: superToken, body: { modulos: MODULOS_ALL } })
    const g2 = await req("GET", `/api/admin/empresas/${guardEmpresaId}`, { token: superToken })
    if (JSON.stringify(g1.data.modulos?.sort()) !== JSON.stringify(g2.data.modulos?.sort())) throw new Error("modulos mudou sem necessidade")
  })

  // ---------- P13 — CONTEXTO DO OPERADOR: lista de clientes com ?usuarioId= (PLAN-063) ----------
  let p13ClienteId
  await t("P13-1", "admin lista clientes do operador com ?usuarioId= → só os do operador", async () => {
    const criado = await req("POST", "/api/clientes", { token: opToken, body: { nome: "Cliente P13", telefone: "83999990001", cpf: "52998224725", comercio: "Com", endereco: { logradouro: "Rua P13", cidade: "João Pessoa", estado: "PB" } } })
    expect(criado, 201, "criar cliente p13")
    p13ClienteId = criado.data.id
    const r = await req("GET", "/api/clientes", { token: adminToken, query: { usuarioId: gabrielId, limit: "100" } })
    expect(r, 200, "admin lista do operador")
    if (!r.data.data?.some((c) => c.id === p13ClienteId)) throw new Error("cliente do operador não veio na lista")
  })

  await t("P13-2", "socio com ?usuarioId= fora da subárvore → 404", async () => {
    const sEmail = `p13socio.${Date.now()}@uorak.com`
    const created = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "P13 Socio", email: sEmail, role: "socio" } })
    expect(created, 201, "criar socio p13")
    await ativarUsuario(created.data.id, sEmail)
    const login = await req("POST", "/api/auth/login", { body: { email: sEmail, senha: SENHA } })
    const r = await req("GET", "/api/clientes", { token: login.data.token, query: { usuarioId: gabrielId } })
    expect(r, 404, "socio fora da subárvore")
    if (r.data?.code !== "OPERATOR_NOT_FOUND") throw new Error(`code=${r.data?.code}`)
  })

  await t("P13-3", "operator ignora ?usuarioId= override → vê os próprios", async () => {
    const r = await req("GET", "/api/clientes", { token: opToken, query: { usuarioId: adminLogin.data.usuario.id, limit: "100" } })
    expect(r, 200, "operator lista")
    if (!r.data.data?.some((c) => c.id === p13ClienteId)) throw new Error("operator não vê os próprios clientes")
  })

  await t("P13-4", "admin sem ?usuarioId= → vê os próprios (comportamento preservado)", async () => {
    const r = await req("GET", "/api/clientes", { token: adminToken })
    expect(r, 200, "admin sem override")
  })

  await t("P13-5", "super_admin com ?empresaId= respeita a empresa-alvo", async () => {
    const r = await req("GET", "/api/clientes", { token: superToken, query: { empresaId: novaEmpresaId, limit: "100" } })
    expect(r, 200, "super com empresaId")
  })

  // ---------- FLUXO DE CONTA (PLAN-065): convite/ativação + forgot/reset ----------
  let convId, convEmail, convSenha
  await t("AC-15", "criar operador sem senha → convidado + convite gerado", async () => {
    const email = `conv.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Convidado S", email, role: "operator" } })
    expect(r, 201, "criar convidado")
    if (r.data.status !== "convidado") throw new Error(`status=${r.data.status}`)
    convId = r.data.id
    convEmail = email
    if (await convitesCount(convId) < 1) throw new Error("convite não criado na tabela convites")
  })

  await t("AC-16", "convidado → senhaHash NULL no banco", async () => {
    const { rows: ac16 } = await SMOKE_POOL.query("SELECT \"senha_hash\" FROM usuarios WHERE id = $1", [convId])
    if (ac16[0]?.["senha_hash"] !== null) throw new Error(`senhaHash=${ac16[0]?.["senha_hash"]}`)
  })

  await t("AC-13", "login de convidado → 403 ACCOUNT_PENDING", async () => {
    const login = await req("POST", "/api/auth/login", { body: { email: convEmail, senha: "qualquer123" } })
    expect(login, 403, "login convidado")
    if (login.data.code !== "ACCOUNT_PENDING") throw new Error(`code=${login.data.code}`)
  })

  await t("SE-01", "token de convite armazenado como HASH (64 hex)", async () => {
    const { rows: se01 } = await SMOKE_POOL.query("SELECT \"token_hash\" FROM convites WHERE \"usuario_id\" = $1 AND status = 'PENDENTE' ORDER BY \"criado_em\" DESC LIMIT 1", [convId])
    if (!se01[0]?.["token_hash"] || !/^[0-9a-f]{64}$/.test(se01[0]["token_hash"])) throw new Error(`hash=${se01[0]?.["token_hash"]}`)
  })

  await t("SE-04", "reenviar-convite invalida o convite anterior", async () => {
    const r = await req("PATCH", `/api/admin/operadores/${convId}/reenviar-convite`, { token: adminToken })
    expect(r, 200, "reenviar convite")
    if (await convitesCount(convId) !== 1) throw new Error("deveria haver exatamente 1 convite PENDENTE")
  })

  await t("AC-17", "reenviar-convite em conta ativa → 409", async () => {
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Ativo S", email: `ativo.${Date.now()}@uorak.com`, role: "operator" } })
    expect(criado, 201, "criar convidado")
    await ativarUsuario(criado.data.id, criado.data.email)
    const r = await req("PATCH", `/api/admin/operadores/${criado.data.id}/reenviar-convite`, { token: adminToken })
    expect(r, 409, "ativo não reenvia")
  })

  await t("AC-18", "reenviar-convite de usuário inexistente → 404", async () => {
    const r = await req("PATCH", "/api/admin/operadores/00000000-0000-4000-8000-000000000000/reenviar-convite", { token: adminToken })
    expect(r, 404, "inexistente")
  })

  await t("AC-05", "ativar com token válido → ok + login funciona", async () => {
    const raw = "rawtoken-ativar-123456"
    await inserirConvite(convId, convEmail, raw, new Date(Date.now() + 3600e3).toISOString())
    const r = await req("POST", "/api/auth/ativar", { body: { token: raw, senha: "novaSenha123" } })
    expect(r, 200, "ativar")
    const login = await req("POST", "/api/auth/login", { body: { email: convEmail, senha: "novaSenha123" } })
    expect(login, 200, "login pós ativação")
    if (login.data.usuario.status !== "ativo") throw new Error(`status=${login.data.usuario.status}`)
    convSenha = "novaSenha123"
  })

  await t("AC-08", "ativar com token já usado → 400 CONVITE_JA_USADO (single-use, PLAN-087)", async () => {
    const r = await req("POST", "/api/auth/ativar", { body: { token: "rawtoken-ativar-123456", senha: "outra123" } })
    expect(r, 400, "single-use")
    if (r.data.code !== "CONVITE_JA_USADO") throw new Error(`code=${r.data.code}`)
  })

  await t("AC-21", "link substituído por reenvio → 400 CONVITE_SUBSTITUIDO (PLAN-087)", async () => {
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Conv Subst", email: `convsubst.${Date.now()}@uorak.com`, role: "operator" } })
    expect(criado, 201, "criar convidado")
    const raw = "rawtoken-subst-00001"
    await inserirConvite(criado.data.id, criado.data.email, raw, new Date(Date.now() + 3600e3).toISOString())
    await req("PATCH", `/api/admin/operadores/${criado.data.id}/reenviar-convite`, { token: adminToken })
    const r = await req("POST", "/api/auth/ativar", { body: { token: raw, senha: "outra123" } })
    expect(r, 400, "substituído")
    if (r.data.code !== "CONVITE_SUBSTITUIDO") throw new Error(`code=${r.data.code}`)
  })

  await t("AC-22", "convite revogado → 400 CONVITE_REVOGADO (PLAN-087)", async () => {
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Conv Revog", email: `convrev.${Date.now()}@uorak.com`, role: "operator" } })
    expect(criado, 201, "criar convidado")
    // N2: um usuário só tem UM convite PENDENTE (findValidoPorUsuario = mais antigo).
    // Revoga o automático primeiro para o nosso convite de token conhecido ser o único.
    await req("PATCH", `/api/admin/operadores/${criado.data.id}/revogar-convite`, { token: adminToken })
    const raw = "rawtoken-revog-00001"
    await inserirConvite(criado.data.id, criado.data.email, raw, new Date(Date.now() + 3600e3).toISOString())
    await req("PATCH", `/api/admin/operadores/${criado.data.id}/revogar-convite`, { token: adminToken })
    const r = await req("POST", "/api/auth/ativar", { body: { token: raw, senha: "outra123" } })
    expect(r, 400, "revogado")
    if (r.data.code !== "CONVITE_REVOGADO") throw new Error(`code=${r.data.code}`)
  })

  await t("AC-23", "e-mail do usuário ≠ alvo do convite → 400 CONVITE_EMAIL_NAO_CONFERE (PLAN-087)", async () => {
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Conv Email", email: `convemail.${Date.now()}@uorak.com`, role: "operator" } })
    expect(criado, 201, "criar convidado")
    const raw = "rawtoken-email-00001"
    await inserirConvite(criado.data.id, "outro-email@uorak.com", raw, new Date(Date.now() + 3600e3).toISOString())
    const r = await req("POST", "/api/auth/ativar", { body: { token: raw, senha: "outra123" } })
    expect(r, 400, "email não confere")
    if (r.data.code !== "CONVITE_EMAIL_NAO_CONFERE") throw new Error(`code=${r.data.code}`)
  })

  await t("AC-19", "ativar com token de tipo errado → 400", async () => {
    const raw = "rawtoken-reset-000000"
    await inserirAuthToken(convId, "reset", raw, new Date(Date.now() + 3600e3).toISOString())
    const r = await req("POST", "/api/auth/ativar", { body: { token: raw, senha: "outra123" } })
    expect(r, 400, "tipo errado")
  })

  await t("AC-07", "ativar com token expirado → 400 TOKEN_EXPIRED", async () => {
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Conv Exp", email: `convexp.${Date.now()}@uorak.com`, role: "operator" } })
    expect(criado, 201, "criar convidado expirado")
    const raw = "rawtoken-expirado-000"
    await inserirConvite(criado.data.id, criado.data.email, raw, new Date(Date.now() - 1000).toISOString())
    const r = await req("POST", "/api/auth/ativar", { body: { token: raw, senha: "outra123" } })
    expect(r, 400, "expirado")
    if (r.data.code !== "TOKEN_EXPIRED") throw new Error(`code=${r.data.code}`)
  })

  await t("AC-20", "criar empresa sem adminSenha → admin convidado", async () => {
    const email = `admconv.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome: `Emp Conv ${Date.now()}`, adminNome: "Adm Conv", adminEmail: email } })
    expect(r, 201, "empresa sem senha")
    const login = await req("POST", "/api/auth/login", { body: { email, senha: "x" } })
    expect(login, 403, "admin convidado")
    if (login.data.code !== "ACCOUNT_PENDING") throw new Error(`code=${login.data.code}`)
  })

  await t("ES-02", "forgot de e-mail existente → 200 genérico", async () => {
    const r = await req("POST", "/api/auth/forgot", { body: { email: "admin@cobranca.com" } })
    expect(r, 200, "forgot existente")
  })

  await t("ES-03", "forgot de e-mail inexistente → 200 genérico (não vaza)", async () => {
    const r = await req("POST", "/api/auth/forgot", { body: { email: `naoexiste.${Date.now()}@uorak.com` } })
    expect(r, 200, "forgot inexistente")
  })

  await t("ES-08", "forgot de convidado → 200 + NENHUM token de reset", async () => {
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Conv FR", email: `convfr.${Date.now()}@uorak.com`, role: "operator" } })
    expect(criado, 201, "criar convidado")
    const r = await req("POST", "/api/auth/forgot", { body: { email: criado.data.email } })
    expect(r, 200, "forgot convidado")
    if (await authTokensCount(criado.data.id, "reset") !== 0) throw new Error("convidado não deve gerar reset")
  })

  let resetUserId
  await t("ES-05", "reset com token válido → login com a nova senha", async () => {
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Reset S", email: `reset.${Date.now()}@uorak.com`, role: "operator" } })
    expect(criado, 201, "criar ativo p/ reset")
    resetUserId = criado.data.id
    const raw = "rawtoken-reset-123456"
    await inserirAuthToken(resetUserId, "reset", raw, new Date(Date.now() + 1800e3).toISOString())
    const r = await req("POST", "/api/auth/reset", { body: { token: raw, senha: "senhaNova123" } })
    expect(r, 200, "reset")
    const login = await req("POST", "/api/auth/login", { body: { email: criado.data.email, senha: "senhaNova123" } })
    expect(login, 200, "login nova senha")
    if (login.data.usuario.status !== "ativo") throw new Error(`status=${login.data.usuario.status}`)
  })

  await t("ES-07", "reset com token reutilizado → 400", async () => {
    const r = await req("POST", "/api/auth/reset", { body: { token: "rawtoken-reset-123456", senha: "outra123" } })
    expect(r, 400, "reset reutilizado")
    if (r.data.code !== "TOKEN_INVALID") throw new Error(`code=${r.data.code}`)
  })

  await t("ES-10", "reset com token expirado → 400 TOKEN_EXPIRED", async () => {
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Reset Exp", email: `resetexp.${Date.now()}@uorak.com`, role: "operator" } })
    expect(criado, 201, "criar p/ reset expirado")
    const raw = "rawtoken-reset-expired"
    await inserirAuthToken(criado.data.id, "reset", raw, new Date(Date.now() - 1000).toISOString())
    const r = await req("POST", "/api/auth/reset", { body: { token: raw, senha: "outra123" } })
    expect(r, 400, "reset expirado")
    if (r.data.code !== "TOKEN_EXPIRED") throw new Error(`code=${r.data.code}`)
  })

  await t("ES-09", "reset com senha curta → 422", async () => {
    const r = await req("POST", "/api/auth/reset", { body: { token: "rawtoken-reset-123456", senha: "123" } })
    expect(r, 422, "senha curta")
  })

  await t("SM-1", "ciclo completo: convite → ativação → troca de senha → login novo", async () => {
    const email = `sm1.${Date.now()}@uorak.com`
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "SM1", email, role: "operator" } })
    expect(criado, 201, "criar convidado SM1")
    const raw = "rawtoken-sm1"
    await inserirConvite(criado.data.id, email, raw, new Date(Date.now() + 3600e3).toISOString())
    await req("POST", "/api/auth/ativar", { body: { token: raw, senha: "sm1Senha123" } })
    const login = await req("POST", "/api/auth/login", { body: { email, senha: "sm1Senha123" } })
    expect(login, 200, "login SM1")
    const troca = await req("PATCH", "/api/auth/senha", { token: login.data.token, body: { senhaAtual: "sm1Senha123", novaSenha: "sm1Nova123" } })
    expect(troca, 200, "troca senha")
    const relogin = await req("POST", "/api/auth/login", { body: { email, senha: "sm1Nova123" } })
    expect(relogin, 200, "login nova")
  })

  await t("SM-2", "ciclo completo: forgot → reset → login novo", async () => {
    const email = `sm2.${Date.now()}@uorak.com`
    const criado = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "SM2", email, role: "operator" } })
    expect(criado, 201, "criar p/ SM2")
    const raw = "rawtoken-sm2"
    await inserirAuthToken(criado.data.id, "reset", raw, new Date(Date.now() + 1800e3).toISOString())
    await req("POST", "/api/auth/reset", { body: { token: raw, senha: "sm2Nova123" } })
    const login = await req("POST", "/api/auth/login", { body: { email, senha: "sm2Nova123" } })
    expect(login, 200, "login SM2 nova")
  })

  await t("ES-11", "rate limit do forgot por email+IP → 429", async () => {
    const email = `rl.${Date.now()}@uorak.com`
    for (let i = 0; i < 3; i++) {
      const r = await req("POST", "/api/auth/forgot", { body: { email } })
      expect(r, 200, `forgot ${i}`)
    }
    const r = await req("POST", "/api/auth/forgot", { body: { email } })
    expect(r, 429, "rate limit forgot")
  })

  // ---------- HIERARQUIA DE PAPÉIS (PLAN-032) ----------
  let socioId, socioEmail, socioOpId, socioToken
  await t("SC-001", "Admin cria sócio (201, chefe = admin)", async () => {
    const email = `socio.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Sócio Smoke", email, role: "socio" } })
    expect(r, 201, "criar sócio")
    socioId = r.data.id
    socioEmail = email
    if (r.data.chefeId !== adminLogin.data.usuario.id) throw new Error("chefeId do sócio não é o admin")
  })
  await t("SC-002", "Ativação do sócio + login (role socio + chefeId)", async () => {
    await ativarUsuario(socioId, socioEmail)
    const r = await req("POST", "/api/auth/login", { body: { email: socioEmail, senha: SENHA } })
    expect(r, 200, "login sócio")
    socioToken = r.data.token
    if (r.data.usuario.role !== "socio") throw new Error("role não é socio")
    if (r.data.usuario.chefeId !== adminLogin.data.usuario.id) throw new Error("chefeId errado no login")
  })
  await t("SC-003", "Sócio cria operador do grupo (201, chefe = sócio)", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: socioToken, body: { nome: "Op do Sócio", email: `opsocio.${Date.now()}@uorak.com`, role: "operator" } })
    expect(r, 201, "sócio cria operador")
    socioOpId = r.data.id
    if (r.data.chefeId !== socioId) throw new Error("chefeId do operador não é o sócio")
  })
  await t("SC-004", "Sócio cria admin/socio (403)", async () => {
    const a = await req("POST", "/api/admin/operadores", { token: socioToken, body: { nome: "X", email: `x.${Date.now()}@uorak.com`, role: "admin" } })
    expect(a, 403, "sócio cria admin")
    const b = await req("POST", "/api/admin/operadores", { token: socioToken, body: { nome: "Y", email: `y.${Date.now()}@uorak.com`, role: "socio" } })
    expect(b, 403, "sócio cria socio")
  })
  await t("SC-005", "Sócio vê equipe da subárvore (não a empresa toda)", async () => {
    const r = await req("GET", "/api/admin/equipe", { token: socioToken })
    expect(r, 200, "equipe do sócio")
    const ids = r.data.operadores.map((o) => o.id)
    if (!ids.includes(socioId) || !ids.includes(socioOpId)) throw new Error("subárvore incompleta")
    if (ids.includes(gabrielId)) throw new Error("sócio viu operador fora da subárvore")
  })
  await t("SC-006", "Sócio acessa operador fora da subárvore (404)", async () => {
    const r = await req("GET", `/api/admin/operadores/${gabrielId}`, { token: socioToken })
    expect(r, 404, "operador fora da subárvore")
  })

  await t("SC-006b", "Sócio ajusta caixa do operador da subárvore (201, BR-325)", async () => {
    const r = await req("POST", "/api/caixa/ajuste", { token: socioToken, body: { valor: 2500, motivo: "smoke sócio subárvore" }, query: { usuarioId: socioOpId } })
    expect(r, 201, "sócio ajusta caixa da subárvore")
    if (r.data.caixaBase !== 2500) throw new Error(`caixaBase=${r.data.caixaBase}`)
  })
  await t("SC-006c", "Sócio ajusta caixa fora da subárvore (404)", async () => {
    const r = await req("POST", "/api/caixa/ajuste", { token: socioToken, body: { valor: 100, motivo: "smoke" }, query: { usuarioId: gabrielId } })
    expect(r, 404, "sócio ajusta fora da subárvore")
  })

  // ---------- TROCA ADMINISTRATIVA DE E-MAIL (PLAN-075 P-06/P-07) ----------
  await t("ADM-TROC-CONV", "Admin troca e-mail de CONVIDADO → troca direta + 201 convidado no novo e-mail", async () => {
    const email = `troc.${Date.now()}@uorak.com`
    const novo = `troc.novo.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Troc Conv", email, role: "operator" } })
    expect(r, 201, "criar convidado")
    const troca = await req("PATCH", `/api/admin/operadores/${r.data.id}`, { token: adminToken, body: { email: novo } })
    expect(troca, 200, "troca e-mail convidado")
    if (troca.data.email !== novo) throw new Error(`email=${troca.data.email} (esperava ${novo})`)
    if (troca.data.status !== "convidado") throw new Error(`status=${troca.data.status}`)
    const dupe = await req("GET", "/api/admin/operadores", { token: adminToken })
    expect(dupe, 200, "listar operadores")
  })

  await t("ADM-TROC-ATIVO", "Admin troca e-mail de usuário ATIVO → email_pendente + verificação (email antigo segue)", async () => {
    const email = `troc.ativo.${Date.now()}@uorak.com`
    const novo = `troc.ativo.novo.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Troc Ativo", email, role: "operator" } })
    expect(r, 201, "criar operador")
    await ativarUsuario(r.data.id, email)
    const troca = await req("PATCH", `/api/admin/operadores/${r.data.id}`, { token: adminToken, body: { email: novo } })
    expect(troca, 200, "troca e-mail ativo")
    if (troca.data.email !== email) throw new Error(`email mudou direto: ${troca.data.email}`)
    if (troca.data.emailPendente !== novo) throw new Error(`emailPendente=${troca.data.emailPendente}`)
    const login = await req("POST", "/api/auth/login", { body: { email, senha: SENHA } })
    expect(login, 200, "email antigo segue valendo")
  })

  await t("ADM-TROC-DUP", "Troca para e-mail já em uso (vivo) → 409", async () => {
    const email = `troc.dup.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Troc Dup", email, role: "operator" } })
    expect(r, 201, "criar operador dup")
    const troca = await req("PATCH", `/api/admin/operadores/${r.data.id}`, { token: adminToken, body: { email: adminLogin.data.usuario.email } })
    expect(troca, 409, "e-mail duplicado na troca")
    if (troca.data?.code !== "EMAIL_DUPLICATED") throw new Error(`code=${troca.data?.code}`)
  })
  await t("ADM-TROC-REUSE", "Reuso de e-mail de operador removido (soft-deleted) → 201 no create e 200 no PATCH", async () => {
    const email = `troc.reuse.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Reuso", email, role: "operator" } })
    expect(r, 201, "criar p/ remover")
    const del = await req("DELETE", `/api/admin/operadores/${r.data.id}`, { token: adminToken })
    expect(del, 204, "remover operador")
    const novamente = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Reuso2", email, role: "operator" } })
    expect(novamente, 201, "reuso no create")
    const del2 = await req("DELETE", `/api/admin/operadores/${novamente.data.id}`, { token: adminToken })
    expect(del2, 204, "remover 2")
    const alvo = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Alvo", email: `alvo.${Date.now()}@uorak.com`, role: "operator" } })
    expect(alvo, 201, "criar alvo")
    const troca = await req("PATCH", `/api/admin/operadores/${alvo.data.id}`, { token: adminToken, body: { email } })
    expect(troca, 200, "reuso no PATCH")
    if (troca.data.email !== email) throw new Error(`email=${troca.data.email}`)
  })

  await t("SOC-TROC-SUB", "Sócio troca e-mail do operador da subárvore (200)", async () => {
    const novo = `troc.sub.${Date.now()}@uorak.com`
    const r = await req("PATCH", `/api/admin/operadores/${socioOpId}`, { token: socioToken, body: { email: novo } })
    expect(r, 200, "sócio troca e-mail da subárvore")
  })

  await t("SOC-TROC-FORA", "Sócio tenta trocar e-mail de operador fora da subárvore (404)", async () => {
    const r = await req("PATCH", `/api/admin/operadores/${gabrielId}`, { token: socioToken, body: { email: `troc.fora.${Date.now()}@uorak.com` } })
    expect(r, 404, "sócio troca fora da subárvore")
  })

  // ---------- TRANSIÇÕES DE PAPEL (WS7) — CTs 120+ ----------
  // Cada teste cria seus próprios usuários (isolamento; emails com Date.now()).
  const adminId = adminLogin.data.usuario.id
  const criarUsuario = async (role, chefeId) => {
    const email = `tr.${role}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: `TR ${role}`, email, role, chefeId } })
    expect(r, 201, `criar ${role}`)
    await ativarUsuario(r.data.id, email)
    return { id: r.data.id, email }
  }

  await t("TR-OPSOC (120)", "admin promove operator→socio (201, chefe=admin, login reflete)", async () => {
    const op = await criarUsuario("operator")
    const r = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: adminToken, body: { role: "socio", chefeId: adminId } })
    expect(r, 200, "promove operator→socio")
    if (r.data.role !== "socio") throw new Error(`role=${r.data.role}`)
    if (r.data.chefeId !== adminId) throw new Error(`chefeId=${r.data.chefeId} (esperava admin)`)
    const login = await req("POST", "/api/auth/login", { body: { email: op.email, senha: SENHA } })
    expect(login, 200, "login promovido")
    if (login.data.usuario.role !== "socio") throw new Error(`login.role=${login.data.usuario.role}`)
  })

  await t("TR-OPADM (121)", "admin promove operator→admin (201, chefe=null, token antigo opera)", async () => {
    const op = await criarUsuario("operator")
    const login = await req("POST", "/api/auth/login", { body: { email: op.email, senha: SENHA } })
    expect(login, 200, "login operator")
    const preToken = login.data.token
    const r = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: adminToken, body: { role: "admin" } })
    expect(r, 200, "promove operator→admin")
    if (r.data.role !== "admin") throw new Error(`role=${r.data.role}`)
    if (r.data.chefeId !== null) throw new Error(`chefeId=${r.data.chefeId} (admin deve ser null)`)
    // WS2: middleware lê role do BANCO — mesmo token antigo já vale como admin
    const eq2 = await req("GET", "/api/admin/equipe", { token: preToken })
    expect(eq2, 200, "token antigo acessa /admin/equipe após promoção")
  })

  await t("TR-SOCADM (122)", "admin promove socio→admin (201, escopo vira empresa toda)", async () => {
    const r = await req("PATCH", `/api/admin/operadores/${socioId}`, { token: adminToken, body: { role: "admin" } })
    expect(r, 200, "promove socio→admin")
    if (r.data.role !== "admin") throw new Error(`role=${r.data.role}`)
    const eq2 = await req("GET", "/api/admin/equipe", { token: socioToken })
    expect(eq2, 200, "equipe do promovido")
    if (!eq2.data.operadores.some((o) => o.id === gabrielId)) throw new Error("promovido não vê a empresa toda")
  })

  await t("TR-SOC-OP (123)", "admin rebaixa socio→operator (422 órfão → reatribui → 201) + token antigo 403", async () => {
    // socioId tem socioOpId como subordinado → rebaixar direto é bloqueado
    const bloqueado = await req("PATCH", `/api/admin/operadores/${socioId}`, { token: adminToken, body: { role: "operator" } })
    expect(bloqueado, 422, "rebaixar com subordinado bloqueado")
    if (bloqueado.data.code !== "OPERATOR_HAS_SUBORDINATES") throw new Error(`code=${bloqueado.data.code}`)
    if (bloqueado.data.subordinados < 1) throw new Error(`subordinados=${bloqueado.data.subordinados}`)
    // reatribui o subordinado para o admin
    const reassign = await req("PATCH", `/api/admin/operadores/${socioOpId}`, { token: adminToken, body: { chefeId: null } })
    expect(reassign, 200, "reatribuir chefe")
    const r = await req("PATCH", `/api/admin/operadores/${socioId}`, { token: adminToken, body: { role: "operator" } })
    expect(r, 200, "rebaixar socio→operator")
    if (r.data.role !== "operator") throw new Error(`role=${r.data.role}`)
    const eq2 = await req("GET", "/api/admin/equipe", { token: socioToken })
    expect(eq2, 403, "token antigo não acessa mais /admin/equipe")
  })

  await t("TR-ADMSOC (124)", "admin rebaixa admin→socio (201)", async () => {
    const a = await criarUsuario("admin")
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "socio", chefeId: null } })
    expect(r, 200, "rebaixa admin→socio")
    if (r.data.role !== "socio") throw new Error(`role=${r.data.role}`)
    const login = await req("POST", "/api/auth/login", { body: { email: a.email, senha: SENHA } })
    if (login.data.usuario.role !== "socio") throw new Error("login.role não é socio")
  })

  await t("TR-ADMOP (125)", "admin rebaixa admin→operator (201) + token antigo 403", async () => {
    const a = await criarUsuario("admin")
    const login = await req("POST", "/api/auth/login", { body: { email: a.email, senha: SENHA } })
    expect(login, 200, "login admin")
    const aToken = login.data.token
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "operator" } })
    expect(r, 200, "rebaixa admin→operator")
    if (r.data.role !== "operator") throw new Error(`role=${r.data.role}`)
    const eq2 = await req("GET", "/api/admin/equipe", { token: aToken })
    expect(eq2, 403, "token antigo rebaixado é 403")
  })

  await t("TR-SOCIO-403 (126)", "sócio não promove: PATCH role admin/socio = 403, operator = 200", async () => {
    const socio = await criarUsuario("socio")
    const op = await criarUsuario("operator")
    await req("PATCH", `/api/admin/operadores/${op.id}`, { token: adminToken, body: { chefeId: socio.id } })
    const sLogin = await req("POST", "/api/auth/login", { body: { email: socio.email, senha: SENHA } })
    expect(sLogin, 200, "login sócio")
    const st = sLogin.data.token
    const a = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: st, body: { role: "admin" } })
    expect(a, 403, "sócio promove a admin")
    const b = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: st, body: { role: "socio" } })
    expect(b, 403, "sócio promove a socio")
    const c = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: st, body: { role: "operator" } })
    expect(c, 200, "sócio mantém operator")
    // self: sócio não altera o próprio papel
    const self = await req("PATCH", `/api/admin/operadores/${socio.id}`, { token: st, body: { role: "admin" } })
    expect(self, 403, "sócio auto-promove")
  })

  await t("TR-ORFAO (127)", "rebaixar admin com subordinado = 422; após reatribuir = 200", async () => {
    const a = await criarUsuario("admin")
    const sub = await criarUsuario("operator")
    await req("PATCH", `/api/admin/operadores/${sub.id}`, { token: adminToken, body: { chefeId: a.id } })
    const bloqueado = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "operator" } })
    expect(bloqueado, 422, "admin com subordinado não rebaixa")
    await req("PATCH", `/api/admin/operadores/${sub.id}`, { token: adminToken, body: { chefeId: null } })
    const ok = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "operator" } })
    expect(ok, 200, "após reatribuir, rebaixa")
  })

  await t("TR-CHEFE-SOCIO (128)", "promover operator com chefe sócio p/ sócio sem trocar chefe = 422", async () => {
    const socio = await criarUsuario("socio")
    const op = await criarUsuario("operator")
    await req("PATCH", `/api/admin/operadores/${op.id}`, { token: adminToken, body: { chefeId: socio.id } })
    const r = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: adminToken, body: { role: "socio", chefeId: socio.id } })
    expect(r, 422, "chefe de sócio deve ser admin")
  })

  await t("TR-TARGET-SUPER (129)", "PATCH super_admin = 403", async () => {
    const me = await req("GET", "/api/auth/me", { token: superToken })
    const r = await req("PATCH", `/api/admin/operadores/${me.data.id}`, { token: superToken, body: { role: "operator" } })
    expect(r, 403, "não altera super_admin")
  })

  await t("TR-ROLE-SUPER (130)", "PATCH role=super_admin = 400", async () => {
    const op = await criarUsuario("operator")
    const r = await req("PATCH", `/api/admin/operadores/${op.id}`, { token: adminToken, body: { role: "super_admin" } })
    expect(r, 400, "role super_admin inválido")
  })

  await t("TR-CROSS-TENANT (131)", "admin PATCH role de operador de outra empresa = 404", async () => {
    const ops = await req("GET", "/api/admin/operadores", { token: superToken })
    const rafael = ops.data.find((o) => o.email === "rafael.nx@uorak.com")
    if (!rafael) throw new Error("rafael não achado")
    const r = await req("PATCH", `/api/admin/operadores/${rafael.id}`, { token: adminToken, body: { role: "socio" } })
    expect(r, 404, "cross-tenant bloqueado")
  })

  // ---------- MATRIZ DE REBAIXAMENTO (PLAN-061): ator super + variações de órfão + reassign atômico ----------
  await t("SUP-1", "super rebaixa admin→operator sem subordinado → 200", async () => {
    const a = await criarUsuario("admin")
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: superToken, body: { role: "operator" } })
    expect(r, 200, "super rebaixa admin→op")
    if (r.data.role !== "operator") throw new Error(`role=${r.data.role}`)
  })

  await t("SUP-2", "super rebaixa admin→operator COM subordinado → 422 + count (regressão do bug)", async () => {
    const a = await criarUsuario("admin")
    await criarUsuario("operator", a.id)
    const bloqueado = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: superToken, body: { role: "operator" } })
    expect(bloqueado, 422, "super: órfão bloqueia")
    if (bloqueado.data.code !== "OPERATOR_HAS_SUBORDINATES") throw new Error(`code=${bloqueado.data.code}`)
    if (bloqueado.data.subordinados !== 1) throw new Error(`subordinados=${bloqueado.data.subordinados}`)
  })

  await t("SUP-3", "super admin→socio: com subordinado sócio → 422; sem → 200", async () => {
    const a = await criarUsuario("admin")
    await criarUsuario("socio", a.id)
    const bloqueado = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: superToken, body: { role: "socio" } })
    expect(bloqueado, 422, "admin→socio com subord sócio")
    const b = await criarUsuario("admin")
    const ok = await req("PATCH", `/api/admin/operadores/${b.id}`, { token: superToken, body: { role: "socio" } })
    expect(ok, 200, "admin→socio sem subord sócio")
  })

  await t("SUP-4", "super socio→operator: com subordinado → 422; reassign separado → 200", async () => {
    const s = await criarUsuario("socio")
    const sub = await criarUsuario("operator", s.id)
    const bloqueado = await req("PATCH", `/api/admin/operadores/${s.id}`, { token: superToken, body: { role: "operator" } })
    expect(bloqueado, 422, "socio→op com subord")
    await req("PATCH", `/api/admin/operadores/${sub.id}`, { token: superToken, body: { chefeId: null } })
    const ok = await req("PATCH", `/api/admin/operadores/${s.id}`, { token: superToken, body: { role: "operator" } })
    expect(ok, 200, "socio→op após reassign")
  })

  await t("SUP-5", "super promove operator→socio · operator→admin · socio→admin → 200", async () => {
    const op1 = await criarUsuario("operator")
    const op2 = await criarUsuario("operator")
    const s = await criarUsuario("socio")
    const r1 = await req("PATCH", `/api/admin/operadores/${op1.id}`, { token: superToken, body: { role: "socio", chefeId: adminId } })
    expect(r1, 200, "op→socio")
    const r2 = await req("PATCH", `/api/admin/operadores/${op2.id}`, { token: superToken, body: { role: "admin" } })
    expect(r2, 200, "op→admin")
    const r3 = await req("PATCH", `/api/admin/operadores/${s.id}`, { token: superToken, body: { role: "admin" } })
    expect(r3, 200, "socio→admin")
  })

  await t("SUP-6", "super rebaixa admin de OUTRA empresa via ?empresaId= → 200", async () => {
    const email = `rb.xt.${Date.now()}@uorak.com`
    const created = await req("POST", "/api/admin/operadores", { token: guardAdmin2Token, body: { nome: "RB XT", email, role: "admin" } })
    expect(created, 201, "criar admin outra empresa")
    const r = await req("PATCH", `/api/admin/operadores/${created.data.id}`, { token: superToken, body: { role: "operator" }, query: { empresaId: guardEmpresa2Id } })
    expect(r, 200, "super rebaixa cross-tenant")
    if (r.data.role !== "operator") throw new Error(`role=${r.data.role}`)
  })

  await t("ORF-1", "admin admin→socio com subordinado SÓCIO → 422", async () => {
    const a = await criarUsuario("admin")
    await criarUsuario("socio", a.id)
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "socio" } })
    expect(r, 422, "admin→socio com subord sócio")
    if (r.data.code !== "OPERATOR_HAS_SUBORDINATES") throw new Error(`code=${r.data.code}`)
  })

  await t("ORF-2", "admin admin→operator com subordinado SÓCIO → 422", async () => {
    const a = await criarUsuario("admin")
    await criarUsuario("socio", a.id)
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "operator" } })
    expect(r, 422, "admin→op com subord sócio")
    if (r.data.code !== "OPERATOR_HAS_SUBORDINATES") throw new Error(`code=${r.data.code}`)
  })

  await t("ORF-3", "admin admin→socio com subordinados só operator → 200", async () => {
    const a = await criarUsuario("admin")
    await criarUsuario("operator", a.id)
    const r = await req("PATCH", `/api/admin/operadores/${a.id}`, { token: adminToken, body: { role: "socio" } })
    expect(r, 200, "admin→socio com operator subordinado")
    if (r.data.role !== "socio") throw new Error(`role=${r.data.role}`)
  })

  await t("REAS-1", "rebaixar + reatribuirParaChefeId no MESMO PATCH → 200 e subordinados movem", async () => {
    const alvo = await criarUsuario("admin")
    const sub = await criarUsuario("operator", alvo.id)
    const novoChefe = await criarUsuario("admin")
    const r = await req("PATCH", `/api/admin/operadores/${alvo.id}`, { token: adminToken, body: { role: "operator", reatribuirParaChefeId: novoChefe.id } })
    expect(r, 200, "reassign atômico")
    if (r.data.role !== "operator") throw new Error(`role=${r.data.role}`)
    const subDetalhe = await req("GET", `/api/admin/operadores/${sub.id}`, { token: adminToken })
    expect(subDetalhe, 200, "detalhe subordinado")
    if (subDetalhe.data.chefeId !== novoChefe.id) throw new Error(`chefe do subordinado=${subDetalhe.data.chefeId}`)
  })

  await t("POS-1", "novo chefe passa a ver o subordinado reatribuído na equipe", async () => {
    const novoChefe = await criarUsuario("admin")
    const alvo = await criarUsuario("admin")
    const sub = await criarUsuario("operator", alvo.id)
    await req("PATCH", `/api/admin/operadores/${alvo.id}`, { token: adminToken, body: { role: "operator", reatribuirParaChefeId: novoChefe.id } })
    const nLogin = await req("POST", "/api/auth/login", { body: { email: novoChefe.email, senha: SENHA } })
    expect(nLogin, 200, "login novo chefe")
    const eq = await req("GET", "/api/admin/equipe", { token: nLogin.data.token })
    if (!eq.data.operadores.some((o) => o.id === sub.id)) throw new Error("novo chefe não vê o subordinado")
  })

  // ---------- VARIAÇÕES (V1–V8) ----------
  let vContrato
  let pagamentoQuitacaoId
  await t("VAR-PRE", "Cria cliente + contrato 4×150 p/ variações de pagamento", async () => {
    const c = await req("POST", "/api/clientes", { token: opToken, body: { nome: "Cliente V", telefone: "83911112222", comercio: "Comércio V", endereco: { logradouro: "Rua V", cidade: "João Pessoa", estado: "PB" } } })
    expect(c, 201, "cliente V")
    const ct = await req("POST", "/api/contratos", { token: opToken, body: { clienteId: c.data.id, valorBase: 500, percentualJuros: 20, quantidadeParcelas: 4, dataInicio: "2026-08-04" } })
    expect(ct, 201, "contrato V")
    vContrato = ct.data.id
    if (ct.data.valorFinal !== 600) throw new Error(`valorFinal=${ct.data.valorFinal} (esperava 600)`)
  })
  await t("V1-080", "Pagamento atravessa parcelas (200 → p1 Paga + p2 Parcial 100)", async () => {
    const r = await req("POST", "/api/pagamentos", { token: opToken, body: { contratoId: vContrato, valor: 200 } })
    expect(r, 201, "pagamento 200")
    const det = await req("GET", `/api/contratos/${vContrato}`, { token: opToken })
    expect(det, 200, "detalhe")
    const ps = det.data.parcelas
    if (ps[0].estado !== "Paga") throw new Error(`p1=${ps[0].estado} (esperava Paga)`)
    if (ps[1].estado !== "Parcial") throw new Error(`p2=${ps[1].estado} (esperava Parcial)`)
    if (Math.abs(ps[1].saldoPendente - 100) > 0.01) throw new Error(`p2 saldo=${ps[1].saldoPendente} (esperava 100)`)
  })
  await t("V2-081", "Quitar contrato (paga 400 restantes → Finalizado)", async () => {
    const r = await req("POST", "/api/pagamentos", { token: opToken, body: { contratoId: vContrato, valor: 400 } })
    expect(r, 201, "pagamento 400")
    pagamentoQuitacaoId = r.data.id
    const det = await req("GET", `/api/contratos/${vContrato}`, { token: opToken })
    expect(det, 200, "detalhe")
    if (det.data.estado !== "Finalizado") throw new Error(`estado=${det.data.estado} (esperava Finalizado)`)
  })
  await t("V3-082", "Estorno reverte Finalizado → Ativo", async () => {
    const r = await req("POST", `/api/pagamentos/${pagamentoQuitacaoId}/estornar`, { token: adminToken, body: { motivo: "V3 revert" }, query: { usuarioId: gabrielId } })
    expect(r, 201, "estorno V3")
    const det = await req("GET", `/api/contratos/${vContrato}`, { token: opToken })
    expect(det, 200, "detalhe pós estorno")
    if (det.data.estado !== "Ativo") throw new Error(`estado=${det.data.estado} (esperava Ativo)`)
  })
  await t("V4-083", "Cliente com 2 contratos → 2 linhas no cobranças", async () => {
    const c = await req("POST", "/api/clientes", { token: opToken, body: { nome: "Cliente 2C", telefone: "83922223333", comercio: "Comércio 2C", endereco: { logradouro: "Rua 2C", cidade: "João Pessoa", estado: "PB" } } })
    expect(c, 201, "cliente 2C")
    const a = await req("POST", "/api/contratos", { token: opToken, body: { clienteId: c.data.id, valorBase: 200, percentualJuros: 20, quantidadeParcelas: 3, dataInicio: "2026-07-20" } })
    expect(a, 201, "contrato A")
    const b = await req("POST", "/api/contratos", { token: opToken, body: { clienteId: c.data.id, valorBase: 100, percentualJuros: 20, quantidadeParcelas: 2, dataInicio: "2026-07-21" } })
    expect(b, 201, "contrato B")
    const r = await req("GET", "/api/operacoes/cobrancas", { token: opToken })
    expect(r, 200, "cobrancas")
    const rows = r.data.cobrancas.filter((x) => x.clienteId === c.data.id)
    if (rows.length !== 2) throw new Error(`linhas=${rows.length} (esperava 2)`)
  })
  await t("V5-084", "Ajuste de caixa é absoluto (3000 sobre 100000 → 3000)", async () => {
    const r = await req("POST", "/api/caixa/ajuste", { token: adminToken, body: { valor: 3000, motivo: "V5 absoluto" }, query: { usuarioId: gabrielId } })
    expect(r, 201, "ajuste 3000")
    const c = await req("GET", "/api/caixa", { token: adminToken, query: { usuarioId: gabrielId } })
    expect(c, 200, "caixa")
    if (c.data.caixaBase !== 3000) throw new Error(`caixaBase=${c.data.caixaBase} (esperava 3000, não 103000)`)
    await req("POST", "/api/caixa/ajuste", { token: adminToken, body: { valor: 100000, motivo: "V5 restore" }, query: { usuarioId: gabrielId } })
  })
  let rafaelId
  await t("V6A", "Acha rafael (empresa 1) via super admin", async () => {
    const ops = await req("GET", "/api/admin/operadores", { token: superToken })
    expect(ops, 200, "ops")
    const rafael = ops.data.find((o) => o.email === "rafael.nx@uorak.com")
    if (!rafael) throw new Error("rafael não achado")
    rafaelId = rafael.id
  })
  await t("V6-085", "Cross-tenant: admin empresa 0 acessa caixa empresa 1 (404)", async () => {
    const r = await req("GET", "/api/caixa", { token: adminToken, query: { usuarioId: rafaelId } })
    expect(r, 404, "caixa cross-tenant")
  })
  await t("V7-086", "Super admin ajusta caixa de outra empresa (201)", async () => {
    const r = await req("POST", "/api/caixa/ajuste", { token: superToken, body: { valor: 5000, motivo: "V7 super cross-empresa" }, query: { usuarioId: rafaelId } })
    expect(r, 201, "ajuste super cross-empresa")
  })
  await t("V8-087", "Token inválido em rota protegida (401)", async () => {
    const r = await req("GET", "/api/clientes", { token: "token-invalido" })
    expect(r, 401, "clientes token inválido")
    const c = await req("GET", "/api/caixa", { token: "token-invalido" })
    expect(c, 401, "caixa token inválido")
  })

  // ---------- LEADS COMERCIAIS (PLAN-064) ----------
  let leadId, leadEmail
  const countLeads = async () => {
    const { rows } = await SMOKE_POOL.query("SELECT COUNT(*)::int AS c FROM leads")
    return rows[0]?.c ?? 0
  }
  const countEmpresas = async () => {
    const { rows } = await SMOKE_POOL.query("SELECT COUNT(*)::int AS c FROM empresas")
    return rows[0]?.c ?? 0
  }

  await t("LD-01", "criar lead público → 201 NOVO + token de confirmação", async () => {
    leadEmail = `lead.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/leads", { body: { nomeResponsavel: "Maria Interessada", empresa: "Comercial Exemplo", email: leadEmail, telefone: "11999999999" } })
    expect(r, 201, "criar lead")
    if (r.data.lead.status !== "NOVO") throw new Error(`status=${r.data.lead.status}`)
    leadId = r.data.lead.id
    const tok = await authTokensCount(leadId, "lead")
    if (tok < 1) throw new Error("token de confirmação não criado")
    const { rows: ld01 } = await SMOKE_POOL.query("SELECT hash FROM auth_tokens WHERE \"subject_id\" = $1 AND tipo = 'lead' AND \"usado_em\" IS NULL ORDER BY \"created_at\" DESC LIMIT 1", [leadId])
    if (!ld01[0]?.hash?.match(/^[0-9a-f]{64}$/)) throw new Error("token não armazenado como hash SHA-256")
  })

  await t("LD-05", "criar lead NÃO cria empresa/usuário (isolamento)", async () => {
    const antes = await countEmpresas()
    const { rows: ld05 } = await SMOKE_POOL.query("SELECT id FROM usuarios WHERE email = $1", [leadEmail])
    if (ld05.length > 0) throw new Error("lead virou usuário")
    if ((await countEmpresas()) !== antes) throw new Error("lead criou empresa")
  })

  await t("LD-02", "e-mail duplicado → 200 jaExistia (não duplica)", async () => {
    const antes = await countLeads()
    const r = await req("POST", "/api/leads", { body: { nomeResponsavel: "Outra", empresa: "Outra Ltda", email: leadEmail } })
    expect(r, 200, "lead duplicado")
    if (!r.data.jaExistia) throw new Error("jaExistia não sinalizado")
    if ((await countLeads()) !== antes) throw new Error("lead duplicado criado")
  })

  await t("LD-15", "e-mail que já é usuário → 409 LEAD_EMAIL_JA_USUARIO", async () => {
    const r = await req("POST", "/api/leads", { body: { nomeResponsavel: "Pessoa Existente", empresa: "Empresa Real Ltda", email: "admin@cobranca.com" } })
    expect(r, 409, "email já usuário")
    if (r.data.code !== "LEAD_EMAIL_JA_USUARIO") throw new Error(`code=${r.data.code}`)
  })

  await t("LD-03", "validação (sem email / email inválido) → 422", async () => {
    const a = await req("POST", "/api/leads", { body: { nomeResponsavel: "X", empresa: "Y" } })
    expect(a, 422, "sem email")
    const b = await req("POST", "/api/leads", { body: { nomeResponsavel: "X", empresa: "Y", email: "não-é-email" } })
    expect(b, 422, "email inválido")
  })

  await t("LD-06", "confirmar token → EMAIL_CONFIRMADO (single-use)", async () => {
    const raw = "lead-raw-confirm"
    await inserirAuthToken(leadId, "lead", raw, new Date(Date.now() + 3600e3).toISOString())
    const r = await req("POST", "/api/leads/confirmar", { body: { token: raw } })
    expect(r, 200, "confirmar lead")
    if (r.data.lead.status !== "EMAIL_CONFIRMADO") throw new Error(`status=${r.data.lead.status}`)
  })

  await t("LD-08", "token de confirmação usado → 400 TOKEN_INVALID", async () => {
    const r = await req("POST", "/api/leads/confirmar", { body: { token: "lead-raw-confirm" } })
    expect(r, 400, "token usado")
    if (r.data.code !== "TOKEN_INVALID") throw new Error(`code=${r.data.code}`)
  })

  await t("LD-07", "token de confirmação expirado → 400 TOKEN_EXPIRED", async () => {
    const raw = "lead-raw-expired"
    await inserirAuthToken(leadId, "lead", raw, new Date(Date.now() - 1000).toISOString())
    const r = await req("POST", "/api/leads/confirmar", { body: { token: raw } })
    expect(r, 400, "token expirado")
    if (r.data.code !== "TOKEN_EXPIRED") throw new Error(`code=${r.data.code}`)
  })

  await t("LD-09", "super lista leads (200) com filtro por status + paginação", async () => {
    const r = await req("GET", "/api/admin/leads", { token: superToken })
    expect(r, 200, "listar leads")
    if (!r.data.data.some((l) => l.id === leadId)) throw new Error("lead não na lista")
    if (!r.data.pagination || typeof r.data.pagination.total !== "number") throw new Error("paginação ausente")
    const f = await req("GET", "/api/admin/leads?status=EMAIL_CONFIRMADO", { token: superToken })
    expect(f, 200, "filtro status")
    if (!f.data.data.every((l) => l.status === "EMAIL_CONFIRMADO")) throw new Error("filtro quebrado")
    const p2 = await req("GET", "/api/admin/leads?page=2&limit=1", { token: superToken })
    expect(p2, 200, "paginação page=2 limit=1")
    if (p2.data.data.length > 1) throw new Error("limit ignorado")
    if (p2.data.pagination.page !== 2) throw new Error("page ignorado")
  })
  await t("LD-BUS", "busca em leads: ?q por nome/empresa/email (mantém status + paginação)", async () => {
    const qn = await req("GET", `/api/admin/leads?q=${encodeURIComponent("Maria Interessada")}`, { token: superToken })
    expect(qn, 200, "busca por nome")
    if (!qn.data.data.some((l) => l.id === leadId)) throw new Error("q por nome não achou o lead")
    const qe = await req("GET", `/api/admin/leads?q=${encodeURIComponent(leadEmail)}`, { token: superToken })
    expect(qe, 200, "busca por email")
    if (!qe.data.data.some((l) => l.id === leadId)) throw new Error("q por email não achou o lead")
  })

  await t("LD-13", "não-super em /admin/leads → 403", async () => {
    const r = await req("GET", "/api/admin/leads", { token: adminToken })
    expect(r, 403, "admin bloqueado")
  })

  await t("LD-10", "iniciar onboarding → EM_ONBOARDING", async () => {
    const r = await req("POST", `/api/admin/leads/${leadId}/onboarding`, { token: superToken })
    expect(r, 200, "iniciar onboarding")
    if (r.data.status !== "EM_ONBOARDING") throw new Error(`status=${r.data.status}`)
  })

  await t("LD-11", "converter → empresa + admin (convite) + CONVERTIDO + auditoria", async () => {
    const antesEmpresas = await countEmpresas()
    const r = await req("POST", `/api/admin/leads/${leadId}/converter`, { token: superToken })
    expect(r, 200, "converter")
    if (r.data.lead.status !== "CONVERTIDO") throw new Error(`status=${r.data.lead.status}`)
    if (!r.data.lead.convertidoEmpresaId) throw new Error("empresaId ausente")
    if (!r.data.lead.convertidoPor) throw new Error("auditoria convertidoPor ausente")
    if (!r.data.lead.convertidoEm) throw new Error("auditoria convertidoEm ausente")
    if ((await countEmpresas()) !== antesEmpresas + 1) throw new Error("empresa não criada")
    // admin convidado (sem senha) → login 403 ACCOUNT_PENDING
    const login = await req("POST", "/api/auth/login", { body: { email: leadEmail, senha: SENHA } })
    expect(login, 403, "admin convidado")
    if (login.data.code !== "ACCOUNT_PENDING") throw new Error(`code=${login.data.code}`)
  })

  await t("LD-12", "descartar → DESCARTADO + LGPD (dados anonimizados)", async () => {
    const email = `desc.${Date.now()}@uorak.com`
    const criado = await req("POST", "/api/leads", { body: { nomeResponsavel: "Ana", empresa: "Descartada Ltda", email } })
    expect(criado, 201, "criar p/ descarte")
    const r = await req("POST", `/api/admin/leads/${criado.data.lead.id}/descartar`, { token: superToken, body: { motivo: "Fora do perfil" } })
    expect(r, 200, "descartar")
    if (r.data.status !== "DESCARTADO") throw new Error(`status=${r.data.status}`)
    if (r.data.email !== null && r.data.email.startsWith("descartado-") !== true) throw new Error("email não anonimizado")
    if (r.data.descarteMotivo !== "Fora do perfil") throw new Error("motivo ausente")
    // sem motivo → 422
    const sem = await req("POST", `/api/admin/leads/${criado.data.lead.id}/descartar`, { token: superToken, body: {} })
    expect(sem, 422, "descarte sem motivo")
  })

  // aguarda todos terminarem
  await Promise.all([])
}

main().then(() => {
  console.log("\n=== SMOKE API — RESULTADO ===")
  console.log(`Total: ${pass + fail} · PASS: ${pass} · FAIL: ${fail}\n`)

  // Agrupa por seção (prefixo do id — parte antes do primeiro "-").
  // Ex.: ADM-060 → ADM · MOD-G-1 → MOD · GEO-001 → GEO.
  const grupos = new Map()
  for (const r of results) {
    const secao = r.id.includes("-") ? r.id.split("-")[0] : "OUTROS"
    if (!grupos.has(secao)) grupos.set(secao, [])
    grupos.get(secao).push(r)
  }

  // Resumo por seção (uma linha cada), na ordem em que os ids aparecem.
  const ordem = [...grupos.keys()]
  for (const secao of ordem) {
    const itens = grupos.get(secao)
    const falhas = itens.filter((r) => !r.ok).length
    const mark = falhas === 0 ? "✅" : "❌"
    console.log(`${mark} ${secao.padEnd(12)} ${itens.length} cenário(s)${falhas > 0 ? ` · ${falhas} falha(s)` : ""}`)
  }

  // Detalhe por cenário (mantém o formato atual, apenas após o resumo por seção).
  console.log("")
  for (const r of results) {
    const mark = r.ok ? "✅" : "❌"
    console.log(`${mark} ${r.id.padEnd(12)} ${r.name.padEnd(62)} ${r.ok ? `${r.ms}ms` : r.err}`)
  }
  process.exit(fail > 0 ? 1 : 0)
})
