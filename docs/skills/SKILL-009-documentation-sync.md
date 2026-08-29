# SKILL-009 — Documentation Sync

**Status:** Aprovada

**Versão:** 1.0

**Última atualização:** 03/08/2026

---

# Objetivo

Manter a documentação do projeto **sempre alinhada ao código**, atualizando **cada ponto afetado** quando algo muda. Define:

1. **Mapa de navegação** — onde mora cada informação (o agente navega sem adivinhar);
2. **Fontes canônicas** — onde a verdade é decidida;
3. **Matriz de propagação** — "mudou X, atualize Y";
4. **Auditoria** — como detectar divergências (script `scripts/audit-docs.mjs`).

Esta skill **implementa código** somente quando a mudança é documentação/código de suporte (`scripts/audit-docs.mjs`, `scripts/build-collection.mjs`). Nunca altera feature code sem um PLAN.

---

# 1. Mapa de navegação

| Eu quero saber... | Documento | Caminho |
|---|---|---|
| Visão geral / índice | INDEX.md | `docs/INDEX.md` |
| Rotas reais da API | Código-fonte (fonte canônica) | `src/modules/**/presentation/routes/*.routes.ts` + mounts em `src/main.ts` |
| Contrato da API (request/response) | 02-API | `docs/engineering/02-API.md` |
| Casos de uso + cenários de teste da API | 07-CASOS-DE-USO-API | `docs/product/07-CASOS-DE-USO-API.md` |
| Executar os cenários da 07 (smoke) | scripts/smoke-api.mjs | `scripts/smoke-api.mjs` (`npm run smoke:api`) |
| Collection Postman (executável) | api-collection.json | `docs/api-collection.json` (gerada por `scripts/build-collection.mjs`) |
| Telas existentes | 05-MAPEAMENTO-TELAS | `docs/engineering/05-MAPEAMENTO-TELAS.md` |
| Rotas reais do front | App.tsx (fonte canônica) | `frontend/src/App.tsx` |
| Casos de uso por fluxo de tela | 06-CASOS-DE-USO | `docs/product/06-CASOS-DE-USO.md` |
| Regras de negócio | 02-BUSINESS-RULES | `docs/product/02-BUSINESS-RULES.md` |
| Entidades/domínio | 01-DOMAIN | `docs/product/01-DOMAIN.md` |
| Roadmap / fases | 04-ROADMAP | `docs/product/04-ROADMAP.md` |
| Planos de implementação | plans/README | `docs/plans/README.md` |
| Backlog do produto | BACKLOG | `docs/plans/BACKLOG.md` |
| Changelog recente | UPDATES | `docs/UPDATES.md` |
| Processos (skills) | skills/README | `docs/skills/README.md` |

---

# 2. Fontes canônicas

A verdade é decidida **no código**, e a documentação a espelha:

| Artefato | Fonte canônica | Espelhos (devem seguir a fonte) |
|---|---|---|
| Endpoints | `src/modules/**/routes/*.routes.ts` + `src/main.ts` | `02-API.md` · `07-CASOS-DE-USO-API.md` · `api-collection.json` |
| Comportamento dos endpoints | `scripts/smoke-api.mjs` (executável dos CTs da `07`) | `07-CASOS-DE-USO-API.md` (conferências/CTs devem descrever o que o smoke valida) |
| Telas | `frontend/src/App.tsx` | `05-MAPEAMENTO-TELAS.md` · contagens do `04-ROADMAP.md` |
| Regras de negócio | `02-BUSINESS-RULES.md` (documentada ANTES do código — BR-034) | UCs (`06`/`07`) · `01-DOMAIN.md` |
| Componentes | `frontend/src/shared/components/` + `modules/*/components/` | `05-MAPEAMENTO-TELAS.md` (árvore) · `04-ROADMAP.md` (contagens) |
| Status de plano | frontmatter do `docs/plans/PLAN-*.md` | `docs/plans/README.md` · `04-ROADMAP.md` |

---

# 3. Matriz de propagação

> **Regra de ouro:** nenhuma mudança é "só código" ou "só doc". Ao mudar algo, percorra a linha correspondente e atualize **todos** os espelhos.

| Mudou... | Atualize obrigatoriamente... | Verifique também |
|---|---|---|
| **Endpoint novo/alteração de contrato** | `02-API.md` · `07-CASOS-DE-USO-API.md` (API-UC + API-CT) · `api-collection.json` (via `scripts/build-collection.mjs`) | `06-CASOS-DE-USO.md` se o front consome (UC de fluxo) · BR se houver regra nova |
| **Tela/rota front nova ou removida** | `05-MAPEAMENTO-TELAS.md` (tabela + árvore + seção) · contagens do `04-ROADMAP.md` | `06-CASOS-DE-USO.md` (UC de fluxo) · `07` se consome endpoint novo |
| **Regra de negócio nova/alterada** | `02-BUSINESS-RULES.md` (número de BR novo — não reutilizar) | UCs vinculados (`06`/`07`) · `01-DOMAIN.md` se entidade · Registrar **antes** de implementar (BR-034) |
| **Componente novo/removido** | `05-MAPEAMENTO-TELAS.md` (árvore) · contagens do `04-ROADMAP.md` | `04-UI-COMPONENTS.md` (catálogo) se shared |
| **Feature entregue (PLAN concluído)** | `docs/plans/README.md` (status) · `UPDATES.md` · `04-ROADMAP.md` (fase) | `BACKLOG.md` (move itens resolvidos) · UCs com status atualizado |
| **Comportamento mudou** | `06`/`07` (conferências/CTs) · **rodar o smoke** (`scripts/smoke-api.mjs`) e registrar resultado | Rodar revisão da `SKILL-001-documentation-reviewer.md` |
| **Entidade/schema do banco** | `01-DOMAIN.md` · `01-DATABASE.md` | UCs/BRs afetados · migração em `src/database.ts` |
| **Lógica duplicada backend↔frontend** (ex.: `intervaloDePeriodicidade`/`calcularDataFinal` em `src/modules/contrato/domain/services/gerar-parcelas.ts` ↔ `frontend/src/modules/contrato/utils/calcularDataFinal.ts` — PLAN-076/085) | Atualizar **os dois arquivos no mesmo commit** + testes-espelho com a mesma matriz nos dois lados | `docs/plans/PLAN-085` · UCs/BRs · badge/labels que renderizam os valores do enum |
| **Identidade/posicionamento de produto** (ex.: "cobranças em campo" vs "plataforma modular" — PLAN-086) | Atualizar em **um único commit**: `00-NORTH-STAR.md` · `00-PROJECT.md` · `03-PRD.md` · `README.md` · `docs/README.md` · `docs/qa/01-VISAO-GERAL.md` · `AGENTS.md` + strings user-facing (`templates.ts` `rodape.marca` · `manifest.webmanifest` · `locales/*.json` `queroConhecerSubtitle`/`auth.loginSubtitle`) | `ADR-007` · `08-UC-MODULOS.md` · testes de i18n/paridade |

