# CHECKLIST — Ajuste de KPIs do painel admin + idioma na engrenagem (PLAN-022)

**Status:** Concluído

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Plano:** plans/PLAN-022-admin-kpis-ajuste.md

---

## Objetivo

Corrigir os pontos identificados na validação do PLAN-021 em produção: "Contratos Ativos" contava contratos não-deletados ignorando `estado` (após quitação total o estado vira `Finalizado`), "Resultado do Dia" mostrava valor negativo bruto (`-470.00`), e o escopo do painel (nome da empresa) não deixava claro o nível. Também move o idioma da barra para dentro da engrenagem (completando o item 5 do PLAN-021).

---

## Fase 1 — Backend: contratos ativos por estado

- [x] `admin.repository.impl.ts`: `eq(contratos.estado, "Ativo")` em `findAllOperadores`, `findById`, `findByEmail`, `getDashboardStats`
- [x] `empresa.repository.impl.ts`: idem em `findAll` e `findById`
- [x] `npx tsc --noEmit` verde (backend)

## Fase 2 — KpiCard: tooltip e subtitle

- [x] Props `tooltip?: string` (atributo `title` nativo) e `subtitle?: ReactNode` (linha discreta sob o valor)

## Fase 3 — AdminPage: header de nível, tooltip e legenda de escopo

- [x] `tituloHeader`: admin self → `user.nome`; super admin → `empresa?.nome`
- [x] Badge de nível: `admin.roleAdmin` (self) ou `admin.roleSuperAdmin` (super)
- [x] Resultado do Dia: `formatCurrency(Math.abs(...))` + cor verde/vermelha + `tooltip`
- [x] KPIs de Operação com `subtitle` "de {nome}" (escopo)

## Fase 4 — Navbar: idioma na engrenagem

- [x] `langRef`/Globe removidos da barra
- [x] Grupo Idioma (PT/EN/ES) dentro do dropdown da engrenagem

## Fase 5 — i18n

- [x] `nav.idioma`, `admin.resultadoDiaTooltip`, `admin.de` nas 3 línguas (JSON válidos)

## Fase 6 — Documentação

- [x] `docs/plans/PLAN-022-admin-kpis-ajuste.md` criado
- [x] `docs/engineering/02-API.md` (nota `estado='Ativo'` + BR-085)
- [x] `docs/engineering/05-MAPEAMENTO-TELAS.md`
- [x] `docs/product/02-BUSINESS-RULES.md` (BR-085)
- [x] `docs/plans/README.md` (entrada PLAN-022)
- [x] `docs/README.md` (aponta para `docs/plans/README.md` — sem entrada individual)

## Fase 7 — Validação e deploy

- [x] `npm run build` (backend tsc + frontend vite)
- [x] Teste de filtro em DB temporário: contrato `Finalizado` não conta, `Ativo` conta (dashboard/operador/empresa = 1)
- [x] Deploy no VPS (`scripts/deploy.sh`) + health check — OK (`/api/health` → `{"status":"ok","db":"connected"}`)

---

## Resultados de verificação

- `npx tsc --noEmit` → OK (backend e frontend)
- JSON i18n válidos nas 3 línguas
- `npm run build` → OK
- Filtro de estado validado em DB temporário (contrato `Finalizado` excluído das 3 contagens)
- Deploy no VPS OK: `git pull` + `./scripts/deploy.sh` (app recreated), health `{"status":"ok","db":"connected"}`, SPA servindo o novo bundle

---

## Notas

- `"Cancelado"` existe no tipo `EstadoContrato` mas nenhum fluxo o produz ainda — quando existir cancelamento, o filtro já estará correto (pendência registrada no plano).
