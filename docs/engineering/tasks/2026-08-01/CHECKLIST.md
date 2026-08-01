# CHECKLIST — Drill-down Admin → Operador + Fix do Caixa (PLAN-020)

**Status:** Concluído

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Plano:** plans/PLAN-020-admin-operador-caixa.md

---

## Objetivo

Permitir que o admin visualize o caixa (KPIs e movimentações) de cada operador e defina o Caixa Base dele — com correção de dois bugs do módulo Caixa: a **dobra de saldo/lucro** (o ajuste do Caixa Base gravava uma movimentação que era somada de novo) e o **404 multi-usuário** (a tabela `caixa_config` tinha PK/seed globais que impediam config por usuário).

---

## Fase 0 — Fix do cálculo do caixa (dobra no saldo/lucro)

- [x] `AjustarCaixaBaseUseCase` deixa de gravar movimentação `origem="Ajuste"` no ajuste (a base é o registro)
- [x] Limpeza idempotente em `createTables()`: `DELETE FROM movimentacoesFinanceiras WHERE origem='Ajuste' AND descricao='Ajuste manual do Caixa Base'` (não toca no "Ajuste de valor base do contrato")
- [x] Validação curl: base 5000 → saldo 5000 / lucro 0; contrato 1000 → saldo 4000; pagamento 366.67 → saldo 4366.67; gasto 200 → saldo 4800 / lucro −200; `movimentacoes` sem "Ajuste" fantasma

## Fase 1 — Caixa multi-usuário (fix do 404)

- [x] PK da `caixa_config` migrada de `id` (global, seed `('default', 0)`) para `userId` — rebuild `caixa_config_new` + DROP + RENAME; linha órfã → primeiro admin/super_admin ativo, senão descartada
- [x] `getOrCreateCaixaConfig(userId)` adicionado ao port e ao repositório — operador sem config passa a ter (recria em runtime, sem 404)
- [x] `getCaixaConfig`/`updateCaixaBase` filtram só por `userId` (era `id='default' AND userId`) — nos dois repos: `caixa` e `contrato` (cópia própria)
- [x] `CaixaConfig` = `{ userId, caixaBase, updatedAt }` nas duas definições (caixa.entity e contrato.entity)
- [x] Validação: migração de banco antigo (linha órfã → admin; sem admin → descarta) idempotente; operador ajusta base sem 404

## Fase 2 — Alvo do caixa via `?usuarioId=` (backend + service)

- [x] `resolveUsuarioAlvo(req, adminRepo)` em `src/shared/utils/scope.ts`: operator → `req.userId`; admin → valida `?usuarioId=` dentro do `empresaId` (token ou `?empresaId=`); super_admin → valida existência
- [x] `GET /api/caixa` e `GET /api/caixa/movimentacoes` aceitam `usuarioId`; `POST /api/caixa/ajuste` aceita `usuarioId` e **bloqueia operator (403)**; `POST /api/caixa/liquidar` permanece `req.userId`
- [x] `OperadorNaoEncontradoError` → 404 nos três endpoints (corrigido `getStatus` que retornava 500)
- [x] Frontend `caixa.service.ts`: `getCaixaStatus`/`ajustarCaixaBase`/`listarMovimentacoes` com `usuarioId?`
- [x] `CaixaPage.tsx`: seção "Ajustar Caixa Total" oculta para `role=operator`
- [x] Validação: operator 403; admin ajusta/vê caixa do operador; forgery `usuarioId` por operator ignorada; alvo inexistente 404; cross-empresa 404

## Fase 3 — Drill-down Admin → Operador

- [x] `GET /api/admin/operadores/:id` (validado dentro da empresa) + rota
- [x] `AdminRoute` (guarda de role admin/super_admin) aplicado nas rotas `/admin*`
- [x] `AdminPage` com abas **Equipe** (default) e **Meus dados** (admin no próprio `/admin`; oculto para super_admin)
- [x] `OperadoresList`: botão "Acessar" (drill-down, padrão EmpresaList) + admin não se vê na própria lista
- [x] Página `OperadorDetail` (`/admin/operadores/:id`): dados do operador + KPIs do caixa dele
- [x] i18n pt-BR/en/es: `tabEquipe`, `tabMeusDados`, `operadorDetail`, `operadorData`, `caixaOperador`, `email`
- [x] Validação: 200/404; super com e sem `empresaId`; cross-empresa 404 em operador e caixa

## Fase 4 — Documentação

- [x] `docs/engineering/02-API.md`: escopo `?usuarioId=` no módulo Caixa, `GET /api/admin/operadores/:id`, BR-078/079/080, tabelas de erros
- [x] `docs/plans/PLAN-020-admin-operador-caixa.md` — status final, resultados de validação
- [x] Este CHECKLIST

---

## Resultados de verificação

- `npm run build` → OK (backend tsc + frontend vite) em todas as fases
- `npx tsc --noEmit` → OK (backend)
- Fluxo completo validado por curl em DB temporário:
  - Operator: `POST /api/caixa/ajuste` → 403; `GET /api/caixa` → caixa próprio (base 5000)
  - Admin: `POST /api/caixa/ajuste?usuarioId=<op>` → 201 base 5000; `GET /api/caixa?usuarioId=<op>` → base 5000
  - Admin: `usuarioId` inexistente → 404; operador de outra empresa → 404
  - Super admin: ajuste/leitura de caixa de operador de qualquer empresa → 200/201
  - `GET /api/admin/operadores/:id` → 200 (dentro da empresa), 404 (fora/inexistente)

## Code review (pós-implementação)

- [x] **Furo de autorização (scope.ts)**: admin podia forjar `?empresaId=` no query e acessar o caixa de operador de outra empresa — corrigido: admin usa sempre `empresaId` do token; só `super_admin` honra `?empresaId=`. Validado: admin com `?usuarioId=<op outra empresa>&empresaId=<outra>` → 404
- [x] **G26 (inconsistência plano × código)**: tabela de gaps atualizada para refletir a decisão da Fase 3.3 (backend conta não-super_admin; próprio admin ocultado da lista)
- [x] **AdminPage "Meus dados"**: estado de erro próprio (`meuCaixaError`) no lugar de reusar o erro da lista de operadores

## Notas

- Nada foi commitado/pushado nesta sessão (há 17 arquivos pré-existentes pendentes de commit — dotenv/JWT + B1–B5). Aguardando decisão do usuário.
