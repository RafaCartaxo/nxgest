# CHECKLIST — Sprint 1 do backlog: Auditoria de Caixa + Modais + Nomenclatura Admin (PLAN-026)

**Status:** Concluído

**Data:** 02/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Plano:** plans/PLAN-026-auditoria-modais-nomencleatura-admin.md

**Backlog:** plans/BACKLOG.md (EPIC 1 — P012/P014; P011 resolvido pela cadeia PLAN-020→025; P018)

---

## Objetivo

Executar o primeiro sprint do backlog de refinamentos: auditoria de caixa (P014), padronização de modais (P018) e nomenclatura da página admin (P012).

---

## Fase 1 — P014 Auditoria de Caixa (backend)

- [x] `src/database.ts`: tabela `auditoria_caixa` (schema drizzle + `CREATE TABLE IF NOT EXISTS` + índices operador/data)
- [x] `AjustarCaixaBaseInput.ts`: `motivo` obrigatório topo (`min(1)`, `max(200)`)
- [x] `caixa.repository.ts` (porta): `AuditoriaCaixa` + `saveAuditoriaCaixa`
- [x] `caixa.repository.impl.ts`: implementação
- [x] `AjustarCaixaBaseUseCase.ts`: `execute(adminId, operadorId, input)` grava auditoria
- [x] `caixa.controller.ts`: `adminId = req.userId`, `operadorId = resolveUsuarioAlvo`

## Fase 1b — P014 (frontend)

- [x] `caixa.service.ts`: `ajustarCaixaBase(valor, motivo, usuarioId?)`
- [x] `CaixaPage.tsx`: campo + validação de `motivo`
- [x] `OperadorDetail.tsx`: campo + validação de `motivo`
- [x] i18n pt-BR/en/es: `motivoObrigatorio`, `motivoPlaceholder`, `ajustarMotivoPlaceholder`

## Fase 2 — P018 Modais

- [x] `shared/components/Modal/Modal.tsx`: base configurável (Escape/backdrop/overflow/`role=dialog`)
- [x] Refatorar ConfirmModal, EquipeModal, ResultadoDiaModal, PagamentoModal
- [x] AdminPage: modal do OperadorForm migrado pro base (ganha Escape)

## Fase 3 — P012 Nomenclatura admin

- [x] i18n `admin.secaoAdministradores` (pt-BR/en/es)
- [x] `OperadoresList.tsx`: subseções Administradores/Operadores

## Fase 4 — Documentação

- [x] `docs/plans/PLAN-026-auditoria-modais-nomencleatura-admin.md`
- [x] `docs/plans/README.md`: entrada PLAN-026
- [x] `docs/engineering/02-API.md`: `POST /api/caixa/ajuste` com `motivo` + nota de auditoria
- [x] Este CHECKLIST + atualizar `docs/plans/BACKLOG.md` (P011 resolvido, P012/P014/P018 concluídos)

---

## Resultados de validação

- [x] `npm run build` → OK (tsc backend + vite frontend)
- [x] Curl `POST /api/caixa/ajuste` sem `motivo` → 422; com `motivo` → 201
- [x] Registro gravado em `auditoria_caixa` (operador/admin/valores/motivo/data)

### Validações pendentes (execução manual / UI)
- [ ] Modais: Escape fecha; backdrop respeita configuração por instância
- [ ] Lista admin: seções "Administradores" e "Operadores" com "(Eu)" preservado

---

# CHECKLIST — Exibição do Histórico de Ajustes do Caixa Base (PLAN-027)

**Plano:** plans/PLAN-027-exibicao-historico-caixa.md

## Fase 1 — Backend

- [x] `use-cases/ListarAuditoriaCaixa/{Input,UseCase}` (schema page/limit, padrão ListarMovimentacoes)
- [x] Port `ICaixaRepository.listAuditoriaCaixa` + `AuditoriaCaixaItem` (com `adminNome`)
- [x] Impl: SQL `WHERE operadorId = ? ORDER BY createdAt DESC` + count + JOIN usuarios
- [x] Controller `listAuditoria` + rota `GET /api/caixa/auditoria`

## Fase 2/3 — Frontend

- [x] `caixa.service.ts`: `listarAuditoriaCaixa` + tipo `AuditoriaCaixaItem`
- [x] `OperadorDetail.tsx`: seção "Histórico de ajustes" (admin, `?usuarioId=`)
- [x] `CaixaPage.tsx`: bloco "Histórico de ajustes" acima das movimentações (self)
- [x] i18n pt-BR/en/es: `historicoAjustes`, `ajusteSemRegistros`, `ajustePor`

## Validação (HTTP real)

- [x] `GET /api/caixa/auditoria` admin self → 200 `{ data, pagination }`
- [x] Ajuste de operador → auditoria com `adminNome` ("Rafael Cartaxo Borges")
- [x] Admin lê histórico do operador via `?usuarioId=` → registros corretos
- [x] Operador lê o próprio → só os próprios
- [x] Forgery: operador com `?usuarioId=` de outro → continua vendo só o próprio

---

# CHECKLIST — Deploy no VPS (PLAN-023 → PLAN-027) + PLAN-028

**Data:** 02/08/2026

## Deploy do código atual em produção

