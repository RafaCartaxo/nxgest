# PLAN-024 — Página do Administrador: organização da equipe, fix do saldo no operador e KPIs clicáveis

**Status:** Concluído

**Versão:** 1.0

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Fase 5 — Polimento)

**Dependências:**
- PLAN-021 (Painel admin: contexto de empresa, KPIs por seção, engrenagem na navbar)
- PLAN-022 (Ajuste de KPIs + idioma na engrenagem)

---

## Objetivo

Reorganizar a página do administrador com base em questões apontadas na validação:

1. **Bug: ajuste de saldo não refletia no operador.** Ao entrar na página do operador (`OperadorDetail`) não havia como ajustar o Caixa Base dele — o único ajuste do sistema (`CaixaPage`) sempre grava no `req.userId` (o próprio admin logado). Corrigir expondo o ajuste na página do operador, gravando no operador correto (`?usuarioId=`).
2. **Cards de operadores fora do padrão.** O `OperadoresList` usava botões de ícones avulsos (`min-w-[44px]`) e badge solto — quebra/overflows em telas estreitas e "tag por cima do nome". Adotar o padrão `Card`/`Card.Actions`/`QuickActions` (como `EmpresaList`).
3. **Usuário corrente não aparecia na Equipe.** `OperadoresList` filtrava `op.id !== user.id`. Passar a exibir o próprio admin na ordem alfabética, com tag "Eu" e sem ações de editar/remover no próprio card.
4. **Ordem da equipe.** Administradores no topo, operadores abaixo; ordem alfabética dentro de cada grupo.
5. **KPIs clicáveis.** Cada KPI da página admin navega ou abre modal, seguindo o padrão de `KpiCard` com `onClick` já usado no sistema.
6. **Escopo dos KPIs de Operação.** `totalClientes`/`contratosAtivos`/`resultadoDoDia` agregavam a **empresa inteira**, mas as telas `/clientes`/`/contratos` e o caixa filtram **por usuário logado** — números divergiam ao navegar. Definido: no admin self os KPIs passam a refletir os dados do próprio usuário (escopo bate com a navegação); o super admin mantém a visão de empresa.

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Escopo dos KPIs de Operação | Admin self → por `req.userId`; super admin → por empresa | Navegar para `/clientes`/`/contratos` passa a bater com os KPIs do admin self; super admin mantém visão agregada da empresa |
| Ajuste de Caixa Base | Bloco no `OperadorDetail` com input monetário + `POST /caixa/ajuste?usuarioId=<operador>` | Endpoint e validação de escopo (`resolveUsuarioAlvo`) já existiam; faltava a UI |
| Card de operador | Padrão `Card.Root`/`Card.Header`/`Card.Body`/`Card.Actions` + `QuickActions` | Mesmo padrão da `EmpresaList`/`ClienteCard` — ícones compactos, sem overflow |
| Tag "Eu" | `StatusBadge variant="success"` no card do próprio usuário, sem ações de editar/remover | Diferencia o usuário logado sem expor auto-ações |
| Ordenação da equipe | `super_admin`/`admin` no topo, depois `operator`; alfabético por nome em cada grupo | Admins são os sócios/gestores da operação |
| KPIs clicáveis | Equipe (admins/operadores) → modal; Clientes/Contratos → navegação (admin self); Resultado do Dia → modal com movimentações do dia | Reusa `KpiCard onClick` + modais no padrão `PagamentosHojeModal` |
| Diferenciação Admins × Operadores | Labels (badges de role) + admins no topo | Conceito de "Sócio" fica para evolução futura (decidido com o usuário) |

---

## Fases de implementação

```
Fase 1 (backend dashboard por usuário) → Fase 2 (OperadoresList) → Fase 3 (AdminPage KPIs + modais) → Fase 4 (OperadorDetail ajuste) → Fase 5 (i18n) → Fase 6 (docs)
```

### Fase 1 — Backend: dashboard escopado por usuário

**Arquivos:** 2 alterados

