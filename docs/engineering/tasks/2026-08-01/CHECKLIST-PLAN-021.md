# CHECKLIST — Painel admin: contexto, KPIs, Admins × Operadores, login por role, engrenagem (PLAN-021)

**Status:** Concluído

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Plano:** plans/PLAN-021-admin-contexto-kpis.md

---

## Objetivo

Dar contexto de empresa ao painel admin (header com o nome da empresa), agrupar KPIs em blocos (`Equipe` e `Operação`), separar a contagem de **Admins × Operadores**, rotear o login por perfil, colocar uma engrenagem (configurações) na navbar e devolver ao operador o ajuste do próprio Caixa Base.

---

## Fase 1 — Backend: stats separados + `GET /admin/empresas/:id`

- [x] `AdminDashboardStats` com `totalAdmins` (role `admin`) e `totalOperadores` (role `operator`) via `countRole`
- [x] `EmpresaComStats.totalOperadores` → `totalUsuarios` (admin + operator)
- [x] `GET /api/admin/empresas/:id` (controller `getById` + rota `router.get("/:id")`)
- [x] `npx tsc --noEmit` verde (backend)

## Fase 2 — Frontend admin: contexto, blocos de KPI e contagem

- [x] `empresa.service.ts`: `EmpresaComStats.totalUsuarios` + `getEmpresa(id)`
- [x] `admin.service.ts`: `AdminDashboardStats` com `totalAdmins`/`totalOperadores`
- [x] `AdminPage.tsx`: header `<h1>` com nome da empresa + badge "Empresa"; redirect de super_admin em `/admin` → `/admin/empresas`; blocos Equipe (Admins/Operadores) e Operação (Clientes/Contratos/Resultado do dia)
- [x] `SuperAdminPage.tsx`/`EmpresaList.tsx`: `totalUsuarios` ("Usuários: N")

## Fase 3 — Login roteado por role

- [x] `AuthContext.login` retorna `LoginResponse`
- [x] `LoginPage` navega por role (operator → `/`, admin → `/admin`, super_admin → `/admin/empresas`)

## Fase 4 — Navbar (engrenagem) + caixa do operator

- [x] `Navbar.tsx`: dropdown de engrenagem (Administração / Empresas / tema / Sair) + idioma
- [x] `CaixaPage.tsx`: seção "Ajustar Caixa Total" volta a aparecer para operator; `useAuth`/`user` removidos
- [x] i18n pt-BR/en/es: `nav.configuracoes`, `nav.temaClaro`, `nav.temaEscuro`, `admin.secaoEquipe`, `admin.secaoOperacao`, `admin.totalAdmins`, `admin.empresaBadge`
- [x] `npx tsc --noEmit` verde (frontend)

## Fase 5 — Documentação

- [x] `docs/plans/PLAN-021-admin-contexto-kpis.md` criado
- [x] `docs/engineering/02-API.md`
- [x] `docs/engineering/05-MAPEAMENTO-TELAS.md`
- [x] `docs/product/02-BUSINESS-RULES.md`
- [x] `docs/plans/README.md` + `docs/README.md`
- [x] Este CHECKLIST + tarefa de validação final

## Fase 6 — Validação e deploy

- [x] `npm run build` (backend tsc + frontend vite) — OK
- [x] `npm test` (vitest) — sem arquivos de teste no repo (G10 do PLAN-020; validação por curl)
- [x] Teste manual via curl (DB temporário `PORT=3900`):
  - `GET /api/admin/empresas/:id` → 200/404
  - `GET /api/admin/dashboard?empresaId=` → `totalAdmins`/`totalOperadores` separados
  - Operator ajusta o próprio caixa (201) e ignora `?usuarioId=` forjado
  - Admin ajusta caixa do operator via `?usuarioId=` (201)
- [ ] Deploy no VPS (`scripts/deploy.sh`) — pendente

---

## Resultados de verificação

- `npm run build` → OK (backend tsc + frontend vite)
- `npx tsc --noEmit` → OK (backend e frontend)
- Curl em DB temporário:
  - Super admin: `GET /api/admin/empresas` → `totalUsuarios`; criar empresa → empresa + admin
  - `GET /api/admin/empresas/:id` → 200; id inexistente → 404
  - Dashboard: 1 admin + 1 operator → `{ totalAdmins: 1, totalOperadores: 1 }`
  - Operator: `POST /api/caixa/ajuste` → 201 base 5000; `GET /api/caixa` → saldo 5000/lucro 0
  - Operator forja `?usuarioId=<admin>` → ignorado (ajusta o próprio); caixa do admin intacto (base 0)
  - Admin: `POST /api/caixa/ajuste?usuarioId=<operator>` → 201 base 8000

---

## Notas

- **Rede local mudou nesta sessão** (troca de wifi): IP local era outro e agora é `192.168.0.7`. Verificado que nada no repo depende do IP local — o remote do git é HTTPS (github.com) e o acesso ao VPS (`172.245.152.223`) é por chave SSH (IP do VPS não muda com o wifi). Se aparecer conflito de IP/host em conexões, revalidar a rede antes de investigar o código.
- Nada foi commitado/pushado nesta sessão (alterações do PLAN-021 + 17 arquivos pré-existentes pendentes de commit de PLAN-020/dotenv/JWT). Aguardando decisão do usuário.
