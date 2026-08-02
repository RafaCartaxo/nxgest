# PLAN-028 — Estorno de Pagamento pelo Admin

**Status:** Concluído

**Versão:** 1.0

**Data:** 02/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Dependências:**
- PLAN-020 (escopo do caixa por `?usuarioId=` + `resolveUsuarioAlvo`)
- PLAN-026 (auditoria de caixa — padrão de tabela de auditoria dedicada)
- PLAN-027 (histórico de ajustes — padrão de exibição admin/operador)
- Backlog `BACKLOG.md` — **P013 (Contexto do Operador)**, caso de uso "corrigir pagamentos registrados incorretamente"

---

## Objetivo

Permitir que o **admin/super_admin** corrija uma transação errada de um operador: **estornar um pagamento** registrado por engano. O operador registra o pagamento correto novamente quando necessário.

Esta entrega é a **primeira fatia vertical do P013** (Contexto do Operador) — focada na correção de pagamentos, sem implementar todo o contexto de uma vez.

---

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Granularidade | **Estorno do pagamento inteiro** | Simples e cobre o caso "registrei por engano"; operador re-registra o valor correto depois |
| Onde o admin acessa | Contratos/pagamentos do operador **dentro do `OperadorDetail`** | Mantém o contexto de navegação atual do admin |
| Auditoria | **Tabela dedicada `auditoria_estornos`** | Coesa com o P013 e o padrão da `auditoria_caixa` |
| ContratoDetail em modo admin | **Somente leitura** (única ação = estorno) | Evita que o admin altere dados do operador além da correção; ajusta depois se necessário |
| Histórico financeiro | Pagamento original **nunca é deletado** (BR-029); marcado como estornado + movimentação reversa | Preserva histórico (BR-032) |

---

## Níveis de acesso (arquitetura existente preservada)

| Nível | Acesso ao estorno |
|-------|-------------------|
| `operator` | **Nunca** — rota com `adminMiddleware` (403); não corrige o próprio pagamento |
| `admin` | Estorna pagamento de operador da **própria empresa** (`?usuarioId=` validado por `resolveUsuarioAlvo`) |
| `super_admin` | Estorna pagamento de **qualquer** empresa |

---

## Fases de implementação

### Fase 1 — Backend: estorno (núcleo)

**Schema** (`src/database.ts`):
- `pagamentos` ganha colunas via `ALTER TABLE` idempotente: `estornadoEm TEXT`, `estornadoPor TEXT`, `estornoMotivo TEXT`
- Nova tabela `auditoria_estornos`: `id`, `pagamentoId`, `operadorId`, `adminId`, `valor`, `motivo`, `data`, `createdAt`

**Use case** `src/modules/pagamento/application/use-cases/EstornarPagamento/`:
- `Input.ts`: `{ motivo: z.string().min(1).max(200) }`
- `UseCase.ts` (dentro de `contratoRepo.transaction`):
  1. Busca o pagamento + parcelas vinculadas (`pagamento_parcelas`)
  2. Guarda de duplo estorno (já `estornadoEm` → recusar)
  3. Reverte cada parcela: `valorPago -= valor`, `saldoPendente += valor`, recálculo de `estado` (`Paga`→`Parcial`/`Pendente`; `Parcial`→`Pendente`), limpa `dataQuitacao` quando necessário
  4. Se o contrato estava `Finalizado` e tem saldo pendente → volta a `Ativo`
  5. Marca o pagamento estornado (`estornadoEm`, `estornadoPor`, `estornoMotivo`)
  6. Cria movimentação reversa: `saida`, origem `Cancelamento`, descrição "Estorno do pagamento ..."
  7. Grava em `auditoria_estornos` (operadorId = dono do caixa, adminId = `req.userId`)

**Repository** (`pagamento.repository`): `findByIdWithParcelas(pagamentoId, userId)` + `marcarEstornado(...)`.

**Controller + rota**:
- `POST /api/pagamentos/:id/estornar` com `adminMiddleware`
- Controller usa `resolveUsuarioAlvo` para validar o alvo (admin → dentro da empresa; super → qualquer)

### Fase 2 — Backend: contexto do operador

- `?usuarioId=` (com `resolveUsuarioAlvo`) nas rotas de leitura de **contrato** (`GET /contratos`, `GET /contratos/:id`), **pagamento** (`GET /pagamentos/contrato/:contratoId`) e **cliente** (`GET /clientes/:id`) — somente leitura; `update`/`remove` permanecem `req.userId`
- `OperadorDetail` expõe os contratos do operador (chamada com `?usuarioId=`)
- **Executado** em: `contrato.controller.ts`, `pagamento.controller.ts`, `cliente.controller.ts`

### Fase 3 — Frontend

- `OperadorDetail`: seção "Contratos do operador" (cliente, valor, parcelas pagas) com link para `ContratoDetail` com `?usuarioId=`
- `ContratoDetail` modo admin (somente leitura): cada pagamento com botão **"Estornar"** + modal de motivo (base `Modal` do PLAN-026)
- Services (`pagamento.service`, `contrato.service`) com `usuarioId?` e `estornarPagamento`
- i18n pt-BR/en/es

### Fase 4 — Documentação

- `02-API.md` (endpoint estorno + escopo), `01-DATABASE.md` (colunas + `auditoria_estornos`)
- `UPDATES.md`, `05-MAPEAMENTO-TELAS.md`, `BACKLOG.md` (P013: fatia em andamento)
- Este PLAN + CHECKLIST

---

## Impacto no caixa (consequência verificada)

- O saldo e o lucro (`getSaldoAtual`/`getLucro`) somam todas as movimentações `saida` → a reversão **reduz** corretamente o saldo/lucro.
- `getRecebidoSemana`/`getRecebidoHoje` filtram por origem `Pagamento` → o KPI "Recebido" **não** é reduzido pelo estorno (mostra o que entrou no caixa); o estorno aparece como saída no saldo e no "Resultado do Dia" (`entradas - saídas`). Comportamento intencional e a documentar.

---

## Validação realizada

- [x] `npm run build` OK
- [x] Curl: operator → **403**; admin estorna pagamento da empresa → **201**
- [x] Curl: pagamento já estornado → **409** (`PAGAMENTO_JA_ESTORNADO`)
- [x] Parcelas revertidas (estado `Pendente`, saldo restaurado, `dataQuitacao` limpa)
- [x] Movimentação reversa registrada (`saida`, origem `Cancelamento`, descrição com motivo)
- [x] Registro em `auditoria_estornos` com operador/admin/motivo
- [x] Escopo: admin lê contratos/pagamentos do operador via `?usuarioId=`; operador de outra empresa → 404 (`OPERATOR_NOT_FOUND`)
- [x] Contrato `Finalizado` → `Ativo` (validado com fluxo real: quitar contrato + estorno → Ativo)

## Correções pós-code review (SKILL-005) e design system

- [x] **P2 (bug real)**: `saldoRestante` era calculado sobre o snapshot pré-reversão → contrato `Finalizado` NÃO voltava a `Ativo` ao estornar (ficava finalizado com parcelas pendentes). Corrigido acumulando `temSaldoPendente` no loop de reversão e validado por teste real.
- [x] **P3 (inconsistência)**: `dataQuitacao` não era limpo quando a parcela reverte para `Parcial`. Agora só mantém `dataQuitacao` se `novoEstado === "Paga"`.
- [x] **Design system (UX)**: lista de contratos do `OperadorDetail` migrada de `<button>` custom para `Card.Root variant="list-item"` (padrão do sistema, igual `OperadoresList`).