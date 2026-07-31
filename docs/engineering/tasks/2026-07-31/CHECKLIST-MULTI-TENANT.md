# CHECKLIST — Multi-Tenant (PLAN-019)

**Status:** Concluído

**Data:** 31/07/2026

**Roadmap:** product/04-ROADMAP.md §5.6, §5.7 (Multi-Tenant)

**Plano:** plans/PLAN-019-multi-tenant.md

---

## Objetivo

Implementar arquitetura multi-tenant com isolamento por `empresaId`:
- Super Admin (role `super_admin`, `empresaId=null`) — acesso transversal a todas as empresas
- Admin (role `admin`, `empresaId` vinculado) — acesso restrito à sua empresa
- Operador (role `operator`, `empresaId` vinculado) — acesso restrito à sua empresa

Isolamento via JOIN nas queries (zero novas colunas nas tabelas operacionais).

---

## Fase A — Auth hardening

- [x] Rate limit no `/api/auth/login` (10 req/15min por IP)
- [x] Auth middleware async com validação no DB (não confia só no JWT)
- [x] `findById` filtra soft-delete (`deletedAt IS NULL`)
- [x] Feedback de erro de rede no LoginPage e api/client.ts

**Commit:** `64bd6e3`

---

## Fase B — Empresas table + empresaId in usuarios

- [x] Tabela `empresas` (id, nome, createdAt)
- [x] Coluna `empresaId` (UUID, nullable FK) adicionada a `usuarios`
- [x] CHECK constraint `role IN ('admin','operator')` removida via table rebuild
- [x] Seed: super_admin (`super@nxgestao.com`, `empresaId=null`) + empresa "Desenvolvimento" + backfill de admin/operators existentes
- [x] `.env.example` e `.env.production.example` atualizados com `SUPER_ADMIN_*` vars

**Commit:** `b2ddcd9`

---

## Fase C — empresaId no ecossistema

- [x] `empresaId` no payload JWT + declaration em `express.d.ts`
- [x] `superAdminMiddleware` (role === `"super_admin"`)
- [x] Auth middleware injeta `req.empresaId` via JOIN `usuarios` → `empresas`
- [x] `me()` retorna `empresaId` + `empresaNome` via JOIN
- [x] `LoginUseCase` passa `empresaId` para o token

**Commit:** `307b2be`

---

## Fase D — Módulo empresa (CRUD)

- [x] `empresa.entity.ts` (domain)
- [x] `empresa.error.ts` (errors)
- [x] `IEmpresaRepository` (port)
- [x] `CriarEmpresaUseCase` + `CriarEmpresaInput` (application)
- [x] `ListarEmpresasUseCase` (application)
- [x] `EmpresaRepository` com transação atômica (infra)
- [x] `EmpresaController` (presentation)
- [x] `empresa.routes.ts` — GET `/` + POST `/`, protegido por `superAdminMiddleware`
- [x] `main.ts` monta `/api/admin/empresas` com `authMiddleware` + `empresaRoutes`

**Commit:** `21cbd44`

---

## Fase E — Isolamento por empresaId

- [x] `IAdminRepository` port atualizada com `empresaId` nos métodos `findAllOperadores`, `findById`, `create`, `update`, `softDelete`, `getDashboardStats`
- [x] `AdminRepository` implementa filtro condicional por `empresaId`
- [x] `AdminController` — `resolveEmpresaId()`: super_admin usa `?empresaId=X` (ou `undefined` para agregado), admin usa token `empresaId`
- [x] `CriarOperadorUseCase` rejeita role `super_admin`
- [x] `ListarOperadoresUseCase` aceita `empresaId`
- [x] `EditarOperadorUseCase` aceita `empresaId`
- [x] `RemoverOperadorUseCase` aceita `empresaId`

**Commit:** `51f00c8`

---

## Fase F — Frontend multi-tenant

- [x] `empresa.service.ts` — API client para `/api/admin/empresas`
- [x] `SuperAdminPage.tsx` — drill-down dashboard (empresas → operadores → clientes/contratos)
- [x] `EmpresaList.tsx` — lista empresas com card de ação
- [x] `EmpresaForm.tsx` — form criação de empresa + admin inicial
- [x] `AuthContext.tsx` — `empresaId` e `empresaNome` no contexto
- [x] `auth.service.ts` — `me()` inclui `empresaId`/`empresaNome`
- [x] `admin.service.ts` — drill-down methods (`getOperadoresByEmpresa`, `getDashboardByEmpresa`)
- [x] `App.tsx` — nova rota `/super-admin` protegida por `superAdmin` guard
- [x] `Navbar.tsx` — link Super Admin visível para `super_admin`
- [x] i18n (`pt-BR.json`, `en.json`, `es.json`) — chaves multi-tenant adicionadas

**Commit:** `b0537fa`

---

## Concluído

- [x] `docs/engineering/02-API.md` — endpoints de empresas e operadores atualizados com empresaId
- [x] `docs/engineering/tasks/2026-07-31/CHECKLIST-MULTI-TENANT.md` — este arquivo
- [x] `npm run build` — verificação final de compilação ✅
- [x] Commit das atualizações de docs ✅

## Resultados de verificação

- `npm run build` → OK (backend tsc + frontend vite)
- Código revisado via SKILL-005 (Code Reviewer) — 5 bugs críticos corrigidos antes da finalização
- Todos os commits pushados para `main` branch

---

## Resultados de verificação

- `npm run build` → pendente de execução final
- Todos os commits pushados para `main` branch