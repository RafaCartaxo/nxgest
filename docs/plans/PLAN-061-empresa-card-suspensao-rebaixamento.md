# PLAN-061 — Card da empresa, suspensão por `ativa` e rebaixamento com reassign

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** whitelabel/gestão de empresas — descoberta de toggles + suspensão + hierarquia de papéis blindada

---

## Objetivo

1. **Card da empresa com descoberta dos toggles:** botão **"Recursos"** (capacidades) direto no card + badge de estado + botão **"Editar"** (empresa existente, incluindo situação ativa/inativa).
2. **Suspensão por `empresa.ativa` (BR-106):** empresa inativa **bloqueia acesso** — 403 `EMPRESA_INATIVA` no login, `/me` e em toda rota autenticada (middleware); super admin intacto; auditoria `tipo:"empresa"`.
3. **Rebaixamento blindado (BR-103 evoluída):** mensagem específica `OPERATOR_HAS_SUBORDINATES` com contagem + **reassign atômico** (`reatribuirParaChefeId` no mesmo PATCH) — sem chefe órfão e sem retrabalho manual.
4. **Fixes de higiene:** `SuperAdminRoute` (só super acessa `/admin/empresas*`), `maxLength` no motivo, auditoria idempotente, smoke de bordas (impacto/motivo).

## Decisões confirmadas

- **Inativa = suspensa** (bloqueia login + rotas; reativação volta tudo). Confirm na UI antes de suspender (mostra nº de usuários).
- **Card:** botão Recursos + badge (mini-toggles dos módulos **deferidos** — fase futura).
- **Edição:** modal reusando `EmpresaForm` com `initial` (esconde campos de admin no edit).
- **Rebaixamento:** reassign atômico no PATCH; novo chefe deve ser **admin** da mesma empresa (`validarChefe` como socio-alvo).

## Escopo

| # | Entrega |
|---|---------|
| 1 | `EmpresaList`: botões Recursos/Editar + badge de capacidades · `SuperAdminPage`: modais de edição + confirm de suspensão |
| 2 | `authMiddleware` + `login`/`me`: 403 `EMPRESA_INATIVA` · `apiRequest`: logout na suspensão · auditoria `tipo:"empresa"` |
| 3 | Rebaixamento: `OPERATOR_HAS_SUBORDINATES` + `subordinados` · `reatribuirParaChefeId` (transação) · `ReassignModal` (UI guiada) |
| 4 | `SuperAdminRoute` · `maxLength={200}` motivo · auditoria idempotente (`antes===depois`) |
| 5 | Smoke **189 → 203** (SUSP-1..4 · SUP-1..6 · ORF-1..3 · REAS-1 · POS-1 · IMP-003/004 · MOD-G-14 · TR-123/127 atualizados) |

## Matriz de transições (coberta por smoke)

| Transição | Guard órfão | Smoke |
|---|---|---|
| admin → operator | 🚫 se qualquer subordinado | TR-125/127, SUP-1/2, ORF-2, REAS-1, POS-1 |
| admin → socio | 🚫 se subordinado sócio | TR-124, SUP-3, ORF-1/3 |
| socio → operator | 🚫 se subordinado | TR-123, SUP-4 |
| socio → admin / operator → {socio,admin} | — (promoção) | TR-120..122, SUP-5 |

## Validação

- `npm run build` ✅ · `audit:ui/styles/modules` ✅ · `docs:audit` ✅ · `vitest` 29 ✅ · `smoke:api` **203/203** ✅ · `migracao:test` ✅

## Referências

- `frontend/src/modules/admin/components/{EmpresaList,EmpresaForm,ReassignModal}.tsx` · `SuperAdminPage` · `shared/auth/SuperAdminRoute.tsx`
- `src/shared/middleware/auth.middleware.ts` · `auth.controller.ts` · `admin.repository.impl.ts` · `admin.controller.ts` · `domain/errors/admin.error.ts`
- BR-103/104/105 (base) · BR-106 (nova: inativa bloqueia)

## Dívida técnica / próximos passos

- **Mini-toggles dos módulos no card** (estilo Lovable) — fase futura; exigiriam reusar o guard 409 no card.
- **Auditoria de `ativa` sem UI de consulta** — só escrita; leitura futura via endpoint de auditoria.
- **Concorrência no reassign** (TOCTOU) — transação SQLite cobre o mesmo processo; ok para ferramenta de admin.
