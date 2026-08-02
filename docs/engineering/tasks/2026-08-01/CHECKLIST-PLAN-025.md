# CHECKLIST — Ajuste do Caixa Base exclusivo + contexto de empresa no super admin (PLAN-025)

**Status:** Concluído

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Plano:** plans/PLAN-025-regra-exclusiva-ajuste-caixa.md

---

## Objetivo

Bloquear o ajuste do Caixa Base para o operador (regra exclusiva de admin/super_admin — reverte a BR-084 liberada no PLAN-021) e dar contexto de navegação ao super admin dentro de uma empresa (breadcrumb/voltar + quem é o admin, na lista e no painel).

---

## Fase 1 — Regra exclusiva no ajuste (backend)

- [x] `src/modules/caixa/presentation/routes/caixa.routes.ts`: `POST /ajuste` com `adminMiddleware` → operator recebe 403
- [x] Fluxo do admin/super_admin via `?usuarioId=` (`OperadorDetail`) permanece intacto

## Fase 2 — Regra exclusiva no ajuste (frontend)

- [x] `CaixaPage.tsx`: `useAuth()` → `canAdjust` (admin/super_admin); seção "Ajustar Caixa Total" condicionada a `canAdjust`
- [x] Operador mantém leitura, movimentações e `liquidar`

## Fase 3 — Admin da empresa (backend)

- [x] `empresa.entity.ts`: `EmpresaComStats` com `adminNome?`/`adminEmail?`
- [x] `empresa.repository.impl.ts`: `findAll()` e `findById()` retornam o primeiro admin ativo (`role='admin'`, `deletedAt IS NULL`)

## Fase 4 — Contexto de empresa (frontend)

- [x] `empresa.service.ts`: interface com `adminNome?`/`adminEmail?`
- [x] `EmpresaList.tsx`: card mostra o admin da empresa
- [x] `AdminPage.tsx`: breadcrumb ChevronLeft → `/admin/empresas` + linha "Administrador da empresa"
- [x] i18n pt-BR/en/es: `superAdmin.voltar`, `superAdmin.admin`, `admin.adminDaEmpresa`

## Fase 5 — Documentação

- [x] `docs/engineering/02-API.md`: escopo do Caixa, `403 FORBIDDEN`, `adminNome`/`adminEmail`, BR-079 reativada / BR-084 revogada / BR-088 nova
- [x] `docs/plans/PLAN-025-regra-exclusiva-ajuste-caixa.md`
- [x] `docs/plans/README.md`: entrada PLAN-025
- [x] Este CHECKLIST

---

## Resultados de validação

- [x] `npm run build` → OK (tsc backend + vite frontend)
- [x] Curl operator → `POST /api/caixa/ajuste` = 403
- [x] Curl admin com `?usuarioId=` → 201
- [x] `GET /api/admin/empresas` retorna `adminNome`/`adminEmail`
- [x] UI: operador sem "Ajustar Caixa Total"; super admin com breadcrumb + admin no header/lista
