#!/usr/bin/env node
/**
 * Smoke test da API — valida os fluxos reais usados pelo frontend (07-CASOS-DE-USO-API).
 *
 * Uso: node scripts/smoke-api.mjs [--baseUrl http://localhost:3002]
 *
 * Requer instância isolada (ex.: PORT=3002 DB_PATH=/tmp/nxgestao-smoke.db npx tsx src/main.ts)
 * com o seed aplicado (senha padrão teste123!).
 *
 * Não testa rate limit (429) — bloquearia o IP da própria execução.
 */
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
  const superLogin = await req("POST", "/api/auth/login", { body: { email: "super@nxgestao.com", senha: SENHA } })
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
    cobranca = r.data.cobrancas[0]
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
  await t("CLI-010", "GET /clientes (200, escopado)", async () => {
    const r = await req("GET", "/api/clientes", { token: opToken })
    expect(r, 200, "listar clientes")
  })
  await t("CLI-011", "GET /clientes/:id (200 + situação financeira)", async () => {
    const r = await req("GET", `/api/clientes/${clienteId}`, { token: opToken })
    expect(r, 200, "detalhe cliente")
    const c = r.data
    for (const f of ["saldoDevedor", "valorEmAtraso", "parcelasEmAtraso", "diasEmAtraso", "valorVenceHoje", "lucroPrevisto"]) {
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
  await t("CLI-015", "DELETE cliente sem contratos (204)", async () => {
    const r = await req("DELETE", `/api/clientes/${clienteSemContrato}`, { token: opToken })
    expect(r, 204, "delete cliente sem contrato")
  })

  // ---------- OPERADOR: caixa base alta (via admin, p/ criar contrato) ----------
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

  // ---------- ADMIN: dashboard / operadores ----------
  await t("ADM-037", "GET /admin/dashboard (200)", async () => {
    const r = await req("GET", "/api/admin/dashboard", { token: adminToken })
    expect(r, 200, "dashboard")
    for (const k of ["totalAdmins", "totalOperadores", "totalClientes", "contratosAtivos"]) {
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
    const r = await req("GET", "/api/caixa/movimentacoes", { token: adminToken, query: { usuarioId: gabrielId } })
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
  await t("ADM-060", "POST /admin/operadores (201) + login funciona", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Smoke Operador", email: novoEmail, senha: SENHA, role: "operator" } })
    expect(r, 201, "criar operador")
    novoOpId = r.data.id
    const login = await req("POST", "/api/auth/login", { body: { email: novoEmail, senha: SENHA } })
    expect(login, 200, "login novo operador")
  })
  await t("ADM-061", "E-mail duplicado (409)", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Duplicado", email: novoEmail, senha: SENHA, role: "operator" } })
    expect(r, 409, "email duplicado")
  })
  await t("ADM-N3", "Senha curta (400, gap 10)", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Curta", email: `curta.${Date.now()}@uorak.com`, senha: "123", role: "operator" } })
    expect(r, 400, "senha curta")
  })
  await t("ADM-062", "Role inválido (400)", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Role", email: `role.${Date.now()}@uorak.com`, senha: SENHA, role: "super_admin" } })
    expect(r, 400, "role inválido")
  })
  await t("ADM-063", "PATCH /admin/operadores/:id (200, senha nova vale)", async () => {
    const r = await req("PATCH", `/api/admin/operadores/${novoOpId}`, { token: adminToken, body: { nome: "Smoke Editado", senha: "outraSenha456" } })
    expect(r, 200, "editar operador")
    const loginNovo = await req("POST", "/api/auth/login", { body: { email: novoEmail, senha: "outraSenha456" } })
    expect(loginNovo, 200, "login com senha redefinida")
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
  await t("EMP-073", "POST /admin/empresas (201) + login admin novo + dashboard", async () => {
    const nome = `Empresa Smoke ${Date.now()}`
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome, adminNome: "Admin Smoke", adminEmail: `smoke.${Date.now()}@empresa.com`, adminSenha: SENHA } })
    expect(r, 201, "criar empresa")
    novaEmpresaId = r.data.empresa.id
    novaEmpresaAdminEmail = r.data.admin.email
    const login = await req("POST", "/api/auth/login", { body: { email: novaEmpresaAdminEmail, senha: SENHA } })
    expect(login, 200, "login admin da nova empresa")
    const dash = await req("GET", "/api/admin/dashboard", { token: superToken, query: { empresaId: novaEmpresaId } })
    expect(dash, 200, "dashboard da nova empresa")
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
  const MODULOS_ALL = ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"]
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
    const created = await req("POST", "/api/admin/operadores", { token: tenantLogin.data.token, body: { nome: "Sócio MOD", email: socioEmail, senha: SENHA, role: "socio" } })
    expect(created, 201, "criar sócio nova empresa")
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

  // ---------- HIERARQUIA DE PAPÉIS (PLAN-032) ----------
  let socioId, socioEmail, socioOpId, socioToken
  await t("SC-001", "Admin cria sócio (201, chefe = admin)", async () => {
    const email = `socio.${Date.now()}@uorak.com`
    const r = await req("POST", "/api/admin/operadores", { token: adminToken, body: { nome: "Sócio Smoke", email, senha: SENHA, role: "socio" } })
    expect(r, 201, "criar sócio")
    socioId = r.data.id
    socioEmail = email
    if (r.data.chefeId !== adminLogin.data.usuario.id) throw new Error("chefeId do sócio não é o admin")
  })
  await t("SC-002", "Login do sócio (role socio + chefeId)", async () => {
    const r = await req("POST", "/api/auth/login", { body: { email: socioEmail, senha: SENHA } })
    expect(r, 200, "login sócio")
    socioToken = r.data.token
    if (r.data.usuario.role !== "socio") throw new Error("role não é socio")
    if (r.data.usuario.chefeId !== adminLogin.data.usuario.id) throw new Error("chefeId errado no login")
  })
  await t("SC-003", "Sócio cria operador do grupo (201, chefe = sócio)", async () => {
    const r = await req("POST", "/api/admin/operadores", { token: socioToken, body: { nome: "Op do Sócio", email: `opsocio.${Date.now()}@uorak.com`, senha: SENHA, role: "operator" } })
    expect(r, 201, "sócio cria operador")
    socioOpId = r.data.id
    if (r.data.chefeId !== socioId) throw new Error("chefeId do operador não é o sócio")
  })
  await t("SC-004", "Sócio cria admin/socio (403)", async () => {
    const a = await req("POST", "/api/admin/operadores", { token: socioToken, body: { nome: "X", email: `x.${Date.now()}@uorak.com`, senha: SENHA, role: "admin" } })
    expect(a, 403, "sócio cria admin")
    const b = await req("POST", "/api/admin/operadores", { token: socioToken, body: { nome: "Y", email: `y.${Date.now()}@uorak.com`, senha: SENHA, role: "socio" } })
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
  await t("EMP-074", "Admin email duplicado (409)", async () => {
    const r = await req("POST", "/api/admin/empresas", { token: superToken, body: { nome: "Duplicada", adminNome: "X", adminEmail: "admin@cobranca.com", adminSenha: SENHA } })
    expect(r, 409, "email admin duplicado")
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

  // ---------- SAÚDE ----------
  await t("HEA-001", "GET /api/health (200)", async () => {
    const r = await req("GET", "/api/health")
    expect(r, 200, "health")
  })

  // aguarda todos terminarem
  await Promise.all([])
}

main().then(() => {
  console.log("\n=== SMOKE API — RESULTADO ===")
  console.log(`Total: ${pass + fail} · PASS: ${pass} · FAIL: ${fail}\n`)
  for (const r of results) {
    const mark = r.ok ? "✅" : "❌"
    console.log(`${mark} ${r.id.padEnd(12)} ${r.name.padEnd(62)} ${r.ok ? `${r.ms}ms` : r.err}`)
  }
  process.exit(fail > 0 ? 1 : 0)
})
