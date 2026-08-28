# PLAN-081 — Navegação escalável (tab bar "Mais" + registro `nav.ts`)

**Status:** 📝 Planejado (não implementado) · **Revisado 28/08** (4 correções + corte de escopo — origem: nota de revisão do vault `brainwork`)

**Versão:** 1.1

**Início:** 18/08/2026

**Relacionado:** o **PLAN-080** (insights) era pré-requisito declarado deste. **Revisão 28/08:** desacoplado — o PLAN-080 entrega `/insights` alcançável por URL **sem item de nav** (Fase 1), então este plano virou pré-requisito só de **descoberta** (item na aba "Mais", Fase 1.5 do PLAN-080).

**Origem:** com a entrada do módulo `insights` (PLAN-080) e futuros módulos (agenda, vendas — F4), a navegação mobile-first estoura (tab bar no teto de 5 abas) e há duplicação real de itens entre `AppLayout.tsx` e `BottomTabBar.tsx`. Requisito: navegação reaproveitável, sem "buracos", com toggle de módulo sem consequências.

---

## ⚠️ Revisão 28/08 — correções de direção

| # | Correção | Decisão |
|---|---|---|
| 1 | **Ordem das fases** | O `nav.ts` é a correção da causa raiz e **deve vir primeiro** (Fase 1 = refactor puro, testável isolado, zero mudança visível); a tab bar consome o registro. A lógica de overflow nunca é escrita contra constantes hardcoded |
| 2 | **Sidebar colapsável (D4) sai do escopo** | Lista vertical já escala; o rail resolve largura de conteúdo (motivação mais fraca) e viola o normativo `06-UI-PATTERNS` ("desktop expande informação"). Vira item de `BACKLOG.md` |
| 3 | **`papel` → `papeis: Role[]`** | Os papéis se sobrepõem (`isTenant = operator‖admin‖socio`, `isAdminSocio = admin‖socio`). Campo escalar gera bug de gating silencioso |
| 4 | **Rota permanece primária; `insights` vai pro "Mais"** | A Rota é a ação diária mais importante do operador (briefing Stitch) e `insights` interessa mais a admin/sócio (que não têm Rota). Rebaixar a Rota inverte a prioridade de quem usa o produto em campo |

**Vetos (valem em toda a execução)**

- [ ] **Nenhum `role="tab"`** fora do componente `Tabs` — a aba "Mais" usa `NavLink`/`button` com `role="navigation"` no container
- [ ] **Não reintroduzir o rail** da sidebar (D4 fora de escopo — está no BACKLOG)
- [ ] **Não rebaixar a Rota** do conjunto primário
- [ ] O cap e o `isOverflowRoute` moram **no `nav.ts`**, derivados da mesma lista ordenada — nunca em dois lugares
- [ ] `papeis` é **lista** (`Role[]`), nunca campo escalar
- [ ] `/gastos` **continua** sem item de nav
- [ ] Itens do super_admin (Board/Empresas/Leads) **nunca** ocultados por whitelabel
- [ ] O registro **não** duplica os guards de acesso (`RequireModule`/`AdminRoute`/`SuperAdminRoute` intactos)
- [ ] `pb-safe` preservado na `BottomTabBar`
- [ ] `Modal` da sheet "Mais" **com `title`**

---

## Objetivo

Fazer a navegação (tab bar mobile + sidebar desktop) escalar com o número de módulos, sem estourar nem criar espaços vazios, mantendo o padrão mobile-first — com um **registro único** de nav como fonte de verdade.

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Padrão mobile | **Tab bar + "Mais"** (overflow → sheet inferior), cap **5 primários** — mecanismo vive no `nav.ts` |
| D2 | Painel Admin (admin/sócio) | Permanece **primário** (cap 5 do perfil); `insights` e demais overflow → "Mais" |
| D3 | Insights | Aba do **overflow ("Mais")** — **Rota permanece primária** (correção 4) |
| D4 | ~~Sidebar desktop colapsável~~ | **CORTADO** (correção 2) → `BACKLOG.md`. Sidebar permanece `w-64` fixa |
| D5 | Arquitetura | **Registro único** `shared/navigation/nav.ts` alimentando tab bar + sidebar (fim da duplicação `useNavItems` × `ABAS`) |
| D6 | Gating | Centralizado no registro via `modulo` (whitelabel) + `papeis` — comportamento atual preservado, em fonte única |
| D7 | Itens só-por-papel | Itens sem `modulo` (Board/Empresas/Leads do super admin) nunca são ocultados por whitelabel (G6) |
| D8 | Exclusão por papel | Regra por item p/ a Rota: `excluirPapel: ["admin","socio"]` (delegada) — não forçar no consumo (G7) |
| D9 | Sheet "Mais" | Reusa o componente `Modal` (já é bottom-sheet no mobile, PLAN-062) — **com `title`** — sem componente novo (G8) |
| D10 | Estado ativo do "Mais" | Aba "Mais" ativa quando a rota atual está no conjunto de overflow — `isOverflowRoute` no `nav.ts` (G9) |
| D11 | `/gastos` | **Sem item de nav — segue agregado ao Caixa** (comportamento atual: rota existe, acesso via Caixa). Documentado no registro p/ não ressuscitar item (R3) |
| D12 | Papéis no registro | `papeis: Role[]` (lista) — casa com a sobreposição real (`isTenant`/`isAdminSocio`); itens do super_admin em grupo próprio, sem whitelabel (R4) |
| D13 | Guards de rota | Registro coexiste com os guards existentes (`RequireModule`, `AdminRoute`, `SuperAdminRoute`) — o registro resolve a **nav**; o guard resolve o **acesso** (R5) |