- [x] `.gitignore`: `*.db.backup-*` (backups do banco fora do repo)
- [x] Commits separados por plano (PLAN-025/026/027 + docs + seed/vite)
- [x] `git push origin main` → `dc435dc`
- [x] Backup manual pré-deploy (checkpoint + backup consistente, 204KB) — **gap**: backups automáticos estavam incompletos (só WAL-less `gestao.db`, 4KB)
- [x] VPS: `git pull` + `./scripts/deploy.sh`
- [x] Health `{"status":"ok","db":"connected"}`
- [x] Migração: tabela `auditoria_caixa` criada em prod; dados preservados (5 usuários, 1 empresa)
- [x] Login admin real OK + `GET /api/caixa/auditoria` → 200 + frontend novo

## PLAN-028 (planejamento)

- [x] `docs/plans/PLAN-028-estorno-pagamento.md` (fases, decisões, níveis de acesso, impacto no caixa)
- [x] `BACKLOG.md`: P013 com nota da fatia 1 em planejamento
- [x] `plans/README.md`: entrada PLAN-028

### Pendência registrada
- [x] Corrigir script de backup automático do VPS para incluir WAL/checkpoint (backups de 4KB são incompletos) — **concluído**

---

# CHECKLIST — Correção do backup de produção (WAL)

**Data:** 02/08/2026

## Problema

Banco em WAL mode (dados vivos no `.db-wal` ~1MB); script copiava só `gestao.db` cru → backups de 4KB **vazios** (validado: "no such table: usuarios"). Cópia off-site local também vazia.

## Fases

- [x] `/opt/scripts/backup-nxgestao.sh` corrigido: `wal_checkpoint(TRUNCATE)` + `cp` + validação embutida (`SELECT COUNT(*) FROM usuarios` > 0; inválido → `.invalid`)
- [x] `scripts/deploy.sh`: backup pré-deploy antes do build (chama `/opt/scripts/backup-nxgestao.sh` se existir)
- [x] Cópia off-site substituída pelo backup consistente (241KB, 5 usuários, 7 clientes)
- [x] `06-PRODUCAO.md`: seção 5.0 (alerta WAL), script corrigido, off-site atualizado, deploy pré-backup
- [x] `UPDATES.md`: entrada da correção

## Validação

- [x] Rodar script 1x → `gestao-20260802-115822.db` (236KB, "Backup válido (usuarios > 0)")
- [x] Conteúdo validado: 5 usuários, 7 clientes
- [x] Off-site local abre com dados (5 usuários, 7 clientes)
- [ ] (pendente) Confirmar próximo backup do cron (00h/12h) também válido

---

# CHECKLIST — Estorno de Pagamento pelo Admin (PLAN-028)

**Data:** 02/08/2026

## Fase 1 — Backend (estorno)

- [x] Schema: colunas `estornadoEm`/`estornadoPor`/`estornoMotivo` em `pagamentos` (ALTER idempotente) + tabela `auditoria_estornos` + índices
- [x] `EstornarPagamentoUseCase` (transação: reverter parcelas + estado/dataQuitacao + contrato→Ativo + movimentação reversa `Cancelamento` + duplo estorno + auditoria)
- [x] `pagamento.repository`: `findByIdWithParcelas` + `marcarEstornado` + `saveAuditoriaEstorno`
- [x] Erros `PagamentoNotFoundError`/`PagamentoJaEstornadoError`
- [x] `POST /api/pagamentos/:id/estornar` com `adminMiddleware` + `resolveUsuarioAlvo`

## Fase 2 — Escopo `?usuarioId=` (contexto do operador)

- [x] `contrato.controller`: `GET /contratos` e `GET /contratos/:id` com `resolveUsuarioAlvo`
- [x] `pagamento.controller`: `GET /pagamentos/contrato/:id` com `resolveUsuarioAlvo`
- [x] `cliente.controller`: `GET /clientes/:id` com `resolveUsuarioAlvo`
- [x] `update`/`remove` permanecem `req.userId` (somente leitura no contexto)

## Fase 3 — Frontend

- [x] Services: `listContratos`/`getContrato`/`getCliente`/`listPagamentos` com `usuarioId?` + `estornarPagamento`
- [x] `OperadorDetail`: seção "Contratos do operador" (link → `ContratoDetail?usuarioId=`)
- [x] `ContratoDetail`: modo admin read-only (sem editar/excluir/pagar) + botão "Estornar" + modal de motivo (base `Modal`)
- [x] i18n pt-BR/en/es (estorno + contratos do operador)

## Validação (HTTP real)

- [x] `npm run build` OK
- [x] Estorno sem motivo → 422
- [x] Estorno com motivo (admin) → 201
- [x] Duplo estorno → 409
- [x] Operator → 403
- [x] Parcela revertida (valorPago 0, saldo restaurado, estado Pendente, dataQuitacao null)
- [x] Movimentação reversa (`saida`/`Cancelamento`) + pagamento marcado estornado
- [x] `auditoria_estornos` gravada (pagamentoId, operadorId, adminId, valor, motivo)
- [x] Escopo: operador de outra empresa → 404

## Pós-code review (SKILL-005) + Design System

- [x] **P2**: fix do `Finalizado → Ativo` (saldo pós-reversão) + teste real (quitar + estorno → Ativo)
- [x] **P3**: `dataQuitacao` limpo quando parcela não fica `Paga`
- [x] **DS**: lista de contratos do OperadorDetail em `Card.Root list-item` (padrão OperadoresList)