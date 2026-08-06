# UI COVERAGE — Inventário canônico de superfícies (PLAN-044)

**Status:** Ativo — manter atualizado a cada tela/componente novo ou redesign

**Última atualização:** 05/08/2026

**Objetivo:** ser o **mapa único** de cobertura da identidade "Nexus". Evita o débito invisível que o redesign deixou (raiz A do ADR-005): o critério de "está redesenhado" é **todo elemento segue o DS**, não "a página tem PageHeader". Rastreia também itens legado/planejados — nada fica invisível.

> **Como manter:** a cada tela nova/alterada ou componente novo, atualizar as tabelas abaixo + rodar `npm run audit:ui` + `npm run audit:styles` + `npm run docs:audit`.

---

## 1. Padrões → componente canônico

| Padrão | Usar (canônico) | Nunca (legado) |
|---|---|---|
| Input / textarea | `Field` (`shared/components/Field`) | `rounded-md border px-3 py-2` cru |
| Select / date | `Field` ou select `min-h-12 rounded-xl border-border-strong` | `rounded-md` cru |
| Card / row | `Card.Root` ou `rounded-xl border border-border bg-card` | `rounded-md bg-surface`, `border-l-4` |
| Header de landing | `PageHeader` (título limpo + badge de ícone + eyebrow) | banner `bg-gradient-accent` |
| KPI | `KpiCard` | divs cruas |
| Skeleton | `bg-surface-hover` | `bg-secondary-light` |
| Badge | `StatusBadge` | spans crus |
| Ações rápidas | `QuickActions` (grade adaptativa) | grid fixo `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |
| Botão | `Button` / `ButtonLink` | `<button>` inline com estilo próprio |
| Modal | `Modal` base | overlay custom cru |

## 2. Telas (19) — status de cobertura

| # | Tela | Shell (PageHeader/layout) | Superfícies internas | Status |
|---|---|---|---|---|
| 1 | Central (`OperacoesDashboard`) | ✅ | KPIs, Ações rápidas, Pendentes (CobrancaCard compact), modais KPI, skeleton | ✅ Canônico |
| 2 | Rota (`RotaPage`) | ✅ | Card detail (tone), GPS badge, date promessa, comprovante modal | ✅ Canônico |
| 3 | Cobranças (`CobrancaListPage`) | ✅ | CobrancaList, banner atrasados (tokens) | ✅ Canônico |
| 4 | Atendidos (`AtendidosPage`) | ✅ | CobrancaList, rows de pagamentos | ✅ Canônico |
| 5 | Clientes (`ClienteList`) | ✅ | ClienteCard list-item, SearchBar | ✅ Canônico |
| 6 | Novo Cliente | ✅ | Field em todos os campos; GPS via Button | ✅ Canônico |
| 7 | Editar Cliente | ✅ | Field; skeleton | ✅ Canônico |
| 8 | Detalhe do Cliente | ✅ | ClienteInfo, card Contratos, SituaçãoFinanceira (KpiCard), QuickActions | ✅ Canônico *(reformulação visual planejada com o Lovable — PLAN-041/042)* |
| 9 | Contratos (`ContratoList`) | ✅ | ContratoCard, filtro dropdown | ✅ Canônico |
| 10 | Novo Contrato | ✅ | Field + select cliente custom | ✅ Canônico |
| 11 | Editar Contrato | ✅ | Field | ✅ Canônico |
| 12 | Detalhe do Contrato | ✅ | ParcelaList, pagamentos (Card), estorno, comprovante | ✅ Canônico |
| 13 | Caixa (`CaixaPage`) | ✅ | KpiCard, auditoria + movimentações (Card), ajuste (input canônico + Button) | ✅ Canônico |
| 14 | Gastos (`GastoPage`) | ✅ | GastoForm (Field) + GastoList (Card) | ✅ Canônico |
| 15 | Administração (`AdminPage`) | ✅ | Equipe/Operação (KpiCard), EquipeModal, OperadoresList | ✅ Canônico |
| 16 | Detalhe do Operador | ✅ | KpiCard, ajuste, auditoria (Card), contratos (Card) | ✅ Canônico |
| 17 | Empresas (`SuperAdminPage`) | ✅ | EmpresaList, EmpresaForm (Field), ModulosModal | ✅ Canônico |
| 18 | Perfil (`PerfilPage`) | ✅ | Field (senha) + Card | ✅ Canônico |
| 19 | Login | ✅ (redesenhado) | Field (email/senha + mostrar) | ✅ Canônico |

## 3. Componentes compartilhados

| Componente | Status | Consumidores |
|---|---|---|
| `PageHeader` | ✅ | 19 telas (`node scripts/consumers.mjs PageHeader`) |
| `Card` | ✅ | listas/cards/rows |
| `KpiCard` | ✅ | dashboards/relatórios |
| `Field` · `FieldSelect` · `FieldTextarea` | ✅ | forms/inputs/selects (16+; `node scripts/consumers.mjs Field`) |
| `Modal` | ✅ | modais (KPI, admin, estorno...) — assinatura Lovable + bottom-sheet (PLAN-047) |
| `Switch` | ✅ | ModulosModal (módulos) |
| `Tabs` | ✅ | AdminPage (equipe/meus dados), PreferenciasModal (modo) |
| `QuickActions` | ✅ | Central, ClienteDetail, Rota, cards |
| `Button` / `ButtonLink` | ✅ | global — variantes `primary/secondary/soft/outline/ghost/danger/success` + sizes `sm/md/lg/block` (PLAN-056) |
| `GpsControl` | ✅ | ClienteForm (comércio + residencial) — port Lovable, 3 estados (PLAN-056) |
| `PreferenciasModal` | ✅ | Topbar (engrenagem) — tema light/dark/system + paletas + idioma (PLAN-056) |
| `ClienteSelect` | ✅ | (futuro ContratoForm) — seletor de cliente buscável (PLAN-056) |
| `StatusBadge` (pill com dot) · `SectionHeader` · `EstadoTela` · `SuccessState` · `ErrorBanner` · `SearchBar` · `Carousel` · `Logo` · `Topbar` | ✅ | — |
| `Avatar` | ⏳ **Planejado** (PLAN-041, Lovable) | — |

## 4. Legado conhecido / planejado (rastreado)

| Item | Tipo | Plano | Status |
|---|---|---|---|
| Foto no `CobrancaCard` | variante futura | PLAN-041 | ⏳ planejado (nota no 041) |
| `Avatar` (foto \| iniciais) para usuário/operador/cliente | componente novo | PLAN-041 | ⏳ Lovable |
| Anexos do cliente (comprovante foto/PDF) | recurso novo | PLAN-042 | ⏳ Lovable |
| Padrão legado ativo | — | `npm run audit:ui` | ✅ **0 ocorrências** |

## 5. Gate de conclusão (tela/módulo novo ou redesign)

- [ ] Usa **apenas** componentes compartilhados (tabela 1)
- [ ] `npm run audit:ui` limpo (sem padrão legado)
- [ ] `npm run audit:styles` limpo (sem cor fixa da paleta)
- [ ] Tabela 2/3 deste inventário atualizada
- [ ] `npm run docs:audit` limpo (mapeamento/rotas coerentes)

## Referências

- `ADR-005` ("Por que o redesign deixou débito") · `02-DESIGN-SYSTEM.md` (DS v2) · `07-FORMS-INPUTS.md`
- `scripts/audit-ui.mjs` · `scripts/consumers.mjs` · `AGENTS.md`

---

## Como adicionar um módulo (whitelabel — PLAN-045)

Novo módulo de negócio (ex.: `agenda`, `vendas`) segue o **Module Manifest**:

1. **Backend** `src/modules/admin/domain/modules.ts`: entrada em `MODULE_MANIFEST` — `labelKey`, `surfaces`, `dados` (endpoints p/ `requireModule`), `widgets` (dono na Central), `capacidades`, `dependsOn`, `ucs`.
2. **Frontend** `frontend/src/shared/modules/modules.ts`: espelho (`id`, `dependsOn`, `icon`) + `MODULE_WIDGETS` (widgets que contribui à Central).
3. **Superfícies**: rotas em `App.tsx` com `RequireModule` + `requireModule` no backend (403) + navbar/sidebar (gated).
4. **Central composável**: os widgets entram automaticamente (composição por módulo ativo) — sem editar a lógica do dashboard.
5. **UCs/CTs**: criar em 06/07 com etiqueta de módulo + adicionar à matriz `08-UC-MODULOS.md`.
6. **Validação**: `npm run audit:modules` + `npm run audit:ui` + `npm run audit:styles` + `docs:audit` — gate do deploy.
