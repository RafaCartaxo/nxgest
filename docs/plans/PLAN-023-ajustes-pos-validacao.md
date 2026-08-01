# PLAN-023 — Ajustes pós-validação: bug da rota, "Vence Hoje", pagos no "Todos" e histórico de atrasos

**Status:** Concluído

**Versão:** 1.0

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Dependências:**
- PLAN-003 (Operações)
- PLAN-011 (Atendidos hoje)
- PLAN-012 (Resumo operacional na rota)

---

## Objetivo

Quatro pontos identificados na validação pós-deploy do PLAN-022/rotina:

1. **Bug: tela em branco na rota após visitar o último cliente pendente.** Ao marcar um cliente como visitado, `resultadoOperacional` sai de `null`, mas o item permanece em `items` (a navegação usa `sortedItems`, só pendentes). O clamp do índice usava `items.length`, que **não encolhe** — o `indiceAtual` sai do range de `sortedItems`, `item` vira `undefined` e a tela renderiza em branco.
2. **Parcela "vence hoje" não se destacava.** A `ParcelaList` só diferenciava pendente/parcial/paga/vencida; a parcela que vence hoje ficava com estilo de pendente genérico.
3. **"Todos" não incluía os pagos.** Na `AtendidosPage`, o filtro `all` mostrava só os atendimentos, sem os pagamentos do dia.
4. **Lista de atrasados sem resumo nem histórico.** Faltava contexto (quantos clientes/valor total) e não havia como acompanhar a evolução dos atrasos no tempo.

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Fix da rota | Clamp via `sortedItems.length` nos dois pontos + fallback de render (`animate-pulse`) | O range válido da navegação é o de pendentes; fallback cobre o frame transiente em vez de renderizar `null` |
| `aindaExiste` no useEffect de currentKey | Continua sobre `items.some(...)` | O item visitado permanece em `items` (com `VISITADO`) — manter evita feedback falso "clienteQuitado" |
| Destaque "Vence Hoje" | Novo estado visual `info` + contadores separados (`venceHoje` excluído de `pendentes`) | Evita duplicar contagem; precedência overdue > vence hoje > estado |
| "Todos" com pagos | Dedup por `clienteId` contra `pagamentosHoje`; bloco de pagamentos abaixo | Cliente que pagou aparece uma vez, como pagamento |
| Resumo de atrasados | Banner `danger` com clientes distintos + soma `totalPendente` (filtro `atrasado`) | Contexto imediato na listagem |
| Histórico de atrasos | Snapshot **lazy** (upsert por `userId`+`data`) a cada `GET /cobrancas` + endpoint `GET /historico-atrasos?dias=30` | Sem job agendado; dado é derivado de uso real — só existe snapshot no dia em que o operador abriu as cobranças |

---

## Fases de implementação

```
Fase 1 (fix rota) → Fase 2 (ParcelaList) → Fase 3 (AtendidosPage) → Fase 4 (CobrancaListPage resumo) → Fase 5 (backend snapshot + histórico) → Fase 6 (docs/build)
```

### Fase 1 — Fix da rota (bug tela em branco)

**Arquivo:** 1 alterado

- `frontend/src/modules/operacoes/pages/RotaPage.tsx`:
  - Clamp do `indiceAtual` passa a usar `sortedItems.length` (deps `[sortedItems, indiceAtual]`), movido para **depois** do `useMemo` de `sortedItems` (usado antes da declaração).
  - Clamp do useEffect de `currentKey` idem (`sortedItems.length`); mantém `aindaExiste = items.some(...)`.
  - Render com fallback: `) : !item ? (<div className="h-64 animate-pulse rounded-md bg-secondary-light" />) : (` — corrige também o `: null}` (TS1005) que deixava sintaxe quebrada.

**Checklist Fase 1**

- [x] Clamp com `sortedItems.length` nos 2 pontos
- [x] useEffect movido após `useMemo` de `sortedItems`
- [x] Fallback de render no lugar de `null`
- [x] `npx tsc --noEmit` verde (frontend)

---

### Fase 2 — ParcelaList: destaque "Vence Hoje"

**Arquivo:** 1 alterado (+ i18n)

- `frontend/src/modules/contrato/components/ParcelaList.tsx`: `isVenceHoje(p)` (comparação `getTime()`); `getCardEstilo`/`getDotEstilo` com precedência overdue > vence hoje > estado; contador `venceHoje` separado; `pendentes` exclui vence hoje; rótulo `t("status.venceHoje")` (`text-info-text`) no card.
- i18n: `parcela.venceHoje` = "Vence Hoje" / "Due Today" / "Vence Hoy".

**Checklist Fase 2**

- [x] `isVenceHoje` com comparação de dia
- [x] Precedência de estilo correta (vencida > vence hoje > estado)
- [x] Contadores sem duplicidade
- [x] Rótulo no card + chave i18n nos 3 locales

---

### Fase 3 — AtendidosPage: "Todos" inclui pagos

**Arquivo:** 1 alterado

- `frontend/src/modules/operacoes/pages/AtendidosPage.tsx`: `completosSemPagos` (filtra por `clienteId` os clientes já presentes em `pagamentosHoje`); `renderPagamentos()` extraído; filtro `all` = lista dedup + bloco de pagamentos (sem `CobrancaList` vazio quando só há pagos).

**Checklist Fase 3**

- [x] Dedup por `clienteId` contra `pagamentosHoje`
- [x] `renderPagamentos()` reutilizada
- [x] Empty correto quando só há pagamentos (sem "Nenhum atendimento" indevido)

