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

---

# Validação de casos de uso (06-CASOS-DE-USO.md) + correções

**Data:** 02/08/2026

## Base de casos de uso criada

- [x] `docs/product/06-CASOS-DE-USO.md`: 33 casos reais de validação (operador/admin/super admin + fim de fluxo), com reflexos de dados e conferências
- [x] Linkado nas Referências do `02-BUSINESS-RULES.md` + `docs/INDEX.md`

## Correções de seed encontradas na validação

- [x] **Datas de vencimento**: contratos "vencidos" vencem no futuro (cálculo de `dataInicio` se anulava) → corrigido com `prevBusinessDay` (recua N dias úteis)
- [x] **Caixa base**: base `rnd(800,3000)` não cobria os empréstimos → saldos negativos. Corrigido: base = total emprestado × 1.15 + margem (saldos positivos)

## Fix do UC-031 (bug do "voltar" no contexto do operador)

- [x] `ContratoDetail.tsx`: em modo admin (`?usuarioId=`), o voltar vai para `/admin/operadores/:usuarioId` (preserva `?empresaId=`) em vez de `/clientes/:id`
- [x] `OperadorDetail.tsx`: link do contrato propaga `empresaId`
- [x] Build OK

## Validações via API real (operador gabriel + admin)

- [x] UC-001 Dashboard: KPIs coerentes (clientesParaCobrar bate com PENDENTE; atrasado = vencidas)
- [x] UC-003 Marcar visitado: 201 + cai `clientesParaCobrar` + PENDENTE na lista
- [x] UC-006 Pagamento: parcela mais antiga quitada + KPI recebido hoje + movimentação entrada
- [x] UC-009 Lista de cobranças: só vencidas/vence hoje (0 futuras)
- [x] UC-010 Atendidos: completos + pagos sem duplicar
- [x] UC-014 Operador ajustar base/estornar → 403
- [x] UC-016 Criar contrato: validação caixa (422), parcelas pulam domingo, juros, movimentação saída
- [x] UC-025 Ajustar base do operador: valor absoluto + auditoria
- [x] UC-030 Estornar: reversão + movimentação + auditoria + selo

## Pendências de validação (UI manual)

- [ ] UC-018/019/020/021/022: estados de fim de fluxo na UI (SuccessState, rota concluída, empties)
- [ ] UC-031: conferência visual do voltar no navegador

---

# Coerência do fim de fluxo + casos ambíguos (UC-034 a UC-038)

**Data:** 02/08/2026

## Unificação do "total de clientes atendidos" (UC-018/034/035/036)

- [x] Helper `frontend/src/modules/operacoes/utils/atendimento.ts`: `totalClientesAtendidos` = clientes distintos (atendidos + pagos, sem duplicar)
- [x] Aplicado em `RotaPage`, `OperacoesDashboard`, `CobrancaListPage` (as 3 usavam fórmulas divergentes que misturavam itens de contrato com clientes)
- [x] Cliente atendido E pago conta 1x (UC-034)

## UC-038 — Alinhamento do KPI "a vencer"

- [x] Backend `aVencer` passou de `BETWEEN hoje AND hoje+7` para `> hoje AND <= hoje+7` (exclui hoje, igual ao modal)
- [x] Validado: KPI 7766.90 == modal 7766.90

## Pontos visuais (UX/DS)

- [x] Empty do `RotaPage` ("nenhuma cobrança") alinhado ao padrão `EstadoTela` (centralizado, `text-text-secondary`)
- [x] Empty do `AtendidosPage` alinhado ao padrão do CobrancaList

## Novos casos de uso no 06-CASOS-DE-USO.md

- [x] UC-034 (atendido e pago = 1), UC-035 (2 contratos), UC-036 (total consistente entre telas), UC-037 (visitar não sobrescreve), UC-038 (KPI a vencer coerente)

---

# Estorno visível nas movimentações (rastreio do estorno)

**Data:** 02/08/2026

## Problema
- O estorno criava movimentação `origem: "Cancelamento"` com `origemId = pagamentoId`, mas o SQL de `clienteNome` resolvia `Cancelamento` por `contratoId` → cliente ficava `null` e a UI mostrava só "Cancelamento" cru, sem descrição. Parecia que o estorno "não tinha acontecido".

## Correção
- [x] `caixa.repository.impl.ts`: `Cancelamento` agora resolve cliente via **pagamentoId** (COALESCE: estorno → pagamento→contrato→cliente; senão contrato→cliente)
- [x] `CaixaPage.tsx`: badge "Estorno" (origem Cancelamento) + exibição da `descricao` (motivo) na linha da movimentação
- [x] i18n `caixa.estornoLabel` (pt/en/es) + fix de chave `movimentacoes` duplicada no en.json

## Validação
- [x] Estorno → movimentação aparece com: origem Cancelamento, cliente ("Carlos Carvalho"), descricao ("Estorno do pagamento - R$ 115.00 (Pagamento duplicado)")