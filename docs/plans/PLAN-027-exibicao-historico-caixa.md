# PLAN-027 — Exibição do Histórico de Ajustes do Caixa Base

**Status:** Concluído

**Versão:** 1.0

**Data:** 02/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Dependências:**
- PLAN-026 (P014 — auditoria de caixa: tabela `auditoria_caixa` + `motivo` obrigatório)
- PLAN-020 (escopo do caixa por `?usuarioId=` + `resolveUsuarioAlvo`)

---

## Objetivo

O P014 (PLAN-026) passou a **gravar** todo ajuste manual do Caixa Base na tabela `auditoria_caixa`, mas o registro ficava **invisível** — nenhum endpoint lia a tabela e nenhuma tela exibia o histórico. Este plano fecha o ciclo: **admin e operador passam a ver o histórico de ajustes** do caixa, de forma coerente com as telas existentes.

Decisão do usuário: os dois papéis enxergam o histórico (admin no detalhe do operador; operador na própria página de caixa).

---

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Endpoint | `GET /api/caixa/auditoria` **sem** `adminMiddleware` | Operador também lê o próprio; `resolveUsuarioAlvo` já garante que operator ignora `?usuarioId=` (só o próprio) e admin só consulta dentro da empresa |
| Padrão backend | Espelha `ListarMovimentacoes` (schema zod + use case + port + impl + controller + rota) | Coerência com o módulo Caixa |
| `adminNome` | JOIN com `usuarios` no SELECT | Histórico legível ("ajustado por <admin>") sem roundtrip extra |
| Posição no operador | Bloco "Histórico de ajustes" **acima** de "Movimentações Recentes" no `/caixa` | Ajuste é fato relevante do caixa; listagem igual ao admin |
| Posição no admin | Seção no `OperadorDetail`, após o bloco de ajuste | Coerência de contexto (ajustou aqui → vê o histórico logo abaixo) |
| Paginação | Lista as últimas 20 (back já paginado); sem UI de paginação agora | Simples; evolui depois |

---

## Fases de implementação

### Fase 1 — Backend

- [x] `use-cases/ListarAuditoriaCaixa/{Input.ts, UseCase.ts}`: schema `page`/`limit` (idêntico ao `listarMovimentacoesSchema`) + use case que delega ao repositório
- [x] `caixa.repository.ts` (porta): `AuditoriaCaixaItem` (com `adminNome`) + `ListarAuditoriaCaixaResult` + método `listAuditoriaCaixa`
- [x] `caixa.repository.impl.ts`: SQL `WHERE operadorId = ? ORDER BY createdAt DESC LIMIT/OFFSET` + count; LEFT JOIN `usuarios` p/ `adminNome`
- [x] `caixa.controller.ts`: handler `listAuditoria` (padrão do `listMovimentacoes` — `resolveUsuarioAlvo` → `safeParse` → use case)
- [x] `caixa.routes.ts`: `GET /auditoria`

### Fase 2 — Frontend admin (`OperadorDetail`)

- [x] `caixa.service.ts`: `listarAuditoriaCaixa(params?, usuarioId?)` + tipo `AuditoriaCaixaItem`
- [x] `OperadorDetail.tsx`: estado `auditoria` + fetch junto do caixa (usa `?usuarioId=id`) + seção "Histórico de ajustes" (data · `R$ X → R$ Y` · por <admin> · motivo)
- [x] Refetch automático após ajuste (o `handleAjustar` já chama `fetch()`)

### Fase 3 — Frontend operador (`CaixaPage`)

- [x] `CaixaPage.tsx`: estado `auditoria` + fetch (self, sem `usuarioId`) + bloco "Histórico de ajustes" acima de "Movimentações Recentes" (mesmo layout)

### Fase 4 — i18n

- [x] `caixa.historicoAjustes`, `caixa.ajusteSemRegistros`, `caixa.ajustePor` em pt-BR/en/es

---

## Resultados de validação

- [x] `npm run build` → OK (tsc backend + vite frontend)
- [x] `GET /api/caixa/auditoria` (admin self) → `{ data: [], pagination }`
- [x] Ajuste real de operador → auditoria com `adminNome`, valores e motivo
- [x] Admin lê histórico do operador via `?usuarioId=` → registros do operador correto
- [x] Operador lê o próprio → só os próprios registros
- [x] **Segurança**: operador com `?usuarioId=` de outro operador → continua vendo só o próprio (forgery bloqueado por `resolveUsuarioAlvo`)

---

## Status do backlog

P014 (Auditoria de Caixa) — **concluído por completo** (escrita + exibição) no PLAN-026 + PLAN-027.