---

## Estrutura de fases (revisada 28/08 — `nav.ts` primeiro)

| Fase | Conteúdo | Verificação |
|---|---|---|
| **0** | baseline — saída literal dos gates + **print da tab bar nos 3 papéis** (operator · admin/sócio · super_admin) como referência de "nada mudou" | `npm test` · `audit:ui/styles` · `docs:audit` · `tsc` |
| **1** | **registro único `nav.ts`** — refactor puro, zero mudança visível; `AppLayout`/`BottomTabBar` consomem o registro | os 3 papéis mostram exatamente os mesmos itens, na mesma ordem |
| **2** | **aba "Mais"** (overflow) — cap aplicado no consumo, sheet com `title`, `isOverflowRoute`, a11y | "Mais" ativo em rota de overflow · módulo off sem buraco |
| **3** | verificação final | gates + manual por papel |

---

## Registro de navegação (`frontend/src/shared/navigation/nav.ts`)

Lista declarativa de itens:

```ts
{ id: string; rota: string; labelKey: string; icon: LucideIcon; modulo?: ModuleId; papeis: Role[]; excluirPapel?: Role[]; prioridade: number; grupo: "operacional"|"admin"|"plataforma" }
```

- `modulo` opcional → item some quando o módulo está off (sem "buraco": itens são condicionais, a lista fecha).
- **Sem `modulo`** = item independente de whitelabel (ex.: itens do super admin — G6).
- `papeis` (lista) → **quem pode ver**; `grupo: "plataforma"` separa os itens do super_admin (Board/Empresas/Leads) dos do admin/sócio (Painel Admin) — R4.
- `excluirPapel` → regra por item p/ a Rota ser ocultada do admin/sócio (delegada) — G7.
- `prioridade` → define ordem + quem é primário vs overflow "Mais".
- **Cap de primários e `isOverflowRoute` vivem aqui**, derivados da mesma lista ordenada (correção 1) — se o corte ficar na `BottomTabBar` e a rota de overflow for calculada em outro lugar, os dois discordam sobre o que é primário.
- **R3:** `/gastos` **não tem entry** no registro (segue agregado ao Caixa) — o registro documenta isso.
- **R5:** o registro só alimenta a **nav**; o **acesso** à rota continua pelos guards (`RequireModule`/`AdminRoute`/`SuperAdminRoute` no `App.tsx`) — não duplicar proteção no registro.

---

## Tab bar mobile (BottomTabBar)

- `Central + até 4 primários + aba "Mais"` (`MoreHorizontal`). Cap = **5 primários** (derivado do registro).
- Overflow (menor prioridade) → "Mais" → **reusa o `Modal`** (bottom-sheet mobile, PLAN-062) **com `title`**, lista de itens de overflow (G8).
- "Mais" só aparece se houver overflow (nunca vazio).
- "Mais" fica **ativo** quando a rota atual está no overflow (`isOverflowRoute`) — G9.
- **Operator:** Central · Clientes · Contratos · Caixa · Rota + Mais(Insights).
- **Admin/sócio:** Central · Clientes · Contratos · Caixa · Painel Admin + Mais(Insights) (Rota é delegada — `excluirPapel`).
- **Super admin:** Central · Board · Empresas · Leads (intocado — whitelabel não se aplica; itens sem `modulo`).

---

## Sidebar desktop (AppLayout)

- Permanece **`w-64` fixa** (sem colapso — D4 cortado; justificativa e gatilho no `BACKLOG.md`).
- Passa a **consumir o registro `nav.ts`** (seções Operacional / Admin / Plataforma), eliminando a duplicação com a tab bar.

