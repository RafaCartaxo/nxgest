# PLAN-026 — Auditoria de Caixa, Maydulação de Modais e Nomenclatura Admin (Sprint 1 do backlog)

**Status:** Concluído

**Versão:** 1.0

**Data:** 02/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Dependências:**
- PLAN-020 (Caixa por `?usuarioId=`)
- PLAN-024 / PLAN-025 (painel admin, "", ajuste exclusivo)
- Backlog `BACKLOG.md` (EPIC 1 — P011/P012/P014, P018)

---

## Objetivo

Organizar o primeiro sprint do backlog de refinamentos do produto (`BACKLOG.md`). Três entregas independentes:

1. **P014 — Auditoria de Caixa.** Todo ajuste manual do Caixa Base passa a gera um registro com operador-alvo, admin responsável, valor anterior, valor novo, motivo e data. Nenhuma alteração manual sem histórico.
2. **P018 — Padronização dos modais.** Componente `Modal` base configurável (mecânica uniforme: backdrop, Escape, overflow, `role=dialog`) que preserva a semântica de fechamento de cada tela.
3. **P012 — Nomenclatura da página admin.** Separar "Equipe" em *Administradores* e *Operadores* em vez de usar "Operadores" como rótulo genérico para todos.

> **P011 (correção de saldo do operador)** chegou a este sprint já **resolvido** pela cadeia PLAN-020 → PLAN-025 (ajuste via `?usuarioId=` + `resolveUsuarioAlvo` + regra exclusiva de admin). Entra aqui só como regressão coberta pela auditoria do P014.

---

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Onde guardar a auditoria | Tabela nova `auditoria_caixa` (separada de `movimentacoesFinanceiras`) | O próprio `database.ts` já **remove** movimentações de "Ajuste manual do Caixa Base" por contaminarem o saldo (PLAN-020). Registrar auditoria como movimentação reabriria o bug. |
| Quem fica em `adminId` vs `operadorId` | `adminId = req.userId` (token); `operadorId = resolveUsuarioAlvo` | O alvo pode ser outro operador (`?usuarioId=`); o responsável é sempre quem autenticou |
| `motivo` obrigatório | Sim, em todo ajuste (inclusive o próprio caixa do admin) | Decisão do usuário — auditoria completa, sem lacuna |
| Modal base | Componente `Modal` com `backdropClose?` / `escapeClose?` por instância | Preserva comportamento atual (quem fecha no backdrop e quem não fecha) — "padronização" não pode virar regressão de UX |
| P012 agrupamento | Dividir a lista da equipe em subseções "Administradores" e "Operadores" | Evita usar "Operadores" como nome genérico |

---

## Fases de implementação

### Fase 1 — P014 Auditoria de Caixa (backend)

- [x] `src/database.ts`: tabela `auditoria_caixa` no schema drizzle + `CREATE TABLE IF NOT EXISTS` no `createTables()` + índices por operador e data
- [x] `AjustarCaixaBaseInput.ts`: `motivo` obrigatório (`z.string().trim().min(1).max(200)`)
- [x] `caixa.repository.ts` (porta): interface `AuditoriaCaixa` + método `saveAuditoriaCaixa`
- [x] `caixa.repository.impl.ts`: implementação de `saveAuditoriaCaixa`
- [x] `AjustarCaixaBaseUseCase.ts`: assinatura `execute(adminId, operadorId, input)`; grava auditoria (valorAnterior = caixaConfig antes do update)
- [x] `caixa.controller.ts`: `adminId = req.userId`, `operadorId = resolveUsuarioAlvo`

### Fase 1b — P014 (frontend)

- [x] `caixa/service.ts`: `ajustarCaixaBase(valor, motivo, usuarioId?)`
- [x] `CaixaPage.tsx`: estado `ajusteMotivo` + input + validação
- [x] `OperadorDetail.tsx`: estado `ajusteMotivo` + input + validação
- [x] i18n pt-BR/en/es: `caixa.motivoObrigatorio`, `caixa.motivoPlaceholder`, `caixa.ajustarMotivoPlaceholder`

### Fase 2 — P018 Modais

- [x] `shared/components/Modal/Modal.tsx`: base configurável (`open`, `onClose`, `backdropClose`, `escapeClose`, `maxWidth`)
- [x] `ConfirmModal.tsx`, `EquipeModal.tsx`, `ResultadoDiaModal.tsx`, `PagamentoModal.tsx` refatorados para o base
- [x] `AdminPage.tsx`: modal inline do `OperadorForm` passa a usar o base (ganha Escape, fix no gap original)

### Fase 3 — P012 Nomenclatura admin

- [x] i18n: `admin.secaoAdministradores` (pt-BR/en/es)
- [x] `OperadoresList.tsx`: agrupa admin+operadores em subseções; mantém ordenação

---

## Resultados de validação

- [x] `npm run build` → OK (tsc backend + vite frontend)

### Regressões cobertas
- [ ] (pendente de execução manual/UI) `POST /api/caixa/ajuste` com `motivo` → 201; sem `motivo` → 422
- [ ] (pendente de execução manual) registro gravado em `auditoria_caixa`
- [ ] (pendente de execução manual) modais: Escape fecha, backdrop respeita configuração por instância

---

## Status do backlog

| Item | Estado |
|------|--------|
| P011 — Correção de saldo do operador | Resolvido (PLAN-020→025); regressão |
| P012 — Nomenclatura admin | Concluído neste sprint |
| P013 — Contexto do operador | Pendente (próximo sprint) |
| P014 — Auditoria de Caixa | Concluído neste sprint |
| P015 — Indicadores financeiros do cliente | Pendente |
| P016 — Endereços | Pendente |
| P017 — Mensagens WhatsApp | Pendente |
| P018 — Modais | Concluído neste sprint |
| P019 — Refinamentos operacionais | Buffer |