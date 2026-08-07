# PLAN-063 — Contexto do operador: clientes do operador (fecha P13)

**Status:** ✅ Pronto para execução (handoff)

**Versão:** 1.0

**Início:** 07/08/2026

**Origem:** backlog `docs/plans/BACKLOG.md` — P013 (Contexto do Operador), fatia restante

---

## Objetivo

Fechar o **P13** fechando o único gap restante: **admin/socio não conseguem listar os clientes de um operador** (o drill-down de contratos/caixa/estorno já funciona).

## Diagnóstico (verificado 07/08)

| Endpoint | Hoje | Precisa |
|---|---|---|
| `GET /api/clientes/:id` (detalhe) | ✅ Já usa `resolveUsuarioAlvo` (`cliente.controller.ts:102`) — admin/socio veem cliente do operador com `?usuarioId=` | nada |
| `GET /api/clientes` (lista) | ❌ Usa `req.userId!` direto (`:88`), ignora `?usuarioId=` | usar `resolveUsuarioAlvo` |

O operador já vê os próprios clientes (backend escopa por token — PLAN-015). O ponto é **a lista** + o **front de drill-down**.

`resolveUsuarioAlvo` (`src/shared/utils/scope.ts`) já cobre: operator → self · admin → `?usuarioId=` ou self · socio → valida subárvore (403) · super_admin → `?usuarioId=` + `?empresaId=`.

---

## Backend (1 mudança)

- `src/modules/cliente/presentation/controllers/cliente.controller.ts` — no handler de **lista**:
  ```ts
  const userId = await resolveUsuarioAlvo(req, this.adminRepository)
  const result = await this.listClientes.execute(userId, parsed.data)
  ```
  (substitui `req.userId!`; `resolveUsuarioAlvo` já importado — usado no FindCliente. Sem mudança de schema: lê `req.query.usuarioId` direto.)

## Frontend

- `frontend/src/modules/cliente/services/cliente.service.ts`:
  - `ListClientesParams` ganha `usuarioId?: string`
  - `listClientes` → `if (params?.usuarioId) searchParams.set("usuarioId", params.usuarioId)`
- `frontend/src/modules/admin/pages/OperadorDetail.tsx`:
  - Nova seção **"Clientes do operador"**: adiciona `listClientes({ limit: 50, usuarioId: id })` ao `Promise.all`
  - Lista com `ClienteCard variant="list-item"` (import necessário) linkada → `/clientes/${c.id}?usuarioId=${id}${empresaId ? `&empresaId=${empresaId}` : ""}`
  - Estado vazio com `admin.semClientesOperador`
- `frontend/src/modules/cliente/pages/ClienteDetail.tsx`:
  - Lê `?usuarioId=` e `?empresaId=` de `useSearchParams`; passa `usuarioId` ao `getCliente(id, usuarioId)`
  - **Coerência do drill-down:** se `usuarioId` presente, "voltar" vai para `/admin/operadores/${usuarioId}`; links de contrato/"Novo contrato" preservam `?usuarioId=`

## i18n (pt/en/es)

- `admin.clientesOperador`: "Clientes do operador" / "Operator's clients" / "Clientes del operador"
- `admin.semClientesOperador`: "Nenhum cliente encontrado para este operador." / "No clients found for this operator." / "Ningún cliente encontrado para este operador."

## CTs (P13)

- Back:
  - admin lista clientes do operador com `?usuarioId=` → retorna só os do operador
  - socio com `?usuarioId=` fora da subárvore → 403 `OperadorNaoEncontrado`
  - operator com `?usuarioId=` → ignora override, vê só os próprios (self)
  - admin sem `?usuarioId=` → vê os próprios clientes (comportamento atual preservado)
  - super_admin com `?empresaId=` → respeita a empresa-alvo
- UI:
  - `OperadorDetail` mostra seção "Clientes do operador" + drill-down com `?usuarioId=`
  - Seção vazia → mensagem `admin.semClientesOperador`
  - `ClienteDetail` com `?usuarioId=` exibe o cliente do operador; voltar → `/admin/operadores/:usuarioId`

## Validação

- [ ] `tsc` (back + front) · `npm run build` · `audit:ui` · `audit:styles` · `audit:modules` · `npm test` · `docs:audit`
- [ ] Smoke manual: admin → OperadorDetail → clientes → detalhe → voltar

## Arquivos

| Ação | Arquivo |
|---|---|
| Alterar | `src/modules/cliente/presentation/controllers/cliente.controller.ts` |
| Alterar | `frontend/src/modules/cliente/services/cliente.service.ts` |
| Alterar | `frontend/src/modules/admin/pages/OperadorDetail.tsx` |
| Alterar | `frontend/src/modules/cliente/pages/ClienteDetail.tsx` |
| Alterar | `frontend/src/i18n/locales/pt-BR.json` · `en.json` · `es.json` |
| Docs | `BACKLOG.md` (P13 ✅) · `UPDATES.md` · `tasks/2026-08-07/CHECKLIST.md` |