- `src/modules/admin/application/ports/admin.repository.ts`: `getDashboardStats(empresaId?, userId?)`.
- `src/modules/admin/infrastructure/repositories/admin.repository.impl.ts`: quando `userId` presente, `totalClientes`/`contratosAtivos`/`recebidoHoje`/`entradas`/`saídas` filtram por `userId`; `totalAdmins`/`totalOperadores` continuam por empresa.
- `src/modules/admin/presentation/controllers/admin.controller.ts`: no `dashboard`, admin self (`req.userRole === "admin"` sem `?empresaId=`) chama com `(req.empresaId, req.userId)`; demais seguem por empresa.

**Checklist Fase 1**

- [x] Port com `userId` opcional
- [x] Queries de operação filtradas por `userId` quando presente
- [x] Controller detecta admin self e repassa `req.userId`
- [x] `npx tsc --noEmit` verde (backend)

---

### Fase 2 — OperadoresList: padrão de cards + ordem + usuário corrente

**Arquivo:** 1 alterado

- `frontend/src/modules/admin/components/OperadoresList.tsx`:
  - Reestruturação para `Card.Root variant="list-item"` → `Card.Header` (`flex-wrap`, nome `min-w-0 flex-1 truncate` + badges), `Card.Body` (email + `Card.Indicators` com clientes/contratos), `Card.Actions`/`QuickActions` (Acessar/Editar/Remover).
  - Remove o filtro `op.id !== user.id` — o próprio usuário aparece na lista.
  - Ordenação: role rank (`super_admin`=0, `admin`=1, `operator`=2) e depois nome.
  - Tag "Eu" (`admin.eu`, `StatusBadge success`) no card do usuário logado; `show: false` para editar/remover no próprio card.

**Checklist Fase 2**

- [x] Padrão `Card`/`QuickActions`
- [x] Usuário corrente visível com tag "Eu"
- [x] Admins no topo, ordem alfabética

---

### Fase 3 — AdminPage: KPIs clicáveis + modais

**Arquivos:** 2 novos + 1 alterado

- `frontend/src/modules/admin/components/EquipeModal.tsx`: **novo** — lista filtrada por role (admin/operator) com badge, no padrão `PagamentosHojeModal`.
- `frontend/src/modules/admin/components/ResultadoDiaModal.tsx`: **novo** — lista movimentações do dia (`listarMovimentacoes({dataInicio, dataFim} = hoje)`) com entradas/saídas/resultado.
- `frontend/src/modules/admin/pages/AdminPage.tsx`:
  - Header com `flex-wrap`/`min-w-0` (badge não sobrepõe o nome).
  - `totalAdmins`/`totalOperadores` → `EquipeModal`.
  - `totalClientes`/`contratosAtivos` → `navigate("/clientes"|"/contratos")` (apenas admin self).
  - `resultadoDia` → `ResultadoDiaModal` (apenas admin self).

**Checklist Fase 3**

- [x] Header sem sobreposição
- [x] KPIs de equipe abrem modal
- [x] KPIs de operação navegam (admin self) / abrem modal de resultado
- [x] Super admin mantém exibição (sem clique) nos KPIs de operação

---

### Fase 4 — OperadorDetail: ajuste de Caixa Base do operador

**Arquivo:** 1 alterado

- `frontend/src/modules/admin/pages/OperadorDetail.tsx`:
  - Bloco "Ajustar caixa base do operador" (`admin.ajustarCaixaOperador`) abaixo dos KPIs do caixa.
  - Input `maskMonetario`/`unmaskMonetario` + botão salvar (`caixa.ajustarSalvar`) + `useFeedback`.
  - `ajustarCaixaBase(valor, operador.id)` → refetch do caixa. O backend valida que o operador pertence à empresa do admin (`resolveUsuarioAlvo`).

**Checklist Fase 4**

- [x] Bloco de ajuste no padrão da `CaixaPage`
- [x] Grava no operador correto via `?usuarioId=`
- [x] Refetch após salvar

---

### Fase 5 — i18n

**Arquivos:** 3 alterados (`frontend/src/i18n/locales/{pt-BR,en,es}.json`)

