# PLAN-020 — Admin → Operador (drill-down) + Caixa Base definido pelo Admin + Fix cálculo do Caixa

**Status:** Concluído

**Versão:** 1.1

**Data:** 01/08/2026

**Roadmap:** product/04-ROADMAP.md (Multi-tenant → drill-down por operador)

**Dependências:**
- PLAN-017 (Admin Panel + Níveis Permissionais)
- PLAN-019 (Multi-Tenant: Super Admin + Empresas)

---

## Objetivo

1. **Drill-down "Admin → Operador"**: o admin (e o super_admin) visualiza os dados de um operador da sua empresa — KPIs do caixa do operador em tela própria (`OperadorDetail`), com navegação a partir da lista de operadores.
2. **Admin define o Caixa Base do operador**: o admin ajusta o caixa base de um operador (`POST /api/caixa/ajuste?usuarioId=`); o operador vê o Caixa Base **read-only** (KPI visível, sem seção de ajuste).
3. **Fix do cálculo do caixa** (bug relatado em produção): ao definir o Caixa Base, o sistema gravava uma movimentação financeira de origem `Ajuste` que era **somada** ao saldo/lucro, dobrando os valores.

## Decisões de design (confirmadas)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Modelo de dados | Admin mantém os próprios dados operacionais; telas operacionais seguem `req.userId`-scoped | Sem duplicação de telas; admin usa as mesmas telas que o operador |
| Aba padrão do painel admin | **"Equipe"** — operadores + KPIs da empresa + drill-down | Operação principal do admin |
| Aba secundária | **"Meus dados"** — resumo KPI do próprio admin + links para suas telas operacionais (opção a: resumo + links, sem conteúdo embutido) | Evita renderizar telas operacionais dentro do admin |
| `super_admin` | Oculta "Meus dados" (não tem dados operacionais próprios) | Coerente com o modelo |
| Operador | Mantém tudo do próprio; **Caixa Base read-only**; "Fechar Semana" (liquidar) permanece disponível (G6) | Escopo aprovado |
| Fora de escopo ("depois") | Admin excluir pagamentos/faturas errados; refinamento de agregados | Não bloqueia a entrega |
| Fix do cálculo | `AjustarCaixaBaseUseCase` **não grava movimentação** — a base é o registro | Elimina a dobra no saldo/lucro |
| Rota de ajuste | Reuso de `POST /api/caixa/ajuste` com `?usuarioId=` (admin/super_admin) | Sem endpoint novo |

---

## Diagnóstico

### Bug de cálculo do caixa (relatado em produção)

| Fato | Evidência |
|------|-----------|
| Seed `caixa_config` grava `userId: NULL` | `src/database.ts:243` |
| `getCaixaConfig` filtra `id='default' AND userId` → operador sem config → `null` → 404 no `ajustar` | `caixa.repository.impl.ts:12`; `AjustarCaixaBaseUseCase.ts:11` |
| `AjustarCaixaBaseUseCase` grava movimento `Ajuste` com `descricao: "Ajuste manual do Caixa Base"` | `AjustarCaixaBaseUseCase.ts:19-27` |
| `getSaldoAtual` = `caixaBase + entradas − saidas` (sem filtrar origem) | `caixa.repository.impl.ts:158-176` |
| `getLucro` = `entradas − saidas` (sem filtrar origem) | `caixa.repository.impl.ts:178-186` |

**Cadeia da dobra:** definir base = 5000 com base 0 → `diferenca = 5000` → `caixaBase = 5000` ✅ + movimento `entrada +5000 (Ajuste)` ❌ → `saldoAtual = 5000 + 5000 = 10000` ❌; `lucro = 5000` ❌ (base não é lucro).

**Fix:** remover o `saveMovimentacaoFinanceira` do `AjustarCaixaBaseUseCase`. A base é contada via `caixaBase`; sem o movimento fantasma, saldo/lucro ficam corretos.

> **Importante:** o `Ajuste` do ajuste de contrato (`UpdateContratoUseCase.ts:80`, `descricao: "Ajuste de valor base do contrato (...)"`) é **legítimo** e deve continuar gerando movimentação. A limpeza de dados deve filtrar apenas `descricao = 'Ajuste manual do Caixa Base'` — nunca a do contrato.

