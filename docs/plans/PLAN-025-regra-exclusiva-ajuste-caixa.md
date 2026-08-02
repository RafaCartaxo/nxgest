# PLAN-025 — Ajuste do Caixa Base exclusivo de admin + contexto de empresa no super admin

**Status:** Concluído

**Versão:** 1.0

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Dependências:**
- PLAN-020 (Caixa por `?usuarioId=` + drill-down admin → operador)
- PLAN-021 (Painel admin, contexto de empresa, login por role)

---

## Objetivo

Dois pontos levantados em validação/uso real:

1. **Regressão de permissão no ajuste do Caixa Base.** O admin ajusta o saldo de um operador com sucesso (via `OperadorDetail`), mas o operador também consegue ajustar a própria base pela tela `/caixa` — comportamento liberado pelo PLAN-021 (BR-084, que revogou a BR-079). O ajuste do Caixa Base deve ser **regra exclusiva de admin/super_admin**; o operador é read-only nesse ponto.

2. **Falta de contexto para o super admin.** Ao entrar numa empresa (`/admin/empresas/:id`), o header mostrava só o nome da empresa + badge, sem breadcrumb/voltar nem quem é o admin da empresa. Na lista de empresas, o card não mostrava o admin. Dificulta saber "onde estou" ao navegar pelo painel.

---

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Bloqueio do ajuste | `adminMiddleware` na rota `POST /api/caixa/ajuste` + ocultar a seção "Ajustar Caixa Total" para `operator` | Reutiliza o middleware existente; defesa em profundidade (API e UI) |
| `liquidar` | Mantém como está (`req.userId`, operador pode fechar a própria semana) | Escopo definido pelo usuário: bloqueia só o ajuste de base |
| Admin da empresa | `adminNome`/`adminEmail` no `EmpresaComStats` (primeiro admin ativo) | Aparece na lista e no header do painel da empresa |
| Breadcrumb/voltar | ChevronLeft no header do `AdminPage` quando `empresaId` presente → `/admin/empresas` | Padrão já usado em OperadorDetail/CaixaPage/ClienteDetail |
| Nomenclatura | Não alterar nomes salvos no banco (seed) | Decisão do usuário: padronização fica nos rótulos de UI |

---

## Fases de implementação

### Fase 1 — Regra exclusiva no ajuste (backend)

- [x] `src/modules/caixa/presentation/routes/caixa.routes.ts`: `router.post("/ajuste", adminMiddleware, controller.ajustar.bind(controller))`
- [x] Efeito: `operator` → `403 FORBIDDEN`; admin/super_admin seguem ajustando via `?usuarioId=` (fluxo `OperadorDetail` intacto)

### Fase 2 — Regra exclusiva no ajuste (frontend)

- [x] `frontend/src/modules/caixa/pages/CaixaPage.tsx`: `useAuth()` → `canAdjust = role admin/super_admin`; seção "Ajustar Caixa Total" renderizada só quando `canAdjust`
- [x] Operador mantém leitura, movimentações e `liquidar`

### Fase 3 — Admin da empresa no backend

- [x] `src/modules/admin/domain/empresa.entity.ts`: `EmpresaComStats` ganha `adminNome?`/`adminEmail?`
- [x] `src/modules/admin/infrastructure/repositories/empresa.repository.impl.ts`: `findAll()` e `findById()` buscam o primeiro admin ativo (`role='admin'`, `deletedAt IS NULL`, ordenado por `createdAt`)

### Fase 4 — Contexto de empresa no frontend

- [x] `frontend/src/modules/admin/services/empresa.service.ts`: interface `EmpresaComStats` com `adminNome?`/`adminEmail?`
- [x] `frontend/src/modules/admin/components/EmpresaList.tsx`: card mostra o admin da empresa (label + nome em destaque)
- [x] `frontend/src/modules/admin/pages/AdminPage.tsx`: breadcrumb com ChevronLeft → `/admin/empresas` (quando `empresaId`) + linha "Administrador da empresa" com `empresa.adminNome`
- [x] i18n pt-BR/en/es: `superAdmin.voltar`, `superAdmin.admin`, `admin.adminDaEmpresa`

### Fase 5 — Documentação

- [x] `docs/engineering/02-API.md`: escopo por usuário do Caixa atualizado (ajuste restrito a admin), `403 FORBIDDEN` em `POST /api/caixa/ajuste`, `adminNome`/`adminEmail` nos responses de empresas, BR-079 reativada e BR-084 revogada
- [x] `docs/plans/PLAN-025-regra-exclusiva-ajuste-caixa.md` — este plano
- [x] `docs/plans/README.md`: entrada PLAN-025
- [x] `docs/engineering/tasks/2026-08-01/CHECKLIST-PLAN-025.md`

---

## Regras de negócio (novas/alterações)

- **BR-079 (REATIVADA)** — Operador não pode ajustar o Caixa Base próprio (403). Revogada pelo PLAN-021 e reativada pelo PLAN-025.
- **BR-084 (REVOGADA)** — Operador não ajusta mais a própria base; `POST /api/caixa/ajuste` aceita apenas `admin`/`super_admin`.
- **BR-088 (NOVA)** — Empresa (lista e detalhe, super admin) retorna `adminNome`/`adminEmail` do primeiro admin ativo, para contexto de quem administra a empresa.

---

## Resultados de validação

- `npm run build` → OK (tsc backend + vite frontend).
- Curl: token `operator` → `POST /api/caixa/ajuste` = `403 FORBIDDEN`; token `admin` com `?usuarioId=` = `201`; `GET /api/admin/empresas` retorna `adminNome`/`adminEmail`.
- UI: operador em `/caixa` não vê a seção "Ajustar Caixa Total"; super admin vê breadcrumb (voltar para Empresas) + admin da empresa no header e na lista.
- `npm test` → sem arquivos de teste no projeto (vitest exit 1, esperado).

---

## Referências

- `src/modules/caixa/presentation/routes/caixa.routes.ts`
- `src/modules/admin/infrastructure/repositories/empresa.repository.impl.ts`
- `frontend/src/modules/caixa/pages/CaixaPage.tsx`
- `frontend/src/modules/admin/pages/AdminPage.tsx`
- `frontend/src/modules/admin/components/EmpresaList.tsx`
- `docs/engineering/02-API.md` (§ Caixa, § Empresas, § BRs)
