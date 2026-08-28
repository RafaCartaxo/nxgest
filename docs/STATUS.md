# STATUS — Visão de relance

> **Regra:** atualizar a cada sessão de trabalho, junto com o `CHECKLIST` do dia (e o `UPDATES.md` quando houver entrega relevante). Fonte de verdade dos detalhes: planos e docs linkados.

**Última atualização:** 28/08/2026

---

## Em produção

| Item | Valor |
|---|---|
| URL produção | `https://nxgest.com.br` (PLAN-068) |
| URL homologação | `https://nxgestao.duckdns.org` (**staging**, desde 11/08 — ex-transitório de prod, agora QA) |
| VPS | `172.245.152.223` · repo `/opt/nxgestao` · vol prod `nxgestao_nxgestao_data` · vol staging `nxgestao_nxgestao_staging_data` |
| E-mail | Resend ativo (`no-reply@nxgest.com.br`) — fail-closed (503 se indisponível) |
| Deploy mais recente | **Automático via pipeline** — último commit da `main` (prod após staging saudável) |
| CI/CD | **CI** (`.github/workflows/ci.yml`): tsc · build · check-dist · audits · test (181) · coverage · docs:audit + smoke isolado (278) + **deploy-staging** · **CD** (`.github/workflows/cd.yml`): validate (CI verde + staging) → **deploy-prod** automático/manual |

## Entregas recentes

