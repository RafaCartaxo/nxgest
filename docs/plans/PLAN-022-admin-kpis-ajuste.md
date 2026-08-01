# PLAN-022 — Painel admin: ajuste de KPIs (contratos ativos por estado, tooltip do Resultado do Dia, escopo de nível) e idioma na engrenagem

**Status:** Concluído

**Versão:** 1.0

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Dependências:**
- PLAN-021 (Painel admin: contexto de empresa, KPIs por seção, engrenagem na navbar)

---

## Objetivo

Corrigir três pontos identificados na validação do PLAN-021 em produção (empresa "Desenvolvimento", dashboard com `-470`) e completar o item da engrenagem que ficou pela metade:

1. **"Contratos Ativos" conta contratos não-deletados, ignorando `estado`**: o KPI mostrava o contrato como ativo mesmo depois de quitação total (estado vira `Finalizado`). Corrigir o filtro para `estado = 'Ativo'`.
2. **"Resultado do Dia" mostrava valor negativo bruto (`-470.00`)**: replicar o comportamento da Central de Operações — valor em módulo (`R$ 470,00`) com cor verde/vermelha (`text-success-text`/`text-danger-text`) e tooltip nativo explicando a composição (entradas − saídas de hoje).
3. **Escopo do painel pouco claro**: o nome no topo era o da empresa. Agora o header indica o **nível** — admin logado vê o próprio nome + badge `Administrador`; super admin vendo `/admin/empresas/:id` vê o nome da empresa + badge `Super Admin`. Os KPIs da seção Operação ganham legenda discreta "de {nome}" (escopo).
4. **Idioma sai da navbar e entra na engrenagem**: completar o item 5 do PLAN-021 — o seletor de idioma (que ficou solto na barra) vira um grupo dentro do dropdown da engrenagem.

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Filtro de contratos ativos | `contratos.estado = 'Ativo'` | Estado nasce `Ativo`, vira `Finalizado` na quitação total (`CreatePagamentoUseCase`); `Cancelado` existe no tipo mas ainda não é produzido |
| Resultado do Dia | `formatCurrency(Math.abs(resultado))` + `valueClassName` verde/vermelho + tooltip nativo | Mesmo comportamento visual da Central (`IndicadoresCards`), com explicação da composição |
| Header do painel | Admin self → nome do usuário + badge `Administrador`; super admin → nome da empresa + badge `Super Admin` | Indica o nível/escopo de quem está vendo |
| Legenda de escopo | `subtitle` "de {nome}" nos 3 KPIs de Operação | Deixa claro que os números agregam a empresa/usuário em contexto |
| KpiCard | Props novas `tooltip?: string` (atributo `title`) e `subtitle?: ReactNode` | Reutilizável, padrão `title` nativo já usado em Navbar/QuickActions |
| Idioma | Grupo "Idioma" (PT/EN/ES) dentro da engrenagem, entre tema e sair | Configurações num só lugar; remove o Globe solto da barra |

---

## Fases de implementação

```
Fase 1 (backend filtro) → Fase 2 (KpiCard) → Fase 3 (AdminPage) → Fase 4 (Navbar) → Fase 5 (i18n) → Fase 6 (docs)
```

### Fase 1 — Backend: contratos ativos por estado

**Arquivos:** 2 alterados

- `src/modules/admin/infrastructure/repositories/admin.repository.impl.ts`: adicionar `eq(contratos.estado, "Ativo")` na contagem de contratos de `findAllOperadores`, `findById`, `findByEmail` e `getDashboardStats`.
- `src/modules/admin/infrastructure/repositories/empresa.repository.impl.ts`: idem em `findAll` e `findById` (`EmpresaComStats.contratosAtivos`).

**Checklist Fase 1**

- [x] `admin.repository.impl.ts` — 4 contagens filtradas por `estado = 'Ativo'`
- [x] `empresa.repository.impl.ts` — 2 contagens filtradas por `estado = 'Ativo'`
- [x] `npx tsc --noEmit` verde (backend)

---

### Fase 2 — KpiCard: tooltip e subtitle

**Arquivo:** 1 alterado

- `frontend/src/shared/components/KpiCard/KpiCard.tsx`: props `tooltip?: string` (atributo nativo `title` no Wrapper) e `subtitle?: ReactNode` (linha `text-xs text-text-muted` sob o valor). Compatível com Wrapper `button`/`div`.

**Checklist Fase 2**

- [x] Props `tooltip` e `subtitle` no KpiCard

---

### Fase 3 — AdminPage: header de nível, tooltip e legenda de escopo