---

### Fase 4 — CobrancaListPage: resumo de atrasados

**Arquivo:** 1 alterado (+ i18n)

- `frontend/src/modules/operacoes/pages/CobrancaListPage.tsx`: `atrasadosResumo` (useMemo — `clientes` = `Set(clienteId).size`, `total` = soma `totalPendente`) quando `filter === "atrasado"`; banner `border-danger bg-danger-light` com `operacoes.atrasadosResumo`.

**Checklist Fase 4**

- [x] Resumo apenas no filtro `atrasado`
- [x] Banner danger + chave i18n

---

### Fase 5 — Backend snapshot + frontend histórico

**Arquivos:** 7 backend + 3 frontend/i18n

- `src/database.ts`: tabela `snapshots_atraso` (id, userId, data, clientesAtrasados, contratosAtrasados, valorAtrasado, createdAt; `UNIQUE(userId, data)`) + `CREATE TABLE IF NOT EXISTS` + índice `(userId, data DESC)`.
- `src/modules/operacoes/application/ports/operacoes.repository.ts`: interface `SnapshotAtraso` + `registrarSnapshotAtraso(userId, data?)` + `listarHistoricoAtrasos(userId, dias?)`.
- `src/modules/operacoes/infrastructure/repositories/operacoes.repository.impl.ts`: `registrarSnapshotAtraso` (COUNT DISTINCT cliente/contrato + SUM saldoPendente onde `dataVencimento < hoje AND saldoPendente > 0`, upsert `ON CONFLICT (userId, data)`); `listarHistoricoAtrasos` (ORDER BY data DESC LIMIT dias).
- `src/modules/operacoes/application/use-cases/ListarCobrancasDoDia/ListarCobrancasDoDiaUseCase.ts`: chama `registrarSnapshotAtraso` (wrapped em try/catch — snapshot é efeito colateral, não pode quebrar a listagem).
- `src/modules/operacoes/application/use-cases/ListarHistoricoAtrasos/ListarHistoricoAtrasosUseCase.ts`: **novo**.
- `src/modules/operacoes/presentation/controllers/operacoes.controller.ts` + `presentation/routes/operacoes.routes.ts`: handler `historicoAtrasos` + `GET /historico-atrasos` (query `dias`, default 30).
- `frontend/src/modules/operacoes/services/operacoes.service.ts`: `SnapshotAtraso` + `listarHistoricoAtrasos(dias?)`.
- `frontend/src/modules/operacoes/pages/CobrancaListPage.tsx`: tabela de histórico (Data/Clientes/Contratos/Valor) carregada quando `filter === "atrasado"`.
- i18n: `operacoes.{atrasadosResumo,historicoAtrasos,semHistoricoAtrasos,historicoData,historicoClientes,historicoContratos,historicoValor}`.

**Checklist Fase 5**

- [x] Tabela + índice + port + repo (upsert idempotente)
- [x] Snapshot lazy no `ListarCobrancasDoDia` protegido por try/catch
- [x] Use-case + controller + rota novos
- [x] Service + tabela no frontend
- [x] i18n nas 3 línguas (JSON válidos)
- [x] `npx tsc --noEmit` verde (backend e frontend)

---

### Fase 6 — Documentação

- [x] `docs/plans/PLAN-023-ajustes-pos-validacao.md` — este plano
- [x] `docs/engineering/02-API.md`: `GET /api/operacoes/historico-atrasos` (+ tabela de endpoints)
- [x] `docs/engineering/05-MAPEAMENTO-TELAS.md`: seções 2b (Atendidos/filtro all) e 2c (histórico de atrasos)
- [x] `docs/product/02-BUSINESS-RULES.md`: BR-086 (snapshot lazy)
- [x] `docs/plans/README.md`: entrada PLAN-023

---

## Regras de negócio (novas/alterações propostas)

- **BR-086 (NOVA)** — O histórico diário de atrasos é alimentado por snapshot registrado automaticamente a cada listagem de cobranças do dia (upsert por operador e data). Sem job agendado: dias sem abertura das cobranças não têm snapshot. Contam apenas parcelas vencidas (`dataVencimento` anterior à data atual) com saldo pendente > 0, com clientes e contratos contados de forma distinta.

---

## Resultados de validação

- `npx tsc --noEmit` → OK (backend e frontend).
- `npm run build` → OK (só warning pré-existente de chunk > 500 kB).
- Teste do snapshot em DB temporário (`better-sqlite3` in-memory via `tsx`): 2 clientes/2 contratos atrasados → `{clientesAtrasados: 2, contratosAtrasados: 2, valorAtrasado: 150}`; segunda chamada no mesmo dia mantém 1 linha (upsert idempotente).
- `npm test` → sem arquivos de teste no projeto (vitest exit 1, esperado).
- Deploy no VPS + health check → pendente de execução nesta sessão.

---

## Referências

- `frontend/src/modules/operacoes/pages/RotaPage.tsx` (fix bug)
- `frontend/src/modules/contrato/components/ParcelaList.tsx` (Vence Hoje)
- `frontend/src/modules/operacoes/pages/AtendidosPage.tsx` (filtro all com pagos)
- `frontend/src/modules/operacoes/pages/CobrancaListPage.tsx` (resumo + histórico)
- `src/database.ts`, `src/modules/operacoes/{application,infrastructure,presentation}/**`
- `docs/plans/PLAN-003-operacoes.md`, `docs/plans/PLAN-011-atendidos-hoje.md`
