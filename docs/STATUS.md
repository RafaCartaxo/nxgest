# STATUS — Visão de relance

> **Regra:** atualizar a cada sessão de trabalho, junto com o `CHECKLIST` do dia (e o `UPDATES.md` quando houver entrega relevante). Fonte de verdade dos detalhes: planos e docs linkados.

**Última atualização:** 12/08/2026

---

## Em produção

| Item | Valor |
|---|---|
| URL produção | `https://nxgest.com.br` (PLAN-068) |
| URL homologação | `https://nxgestao.duckdns.org` (**staging**, desde 11/08 — ex-transitório de prod, agora QA) |
| VPS | `172.245.152.223` · repo `/opt/nxgestao` · vol prod `nxgestao_nxgestao_data` · vol staging `nxgestao_nxgestao_staging_data` |
| E-mail | Resend ativo (`no-reply@nxgest.com.br`) — fail-closed (503 se indisponível) |
| Deploy mais recente | **Automático via pipeline** — último commit da `main` (prod após staging saudável) |
| CI/CD | **CI** (`.github/workflows/ci.yml`): tsc · build · audits · test (78) · coverage · docs:audit + smoke isolado (250) + **deploy-staging** · **CD** (`.github/workflows/cd.yml`): validate (CI verde + staging) → **deploy-prod** automático/manual |

## Entregas recentes

- **Pacote QA + fonte de estudo (11/08)** — `docs/qa/` com 10 documentos: visão geral, arquitetura, engenharia, testes, pipeline (CI/CD), operação, segurança, glossário e checklists + trilha de estudo recomendada. Linkado no `INDEX.md`/`docs/README.md`/`engineering/README.md`.
- **Pipeline CI/CD completo (11/08, green)** — CI corrigido (16 runs vermelhas → verde): frontend virou **npm workspace** (node_modules unificada, fix da dupla cópia de React) · `scripts/create-schema.mjs` (smoke sem duplo-boot, fim do `EADDRINUSE`) · `JWT_SECRET`/rate limits no runner. **Staging** de homologação no duckdns (compose/DB/Caddyfile próprios + seed fake) com **deploy automático** no merge à main. **CD** para produção com gate de promoção (**prod só passa se staging passou**) — automático via `workflow_run` + manual (`workflow_dispatch` com `ref` p/ rollback), environment `production`, health pós-deploy. **Secrets:** `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY`. **Deps:** dependabot (npm+actions) · react-router 7.18.2 (fix GHSA-337j/CVE-2025-68470; runtime prod 0 vulns).
- **Fix anexos (11/08)** — imagem (`toBlob` elimina `fetch(dataUrl)` bloqueado pela CSP) · PDF mobile (botão "Baixar PDF"; desktop mantém iframe).
- **Pendentes do dia + performance (11/08)** — contadores dos chips (Todos/Vence hoje/Atrasado) corrigidos · **8 índices por `userId`** (P028) eliminam table scan do isolamento multi-tenant. **Follow-up:** reescrita da query de cobranças (ROADMAP 5.10 / BACKLOG P028).
- **Ícone/logo v2 (10-11/08)** — favicon/PNGs/PWA com a **LOGO** (variante `sm`) · `sw.js` (só em produção) → PWA instalável no Android · manifest com `id`. **Ajuste de Caixa Base** no `FecharCaixaModal`. **Pendente:** validação manual da tela inicial (Android/iOS/desktop).

## Planos em aberto

| Plano | Status | Próximo passo |
|---|---|---|
| PLAN-070 (postgres) | ⏳ Planejado (pronto p/ execução — pré-requisito CI/docker na main) | Fase A — baseline (dump de prod + medições) |
| PLAN-069 (polimento UI) | 🔵 Parte 1 ✅ (08/08) | **Parte 2 — Admin** (filtro por papel `SegmentedControl` · "Recebido hoje" em destaque · "Meus dados" → Perfil) |
| PLAN-067 (testes) | 🔵 F0+F1 parcial+F3-P022+CI (08/08) | F1 restante (financeiro/admin/operações) · F2 (AuthContext/ThemeProvider/api-client) · F3 telas críticas |
| PLAN-066 (segurança) | 🔵 P0 ✅ · P1 parcial · P2 ⏳ | P1: timeouts Caddy (T-08) + **executar firewalld/fail2ban no VPS** · P2: JWT curto/revogação, Cloudflare WAF, 2FA, senha mín. 8 |

## Pendências de produção (verificação manual)

- [ ] CT-ANX-02 — upload de anexo **imagem** e abrir no modal (render confirmado)
- [ ] CT-ROT-02 — rota concluída/parcial: contadores e empty state
- [ ] CT-PWA-01 — reinstalar o app instalado e conferir ícone/nome/theme
- [ ] CT-GEO-01/02 — capturar localização → campos preenchem + navegar disponível
- [ ] Cloudflare SSL Full (strict) — recomendado (site já funcionando)
- [ ] Validação manual no staging (`nxgestao.duckdns.org`, seed `teste123!`) — QA pré-produção

## Backlog (próximos)

| Item | Onde |
|---|---|
| P017 — Mensagens inteligentes do WhatsApp (sem plano ainda) | `docs/plans/BACKLOG.md` |
| P021 — Pagamento a mais que o total (decisão de produto) | `docs/plans/BACKLOG.md` |
| P023 — Validação manual fim de fluxo / empty states (T2) | `docs/plans/BACKLOG.md` |
| P028 — Reescrita da query de cobranças (perf) | `docs/plans/BACKLOG.md` |
| P022 → PLAN-067 (em execução) | `docs/plans/PLAN-067-testes.md` |

## Métricas de saúde

- **Testes:** 78 verdes (18 arquivos) · smoke API **250/250** · `docs:audit` 0 divergências (62 rotas = 62 telas)
- **Pipeline:** CI verde no push/PR · staging automático no merge à main · CD prod com gate de promoção (staging saudável)
- **QA:** pacote `docs/qa/` (visão geral, arquitetura, engenharia, testes, pipeline, operação, segurança, glossário, checklists + trilha de estudo)
- **Docs:** planos (incl. PLAN-070) · 6 ADRs · 5 templates · skills SKILL-001..009
