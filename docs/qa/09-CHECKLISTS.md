# 09 — Checklists (QA operacional)

**Status:** Ativo · Modelo: `docs/templates/CHECKLIST.template.md`

> Use as seções abaixo como guia em cada validação. Marque `[x]` ao concluir.

---

## A. Sanidade (mudança pequena / hotfix)

- [ ] `npx tsc --noEmit` limpo (raiz + frontend)
- [ ] `npm run build` verde
- [ ] `npm test` verde (78 testes)
- [ ] Audits: `audit:ui` · `audit:styles` · `audit:modules` · `docs:audit`
- [ ] Smoke (se tocou backend/API): 250/250 em instância isolada
- [ ] CI verde no push/PR
- [ ] (se merge à main) staging no ar + prod sem regressão

---

## B. Regressão (módulo ou fluxo alterado)

- [ ] Login (admin + operator + super) e logout
- [ ] `GET /auth/me` reflete perfil/módulos
- [ ] Cliente: criar, listar, detalhe (situação financeira), editar, CPF duplicado (409), inválido (422)
- [ ] Contrato: criar (geração de parcelas sem domingo), detalhe, editar sem pagamentos, caixa insuficiente (422)
- [ ] Pagamento: preview, registrar (atravessa parcelas), quitar → Finalizado, exceder saldo (422), estorno + auditoria
- [ ] Caixa: saldo/recebido, ajuste de base (admin), auditoria, fechamento semanal (+ re-liquidação 409)
- [ ] Gastos: criar (categoria obrigatória), listar, excluir
- [ ] Operações: cobranças do dia, parcelas hoje/semana, registrar visita (tipos + promessa com data)
- [ ] Admin: operadores CRUD, auto-rebaixar/remover (403), equipe (Σ = totais), empresas (super), módulos/capacidades
- [ ] Leads: criar público, duplicado, confirmar token (single-use), converter, descartar (LGPD)
- [ ] Anexos: upload imagem/PDF, MIME real, limite, download autenticado, escopo (404 p/ outro operador)
- [ ] Smoke 250/250

---

## C. Release / QA pré-produção

- [ ] Todas as seções A + B verdes
- [ ] CI verde (test + smoke) na última `main`
- [ ] **Staging** deployado e saudável (`https://nxgestao.duckdns.org/api/health`)
- [ ] Validação manual no staging com seed `teste123!`
- [ ] CD `validate` verde (staging saudável)
- [ ] Deploy em prod + health pós-deploy (`https://nxgest.com.br/api/health`)
- [ ] `docs:audit` 0 divergências
- [ ] `STATUS.md`/`UPDATES.md` atualizados

---

## D. Validação manual pendente (conhecidos — STATUS.md)

- [ ] CT-ANX-02 — upload de anexo imagem e abrir no modal
- [ ] CT-ROT-02 — rota concluída/parcial: contadores e empty state
- [ ] CT-PWA-01 — reinstalar o app instalado e conferir ícone/nome/theme
- [ ] CT-GEO-01/02 — capturar localização → campos preenchem + navegar disponível
- [ ] Cloudflare SSL Full (strict)

---

## E. Incidente em produção

- [ ] Confirmar health: `curl https://nxgest.com.br/api/health`
- [ ] Logs do app: `docker compose -f /opt/nxgestao/docker-compose.prod.yml logs -f app`
- [ ] Rodar backup manual antes de qualquer rollback
- [ ] Rollback: `Actions → CD → Run workflow` (ref = commit bom) **ou** `git reset --hard` no VPS + `deploy.sh`
- [ ] Validar prod novamente + registrar no `UPDATES.md`

---

## F. Nova feature (gate de review)

- [ ] Plano em `docs/plans/` (padrão SKILL-003)
- [ ] Implementação em vertical slice (SKILL-004)
- [ ] Teste incluído: use-case/lógica + smoke quando aplicável
- [ ] `docs:audit` limpo (rotas/superfícies sincronizadas)
- [ ] `audit:ui/styles/modules` verdes (se UI mudou)
- [ ] PR com CI verde + review

---

## Referências

- `docs/templates/CHECKLIST.template.md` — modelo oficial (catálogo de status ✅/🔵/⏳/🚨/❌/🐛/🔁)
- `docs/engineering/tasks/` — checklists executados por data
- `docs/qa/04-TESTES.md` — como rodar cada validação
