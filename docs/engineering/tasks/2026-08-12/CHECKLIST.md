# CHECKLIST — Validações manuais em produção + fix do teclado (12/08)

**Data:** 12/08/2026

**Planos/refs:** `docs/STATUS.md` · `docs/qa/09-CHECKLISTS.md` · `docs/product/06-CASOS-DE-USO.md` (UC-002/UC-080) · commit `7d6060e` (fix teclado)

> Dia de validação manual em produção (`https://nxgest.com.br`) dos CTs pendentes + correção do teclado na edição de endereço. Resultado: pendências de QA zeradas; restam apenas itens futuros (planos, ajuste de painel).

## Entregue

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
