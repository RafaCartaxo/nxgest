# PLAN-021 — Painel admin: contexto de empresa, KPIs por seção, Admins × Operadores, login por role e engrenagem na navbar

**Status:** Concluído

**Versão:** 1.0

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Dependências:**
- PLAN-017 (Admin Panel + Níveis Permissionais)
- PLAN-019 (Multi-Tenant: Super Admin + Empresas)
- PLAN-020 (Drill-down Admin → Operador + Caixa Base)

---

## Objetivo

1. **Contexto de empresa no topo do painel admin**: quando o admin acessa `/admin` (ou o super_admin acessa `/admin/empresas/:id`), o nome da empresa aparece como header grande no topo — mesmo padrão visual do `OperadorDetail`. O resto da página sai da leitura "admin genérico" e entra no contexto daquela empresa.
2. **KPIs legíveis por seção**: agrupar os KPIs em blocos com títulos (`Equipe` e `Operação`) em vez de uma grade única sem contexto.
3. **Contagem correta de Admins × Operadores**: o KPI "Operadores" hoje conta todos os não-super_admin (admin + operator). Separar em dois KPIs: **Admins** (role `admin`) e **Operadores** (role `operator`). No card de empresa da tela do super admin, o total passa a ser "Usuários" (admin + operator), deixando claro que inclui o próprio admin.
4. **Login roteado por perfil**: após autenticar, cada role vai para o destino certo — `operator` → `/`, `admin` → `/admin`, `super_admin` → `/admin/empresas`. O `/admin` para super_admin redireciona para `/admin/empresas`.
5. **Engrenagem na navbar**: reunir configurações (Administração, Empresas, idioma, tema, sair) num dropdown de engrenagem, em vez de só o seletor de idioma solto na navbar.
6. **Operador ajusta a própria base de caixa**: reverter a restrição do PLAN-020 que impedia o operator de ajustar o próprio Caixa Base (o `ajustar` voltou a aceitar operator, mantendo o `resolveUsuarioAlvo` — operator sempre usa `req.userId`, ignora `?usuarioId=`).

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Destino pós-login por role | `operator` → `/`; `admin` → `/admin`; `super_admin` → `/admin/empresas` | Cada perfil cai direto na tela principal do seu papel |
| `/admin` para super_admin | Redireciona para `/admin/empresas` | Super admin não tem empresa própria para gerenciar |
| Contexto no topo | Nome da empresa como `<h1>` grande (padrão OperadorDetail) + badge "Empresa" | Reforça em qual empresa se está |
| KPIs | Dois blocos com `SectionHeader`: **Equipe** (Admins, Operadores) e **Operação** (Clientes, Contratos, Resultado do dia) | Separa pessoas de operação |
| Contagem | `AdminDashboardStats.totalAdmins` (role `admin`) e `totalOperadores` (role `operator`) — separadas no backend via `countRole` | KPI preciso, sem duplicar o admin na contagem de operadores |
| Card de empresa | `totalOperadores` → `totalUsuarios` (admin + operator) | O card mostra quantos usuários a empresa tem no total, incluindo o admin |
| Ajuste do caixa pelo operator | Permitir (reverter 403 do PLAN-020), mantendo `resolveUsuarioAlvo` | O operator ajusta a própria base; a segurança continua (sempre `req.userId`, `?usuarioId=` ignorado) |
| Engrenagem na navbar | Dropdown com: Administração (admin), Empresas (super), tema, idioma, sair | Configurações num só lugar, padrão do dropdown de idioma já existente |

---

## Fases de implementação

```
Fase 1 (backend stats + endpoint empresa) → Fase 2 (frontend admin)
    → Fase 3 (login por role) → Fase 4 (navbar + caixa operator) → Fase 5 (docs)
```

### Fase 1 — Backend: stats separados + `GET /admin/empresas/:id`

**Arquivos:** 5 alterados

#### 1.1 — `AdminDashboardStats` separado por role