---

## Arquivos

| Arquivo | Mudança |
|---|---|
| `frontend/src/shared/navigation/nav.ts` | **novo** — registro + helpers (cap, `isOverflowRoute`, gating por `papeis`) |
| `frontend/src/shared/navigation/nav.test.ts` | **novo** — testes do registro |
| `frontend/src/shared/layout/BottomTabBar.tsx` | consome o registro; cap 5 + aba "Mais" (reusa `Modal` com `title`) + estado ativo |
| `frontend/src/shared/layout/AppLayout.tsx` | consome o registro (sem colapso — D4 fora) |
| `frontend/src/test/setup.ts` | mock `ResizeObserver` se o `Modal`/sheet exigir (G14, transversal); mock `matchMedia` se algum teste exercitar breakpoint |
| `frontend/src/i18n/locales/{pt-BR,en,es}.json` | chave `nav.mais` + labels/tooltips |
| `docs/engineering/design/04-UI-COMPONENTS.md` | atualizar comportamento da nav |
| `docs/engineering/design/UI-COVERAGE.md` | atualizar superfícies |
| `docs/product/06-CASOS-DE-USO.md` | novos UCs de navegação |
| `docs/product/08-UC-MODULOS.md` | linha do `insights` (quando entrar — Fase 1.5 do PLAN-080) |

> **Nota:** a rota `/insights` é escopo do **PLAN-080**; este plano só coloca o item de nav na aba "Mais" (descoberta).

---

## QA / CTs

| Camada | Entrega |
|---|---|
| Unit front | `nav.test.ts` — cap 5, ordenação por prioridade, overflow→Mais, "Mais" só com overflow, gating por módulo/**papeis**, itens só-por-papel (G6), `excluirPapel` da Rota (G7), `isOverflowRoute` (G9), Central sempre presente, `/gastos` sem entry (R3), super_admin em grupo Plataforma (R4) |
| Component/UI | `BottomTabBar` (5+Mais, sheet abre/fecha, estado ativo, **a11y do "Mais": foco, `Escape` fecha, `role`** — P8) — jsdom, **docblock `// @vitest-environment jsdom`** (G15) |
| Integração | registro `nav.ts` só alimenta a **nav**; guards (`RequireModule`/`AdminRoute`/`SuperAdminRoute`) continuam no `App.tsx` (R5) — teste de que não há duplicação de proteção |
| Gates | `npm test` + `audit:ui` + `audit:styles` + `audit:modules` + `audit:docs` limpos; **PR passa no CI (test+smoke) antes do merge (P9)** |

---

## Critérios de aceite

- `npm run audit:ui` / `audit:styles` / `audit:modules` / `audit:docs` + `npm test` limpos.
- `UI-COVERAGE.md` e `04-UI-COMPONENTS.md` atualizados.
- **Fase 1:** os 3 papéis mostram exatamente os mesmos itens da linha de base (refactor puro).
- Tab bar mobile: 5 primários + "Mais" com overflow correto por perfil (operator / admin-sócio / super); **Rota nunca rebaixada**.
- Módulo off → item some e a lista fecha, sem "buraco".
- Rota do overflow deixa o "Mais" ativo; "Mais" reusa o `Modal` **com `title`**.
- Sheet "Mais" acessível: foco gerenciado, `Escape` fecha, `role` correto, `pb-safe` preservado.
- `/gastos` permanece sem item de nav (agregado ao Caixa).
- Itens do super_admin (Board/Empresas/Leads) em seção própria, sem whitelabel.
- Registro de nav não duplica os guards de acesso das rotas.
- PR passa no CI (test + smoke) antes do merge.

---

## Referências

- PLAN-031 (whitelabel v1) · PLAN-036 (enforcement 403) · PLAN-037 (coerência) · PLAN-045 (Module Manifest + `audit:modules`) · PLAN-044 (UI governance) · **PLAN-080** (insights — desacoplado, só descoberta) · PLAN-060/Stitch (origem da nav atual)
- Revisão 28/08: nota `NX Gest - Navegação escalável (PLAN-081)` no vault `brainwork` · normativo `docs/foundation/ADR-005-UI-Governance.md` · `docs/engineering/design/06-UI-PATTERNS.md`
- `frontend/src/shared/layout/AppLayout.tsx` · `BottomTabBar.tsx` · `frontend/src/shared/modules/modules.ts`
- `docs/engineering/design/04-UI-COMPONENTS.md` · `UI-COVERAGE.md` · `docs/product/06-CASOS-DE-USO.md` · `08-UC-MODULOS.md`