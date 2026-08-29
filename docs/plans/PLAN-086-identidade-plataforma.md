# PLAN-086 — Identidade de plataforma (reposicionamento)

**Status:** ✅ Implementado (28/08) — docs + ADR-007 + 4 strings user-facing

**Versão:** 1.0

**Início:** 28/08/2026

**Origem:** plano fechado e aprovado no vault `brainwork` (nota `NX Gest - Reposicionamento de identidade (PLAN-086)`). A doc de fundação (27/06) descreve o NX Gest como "sistema de gestão de **cobranças** em campo", mas o produto já é **plataforma** (roadmap §5.10 F4, ADR-006, tagline de login "Gestão centralizada para o seu negócio", "hub… e cresce com novos segmentos") — a doc ficou para trás, criando duas verdades oficiais.

---

## Objetivo

Alinhar a documentação canônica ao que o produto **já é** — plataforma modular de gestão operacional, com o crédito em campo como primeiro vertical — e **travar** para não driftar de novo. Natureza: organização, docs-only + 4 strings user-facing. Não é rebrand, refatoração ou antecipação do F4 (`tipo_negocio`).

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Níveis conceituais | 3 níveis — 2 de prosa (plataforma + vertical) e 1 fonte executável (Module Manifest) — **ADR-007** |
| D2 | `tipo_negocio` | Adiado (não antecipar F4); gatilhos A/B/C/D para reabrir; BR numerada só quando escrita |
| D3 | Finanças pessoais | Fora da Visão (incompatível com tenancy por empresa) — §"Escopos futuros não comprometidos" no ADR-007 |
| D4 | BRs | **Nenhuma** (não governa entidade/request; BR sem CT é dívida) |
| D5 | Strings | `rodape.marca` (e-mail) · `manifest.description` · `queroConhecerSubtitle` · **`auth.loginSubtitle`** (nova — subtítulo do login era hardcoded, não traduzido) |
| D6 | `auth.tagline` | **Intacta** (já é plataforma; veto do vault) |

---

## Arquivos alterados

### F1 — ADR-007 (decisão)
- `docs/foundation/ADR-007-Identidade-Plataforma.md` — **novo** (formato ADR-006): 3 níveis, tabela canônica de nomes, 6 critérios de admissão de vertical, regra de fronteira, gatilhos A/B/C/D, escopos futuros, sem BR.
- `docs/foundation/README.md` · `docs/decisions/ADR-INDEX.md` · `docs/INDEX.md` (§Foundation — inclui ADR-005/006 que faltavam).

### F2 — Canônicos
- `00-NORTH-STAR.md` **1.0→1.1**: Objetivo/Missão/Visão em 2 níveis; "é"/"não é" com `##` (Nível 0/1) + Regra de fronteira; **Regra de Ouro preservada**.
- `00-PROJECT.md` **1.1→1.2**: Objetivo 2 níveis; Escopo → ponteiro ao Module Manifest; Fora do Escopo em 2 níveis.
- `03-PRD.md` **1.0→1.1**: Objetivo plataforma + **bullets duplicados removidos** (autenticação/painel ×2).

### F3 — Secundários
- `README.md` · `docs/README.md` · `docs/qa/01-VISAO-GERAL.md` (O que é + linha `| Produto |`) · `AGENTS.md` (stack + **linha nova "O que é este produto?"** na tabela "comece por aqui").

### F4 — Módulos
- `08-UC-MODULOS.md` — nota "Escopo e verticais (ADR-007)".

### F5 — User-facing (4 strings)
- `src/shared/email/templates.ts` `rodape[*].marca` (3 idiomas) → "plataforma de gestão operacional".
- `frontend/public/manifest.webmanifest` description → plataforma.
- `locales/*.json` `queroConhecerSubtitle` (3 idiomas) → sem "de cobranças" + artigo "**o** NX Gest".
- **`auth.loginSubtitle`** (3 idiomas, nova) — subtítulo do login movido do hardcoded para i18n (`LoginPage.tsx`); mesma classe responsiva.

### F6/F7 — Anti-drift, rastreio, registro
- `SKILL-009` §3 — linha "Identidade/posicionamento" na matriz de propagação.
- `PLAN-071:69` — anotação de 1 linha (rodapé atualizado).
- `docs/plans/PLAN-086-identidade-plataforma.md` (**este**) + linha em `README.md`.
- `docs/UPDATES.md` · `docs/STATUS.md`.

---

## Baseline e fatos apurados

Medido em 28/08 (repo em `f1e0094`):
- `audit:links` → **0 erro(s), 5 warn(s), 199 arquivos** · `docs:audit` → **Nenhuma divergência** (72 rotas ↔ 72 endpoints ↔ 72 UCs · 28 rotas front ↔ 28 telas) · `audit:modules` → manifest coerente · `npm test` → **181/181**.
- **Âncora nula:** 1 link com âncora no repo, interno a arquivo não tocado → headers de identidade são livres, mas mantidos (níveis entram como `##`).
- **Superfície:** varredura de "cobranças em campo" → 10 arquivos de fundação/product + 3 strings + qa/01. Verificados limpos: templates/, skills/, .github/, engineering/** (exceto 06 e 08), etc.
- **Headers congelados (não renomear):** `# O que este sistema é/não é` · `# GET|POST /rota` · `## BR-NNN` · tabelas parseadas por `audit-docs.mjs`.

---

## Vetos (conferir antes de commitar)

- [x] `git diff --name-status` **somente M e A** — nenhum R/D.
- [x] Nenhuma ocorrência de `nxgestao` renomeada (infra).
- [x] `Lovable-*`/`Stitch-*` intocados (histórico — PLAN-084).
- [x] `src/modules/admin/domain/modules.ts` + espelho frontend **intocados** (`audit:modules` idêntico).
- [x] `02-BUSINESS-RULES.md` intocado — **nenhuma BR nova** nem número pré-reservado.
- [x] i18n: só `queroConhecerSubtitle` e `auth.loginSubtitle` (nova); **`auth.tagline` intacta**.
- [x] Headers `# O que este sistema é/não é` **não renomeados** (níveis entram como `##`).
- [x] "Finanças pessoais" **não** entrou na Visão (está no ADR-007 como escopo futuro não comprometido).

---

## Verificação

- `npm run audit:links` (0 erro(s)) · `npm run docs:audit` (0 divergências) · `npm run audit:modules` (manifest coerente) · `npm test` (181).
- `npx tsc --noEmit` (strings em templates/i18n — sem impacto de tipo, mas valida o frontend).
- **Teste de pronto:** leitor do `00-NORTH-STAR.md` chega à mesma conclusão que quem lê o ADR-006 + roadmap §5.10 + tela de login.