### Bug multi-usuário do caixa (produção)

A tabela `caixa_config` tem PK `id` (default `'default'`, 1 linha global) + coluna `userId`. Como o seed grava a linha com `userId NULL` e o repo filtra por `userId`, **nenhum operador tem caixa config** — `AjustarCaixaBaseUseCase` lança `CaixaNotFoundError` (404). A migração move a PK para `userId`, dando 1 linha por usuário.

---

## Gaps identificados (G1–G27)

| # | Gap | Resolução |
|---|-----|-----------|
| G1 | Migração PK `caixa_config`: linha órfã (`userId NULL`) | Rebuild (padrão `usuarios_new` de `database.ts:337-359`); linha órfã → vira do admin; sem admin → descarta (getOrCreate recria) |
| G2 | KPI `totalOperadores` vira 1 por operador no `OperadorDetail` | Ocultar esse KPI na tela de detalhe (mostrar só dados do operador) |
| G3 | `OperadorDetail` deve buscar via `GET /admin/operadores/:id` | Novo endpoint; não depender do estado da lista |
| G4 | Super admin no drill-down precisa de `?empresaId=` na URL | Passar `?empresaId=` + `?usuarioId=` juntos no frontend |
| G5 | Operador forjando `?usuarioId=` | `resolveUsuarioAlvo`: operator → sempre `req.userId`; admin/super_admin → valida `?usuarioId=` (admin: dentro do `req.empresaId`; super_admin: existência) |
| G6 | "Fechar Semana" (liquidar) permanece para o operador | Confirmado — não remover `POST /caixa/liquidar` do operador |
| G7 | Primeira definição de Caixa Base grava movimentação "Ajuste" | Após o fix (Fase 0), **não** grava movimentação — consistente |
| G8 | Esconder "Meus dados" para super_admin | Condicional por role no frontend |
| G9 | Docs desatualizados | Fase 4: `02-API.md`, PLAN-020, CHECKLIST |
| G10 | Sem framework de testes no repo | Validação manual via curl (documentada em cada fase) |
| G11 | `updateCaixaBase` é delta (`caixaBase + valor`), semântica de valor absoluto preservada via `diferenca` | Mantido — `diferenca = input.valor − caixa.caixaBase` |
| G12 | **Dobra no saldo/lucro ao definir base** | Fase 0: não gravar movimento no ajuste + limpeza de dados órfãos |
| G13 | `getSaldoAtual`/`getLucro` somam tudo sem filtrar origem | **Não alterar** — movimentos de contrato/pagamento/gasto/cancelamento são legítimos; o fix é na origem (não criar o movimento do caixa) |
| G14 | Movimentação órfã `Ajuste` pode ter `origemId=''` | Limpeza filtra por `descricao` exata — segura |
| G15 | OperadorDetail pode precisar de KPIs de operações (`/api/operacoes/*` não tem `?usuarioId=`) | **Escopo:** OperadorDetail mostra KPIs do **caixa** (`GET /caixa?usuarioId=`) + contagens de `findById`. Não estender `/api/operacoes/*` nesta entrega (anotar como futuro) |
| G16 | `ProtectedRoute` não tem guard de role — operator pode abrir `/admin/operadores/:id` | Novo `AdminRoute` (role `admin`/`super_admin`) nas rotas `/admin*` |
| G17 | Admin aparece na própria lista de operadores | Ocultar o próprio admin da lista "Equipe" (role `admin`); super_admin vê todos |
| G18 | Fonte de dados da aba "Meus dados" | Reuso: `GET /caixa` (dados do próprio admin via `req.userId`) + `findById(req.userId)` + links para telas operacionais. Sem endpoint novo |
| G19 | `POST /caixa/ajuste` precisa bloquear operator por completo | No controller: `req.userRole === 'operator'` → 403 (o operator não ajusta nem a própria base) |
| G20 | `req.empresaId` vem do JWT (pode estar ausente em token antigo) | `resolveUsuarioAlvo` valida alvo via banco (`findById`/`findAllOperadores`), não só token |
| G21 | Chaves i18n de abas não existem | Criar `admin.*` novas (equipe, meusDados, acessar, etc.) nas 3 línguas |
| G22 | Migração PK precisa de rebuild + seed + filtros do repo detalhados | Documentado na Fase 1 (SQL + código) |
| G23 | `listarMovimentacoes` resolve cliente de origem `Ajuste` via `origemId` | Com o fix, o caso de caixa morre; sem crash (`origemId: ""` → subselect NULL). Sem ação |
| G24 | Super admin no OperadorDetail: `?empresaId=` + `?usuarioId=` | Implementado no frontend (Fase 3) |
| G25 | `saldoAtual` pós-liquidação usa `dataInicio` | `LiquidarSemana` usa só Pagamento/Gasto — Ajuste nunca entrou. Validar por curl na Fase 0 |
| G26 | `totalOperadores` conta o próprio admin | KPI da aba "Equipe" segue o backend (conta não-super_admin); o próprio admin é **ocultado da lista** (G17). Decisão final: manter backend e ocultar da lista (ver Fase 3.3) — KPI mostra membros da empresa, lista mostra os demais |
| G27 | Ordem de deploy Fase 0 → Fase 1 | Fase 0 é independente e vai primeiro (fix crítico); Fase 1 desbloqueia caixa por operador |