- **PLAN-087 — mensagens de falha de convite (28/08)** — incidente de produção resolvido: 6 códigos distintos na ativação (inclui `CONVITE_SUBSTITUIDO` para link trocado por reenvio), 6 chaves i18n órfãs ativadas, ação de saída no `AtivarPage`, e-mail com prazo real de 7 dias (3 idiomas), BR-109, 9 testes unitários novos + CTs.
- **PLAN-085 — contrato com periodicidade alternada (27/08)** — 3º modelo (`alternada`, a cada 2 dias, default 10 parcelas): zero migração, BR-107/BR-108, espelho backend↔frontend sincronizado com testes-espelho, formulário `grid-cols-3` + lookup de defaults, badge por i18n. tsc · testes (19 novos no backend + 9 no frontend) · audits/docs verdes. **Em produção.**
- **PLAN-076 + PLAN-077 + UI consolidada em produção (15/08)** — contrato com **periodicidade diária/semanal** (migração idempotente, BR-040-A); **performance**: pool PG com timeout, auth/módulo sem re-query (3→2 queries/request), `listarCobrancasDoDia` com `LATERAL`, N+1 em pagamentos, code-splitting frontend + GPS throttle; UI de Perfil/Operador/Admin consolidada. **Node 20 em todos os ambientes** (prod já era; dev migrado). Smoke **267/267** · testes **125/125** · CI/CD verdes · deploy prod ok.
- **E-mail: identidade visual NX nos templates (13/08, PLAN-071 Fase 1b — em produção)** — `templates.ts` com layout único (marca "NX Gest" violeta · CTA `min-width` · rodapé institucional pt/en/es · cores da marca em hex). Os 3 templates (convite/reset/lead) usam o layout; textos preservados. Validado local (tsc/91 testes/render HTML).
- **PLAN-070 concluído — PostgreSQL em produção (13/08)** — migração SQLite→PG concluída: `nxgest-postgres`/`staging-pg` healthy, cutover aplicado, débitos 1-3 resolvidos (TIMESTAMPTZ + snake_case + node 20). Otimização de queries/índices (PLAN-070 Fases B-I).
- **Caixa: DRY + seções colapsáveis + movimentações sem truncate (12/08, em produção)** — componentes reutilizáveis (`CaixaKpis`, `AjusteHistorico`/`AjusteRow`, `MovimentacoesList`/`MovimentacaoRow`, `CollapsibleSection`) eliminam a duplicação entre CaixaPage e OperadorDetail; movimentações e histórico colapsáveis (limit 8 + "Ver mais"); movimentação em 2 blocos sem truncate. 1 fonte → 2 páginas.
- **Cliente: lucro realizado (12/08, em produção)** — backend expõe `lucroRealizado` (Σ `valorFinal−valorBase` dos contratos `Finalizado`) via helper reutilizado; frontend mostra o KPI "Lucro realizado" (`sm:grid-cols-3`); BR-098, UC-071, API-CT-106 e smoke `CLI-011` atualizados.
- **Caixa: título do ajuste contextual + label do motivo + reordenação (12/08, em produção)** — `AjustarCaixaModal` com `title` contextual (próprio: "Ajustar Caixa Total" · operador: "Ajustar caixa base do operador") · label do motivo corrigido ("Motivo do ajuste", era chave crua) · `OperadorDetail` reordenado (Dados → Caixa → Clientes → Contratos → Ajuste → Histórico) · `CaixaPage` reordenada (KPIs → Gasto → Movimentações → Ajustar → Histórico).
- **Página do administrador: refinamento de identidade visual (12/08, em produção)** — título de seção "Ajuste de caixa" (sem repetição com o botão) · histórico de ajustes **unificado** (CaixaPage + OperadorDetail) com valor em destaque `value-lg` e autor ("por **Nome**") em bold · cards Contratos/Clientes do operador no **padrão canônico** (`Card.Indicators` + `Card.Actions` "Acessar", como a lista de operadores) · CTs atualizados (UC-028/028b).
- **Página do administrador: hierarquia + histórico 2 colunas + contadores p/ listas (12/08, em produção)** — ajuste de caixa em modal único (CaixaPage + OperadorDetail) · botão separado dos KPIs · histórico de ajustes em **2 colunas** (alinhamento consistente) · motivo do ajuste **máx 100** · contratos/clientes do operador viram **contador + botão "Ver" → lista** escopada (`?usuarioId=`) · CTs documentados (UC-025/026/028/028b + hierarquia admin/sócio/super).
- **Caixa operacional: ajuste unificado em modal + remoção do "Fechar caixa" da Central (12/08, em produção)** — `OperadorDetail` abre o mesmo `AjustarCaixaModal` da CaixaPage (`AjusteCaixaCard` inline removido) · `FecharCaixaModal` removido (repetia KPIs, não gerava dado; fechamento real só na CaixaPage "Liquidar") · botões Ajuste/Gasto padronizados (`primary`). Docs atualizados.
- **Validações manuais em produção (12/08)** — GPS/localização (CT-GEO-01/02) · edição de endereço com teclado preservado (UC-080, fix `7d6060e`) · PWA ícone/nome/theme (CT-PWA-01) · anexos imagem + PDF (CT-ANX-02) · rota + contadores (CT-ROT-02) — **todos concluídos**.
- **Fix teclado na edição de endereço (12/08, `7d6060e`)** — `EnderecoFields` movido p/ nível de módulo + `memo` (não remonta inputs → foco/teclado preservados ao editar endereço com localização). Regressão `ClienteForm.test.tsx` + CT no UC-080. **Em produção e staging.**
- **Pacote QA + fonte de estudo (11/08)** — `docs/qa/` com 10 documentos: visão geral, arquitetura, engenharia, testes, pipeline (CI/CD), operação, segurança, glossário e checklists + trilha de estudo recomendada. Linkado no `INDEX.md`/`docs/README.md`/`engineering/README.md`.
- **Pipeline CI/CD completo (11/08, green)** — CI corrigido (16 runs vermelhas → verde): frontend virou **npm workspace** (node_modules unificada, fix da dupla cópia de React) · `scripts/create-schema.mjs` (smoke sem duplo-boot, fim do `EADDRINUSE`) · `JWT_SECRET`/rate limits no runner. **Staging** de homologação no duckdns (compose/DB/Caddyfile próprios + seed fake) com **deploy automático** no merge à main. **CD** para produção com gate de promoção (**prod só passa se staging passou**) — automático via `workflow_run` + manual (`workflow_dispatch` com `ref` p/ rollback), environment `production`, health pós-deploy. **Secrets:** `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY`. **Deps:** dependabot (npm+actions) · react-router 7.18.2 (fix GHSA-337j/CVE-2025-68470; runtime prod 0 vulns).
- **Fix anexos (11/08)** — imagem (`toBlob` elimina `fetch(dataUrl)` bloqueado pela CSP) · PDF mobile (botão "Baixar PDF"; desktop mantém iframe). **Validado em produção (12/08).**
- **Pendentes do dia + performance (11/08)** — contadores dos chips (Todos/Vence hoje/Atrasado) corrigidos · **8 índices por `userId`** (P028) eliminam table scan do isolamento multi-tenant. **Follow-up:** reescrita da query de cobranças (ROADMAP 5.10 / BACKLOG P028). **Contadores validados em produção (12/08).**
- **Ícone/logo v2 (10-11/08)** — favicon/PNGs/PWA com a **LOGO** (variante `sm`) · `sw.js` (só em produção) → PWA instalável no Android · manifest com `id`. **Ajuste de Caixa Base** no `FecharCaixaModal`. **Validado em produção (12/08).**

## Planos em aberto (próximas tarefas — não executadas)

