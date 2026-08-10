# CHECKLIST — Sincronização de documentação + organização (10/08)

**Data:** 10/08/2026

**Planos/refs:** `docs/STATUS.md` · `docs/templates/CHECKLIST.template.md` · `docs/plans/README.md` · `docs/product/04-ROADMAP.md`

> Rodada de organização do acervo de docs após o handoff de 09/08: corrigir gaps de sincronização (paths de infra desatualizados, índices órfãos, planos fora do índice), alinhar o padrão ao QA Workspace e adicionar 3 melhorias de rotina. Sem mudança de código.

## Entregue

- [x] **Infra paths** — `AGENTS.md` · `06-PRODUCAO.md` · `.opencode/agents/{ops-runner,docs-sync}.md` · `ADR-004` · `PLAN-018` · `PLAN-068`: `/opt/nxgest` → `/opt/nxgestao`, `~/.config/nxgest/` → `~/.config/nxgestao/`, volume `nxgest_nxgest_data` → `nxgestao_nxgestao_data`, ops-runner URL → `nxgest.com.br` (realidade confirmada no VPS: `/opt/nxgestao` + volumes `nxgestao_*`)
- [x] **Índices/READMEs** — `INDEX.md` (+TESTES/SEGURANCA/07-FORMS-INPUTS/UI-COVERAGE/STATUS) · `product/README` (BR-106, roadmap v2.7, +06/07/08, PRD aprovado) · `engineering/README` (+07/TESTES/SEGURANCA/UI-COVERAGE) · `ADR-INDEX` + `foundation/README` (ADR-004/005/006 órfãs) · `tasks/README` (histórico 03→08/08; 02/07 em andamento → concluído) · `templates/README.md` criado (referenciado mas inexistente)
- [x] **Planos** — `plans/README.md` reestruturado (tabela principal + seção "Backlog e briefings auxiliares"); briefs Lovable históricos marcados (Admin→040, Avatar→041, Anexos→042, Cadastro-Rota→055/056/062, NXGest→superseded, Stitch-Nav→060); **rename `Lovable-Icone-Marca-NXGestao.md` → `NXGest`**; **duplicata `PLAN-005-padronização-cliente-card.md` → `arquivo/…-HISTORICO.md`**; `BACKLOG.md` (removida menção obsoleta "npm test exit 1")
- [x] **ROADMAP** — 5.5/5.8 "91 cenários" → 248/248 + 78 testes/CI; 5.6 "Planejado" → Concluído (PLAN-055/056); 5.4 PWA parcial (manifest/ícones 08/08); "entregue além do roadmap" + PLAN-066/068/069; marcos M8/M9
- [x] **B1 — `templates/CHECKLIST.template.md`** — estrutura fixa (Entregue → Validação → Pendências → Observações) + catálogo de status
- [x] **B2 — `docs/STATUS.md`** — hub de relance (prod, planos em aberto, pendências de prod, backlog, métricas); linkado no `INDEX.md` e `docs/README.md`
- [x] **B3 — catálogo de emojis/status** — ✅/🔵/⏳/🚨/❌/🐛/🔁 no template CHECKLIST + nota no `AGENTS.md`
- [x] **Ícone/marca portado (PLAN Lovable-Icone-Marca)** — geometria nova do protótipo (`f5a8156`): `Logo.tsx` (viewBox 64×64, "N" primário + malha + hub, nova prop `boxed`, title "NX Gest") · `favicon.ts` (theme-aware full-bleed sem `rx` — resolve cantos transparentes) · `favicon.svg` (full-bleed, cores literais default) · PNGs PWA regenerados (icon-192/512, maskable c/ safe-zone, apple-touch 180) via ImageMagick. Consumidores intactos (API `Logo`/`LogoLockup` mantida)

## Validação

- [x] `npm run docs:audit` — 0 divergências (62 rotas = 62 endpoints = 62 telas)
- [x] Revisão do `git diff` (paths, renames, links) — sem segredos, sem mudança de código
- [x] **Ícone**: `tsc` · `build` · `audit:ui/styles/modules` · `npm test` (78/78) · `docs:audit` verdes · PNGs full-bleed validados (cantos = fundo, maskable com safe-zone)

## Pendências

- [ ] PLAN-069 parte 2 (Admin) — filtro por papel `SegmentedControl` · "Recebido hoje" em destaque · "Meus dados" → Perfil real
- [ ] PLAN-066 P1 restante: timeouts no Caddy (T-08) + executar firewalld/fail2ban no VPS
- [ ] PLAN-066 P2: JWT curto/revogação · Cloudflare WAF · 2FA · senha mín. 8
- [ ] PLAN-067 F1/F2/F3 restantes + threshold de coverage no CI
- [ ] CTs manuais pós-deploy (ANX-02 · ROT-02 · PWA-01 · GEO-01/02) — ver `docs/STATUS.md`
- [ ] Conferência visual do ícone novo (favicon 16/32px no navegador · login/sidebar · PWA instalado) — preferencialmente no preview

## Observações

- Realidade do VPS confirmada por SSH: repo `/opt/nxgestao`, volumes `nxgestao_caddy_*`/`nxgestao_nxgestao_data` — as docs antigas apontavam `/opt/nxgest`.
- Referências a `nxgestao.duckdns.org`/`/opt/nxgest` em docs **históricas** (PLAN-018, tasks 31/07, UPDATES) foram mantidas como registro da época, com nota de migração no PLAN-018.