---

## Fases de implementação

```
Fase 0 (Fix cálculo) → Fase 1 (caixa multi-usuário) → Fase 2 (admin define caixa base)
    → Fase 3 (drill-down + abas) → Fase 4 (docs)
```

### Fase 0 — Fix do cálculo do caixa (crítico, vai primeiro)

**Arquivos:** 2 alterados

#### 0.1 — `AjustarCaixaBaseUseCase`: remover a gravação de movimentação

Remover as linhas 19–27 (o objeto `mov` + `saveMovimentacaoFinanceira`). O `updateCaixaBase(userId, diferenca)` permanece — a base é o registro.

```typescript
// Antes (AjustarCaixaBaseUseCase.ts:19-27)
await this.repository.updateCaixaBase(userId, diferenca)
await this.repository.saveMovimentacaoFinanceira(userId, { /* origem: "Ajuste" ... */ })

// Depois
await this.repository.updateCaixaBase(userId, diferenca)
```

#### 0.2 — Limpeza de dados (migração no `createTables()`)

Após a migração de normalização de datas, adicionar:

```typescript
// Limpeza: remover movimentações fantasma do ajuste manual do Caixa Base
// (a base é contada via caixaBase — movimento duplicava saldo/lucro). Não
// toca no "Ajuste de valor base do contrato" (legítimo).
sqlite.exec(`
  DELETE FROM movimentacoesFinanceiras
  WHERE origem = 'Ajuste' AND descricao = 'Ajuste manual do Caixa Base'
`)
```

Idempotente (segunda execução não apaga nada). Segura: filtra por `descricao` exata.

#### 0.3 — Validação manual (curl)

1. Subir backend (`npm run dev:backend`), login como admin → token.
2. `POST /api/caixa/ajuste {"valor":5000}` → `{ "caixaBase": 5000 }`.
3. `GET /api/caixa` → `caixaBase: 5000`, `saldoAtual: 5000`, `lucro: 0`.
4. Criar pagamento/contrato e conferir reflexo no saldo; criar gasto e conferir subtração.
5. Conferir `GET /api/caixa/movimentacoes` — sem entrada "Ajuste".

**Checklist Fase 0**

- [x] `AjustarCaixaBaseUseCase` não grava movimentação
- [x] Limpeza idempotente no `createTables()`
- [x] curl: base 5000 → saldo 5000, lucro 0; pagamento +1000 → saldo 6000; gasto −200 → saldo 5800
- [x] `npm run build` verde

---

### Fase 1 — Caixa multi-usuário (migração PK + getOrCreate)

**Arquivos:** 3 alterados

#### 1.1 — Schema Drizzle (`src/database.ts`)