---

# 4. Auditoria

## 4.1 Script automático

```bash
node scripts/audit-docs.mjs
```

Cruza (em 4 vias por endpoint + telas + contagens):

1. **Rotas reais** (`src` + `main.ts`) ↔ **02-API.md**
2. **Rotas reais** ↔ **07-CASOS-DE-USO-API.md**
3. **Rotas reais** ↔ **api-collection.json**
4. **Rotas front** (`App.tsx`) ↔ **05-MAPEAMENTO-TELAS.md**
5. **Contagens** (telas/módulos) ↔ **04-ROADMAP.md**

Saída: lista de divergências com caminhos dos arquivos. `exit 0` mesmo com divergências (é relatório, não gate); divergência grave → `exit 1` se `--strict`.

## 4.2 Reconstruir a collection

```bash
node scripts/build-collection.mjs
```

Regenera `docs/api-collection.json` a partir da lista canônica em `scripts/build-collection.mjs`. **Toda mudança de endpoint** deve passar por aqui (o JSON é derivado, não editado à mão).

## 4.3 Validar comportamento (smoke — executável da 07)

```bash
npm run smoke:api          # contra http://localhost:3002 (padrão)
node scripts/smoke-api.mjs --baseUrl http://localhost:3002
```

Executa os **cenários da `07-CASOS-DE-USO-API.md`** (fluxos reais do front + todos os endpoints + conferências de coerência) e reporta PASS/FAIL. Pré-requisitos e como preparar a instância isolada: ver seção "Como executar" em `07-CASOS-DE-USO-API.md`.

**Quando rodar:** após qualquer mudança de comportamento de endpoint, ou como validação da `07` (resultado registrado no `UPDATES.md`).

## 4.4 Checklist manual (o que o script não pega)

- [ ] UCs (`06`/`07`) citam BRs que existem em `02-BUSINESS-RULES.md`?
- [ ] Toda BR tem ao menos um UC/CT que a exercita?
- [ ] Status dos PLANs no `plans/README.md` batem com o frontmatter?
- [ ] `UPDATES.md` tem entrada para as últimas entregas?
- [ ] `INDEX.md` lista todo documento existente (e nada inexistente)?
- [ ] i18n: toda chave usada no código existe nos 3 locales (`pt-BR`, `en`, `es`)?
- [ ] Cenários de empty state (V9) validados manualmente (operador sem dados)?

---

# 5. Workflow de uso

## Quando mudou algo (fluxo do dia a dia)

1. Faça a mudança de código (seguindo o PLAN e a SKILL-003).
2. Rode `npm run docs:audit` (`node scripts/audit-docs.mjs`) — veja o que ficou divergente.
3. Aplique a **matriz de propagação** (seção 3) nos pontos apontados.
4. Se envolveu endpoint: atualize `02-API.md` + `07` (UC/CT) + rode `npm run docs:collection` (`node scripts/build-collection.mjs`).
5. Se envolveu comportamento: rode `npm run smoke:api` e registre o resultado (PASS/FAIL) na `07`.
6. Rode `node scripts/audit-docs.mjs` de novo — deve sair limpo (idempotente).
7. Registre no `UPDATES.md` se for entrega relevante.

## Quando quiser um raio-X (sem mudança)

- Use o comando `audita-docs` (opencode) ou rode o script diretamente.
- O agente `.opencode/agents/docs-sync.md` reporta os gaps e o plano de correção (read-only por padrão).

---

# Restrições

- **Nunca editar `api-collection.json` à mão** — sempre via `scripts/build-collection.mjs`.
- **Nunca reutilizar número de BR** — BRs são imutáveis; regra alterada vira BR nova com nota de revogação (precedente: BR-084 → BR-079).
- **Nunca numerar UC sem consultar o maior existente** (`06`/`07`) — evita colisão.
- **Documentar regra de negócio antes de implementar** (BR-034).
- Mudança de tela/endpoint **sempre** atualiza o espelho no mesmo commit (se possível).

---

# Referências

- `SKILL-001-documentation-reviewer.md` — revisão de qualidade/consistência (complementar)
- `scripts/audit-docs.mjs` — auditoria automatizada (`npm run docs:audit`)
- `scripts/build-collection.mjs` — gerador da collection (`npm run docs:collection`)
- `scripts/smoke-api.mjs` — executável dos cenários da `07` (`npm run smoke:api`)
- `.opencode/agents/docs-sync.md` — agente que opera esta skill
- `docs/INDEX.md` — porta de entrada única
