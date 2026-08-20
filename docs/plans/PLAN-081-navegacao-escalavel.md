# PLAN-081 — Navegação escalável (tab bar "Mais" + sidebar colapsável)

**Status:** 📝 Planejado (não implementado)

**Versão:** 1.0

**Início:** 18/08/2026

**Pré-requisito:** o **PLAN-080** (insights dashboard) depende deste — sem a navegação escalável, o 6º item estoura a tab bar.

**Origem:** com a entrada do módulo `insights` (PLAN-080) e futuros módulos (agenda, vendas — F4), a navegação mobile-first estoura (tab bar hoje no teto de 5 abas) e a sidebar desktop fixa `w-64` não escala. Requisito: navegação reaproveitável, sem "buracos", com toggle de módulo sem consequências.

---

## Objetivo

Fazer a navegação (tab bar mobile + sidebar desktop) escalar com o número de módulos, sem estourar nem criar espaços vazios, mantendo o padrão mobile-first.

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Padrão mobile | **Tab bar + "Mais"** (overflow → sheet inferior), cap **5 primários** |
| D2 | Painel Admin (admin/sócio) | Vai pro **"Mais"** junto com a Rota (cap 5) |
| D3 | Insights | Aba **primária** (Central, Clientes, Contratos, Caixa, Insights); **Rota** → "Mais" |
| D4 | Sidebar desktop | **Colapsável** expandida `w-64` ⇄ rail `w-16`, toggle manual, estado persistido (localStorage) |
| D5 | Arquitetura | **Registro único** `shared/navigation/nav.ts` alimentando tab bar + sidebar (fim da duplicação `useNavItems` × `ABAS`) |
| D6 | Gating | Centralizado no registro via `modulo` (whitelabel) + `papel` — comportamento atual preservado, em fonte única |
| D7 | Itens só-por-papel | Itens sem `modulo` (Board/Empresas/Leads do super admin) nunca são ocultados por whitelabel (G6) |
| D8 | Exclusão por papel | Regra por item p/ a Rota: `excluirPapel: ["admin","socio"]` (delegada) — não forçar no consumo (G7) |
| D9 | Sheet "Mais" | Reusa o componente `Modal` (já é bottom-sheet no mobile, PLAN-062) — sem componente novo (G8) |
| D10 | Estado ativo do "Mais" | Aba "Mais" ativa quando a rota atual está no conjunto de overflow (G9) |
| D11 | `/gastos` | **Sem item de nav — segue agregado ao Caixa** (comportamento atual: rota existe, acesso via Caixa). Documentado no registro p/ não ressuscitar item (R3) |
| D12 | Papel no registro | `papel: "tenant"\|"admin"\|"socio"\|"super_admin"` — itens do super_admin (Board/Empresas/Leads) em grupo próprio, sem whitelabel (R4) |
| D13 | Guards de rota | Registro coexiste com os guards existentes (`RequireModule`, `AdminRoute`, `SuperAdminRoute`) — o registro resolve a **nav**; o guard resolve o **acesso** (R5) |

---

## Registro de navegação (`frontend/src/shared/navigation/nav.ts`)

Lista declarativa de itens:

```ts
{ id: string; rota: string; labelKey: string; icon: LucideIcon; modulo?: ModuleId; papel: "tenant"|"admin"|"socio"|"super_admin"; excluirPapel?: ("admin"|"socio")[]; prioridade: number; grupo: "operacional"|"admin"|"plataforma" }
```

- `modulo` opcional → item some quando o módulo está off (sem "buraco": itens são condicionais, a lista fecha).
- **Sem `modulo`** = item independente de whitelabel (ex.: itens do super admin — G6).
- `papel` → **quem pode ver**; `grupo: "plataforma"` separa os itens do super_admin (Board/Empresas/Leads) dos do admin/sócio (Painel Admin) — R4.
- `excluirPapel` → regra por item p/ a Rota ser ocultada do admin/sócio (delegada) — G7.
- `prioridade` → define ordem + quem é primário vs overflow "Mais".
- `grupo` → separa as seções Operacional / Admin / Plataforma (sidebar desktop).
- Helper `isOverflowRoute(rotaAtual)` → estado ativo do "Mais" por rota de overflow (G9).
- **R3:** `/gastos` **não tem entry** no registro (segue agregado ao Caixa) — o registro documenta isso.
- **R5:** o registro só alimenta a **nav**; o **acesso** à rota continua pelos guards (`RequireModule`/`AdminRoute`/`SuperAdminRoute` no `App.tsx`) — não duplicar proteção no registro.

---

## Tab bar mobile (BottomTabBar)

- `Central + até 4 primários + aba "Mais"` (`MoreHorizontal`). Cap = **5 primários**.
- Overflow (menor prioridade) → "Mais" → **reusa o `Modal`** (bottom-sheet mobile, PLAN-062) com a lista de itens de overflow (G8).
- "Mais" só aparece se houver overflow (nunca vazio).
- "Mais" fica **ativo** quando a rota atual está no overflow (`isOverflowRoute`) — G9.
- **Operator:** Central · Clientes · Contratos · Caixa · Insights · Mais(Rota).
- **Admin/sócio:** Central · Clientes · Contratos · Caixa · Insights · Mais(Rota delegada, **Painel Admin**).
- **Super admin:** Central · Board · Empresas · Leads (intocado — whitelabel não se aplica; itens sem `modulo`).