- `src/modules/admin/application/ports/admin.repository.ts`: `AdminDashboardStats` ganha `totalAdmins: number` e `totalOperadores: number` (substitui `totalOperadores` único que contava não-super_admin).
- `src/modules/admin/infrastructure/repositories/admin.repository.impl.ts`: helper `countRole(role)` → `SELECT COUNT(*) WHERE role = ? AND deletedAt IS NULL`; `totalAdmins = countRole("admin")`, `totalOperadores = countRole("operator")`.

#### 1.2 — `EmpresaComStats.totalUsuarios`

- `src/modules/admin/domain/empresa.entity.ts` e `src/modules/admin/infrastructure/repositories/empresa.repository.impl.ts`: `totalOperadores` → `totalUsuarios` (conta `admin` + `operator`).

#### 1.3 — `GET /api/admin/empresas/:id`

- `src/modules/admin/presentation/controllers/empresa.controller.ts`: handler `getById` → `empresaRepository.findById(id)` → 200 ou 404 (`EmpresaNaoEncontradaError`).
- `src/modules/admin/presentation/routes/empresa.routes.ts`: `router.get("/:id", controller.getById)`.

**Checklist Fase 1**

- [x] `AdminDashboardStats.totalAdmins` + `totalOperadores` (countRole)
- [x] `EmpresaComStats.totalUsuarios`
- [x] `GET /api/admin/empresas/:id` (controller + rota)
- [x] `npx tsc --noEmit` verde (backend)

---

### Fase 2 — Frontend admin: contexto, blocos de KPI e contagem

**Arquivos:** 5 alterados

#### 2.1 — Serviços

- `frontend/src/modules/admin/services/empresa.service.ts`: `EmpresaComStats.totalUsuarios` + novo `getEmpresa(id)`.
- `frontend/src/modules/admin/services/admin.service.ts`: tipo `AdminDashboardStats` com `totalAdmins`/`totalOperadores`.

#### 2.2 — `AdminPage.tsx`

- Busca `getEmpresa(empresaId)` quando `id` na rota; `empresaNome = empresa?.nome ?? user?.empresaNome` → `<h1 className="text-3xl font-semibold">` + badge `Empresa` (StatusBadge info).
- Redirect: `user?.role === "super_admin" && !empresaId` → `<Navigate to="/admin/empresas" replace />`.
- KPIs: `SectionHeader "Equipe"` → Admins (blue) + Operadores (info); `SectionHeader "Operação"` → Clientes (green) + Contratos (yellow) + Resultado do dia (gray).

#### 2.3 — `SuperAdminPage.tsx` + `EmpresaList.tsx`

- `SuperAdminPage`: usa `totalUsuarios` do dashboard.
- `EmpresaList`: card mostra `t("superAdmin.usuarios")` + `empresa.totalUsuarios`.

**Checklist Fase 2**

- [x] `getEmpresa(id)` + `totalUsuarios` no service
- [x] `AdminDashboardStats` no service do frontend
- [x] AdminPage com header de contexto, redirect do super, blocos Equipe/Operação e Admins × Operadores
- [x] SuperAdminPage/EmpresaList com `totalUsuarios`

---

### Fase 3 — Login roteado por role

**Arquivos:** 2 alterados

- `frontend/src/shared/auth/AuthContext.tsx`: `login` passa a retornar `Promise<LoginResponse>` (o `loginService` já retornava isso; o contexto descartava).
- `frontend/src/modules/auth/pages/LoginPage.tsx`: `const response = await login(...)` → `navigate(role === "super_admin" ? "/admin/empresas" : role === "admin" ? "/admin" : "/")`.

**Checklist Fase 3**

- [x] `AuthContext.login` retorna `LoginResponse`
- [x] `LoginPage` navega por role (operator → `/`, admin → `/admin`, super_admin → `/admin/empresas`)

---

### Fase 4 — Navbar (engrenagem) + caixa do operator

**Arquivos:** 2 alterados

#### 4.1 — `frontend/src/shared/components/Navbar.tsx`

Dropdown de engrenagem (padrão do dropdown de idioma): link **Administração** (`/admin`, se `admin`/`super_admin`), **Empresas** (`/admin/empresas`, se `super_admin`), divisórias, **tema claro/escuro** (mover o toggle pra dentro), idioma (mantido como está), **Sair**. Ícones `Settings`/`Shield`/`Building`/`Sun`/`Moon`/`LogOut` (lucide-react, já usado no projeto).