```typescript
export const caixaConfig = sqliteTable("caixa_config", {
  userId: text("userId").primaryKey(),
  caixaBase: real("caixaBase").notNull().default(0),
  updatedAt: text("updatedAt").notNull(),
})
```

#### 1.2 — `createTables()` — SQL + migração (rebuild)

- `CREATE TABLE IF NOT EXISTS caixa_config` atualizado para `userId TEXT PRIMARY KEY, caixaBase REAL NOT NULL DEFAULT 0, updatedAt TEXT NOT NULL`.
- Seed global (`id='default'`) **removido** — cada usuário ganha linha via `getOrCreateCaixaConfig`.
- Migração para bancos existentes (padrão `usuarios_new`):

```typescript
try {
  sqlite.exec("BEGIN IMMEDIATE")
  sqlite.exec(`
    CREATE TABLE caixa_config_new (
      userId TEXT PRIMARY KEY,
      caixaBase REAL NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    )
  `)
  // Linhas com userId válido → preservadas; órfã (userId NULL) → vira do admin (primeiro admin ativo);
  // sem admin → descartada (getOrCreate recria)
  sqlite.exec(`
    INSERT INTO caixa_config_new (userId, caixaBase, updatedAt)
    SELECT
      COALESCE(
        cc.userId,
        (SELECT u.id FROM usuarios u WHERE u.role IN ('admin','super_admin') AND u.deletedAt IS NULL LIMIT 1)
      ),
      cc.caixaBase,
      cc.updatedAt
    FROM caixa_config cc
    WHERE COALESCE(
      cc.userId,
      (SELECT u.id FROM usuarios u WHERE u.role IN ('admin','super_admin') AND u.deletedAt IS NULL LIMIT 1)
    ) IS NOT NULL
  `)
  sqlite.exec("DROP TABLE caixa_config")
  sqlite.exec("ALTER TABLE caixa_config_new RENAME TO caixa_config")
  sqlite.exec("COMMIT")
} catch {
  try { sqlite.exec("ROLLBACK") } catch {}
}
```

> Em banco novo, o `CREATE TABLE IF NOT EXISTS` já cria com a PK nova e a migração não faz nada (tabela igual). A primeira chamada de `getOrCreate` cria a linha.

#### 1.3 — `ICaixaRepository` + `CaixaRepository`

```typescript
// ports/caixa.repository.ts — adicionar
getOrCreateCaixaConfig(userId: string): Promise<CaixaConfig>
```

```typescript
// impl — getCaixaConfig deixa de filtrar id='default'
async getCaixaConfig(userId: string): Promise<CaixaConfig | null> {
  const rows = await db.select().from(caixaConfig).where(eq(caixaConfig.userId, userId)).limit(1)
  if (rows.length === 0) return null
  return { userId: rows[0].userId, caixaBase: rows[0].caixaBase, updatedAt: rows[0].updatedAt }
}

async getOrCreateCaixaConfig(userId: string): Promise<CaixaConfig> {
  const existing = await this.getCaixaConfig(userId)
  if (existing) return existing
  const now = new Date().toISOString()
  await db.insert(caixaConfig).values({ userId, caixaBase: 0, updatedAt: now })
  return { userId, caixaBase: 0, updatedAt: now }
}

// updateCaixaBase — remove id='default'
async updateCaixaBase(userId: string, valor: number): Promise<void> {
  const now = new Date().toISOString()
  await db
    .update(caixaConfig)
    .set({ caixaBase: sql`${caixaConfig.caixaBase} + ${valor}`, updatedAt: now })
    .where(eq(caixaConfig.userId, userId))
}
```

- `CaixaConfig` entity (`caixa.entity.ts`) passa a `{ userId, caixaBase, updatedAt }`.
- `AjustarCaixaBaseUseCase` usa `getOrCreateCaixaConfig` no lugar de `getCaixaConfig` + `throw CaixaNotFoundError` (deixa de lançar 404; `CaixaNotFoundError` pode permanecer no domain errors por compat, mas não é mais lançado aqui).

**Checklist Fase 1**