---

## Sidebar desktop (AppLayout)

- Expandida `w-64` (ícone + label, seções Operacional/Admin/Plataforma) ⇄ colapsada rail `w-16` (ícone + tooltip no hover).
- Toggle manual, estado persistido (localStorage).
- Quando colapsada, o **header da seção ("Administração"/"Plataforma") some** (só ícones) — G10.
- Seções: **Operacional** (tenant), **Admin** (admin/sócio: Painel Admin) e **Plataforma** (super_admin: Board/Empresas/Leads) — R4.

---

## Arquivos

| Arquivo | Mudança |
|---|---|
| `frontend/src/shared/navigation/nav.ts` | **novo** — registro + helpers |
| `frontend/src/shared/navigation/nav.test.ts` | **novo** — testes do registro |
| `frontend/src/shared/layout/BottomTabBar.tsx` | cap 5 + aba "Mais" (reusa `Modal`) + estado ativo |
| `frontend/src/shared/layout/AppLayout.tsx` | sidebar colapsável (toggle + persistência + tooltip + header de seção) |
| `frontend/src/test/setup.ts` | mock `ResizeObserver` se o `Modal`/sheet exigir (G14, transversal) |
| `frontend/src/i18n/locales/{pt-BR,en,es}.json` | chave `nav.mais` + labels/tooltips |
| `docs/engineering/design/04-UI-COMPONENTS.md` | atualizar comportamento da nav |
| `docs/engineering/design/UI-COVERAGE.md` | atualizar superfícies |
| `docs/product/06-CASOS-DE-USO.md` | novos UCs de navegação |
| `docs/product/08-UC-MODULOS.md` | linha do `insights` (quando entrar, PLAN-080) |

> **Nota:** a rota `/insights` é escopo do **PLAN-080**, não deste.

---

## QA / CTs

| Camada | Entrega |
|---|---|
| Unit front | `nav.test.ts` — cap 5, ordenação por prioridade, overflow→Mais, "Mais" só com overflow, gating por módulo/papel, itens só-por-papel (G6), `excluirPapel` da Rota (G7), `isOverflowRoute` (G9), Central sempre presente, `/gastos` sem entry (R3), papel `super_admin` em grupo Plataforma (R4) |
| Component/UI | `BottomTabBar` (5+Mais, sheet abre/fecha, estado ativo, **a11y do "Mais": foco, `Escape` fecha, `role`** — P8) + `AppLayout` (collapse/tooltip/**persistência localStorage set/restore** — P7/header seção, seções por papel — R4) — jsdom, **docblock `// @vitest-environment jsdom`** (G15) |
| Integração | registro `nav.ts` só alimenta a **nav**; guards (`RequireModule`/`AdminRoute`/`SuperAdminRoute`) continuam no `App.tsx` (R5) — teste de que não há duplicação de proteção |
| Gates | `npm test` + `audit:ui` + `audit:styles` + `audit:modules` + `audit:docs` limpos; **PR passa no CI (test+smoke) antes do merge (P9)** |

---

## Critérios de aceite

- `npm run audit:ui` / `audit:styles` / `audit:modules` / `audit:docs` + `npm test` limpos.
- `UI-COVERAGE.md` e `04-UI-COMPONENTS.md` atualizados.
- Tab bar mobile: 5 primários + "Mais" com overflow correto por perfil (operator / admin-sócio / super).
- Sidebar desktop colapsa/expande e persiste entre sessões.
- Módulo off → item some e a lista fecha, sem "buraco".
- Rota do overflow deixa o "Mais" ativo; "Mais" reusa o `Modal`.
- Header "Administração" some quando a sidebar está colapsada.
- Colapso da sidebar persiste entre sessões (localStorage set/restore).
- Sheet "Mais" acessível: foco gerenciado, `Escape` fecha, `role` correto.
- `/gastos` permanece sem item de nav (agregado ao Caixa).
- Itens do super_admin (Board/Empresas/Leads) em seção própria, sem whitelabel.
- Registro de nav não duplica os guards de acesso das rotas.
- PR passa no CI (test + smoke) antes do merge.

---

## Referências

- PLAN-031 (whitelabel v1) · PLAN-036 (enforcement 403) · PLAN-037 (coerência) · PLAN-045 (Module Manifest + `audit:modules`) · PLAN-044 (UI governance) · **PLAN-080** (insights, dependente deste)
- `frontend/src/shared/layout/AppLayout.tsx` · `BottomTabBar.tsx` · `frontend/src/shared/modules/modules.ts`
- `docs/engineering/design/04-UI-COMPONENTS.md` · `UI-COVERAGE.md` · `docs/product/06-CASOS-DE-USO.md` · `08-UC-MODULOS.md`