| Plano | Status | Próximo passo |
|---|---|---|
| PLAN-072 (identidade visual autosserviço) | ⏳ Planejado (13/08) | Admin/sócio edita nomeFantasia/tema/logo/contato · super modera · seed na conversão de lead |
| PLAN-073 (IA mestre) | ⏳ Planejado | F1 WhatsApp detalhada em PLAN-074 · F2-F5 como fases |
| PLAN-074 (IA F1 — WhatsApp) | ⏳ Planejado | Endpoint `sugerir` (Gemini Flash-Lite) + fallback ao template |
| PLAN-071 (e-mail) | 🔵 Fase 1+2 ✅ (11/08) | E-mail saindo do spam (display name "NX Gest" · DMARC rua→quarantine · assuntos) + política dev/staging/prod (`MAIL_PROVIDER`) · ⏳ DNS (Fase 3) e monitoramento (Fase 4) manuais |
| PLAN-075 (cadastro/perfil/convites/segurança) | ✅ Implementado (14/08) | convites (ciclo próprio) · troca de e-mail com verificação · suspensão de usuário · admin nunca define senha · seed de contato na conversão · dedup global |
| PLAN-069 (polimento UI) | 🔵 Parte 1 ✅ (08/08) | **Parte 2 — Admin** (filtro por papel `SegmentedControl` · "Recebido hoje" em destaque · "Meus dados" → Perfil) |
| PLAN-067 (testes) | 🔵 F0+F1 parcial+F3-P022+CI (08/08) | F1 restante (financeiro/admin/operações) · F2 (AuthContext/ThemeProvider/api-client) · F3 telas críticas |
| PLAN-066 (segurança) | 🔵 P0 ✅ · P1 parcial · P2 ⏳ | P1: timeouts Caddy (T-08) + **executar firewalld/fail2ban no VPS** · P2: JWT curto/revogação, Cloudflare WAF, 2FA, senha mín. 8 |
| **PLAN-077 (performance)** | 🔵 F1-F4 ✅ (15/08) · em prod | Bulk insert e otimização adicional encaminhados no PLAN-083; manter medição com volume real como acompanhamento |
| **PLAN-079 (estabilidade deploy)** | ✅ Implementado (18/08) · **em produção** | Fix erro "text/html MIME" pós-code-splitting: cache-busting do SW · fallback assets→404 · static imutável · check-dist no CI |
| **PLAN-084 (organização do repositório)** | ✅ **Concluído (20/08)** | Blocos 1–5: sync factual, fronteira Git/Docker, staging organizado, `audit:links` no CI, SHA validado no staging, gates completos no CD manual, backup obrigatório no deploy. Novos planos: **PLAN-080/081/082** 📝 Planejado |
| **PLAN-086 (identidade/posicionamento)** | 📝 Pendência (origem: vault `brainwork`) | Reposicionar a doc canônica p/ "plataforma modular de gestão operacional" (docs-only + 3 strings) + ADR-007. Checklist na nota do vault `NX Gest - Reposicionamento de identidade (PLAN-086)`. **Nota:** a copy preventiva do e-mail de convite saiu deste plano → executada no PLAN-087 |
| ~~PLAN-087 (mensagens de falha de convite)~~ | ✅ **Implementado (28/08)** | Incidente de produção resolvido: códigos distintos na ativação + ação de saída + e-mail com prazo real. BR-109 |

## Pendências (verificação/ações futuras)

- [ ] **Cloudflare SSL Full (strict)** — recomendado (site já funcionando); ajuste de painel
- [x] **E-mail no staging** — `MAIL_PROVIDER=console` (não envia de verdade; política atual)
- [ ] Vulns dev-only restantes (`vite`/`vitest` — major bump, fora de escopo; monitorar via dependabot)
- [x] **Node 20 no dev local** — instalado; usar `nvm use 20` antes de subir backend/vite

## Backlog (próximos)

| Item | Onde |
|---|---|
| P017 — Mensagens inteligentes do WhatsApp (sem plano ainda) | `docs/plans/BACKLOG.md` |
| P021 — Pagamento a mais que o total (decisão de produto) | `docs/plans/BACKLOG.md` |
| P023 — Validação manual fim de fluxo / empty states (T2) | `docs/plans/BACKLOG.md` |
| P028 — Reescrita da query de cobranças (perf) — **✅ feita no PLAN-077 (15/08)** | `docs/plans/PLAN-077-performance-escalabilidade.md` |
| P022 → PLAN-067 (em execução) | `docs/plans/PLAN-067-testes.md` |

## Métricas de saúde

- **Testes:** 181 verdes (35 arquivos) · smoke API **278/278** · `docs:audit` 0 divergências (62 rotas = 62 telas)
- **Pipeline:** CI verde no push/PR · staging automático no merge à main · CD prod com gate de promoção (staging saudável) · `check-dist` (PLAN-079) garante consistência index.html ↔ chunks
- **QA:** pacote `docs/qa/` (visão geral, arquitetura, engenharia, testes, pipeline, operação, segurança, glossário, checklists + trilha de estudo) · validações manuais de produção **concluídas (12/08)**
- **Docs:** planos (incl. PLAN-070, PLAN-071) · 6 ADRs · 5 templates · skills SKILL-001..009