#### 4.2 — `frontend/src/modules/caixa/pages/CaixaPage.tsx`

Remover o bloco condicional `user?.role !== "operator" && (...)` que ocultava "Ajustar Caixa Total" — o operator volta a ajustar a própria base. Remover `useAuth`/`user` se não usados em outro ponto da página.

**Checklist Fase 4**

- [x] Navbar com dropdown de engrenagem (admin/empresas/tema/sair)
- [x] CaixaPage sem ocultar "Ajustar Caixa Total" para operator
- [x] i18n pt-BR/en/es (nav.configuracoes, nav.temaClaro, nav.temaEscuro, admin.secaoEquipe, admin.secaoOperacao, admin.totalAdmins, admin.empresaBadge)
- [x] `npx tsc --noEmit` verde (frontend)

---

### Fase 5 — Documentação

- [x] `docs/plans/PLAN-021-admin-contexto-kpis.md` — este plano
- [ ] `docs/engineering/02-API.md`: `GET /api/admin/empresas/:id`, `AdminDashboardStats` (Admins × Operadores), `totalUsuarios`, BR-081/082/083
- [ ] `docs/engineering/05-MAPEAMENTO-TELAS.md`: login por role, navbar com engrenagem, AdminPage com contexto/blocos
- [ ] `docs/product/02-BUSINESS-RULES.md`: BR novas
- [ ] `docs/README.md`/`docs/plans/README.md`: entrada PLAN-021
- [ ] `docs/engineering/tasks/2026-08-01/CHECKLIST.md`: registro do dia

---

## Regras de negócio (novas/alterações propostas)

- **BR-081 (NOVA)** — Login roteado por perfil: `operator` → `/`, `admin` → `/admin`, `super_admin` → `/admin/empresas`. `/admin` para `super_admin` redireciona para `/admin/empresas`.
- **BR-082 (NOVA)** — Painel admin com contexto de empresa: KPIs agrupados em `Equipe` (Admins × Operadores) e `Operação` (Clientes, Contratos, Resultado do dia). O KPI de operadores conta apenas `role='operator'`; admins têm KPI próprio.
- **BR-083 (NOVA)** — Card de empresa (super admin) mostra `totalUsuarios` (admin + operator), não apenas operadores.
- **BR-084 (NOVA)** — Operador pode ajustar o próprio Caixa Base: `POST /api/caixa/ajuste` aceita `operator` para o próprio caixa (`req.userId`); `?usuarioId=` é sempre ignorado para operator (segurança preservada).

---

## Resultados de validação

- `npm run build` → OK (backend tsc + frontend vite). `npx tsc --noEmit` → OK (frontend).
- Fluxo validado por curl em DB temporário (`PORT=3900`, `DB_PATH=/tmp/opencode/plan021/test.db`):
  - `GET /api/admin/empresas` → `totalUsuarios` (não mais `totalOperadores`); `POST /api/admin/empresas` cria empresa + admin.
  - `GET /api/admin/empresas/:id` → 200 (empresa existente) / 404 (inexistente).
  - `GET /api/admin/dashboard?empresaId=` → `{ totalAdmins: 1, totalOperadores: 1 }` após criar 1 admin + 1 operator (contagem separada por role).
  - Operator `POST /api/caixa/ajuste` → 201 `{ caixaBase: 5000 }` (ajusta o próprio caixa); `GET /api/caixa` → base 5000, saldo 5000, lucro 0.
  - **Forgery:** operator com `?usuarioId=<admin da própria empresa>` → ignorado, ajusta o próprio caixa; caixa do admin permanece base 0.
  - Admin ajusta caixa do operator via `?usuarioId=` → 201 base 8000.

---

## Referências

- `src/modules/admin/**`, `src/modules/caixa/**`
- `frontend/src/modules/{admin,caixa,auth}/**`, `frontend/src/shared/{auth,components}/**`, `frontend/src/i18n/locales/**`
- `docs/plans/PLAN-020-admin-operador-caixa.md`
