# STATUS — Visão de relance

> **Regra:** atualizar a cada sessão de trabalho, junto com o `CHECKLIST` do dia (e o `UPDATES.md` quando houver entrega relevante). Fonte de verdade dos detalhes: planos e docs linkados.

**Última atualização:** 10/08/2026

---

## Em produção

| Item | Valor |
|---|---|
| URL oficial | `https://nxgest.com.br` (PLAN-068) · `nxgestao.duckdns.org` transitório (aposentar) |
| VPS | `172.245.152.223` · repo `/opt/nxgestao` · volume `nxgestao_nxgestao_data` |
| E-mail | Resend ativo (`no-reply@nxgest.com.br`) — fail-closed (503 se indisponível) |
| Deploy mais recente | 11/08 — lote ícone/logo v2 (LOGO sm + favicon.ico + SW PWA) + docs sync + ajuste caixa (commit `79c132b`) |
| CI | GitHub Actions (tsc · build · audits · test · docs:audit + smoke isolado) |

## Entregas recentes

- **Ícone/logo v2 (10-11/08)** — favicon/PNGs/PWA com a **LOGO** (variante `sm`: N + malha + hub) · `favicon.ico` · `favicon.ts` com seletor correto + cores `rgb()` · **service worker mínimo** (`sw.js`, **só em produção** via `import.meta.env.PROD` + cache v2) → PWA instalável no Android · manifest com `id`. **Ajuste de Caixa Base** no layout do `FecharCaixaModal` (KpiCard) · **`PreviewAoVivo` removido do config**. ✅ **Deployado em prod (11/08)** — health ok, favicon/PNGs/sw.js 200, SW v2 ativo. **Pendente:** validação manual da tela inicial (Android/iOS/desktop).
- **Fix anexos (11/08, sem deploy ainda)** — imagem (`toBlob` elimina `fetch(dataUrl)` bloqueado pela CSP) · PDF mobile (botão "Baixar PDF"; desktop mantém iframe). **Pendente:** deploy.
- **Pendentes do dia + performance (11/08, sem deploy ainda)** — contadores dos chips (Todos/Vence hoje/Atrasado) corrigidos · **8 índices por `userId`** (P028) eliminam table scan do isolamento multi-tenant. **Follow-up:** reescrita da query de cobranças (ROADMAP 5.10 / BACKLOG P028). **Pendente:** deploy.

## Planos em aberto

| Plano | Status | Próximo passo |
|---|---|---|
| PLAN-069 (polimento UI) | 🔵 Parte 1 ✅ (08/08) | **Parte 2 — Admin** (filtro por papel `SegmentedControl` · "Recebido hoje" em destaque · "Meus dados" → Perfil) |
| PLAN-067 (testes) | 🔵 F0+F1 parcial+F3-P022+CI (08/08) | F1 restante (financeiro/admin/operações) · F2 (AuthContext/ThemeProvider/api-client) · F3 telas críticas · coverage no CI |
| PLAN-066 (segurança) | 🔵 P0 ✅ · P1 parcial · P2 ⏳ | P1: timeouts Caddy (T-08) + **executar firewalld/fail2ban no VPS** · P2: JWT curto/revogação, Cloudflare WAF, 2FA, senha mín. 8 |

## Pendências de produção (verificação manual)

- [ ] CT-ANX-02 — upload de anexo **imagem** e abrir no modal (render confirmado)
- [ ] CT-ROT-02 — rota concluída/parcial: contadores e empty state
- [ ] CT-PWA-01 — reinstalar o app instalado e conferir ícone/nome/theme
- [ ] CT-GEO-01/02 — capturar localização → campos preenchem + navegar disponível
- [ ] Aposentar `nxgestao.duckdns.org` após confirmação total (Caddyfile)
- [ ] Cloudflare SSL Full (strict) — recomendado (site já funcionando)

## Backlog (próximos)

| Item | Onde |
|---|---|
| P017 — Mensagens inteligentes do WhatsApp (sem plano ainda) | `docs/plans/BACKLOG.md` |
| P021 — Pagamento a mais que o total (decisão de produto) | `docs/plans/BACKLOG.md` |
| P023 — Validação manual fim de fluxo / empty states (T2) | `docs/plans/BACKLOG.md` |
| P022 → PLAN-067 (em execução) | `docs/plans/PLAN-067-testes.md` |

## Métricas de saúde

- **Testes:** 78 verdes (18 arquivos) · smoke API **248/248** · `docs:audit` 0 divergências (62 rotas = 62 telas)
- **Docs:** 73 arquivos de plano · 6 ADRs · 5 templates · skills SKILL-001..009