- [x] PK `userId` na Drizzle + SQL
- [x] Seed global removido; getOrCreate cria por usuário
- [x] Migração rebuild idempotente
- [x] Repo sem `id='default'`
- [x] `CaixaNotFoundError` não é mais lançado no ajuste
- [x] `npm run build` verde

---

### Fase 2 — Admin define o Caixa Base do operador (operador read-only)

**Arquivos:** 4 alterados + 1 novo

#### 2.1 — `src/shared/utils/scope.ts` (novo) — `resolveUsuarioAlvo`

```typescript
// Retorna o userId alvo de uma operação de caixa.
// - operator: sempre req.userId (ignora ?usuarioId= — bloqueia forgery)
// - admin: valida ?usuarioId= dentro do req.empresaId (via admin repository findById)
// - super_admin: valida ?usuarioId= existente (findById sem filtro de empresa)
export async function resolveUsuarioAlvo(
  req: Request,
  adminRepo: IAdminRepository
): Promise<{ userId: string }>
```

- Admin/super_admin com `?usuarioId=` ausente → usam `req.userId` (próprio).
- `findById` retorna null (não encontrado / fora da empresa) → `OperadorNaoEncontradoError` (404).

#### 2.2 — `caixa.controller.ts` + rotas

- `getStatus`, `listMovimentacoes`: usam `resolveUsuarioAlvo` no lugar de `req.userId` direto.
- `ajustar`: **bloqueia operator** (`403`) + usa `resolveUsuarioAlvo` + `getOrCreateCaixaConfig`.
- `liquidar`: permanece `req.userId` (G6) — não aceita `?usuarioId=`.
- `caixa.routes.ts` não muda (já montada em `/api/caixa`).

#### 2.3 — Frontend `caixa.service.ts`

- `getCaixaStatus(dataInicio?, dataFim?, usuarioId?)` — adiciona `usuarioId` ao query string.
- `ajustarCaixaBase(valor, usuarioId?)`.
- `listarMovimentacoes(params?, usuarioId?)`.

#### 2.4 — Frontend `CaixaPage.tsx` (operador read-only)

- Com base em `user.role === 'operator'`: ocultar a seção "Ajustar Caixa Total" (linhas 397–416).
- KPI "Base do Caixa" continua visível (read-only).

**Checklist Fase 2**

- [x] `resolveUsuarioAlvo` criado (operator → req.userId; admin → dentro da empresa; super_admin → existência)
- [x] `ajustar` bloqueia operator (403)
- [x] `getStatus`/`listMovimentacoes` aceitam `?usuarioId=`
- [x] `liquidar` permanece `req.userId`
- [x] CaixaPage oculta "Ajustar" para operator
- [x] `npm run build` verde

---

### Fase 3 — Drill-down + abas do painel admin

**Arquivos:** ~8 alterados + 2 novos

#### 3.1 — Backend: `GET /admin/operadores/:id`

- `admin.controller.ts`: handler `getOperador` → `findById(req.params.id, resolveEmpresaId(req))`.
- `admin.routes.ts`: `router.get("/operadores/:id", controller.getOperador)`.

#### 3.2 — Frontend: guard de role