- `admin.eu`: Eu / Me / Yo
- `admin.ajustarCaixaOperador`: Ajustar caixa base do operador / Adjust operator cash base / Ajustar base de caja del operador
- `admin.modalAdmins`: Administradores / Administrators / Administradores
- `admin.modalOperadores`: Operadores / Operators / Operadores
- `admin.modalResultadoDia`: Resultado do Dia / Daily Result / Resultado del Día
- `admin.acessar`/`editar`/`remover`: Acessar/Editar/Remover (labels das QuickActions)
- `caixa.entradas`/`caixa.saidas`: Entradas/Saídas (modal de resultado)

**Checklist Fase 5**

- [x] JSON válidos nas 3 línguas
- [x] `npx tsc --noEmit` verde (frontend)

---

### Fase 6 — Documentação

- [x] `docs/plans/PLAN-024-admin-organizacao-kpis.md` — este plano
- [x] `docs/plans/README.md`: entrada PLAN-024
- [x] `docs/product/02-BUSINESS-RULES.md`: BR-087 (dashboard admin self escopado por usuário)
- [x] `docs/engineering/05-MAPEAMENTO-TELAS.md`: OperadoresList, EquipeModal, ResultadoDiaModal, OperadorDetail
- [x] `docs/engineering/02-API.md`: nota do escopo por usuário no dashboard admin
- [x] `docs/UPDATES.md`: entrada do PLAN-024

---

## Regras de negócio (novas/alterações propostas)

- **BR-087 (NOVA)** — No painel admin, quando o administrador acessa o próprio painel (admin self, sem `?empresaId=`), os KPIs de Operação (`totalClientes`, `contratosAtivos`, `recebidoHoje`, `resultadoDoDia`) são escopados aos dados do próprio usuário logado. O super admin (ou admin visualizando uma empresa via `?empresaId=`) continua vendo o agregado da empresa.

---

## Resultados de validação

- `npx tsc --noEmit` → OK (backend e frontend).
- `npm run build` → OK (só warning pré-existente de chunk > 500 kB).
- Teste do dashboard escopado em DB temporário (`better-sqlite3` in-memory): empresa com admin (1 cliente/1 contrato/100 recebido/70 resultado) e operador (1 cliente/1 contrato/50 recebido). Admin self → `{1,1,100,70}`; empresa → `{2,2,150,120}`. **Confirmado: escopo por usuário e por empresa corretos.**
- Ajuste de caixa por `?usuarioId=` já validado no PLAN-020 (admin ajusta caixa do operador → 201; `usuarioId` de outra empresa → 404).
- Deploy no VPS → não executado nesta sessão (a pedido do usuário).

## Correções do code review (01/08/2026)

Ajustes aplicados após a revisão do commit `aceb8a5`:

- **Mensagem de erro do ajuste:** `OperadorDetail` usava `admin.erroCarregar` ("Erro ao carregar dados de administração") para falha no ajuste de caixa. Corrigido para `caixa.ajustarErro` ("Erro ao ajustar caixa.") — nova chave nos 3 idiomas.
- **Feedback de valor inválido:** `handleAjustar` descartava `valor <= 0` silenciosamente. Agora dispara `feedback.show` com `caixa.ajustarValorInvalido` ("Informe um valor maior que zero.") — nova chave nos 3 idiomas.
- **Destaque do remover:** o botão Remover do `OperadoresList` usava `variant: "gray"` (perdeu o vermelho de perigo). Adicionada a variante `danger` ao `QuickActions` e ao `Card.Actions` (`text-danger-text`/`hover:bg-danger-light`) e aplicada ao remover.

---

## Referências

- `src/modules/admin/infrastructure/repositories/admin.repository.impl.ts`
- `src/modules/admin/presentation/controllers/admin.controller.ts`
- `frontend/src/modules/admin/components/{OperadoresList,EquipeModal,ResultadoDiaModal}.tsx`
- `frontend/src/modules/admin/pages/{AdminPage,OperadorDetail}.tsx`
- `frontend/src/modules/caixa/pages/CaixaPage.tsx` (padrão de ajuste)
- `docs/plans/PLAN-021-admin-contexto-kpis.md`, `PLAN-022-admin-kpis-ajuste.md`
