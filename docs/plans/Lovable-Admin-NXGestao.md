# NX Gestão — Painel Admin: identidade + UX (briefing para IA)

## 1. Contexto do produto

**NX Gestão** ("Nexus Gestão") — plataforma de gestão multi-negócio (whitelabel).
O frontend é **React + Tailwind v3**, mobile-first, identidade 100% dirigida por **CSS variables**.
Identidade visual "Nexus" (PLAN-038) já implementada: tokens OKLCH (`--color-*`, `--brand-*`,
gradientes `--gradient-page/brand/text`), fonte **Sora** nos títulos + Inter no corpo, sidebar
lateral (`AppLayout`), `PageHeader` limpo (ícone suave + data), `KpiCard` com barra de tom,
`Card` `rounded-xl bg-card`, modais via `Modal` base (`rounded-xl`).

**DS v2** (`docs/engineering/design/02-DESIGN-SYSTEM.md`) é a referência visual oficial.

## 2. Escopo — área administrativa

- **Painel Admin** (`AdminPage`) — usado por admin/sócio: KPIs de Equipe/Operação, lista de operadores, "Meus dados".
- **Super Admin** (`SuperAdminPage`) — gestão de **Empresas** (lista + criação) e **Módulos por empresa** (`ModulosModal`).
- **Forms**: `OperadorForm` (admin cria/edita operador/sócio) e `EmpresaForm` (super cria empresa + admin).
- **OperadorDetail** — detalhe do operador (já com `PageHeader`).

## 3. Estado atual (base — não partir do zero)

- **Já no padrão**: `PageHeader`, `KpiCard` (barra de tom + value-lg), `Card` (`rounded-xl bg-card`), `Modal` base, sidebar com seção "Administração" (Painel Admin + Empresas).
- **Despadronizado**: inputs dos forms (`OperadorForm`, `EmpresaForm`) ainda em `rounded-md border px-3 py-2` (estilo antigo) — o padrão canônico é o componente **`Field`** (`shared/components/Field/Field.tsx`: `rounded-xl min-h-12 border-strong` + label + erro).
- **ModulosModal**: lista de botões com texto "Ativo/Inativo/Dependência" (sem switch, sem hint visual de dependência claro).
- **AdminPage**: abas em pill antiga (`bg-primary text-white`), seções ok mas com margem de polimento.
- **EmpresaList**: cards funcionais, sem identidade (sem avatar/marca, sem indicar módulos ativos).

## 4. O que quero (prioridade)

1. **Forms do admin → `Field`**: `OperadorForm` e `EmpresaForm` migram os inputs para o componente `Field` (label + input `rounded-xl min-h-12 border-strong` + `focus:ring-primary` + erro). Manter selects (role/chefe) com o mesmo padrão visual.
2. **`ModulosModal` v2** (destaque):
   - Cada módulo vira uma linha com **switch (toggle)** no padrão do app (estilo `rounded-xl bg-card`, altura de toque confortável);
   - **Hint de dependência** claro (BR-092/093): se o módulo está off porque depende de outro, mostrar "Requer: contratos" + **bloquear o toggle** (estado desabilitado); módulos ativos com cor de destaque;
   - **Agrupamento** dos 7 módulos (`clientes, contratos, caixa, gastos, rota, cobrancas, atendidos`; `central` sempre ativo) em grupos lógicos (ex.: "Base", "Financeiro", "Cobrança em campo");
   - Fonte dos dados: `shared/modules/modules.ts` (`MODULES` com `dependsOn`).
3. **AdminPage polish**: abas em **pills da identidade** (`rounded-xl`, ativa em `bg-primary-light text-primary-text` ou gradiente brand), seções consistentes (`SectionHeader`), cards de equipe no padrão `Card`.
4. **EmpresaList**: card com **avatar/iniciais** da empresa + **badges** indicando módulos ativos (ou "Todos ativos").
5. **Futuro (documentar, não implementar)**: **branding por empresa** (nomeFantasia, corPrimária, logo — whitelabel, hook `--tenant-primary` já pronto no tema).

## 5. Padrões a seguir (obrigatórios)

- **Input**: componente `Field` (`shared/components/Field/Field.js`) — nunca input cru com estilo antigo.
- **Card**: `Card.Root` (`rounded-xl border bg-card`), com `tone` para destaque de estado.
- **KPI**: `KpiCard` (barra de tom + `value-lg` + hint).
- **Header de página**: `PageHeader` (ícone suave + título Sora + action/voltar).
- **Modal**: `Modal` base (`shared/components/Modal/Modal.js`) — não duplicar overlay/Escape/scroll.
- **Título de seção**: `SectionHeader`.
- **Badge**: `StatusBadge` (variants success/warning/danger/info/neutral).
- **Cores**: SEMPRE tokens (`bg-primary`, `text-danger-text`, `bg-card`, etc.) — nunca cores hardcoded da paleta (o `npm run audit:styles` falha se encontrar `bg-blue-500` etc.).
- **Foco de input**: `focus:ring-primary` / `focus:border-primary`.
- **i18n**: adicionar rótulos em pt-BR, en, es.
- **Módulos**: usar `shared/modules/modules.ts` (não duplicar a lista).

## 6. Entregáveis

- [ ] `OperadorForm` e `EmpresaForm` com `Field` (sem inputs antigos)
- [ ] `ModulosModal` v2 com switches + dependências visuais + agrupamento
- [ ] `AdminPage` com abas/pills da identidade
- [ ] `EmpresaList` com avatar + badges de módulos
- [ ] i18n (pt/en/es) completo
- [ ] `npm run build` ✅ · `npm run audit:styles` ✅ (sem cor fixa da paleta)

## 7. Restrições técnicas

- React + Tailwind **v3** (config em `frontend/tailwind.config.js`); mobile-first.
- Identidade por CSS variables — tokens em `frontend/src/index.css`.
- Não adicionar dependências de UI novas; usar os componentes compartilhados existentes.
- Preservar a lógica atual (API, escopos por papel admin/sócio/super_admin, BRs).
