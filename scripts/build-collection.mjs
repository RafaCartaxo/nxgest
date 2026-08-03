/**
 * Gera docs/api-collection.json (Postman Collection v2.1) a partir da lista canônica
 * de endpoints. Espelha 1:1 a base de validação docs/product/07-CASOS-DE-USO-API.md.
 *
 * Uso: node scripts/build-collection.mjs
 * Regeneração: qualquer mudança de endpoint exige atualizar `endpoints` abaixo
 * (e a 07 + 02-API) — ver SKILL-009-documentation-sync.md.
 */
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, "..", "docs", "api-collection.json")

const AUTH = "auth" // request autenticado (Bearer {{token}})
const PUBLIC = "public"

/** Define um request da collection. */
function req(name, method, path, opts = {}) {
  const { auth = AUTH, body, query, description } = opts
  const pathSegments = path.split("/").filter(Boolean)
  const r = {
    method,
    header: [],
    url: {
      raw: `{{baseUrl}}/${pathSegments.join("/")}`,
      host: ["{{baseUrl}}"],
      path: pathSegments,
    },
  }
  if (query?.length) {
    r.url.query = query.map((q) => (typeof q === "string" ? { key: q, value: "" } : q))
  }
  if (auth === AUTH) {
    r.auth = { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] }
  }
  if (body) {
    r.body = { mode: "raw", raw: JSON.stringify(body, null, 2), options: { raw: { language: "json" } } }
  }
  if (description) {
    r.description = description
  }
  return { name, request: r }
}

/** Módulo da collection. */
function mod(name, description, items) {
  return { name, description, item: items }
}