**Arquivo:** 1 alterado

- `frontend/src/modules/admin/pages/AdminPage.tsx`:
  - `tituloHeader` = admin self → `user.nome`; super admin → `empresa?.nome`.
  - `headerBadge` = `admin.roleAdmin` (admin self) ou `admin.roleSuperAdmin` (super).
  - `escopoNome` (legenda) = mesmo critério do `tituloHeader`.
  - KPI Resultado do Dia: `formatCurrency(Math.abs(...))` + `valueClassName` verde/vermelho + `tooltip={t("admin.resultadoDiaTooltip")}`.
  - KPIs de Operação com `subtitle={t("admin.de", { nome: escopoNome })}`.
  - Import de `formatCurrency` de `masks.js`.

**Checklist Fase 3**

- [x] Header por nível (usuário/empresa + badge de role)
- [x] Resultado do Dia em módulo + cor + tooltip
- [x] Legenda "de {nome}" nos KPIs de Operação

---

### Fase 4 — Navbar: idioma na engrenagem

**Arquivo:** 1 alterado

- `frontend/src/shared/components/Navbar.tsx`: remover `langRef`/`langOpen`/Globe solto da barra; adicionar grupo **Idioma** (PT/EN/ES) no dropdown da engrenagem (divisória + label `nav.idioma` + botões PT/EN/ES com destaque da língua ativa).

**Checklist Fase 4**

- [x] Globe removido da barra
- [x] Grupo Idioma dentro da engrenagem

---

### Fase 5 — i18n

**Arquivos:** 3 alterados (`frontend/src/i18n/locales/{pt-BR,en,es}.json`)

- `nav.idioma`: Idioma / Language / Idioma
- `admin.resultadoDiaTooltip`: "Entradas − saídas de hoje" / "Income − expenses today" / "Entradas − salidas de hoy"
- `admin.de`: "de {{nome}}" / "of {{nome}}" / "de {{nome}}"

Badges reutilizam `admin.roleAdmin`/`admin.roleSuperAdmin` (já existentes).

**Checklist Fase 5**

- [x] JSON válidos nas 3 línguas (parse ok)
- [x] `npx tsc --noEmit` verde (frontend)

---

### Fase 6 — Documentação

- [x] `docs/plans/PLAN-022-admin-kpis-ajuste.md` — este plano
- [x] `docs/engineering/02-API.md`: nota sobre contagem de contratos ativos (`estado = 'Ativo'`)
- [x] `docs/engineering/05-MAPEAMENTO-TELAS.md`: navbar (idioma na engrenagem), AdminPage (header de nível, tooltip, legenda)
- [x] `docs/product/02-BUSINESS-RULES.md`: BR-085 (contrato ativo por estado)
- [x] `docs/README.md`/`docs/plans/README.md`: entrada PLAN-022
- [x] `docs/engineering/tasks/2026-08-01/CHECKLIST.md`: registro do dia

---

## Regras de negócio (novas/alterações propostas)

- **BR-085 (NOVA)** — Um contrato só conta como "ativo" (KPIs do painel admin/empresa) quando `estado = 'Ativo'`. Contratos `Finalizado` (quitação total) ou `Cancelado` não entram na contagem. O filtro usa o campo `estado` da tabela `contratos`, não apenas `deletedAt IS NULL`.

---

## Resultados de validação

- `npx tsc --noEmit` → OK (backend e frontend). JSON i18n válidos nas 3 línguas.
- `npm run build` → OK (backend tsc + frontend vite).
- Teste de filtro em DB temporário (`DB_PATH=/tmp/...`, `tsx`): empresa com 1 contrato `Ativo` + 1 `Finalizado` → `getDashboardStats`/`findAllOperadores`/`EmpresaRepository.findById` retornam `contratosAtivos = 1`. **Confirmado: `Finalizado` não conta, `Ativo` conta.**
- Deploy no VPS + health check → pendente de execução nesta sessão.

---

## Referências

- `src/modules/admin/infrastructure/repositories/{admin,empresa}.repository.impl.ts`
- `src/modules/pagamento/application/use-cases/CreatePagamento/CreatePagamentoUseCase.ts` (transição `Ativo` → `Finalizado`)
- `frontend/src/shared/components/{KpiCard,Navbar}.tsx`
- `frontend/src/modules/admin/pages/AdminPage.tsx`
- `frontend/src/modules/operacoes/components/IndicadoresCards.tsx` (padrão visual da Central)
- `docs/plans/PLAN-021-admin-contexto-kpis.md`