- Novo `frontend/src/shared/auth/AdminRoute.tsx`: role `admin`/`super_admin` senão redireciona.
- `App.tsx`: rotas `/admin`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/operadores/:id` envolvidas em `AdminRoute`.

#### 3.3 — Frontend: AdminPage com abas

- Segmented control inline (não existe componente de tabs no projeto).
- Aba **Equipe** (default): KPIs da empresa + `OperadoresList` + "Acessar".
  - `totalOperadores` → conta só `role='operator'` (G26) — ajustar `getDashboardStats` ou subtrair admins no frontend; decisão: ajustar no backend `getDashboardStats` para contar `role='operator'`? **Decisão:** manter backend como está (conta não-super_admin) e **ocultar o próprio admin da lista** (G17); KPI continua "Operadores" contando membros da empresa.
- Aba **Meus dados** (admin apenas): `GET /caixa` (próprio admin) → KPIs + links para `/caixa`, `/clientes`, `/contratos`. Super admin não vê (G8).

#### 3.4 — Frontend: OperadoresList com "Acessar"

- Novo botão (ícone `ArrowRight`, padrão de `EmpresaList.tsx:28-34`) → `navigate(/admin/operadores/${op.id})`.
- Ocultar o próprio admin da lista quando `role === 'admin'` (G17).

#### 3.5 — Frontend: OperadorDetail (novo)

- Rota `/admin/operadores/:id`.
- Busca `GET /admin/operadores/:id` (+ `?empresaId=` se super_admin) e `GET /caixa?usuarioId=` (+ `?empresaId=` não é preciso no caixa — super_admin valida existência).
- Exibe: nome/email/role, `totalClientes`, `contratosAtivos`, e KPIs do caixa do operador (caixaBase, saldoAtual, lucro, aReceberHoje, recebidoHoje, recebidoSemana). Sem `totalOperadores` (G2). Sem seção de ajuste (read-only).

#### 3.6 — i18n (3 línguas)

Novas chaves `admin.*`: `equipe`, `meusDados`, `acessar`, `operadorDetail`, `caixaOperador`, `cliente.count`, `contrato.count` etc.

**Checklist Fase 3**

- [x] `GET /admin/operadores/:id` no backend
- [x] `AdminRoute` protege `/admin*`
- [x] AdminPage com abas (Equipe default / Meus dados)
- [x] OperadoresList com "Acessar" e sem o próprio admin
- [x] OperadorDetail renderiza KPIs do caixa do operador
- [x] i18n pt-BR/en/es
- [x] `npm run build` verde

---

### Fase 4 — Documentação

- [x] `docs/engineering/02-API.md`: novos endpoints/params (`?usuarioId=`, `GET /admin/operadores/:id`, `POST /caixa/ajuste` restrito a admin+)
- [x] `docs/engineering/tasks/2026-08-01/CHECKLIST.md`: registro do dia
- [x] PLAN-020 status final + gaps resolvidos

---

## Regras de negócio (novas/alterações propostas)

- **BR-078 (NOVA)** — Caixa Base é definido pelo admin: operador não ajusta o próprio Caixa Base (read-only). `POST /api/caixa/ajuste` exige role `admin`/`super_admin`; `?usuarioId=` opcional para ajustar a base de um operador da empresa.
- **BR-079 (NOVA)** — Drill-down do admin: `GET /api/admin/operadores/:id` e KPIs de caixa via `GET /api/caixa?usuarioId=` permitem ao admin (e super_admin) visualizar os dados de um operador da empresa, sem modificá-los.
- **BR-080 (NOVA)** — Ajuste de Caixa Base não gera movimentação financeira: a base é o registro; evita duplicar saldo/lucro.

---

## Resultados de validação

- `npm run build` verde em todas as fases; `npx tsc --noEmit` verde (backend).
- **Fase 0:** base 5000 → saldo 5000 / lucro 0; contrato 1000 → saldo 4000; pagamento 366.67 → saldo 4366.67; gasto 200 → saldo 4800 / lucro −200; `movimentacoes` sem "Ajuste" fantasma.
- **Fase 1:** migração de banco antigo (linha órfã → admin; sem admin → descarta) idempotente; operador ajusta base sem 404 (bug de produção eliminado).
- **Fase 2:** operator `POST /api/caixa/ajuste` → 403; admin ajusta base do operador (`?usuarioId=`) → 201; forgery de `?usuarioId=` por operator é ignorada (fica o próprio); alvo inexistente → 404; operador de outra empresa → 404.
- **Fase 3:** `GET /api/admin/operadores/:id` → 200 (dentro da empresa) / 404 (fora/inexistente); super_admin funciona com e sem `?empresaId=`; `GET /caixa?usuarioId=` cross-empresa → 404 (corrigido `getStatus` que retornava 500).

---

## Referências

- `src/database.ts`, `src/modules/caixa/**`, `src/modules/admin/**`, `src/shared/**`
- `frontend/src/modules/{admin,caixa}/**`, `frontend/src/shared/**`, `frontend/src/App.tsx`
- `docs/plans/PLAN-017-admin-panel.md`, `PLAN-019-multi-tenant.md`
- `docs/engineering/02-API.md`
