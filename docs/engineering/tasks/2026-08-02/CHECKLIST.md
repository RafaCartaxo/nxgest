# CHECKLIST — Sprint 1 do backlog: Auditoria de Caixa + Modais + Nomenclatura Admin (PLAN-026)

**Status:** Concluído

**Data:** 02/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Plano:** plans/PLAN-026-auditoria-modais-nomencleatura-admin.md

**Backlog:** plans/BACKLOG.md (EPIC 1 — P012/P014; P011 resolvido pela cadeia PLAN-020→025; P018)

---

## Objetivo

Executar o primeiro sprint do backlog de refinamentos: auditoria de caixa (P014), padronização de modais (P018) e nomenclatura da página admin (P012).

---

## Fase 1 — P014 Auditoria de Caixa (backend)

- [x] `src/database.ts`: tabela `auditoria_caixa` (schema drizzle + `CREATE TABLE IF NOT EXISTS` + índices operador/data)
- [x] `AjustarCaixaBaseInput.ts`: `motivo` obrigatório topo (`min(1)`, `max(200)`)
- [x] `caixa.repository.ts` (porta): `AuditoriaCaixa` + `saveAuditoriaCaixa`
- [x] `caixa.repository.impl.ts`: implementação
- [x] `AjustarCaixaBaseUseCase.ts`: `execute(adminId, operadorId, input)` grava auditoria
- [x] `caixa.controller.ts`: `adminId = req.userId`, `operadorId = resolveUsuarioAlvo`

## Fase 1b — P014 (frontend)

- [x] `caixa.service.ts`: `ajustarCaixaBase(valor, motivo, usuarioId?)`
- [x] `CaixaPage.tsx`: campo + validação de `motivo`
- [x] `OperadorDetail.tsx`: campo + validação de `motivo`
- [x] i18n pt-BR/en/es: `motivoObrigatorio`, `motivoPlaceholder`, `ajustarMotivoPlaceholder`

## Fase 2 — P018 Modais

- [x] `shared/components/Modal/Modal.tsx`: base configurável (Escape/backdrop/overflow/`role=dialog`)
- [x] Refatorar ConfirmModal, EquipeModal, ResultadoDiaModal, PagamentoModal
- [x] AdminPage: modal do OperadorForm migrado pro base (ganha Escape)

## Fase 3 — P012 Nomenclatura admin

- [x] i18n `admin.secaoAdministradores` (pt-BR/en/es)
- [x] `OperadoresList.tsx`: subseções Administradores/Operadores

## Fase 4 — Documentação

- [x] `docs/plans/PLAN-026-auditoria-modais-nomencleatura-admin.md`
- [x] `docs/plans/README.md`: entrada PLAN-026
- [x] `docs/engineering/02-API.md`: `POST /api/caixa/ajuste` com `motivo` + nota de auditoria
- [x] Este CHECKLIST + atualizar `docs/plans/BACKLOG.md` (P011 resolvido, P012/P014/P018 concluídos)

---

## Resultados de validação

- [x] `npm run build` → OK (tsc backend + vite frontend)
- [x] Curl `POST /api/caixa/ajuste` sem `motivo` → 422; com `motivo` → 201
- [x] Registro gravado em `auditoria_caixa` (operador/admin/valores/motivo/data)

### Validações pendentes (execução manual / UI)
- [ ] Modais: Escape fecha; backdrop respeita configuração por instância
- [ ] Lista admin: seções "Administradores" e "Operadores" com "(Eu)" preservado

---

# CHECKLIST — Exibição do Histórico de Ajustes do Caixa Base (PLAN-027)

**Plano:** plans/PLAN-027-exibicao-historico-caixa.md

## Fase 1 — Backend

- [x] `use-cases/ListarAuditoriaCaixa/{Input,UseCase}` (schema page/limit, padrão ListarMovimentacoes)
- [x] Port `ICaixaRepository.listAuditoriaCaixa` + `AuditoriaCaixaItem` (com `adminNome`)
- [x] Impl: SQL `WHERE operadorId = ? ORDER BY createdAt DESC` + count + JOIN usuarios
- [x] Controller `listAuditoria` + rota `GET /api/caixa/auditoria`

## Fase 2/3 — Frontend

- [x] `caixa.service.ts`: `listarAuditoriaCaixa` + tipo `AuditoriaCaixaItem`
- [x] `OperadorDetail.tsx`: seção "Histórico de ajustes" (admin, `?usuarioId=`)
- [x] `CaixaPage.tsx`: bloco "Histórico de ajustes" acima das movimentações (self)
- [x] i18n pt-BR/en/es: `historicoAjustes`, `ajusteSemRegistros`, `ajustePor`

## Validação (HTTP real)

- [x] `GET /api/caixa/auditoria` admin self → 200 `{ data, pagination }`
- [x] Ajuste de operador → auditoria com `adminNome` ("Rafael Cartaxo Borges")
- [x] Admin lê histórico do operador via `?usuarioId=` → registros corretos
- [x] Operador lê o próprio → só os próprios
- [x] Forgery: operador com `?usuarioId=` de outro → continua vendo só o próprio