const endpoints = [
  mod("Health", "Health check público (runbook / ops-runner)", [
    req("Health check", "GET", "/api/health", { auth: PUBLIC, description: "API-UC-001 · 200 {status, db}" }),
  ]),

  mod("Auth", "Autenticação e identidade", [
    req("Login", "POST", "/api/auth/login", {
      auth: PUBLIC,
      body: { email: "admin@cobranca.com", senha: "teste123!" },
      description: "API-UC-002 · 200 {token, usuario} · 401 inválido · 429 rate limit (10/15min)",
    }),
    req("Me", "GET", "/api/auth/me", { description: "API-UC-003 · 200 dados do usuário logado" }),
    req("Alterar senha", "PATCH", "/api/auth/senha", {
      body: { senhaAtual: "teste123!", novaSenha: "novaSenha123" },
      description: "API-UC-041 · 200 {ok} · 422 senha atual incorreta/nova inválida (BR-089/090, PLAN-029)",
    }),
  ]),

  mod("Clientes", "CRUD de clientes (escopo por operador)", [
    req("Criar", "POST", "/api/clientes", {
      body: { nome: "João Silva", telefone: "11999999999", cpf: "39053344705", comercio: "Padaria Central", endereco: { logradouro: "Rua A", numero: "123", bairro: "Centro", cidade: "São Paulo", estado: "SP" } },
      description: "API-UC-004 · 201 · 409 CPF duplicado · 422 inválido · endereco aninhado",
    }),
    req("Listar", "GET", "/api/clientes", { description: "API-UC-005 · 200 lista escopada" }),
    req("Detalhe", "GET", "/api/clientes/{{clienteId}}", { description: "API-UC-006 · 200 · 404 outro operador" }),
    req("Editar", "PATCH", "/api/clientes/{{clienteId}}", {
      body: { nome: "João Silva Atualizado" },
      description: "API-UC-007 · 200 · 409 CPF de outro cliente",
    }),
    req("Excluir", "DELETE", "/api/clientes/{{clienteId}}", { description: "API-UC-008 · 204 · 409 com contratos ativos" }),
  ]),

  mod("Contratos", "CRUD de contratos", [
    req("Criar", "POST", "/api/contratos", {
      body: { clienteId: "{{clienteId}}", valorBase: 1000, percentualJuros: 20, quantidadeParcelas: 5, dataInicio: "2026-08-04" },
      description: "API-UC-009 · 201 · 422 caixa insuficiente · 404 cliente · campo percentualJuros",
    }),
    req("Listar", "GET", "/api/contratos", { description: "API-UC-010 · 200 lista escopada" }),
    req("Detalhe", "GET", "/api/contratos/{{contratoId}}", { description: "API-UC-011 · 200 · 404 outro operador" }),
    req("Editar", "PATCH", "/api/contratos/{{contratoId}}", {
      body: { quantidadeParcelas: 6 },
      description: "API-UC-012 · 200 sem pagamentos · 409 com pagamentos",
    }),
    req("Excluir", "DELETE", "/api/contratos/{{contratoId}}", { description: "API-UC-013 · 204 sem pagamentos (devolve valorBase) · 409 com pagamentos" }),
  ]),

  mod("Pagamentos", "Registro, preview, listagem e estorno", [
    req("Registrar", "POST", "/api/pagamentos", {
      body: { contratoId: "{{contratoId}}", valor: 120 },
      description: "API-UC-014 · 201 · 422 excede saldo",
    }),
    req("Preview", "POST", "/api/pagamentos/preview", {
      body: { contratoId: "{{contratoId}}", valor: 120 },
      description: "API-UC-015 · 200 distribuição simulada (não persiste)",
    }),
    req("Por contrato", "GET", "/api/pagamentos/contrato/{{contratoId}}", { description: "API-UC-016 · 200 lista de pagamentos do contrato" }),
    req("Estornar", "POST", "/api/pagamentos/{{pagamentoId}}/estornar", {
      body: { motivo: "Pagamento registrado por engano" },
      description: "API-UC-017 · 201 · 403 operator · 409 já estornado · query ?usuarioId= (admin)",
    }),
  ]),

  mod("Operações", "Cobranças, pagamentos/parcelas do dia, visitas e histórico de atrasos", [
    req("Cobranças do dia", "GET", "/api/operacoes/cobrancas", { description: "API-UC-018 · 200 {indicadores, cobrancas} · query sort/lat/lng" }),
    req("Pagamentos hoje", "GET", "/api/operacoes/pagamentos-hoje", { query: [{ key: "dataInicio", value: "" }, { key: "dataFim", value: "" }], description: "API-UC-019 · 200 pagamentos do período (padrão hoje)" }),
    req("Parcelas hoje", "GET", "/api/operacoes/parcelas-hoje", { description: "API-UC-020 · 200 parcelas vencendo hoje" }),
    req("Parcelas semana", "GET", "/api/operacoes/parcelas-semana", { description: "API-UC-021 · 200 próximos 7 dias (exclui hoje)" }),
    req("Histórico atrasos", "GET", "/api/operacoes/historico-atrasos", { query: [{ key: "dias", value: "30" }], description: "API-UC-022 · 200 snapshots diários" }),
    req("Registrar visita", "POST", "/api/operacoes/visitas", {
      body: { clienteId: "{{clienteId}}", contratoId: "{{contratoId}}", tipo: "visitado" },
      description: "API-UC-023 · 201 · 422 tipo inválido (visitado|nao_localizado|promessa) · 422 promessa sem dataPromessa · GET retorna NAO_ENCONTRADO",
    }),
  ]),

  mod("Caixa", "Status, ajuste (admin), movimentações, auditoria e liquidação", [
    req("Status", "GET", "/api/caixa", { query: [{ key: "dataInicio", value: "" }, { key: "dataFim", value: "" }, { key: "usuarioId", value: "" }], description: "API-UC-024 · 200 status completo · 404 alvo inexistente" }),
    req("Ajustar", "POST", "/api/caixa/ajuste", {
      body: { valor: 22000, motivo: "Reposição de troco" },
      query: [{ key: "usuarioId", value: "" }],
      description: "API-UC-025 · 201 · 403 operator · 422 sem motivo · grava auditoria",
    }),
    req("Movimentações", "GET", "/api/caixa/movimentacoes", { query: [{ key: "origem", value: "" }, { key: "usuarioId", value: "" }], description: "API-UC-026 · 200 {data, pagination}" }),
    req("Auditoria", "GET", "/api/caixa/auditoria", { query: [{ key: "usuarioId", value: "" }], description: "API-UC-027 · 200 histórico de ajustes" }),
    req("Liquidar", "POST", "/api/caixa/liquidar", { description: "API-UC-028 · 201 · 409 semana já liquidada" }),
  ]),

  mod("Gastos", "Registro, listagem e exclusão de gastos", [
    req("Registrar", "POST", "/api/gastos", {
      body: { valor: 50, categoria: "Transporte", data: "2026-08-03", observacao: "Combustível" },
      description: "API-UC-029 · 201 · 422 obrigatórios",
    }),
    req("Listar", "GET", "/api/gastos", { query: [{ key: "dataInicio", value: "" }, { key: "dataFim", value: "" }], description: "API-UC-030 · 200 lista escopada" }),
    req("Excluir", "DELETE", "/api/gastos/{{gastoId}}", { description: "API-UC-031 · 204 · 404 inexistente" }),
  ]),

  mod("Admin", "Gestão de operadores e dashboard (admin/super_admin)", [
    req("Listar operadores", "GET", "/api/admin/operadores", { description: "API-UC-032 · 200 · 403 operator" }),
    req("Detalhe operador", "GET", "/api/admin/operadores/{{operadorId}}", { description: "API-UC-033 · 200 · 404 outra empresa" }),
    req("Criar operador", "POST", "/api/admin/operadores", {
      body: { nome: "Maria Op", email: "maria.nx@uorak.com", senha: "teste123!", role: "operator" },
      description: "API-UC-034 · 201 · 409 e-mail · 400 role inválido/senha < 6",
    }),
    req("Editar operador", "PATCH", "/api/admin/operadores/{{operadorId}}", {
      body: { nome: "Maria Atualizada", senha: "novaSenha123" },
      description: "API-UC-035 · 200 · 403 auto-rebaixar",
    }),
    req("Remover operador", "DELETE", "/api/admin/operadores/{{operadorId}}", { description: "API-UC-036 · 204 · 403 auto-remover" }),
    req("Dashboard", "GET", "/api/admin/dashboard", { query: [{ key: "empresaId", value: "" }], description: "API-UC-037 · 200 KPIs · 403 operator" }),
    req("Equipe", "GET", "/api/admin/equipe", { query: [{ key: "empresaId", value: "" }], description: "API-UC-042 · 200 operadores+totais (BR-091) · 403 operator · 400 super sem empresaId" }),
  ]),

  mod("Empresas", "Multi-tenant (super_admin)", [
    req("Listar", "GET", "/api/admin/empresas", { description: "API-UC-038 · 200 · 403 não-super" }),
    req("Detalhe", "GET", "/api/admin/empresas/{{empresaId}}", { description: "API-UC-039 · 200 · 404 inexistente" }),
    req("Criar", "POST", "/api/admin/empresas", {
      body: { nome: "Empresa Exemplo", adminNome: "João Admin", adminEmail: "admin@empresa.com", adminSenha: "senhaSegura123" },
      description: "API-UC-040 · 201 empresa+admin atômico · 409 e-mail duplicado",
    }),
    req("Módulos", "PATCH", "/api/admin/empresas/{{empresaId}}/modulos", {
      body: { modulos: ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"] },
      description: "API-UC-043 · 200 · 422 dependência (gastos requer caixa) · 403 não-super",
    }),
  ]),
]

const collection = {
  info: {
    _postman_id: "0f5a4a5c-9c6e-4b3a-8f1d-2e5c7a9b0d1e",
    name: "Gestão de Cobranças — API",
    description:
      "Collection espelho da base de validação docs/product/07-CASOS-DE-USO-API.md.\nVariáveis: baseUrl (ex.: https://nxgestao.duckdns.org ou http://localhost:3001) e token (Bearer).\nGerenciar: node scripts/build-collection.mjs.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "https://nxgestao.duckdns.org", type: "string" },
    { key: "token", value: "", type: "string" },
  ],
  item: endpoints,
}

writeFileSync(out, JSON.stringify(collection, null, 2) + "\n", "utf8")
console.log(`Collection gerada: ${out} (${countRequests(endpoints)} requests)`)

function countRequests(items) {
  return items.reduce((acc, it) => acc + (it.item ? countRequests(it.item) : 1), 0)
}
