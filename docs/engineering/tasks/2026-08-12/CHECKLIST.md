# CHECKLIST — Validações manuais em produção + fix do teclado (12/08)

**Data:** 12/08/2026

**Planos/refs:** `docs/STATUS.md` · `docs/qa/09-CHECKLISTS.md` · `docs/product/06-CASOS-DE-USO.md` (UC-002/UC-080) · commit `7d6060e` (fix teclado)

> Dia de validação manual em produção (`https://nxgest.com.br`) dos CTs pendentes + correção do teclado na edição de endereço + consolidação do caixa operacional (ajuste em modal · remoção do "Fechar caixa" da Central). Resultado: pendências de QA zeradas; restam apenas itens futuros (planos, ajuste de painel).

## Entregue

- [x] **Caixa: DRY + seções colapsáveis + movimentações sem truncate (12/08, local — aguardando commit)** — componentes reutilizáveis: `CaixaKpis` (6 KPIs com `kpis[]`/`onKpiClick?`), `AjusteHistorico`+`AjusteRow`, `MovimentacoesList`+`MovimentacaoRow` (2 blocos, sem truncate), `CollapsibleSection` (shared, colapsada, count, limit 8 + "Ver mais") · aplicado em CaixaPage (Movimentações+Histórico colapsáveis, KPIs via componente) e OperadorDetail (KPIs via componente, Histórico colapsável) · i18n `verMais`/`verMenos` · validação local (tsc/build/91 testes/audits/docs:audit).
- [x] **Cliente: lucro realizado (12/08, local — aguardando commit)** — backend `lucroRealizado` (Σ `valorFinal−valorBase` dos `Finalizado`) via helper `sumLucroPorEstado` reutilizado (previsto `'Ativo'` · realizado `'Finalizado'`) · frontend KPI "Lucro realizado" (`sm:grid-cols-3`) + interface `Cliente` + i18n 3 idiomas · BR-098 · UC-071 · API-CT-106 · smoke `CLI-011` · validação local (tsc/build/91 testes/audits/docs:audit).
- [x] **Caixa: título do ajuste contextual + label do motivo + reordenação (12/08, local — aguardando commit)** — `AjustarCaixaModal` ganhou prop `title` (próprio: "Ajustar Caixa Total" · operador: "Ajustar caixa base do operador", chave `admin.ajustarTituloOperador` 3 idiomas) · label do motivo corrigido (`caixa.motivo` → `caixa.motivoPlaceholder` = "Motivo do ajuste") · `OperadorDetail` reordenado (Dados → Caixa → Clientes → Contratos → Ajuste → Histórico) · `CaixaPage` reordenada (KPIs → Registrar Gasto → Movimentações → Ajustar → Histórico).
- [x] **Página do administrador — refinamento de identidade visual (12/08, local — aguardando commit)** — título de seção "Ajuste de caixa" (`admin.ajusteCaixaSecao`) sem repetir o texto do botão · histórico de ajustes **unificado** (CaixaPage + OperadorDetail) com valor em destaque `value-lg` + autor ("por **Nome**") em bold + motivo · cards Contratos/Clientes migrados para o **padrão canônico** (`Card.Root list-item` + `Card.Indicators` + `Card.Actions` "Acessar" com seta) · CTs UC-028/028b atualizados.
- [x] **Página do administrador — hierarquia + histórico 2 colunas + contadores (12/08, local — aguardando commit)** — motivo do ajuste **máx 100** (form+backend+i18n) · histórico de ajustes em **2 colunas** (valor/"por Nome"/motivo à esquerda, data à direita — alinhamento consistente) · botão de ajuste separado dos KPIs (seção própria, acesso por modal) · **contratos/clientes do operador** viram **card com contador + botão "Ver" → lista** escopada (`?usuarioId=`) · `ContratoList`/`ClienteList` leem `?usuarioId=` (header indica visão do operador; sem "Novo cliente" nessa visão) · **CTs** documentados no `06-CASOS-DE-USO.md` (UC-025/026/028/028b + hierarquia admin/sócio/super).
- [x] **Ajuste de caixa unificado em modal (12/08, local — aguardando commit)** — `OperadorDetail` abre o **mesmo `AjustarCaixaModal`** da CaixaPage (form único `AjusteCaixaForm`); `AjusteCaixaCard` (inline) **removido**. Antes: 1 modal (CaixaPage) + 1 inline (OperadorDetail).
- [x] **"Fechar caixa" removido da Central (12/08, local)** — `FecharCaixaModal` **removido** (repetia os KPIs da Central e só navegava → `/caixa`, sem gerar dado). Fechamento real (semana, `fechamentos_semanais`) exclusivo da CaixaPage ("Liquidar"). QuickAction limpa.
- [x] **Botões gatilho padronizados (CaixaPage)** — "Ajustar Caixa Total" `soft` → `primary` (paridade com "Registrar Gasto").

- [x] **Fix teclado na edição de endereço** — `ClienteForm.tsx`: `EnderecoFields` + `blocoComercio` movidos para o **nível de módulo** + `memo` (referência estável → React não remonta os inputs → foco/teclado preservados). Regra de descarte de coords (PLAN-055) intacta. **Prova:** teste `ClienteForm.test.tsx` falha em `toHaveFocus()` sem o fix; passa com o fix.
- [x] **Teste de regressão** — `ClienteForm.test.tsx` (2 testes): editar logradouro com localização salva → coords descartadas + foco mantido; editar comércio sem coords → foco mantido.
- [x] **CT no UC-080** — conferência "teclado do celular permanece aberto" + citação do teste de regressão.

## Validações manuais concluídas em produção (12/08)

- [x] **CT-GEO-01/02** — capturar localização (GPS) preenche endereço + "Navegar" disponível
- [x] **UC-080 edição** — editar endereço com localização descarta coords + **teclado permanece aberto**
- [x] **CT-PWA-01** — ícone/nome/theme do app instalado
- [x] **CT-ANX-02** — anexo imagem (upload + abrir no modal) e **PDF** (mobile/desktop)
- [x] **CT-ROT-02** — rota + contadores (Todos/Vence hoje/Atrasado)

## Validação (rodar antes de finalizar)

- [x] `npx tsc --noEmit` limpo (raiz + frontend)
- [x] `npm run build` verde
- [x] `npm test` verde (**80 testes** — 78 + 2 de regressão)
- [x] `npm run audit:ui` · `audit:styles` · `audit:modules` · `docs:audit` verdes
- [x] **Prova do teste:** sem o fix, `ClienteForm.test.tsx` falha em `toHaveFocus()`; com o fix, passa
- [x] **Pipeline** — CI (test + smoke + deploy-staging) verde · CD (validate + deploy-prod) verde · prod no commit `7d6060e`

## Tarefas futuras (não executadas — registradas no STATUS/BACKLOG)

- [ ] Cloudflare SSL Full (strict) — ajuste de painel recomendado
- [ ] E-mail no staging — `MAIL_PROVIDER=console` (manter por ora; decidir depois)
- [ ] PLAN-070 (postgres) · PLAN-069 parte 2 · PLAN-067 F1/F2/F3 · PLAN-066 P1/P2
- [ ] Vulns dev-only (`vite`/`vitest`) — major bump, monitorar

## Observações

- A correção do teclado foi validada em produção (12/08): editar o endereço descarta a localização como sempre, mas o teclado permanece aberto.
- Nenhum backend/banco/API foi alterado — a correção é 100% frontend + teste + documentação.
