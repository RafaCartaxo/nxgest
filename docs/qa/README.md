# QA — Material de Qualidade e Fonte de Estudo

**Status:** Ativo (11/08/2026)

---

## O que é este pacote

Material de **Quality Assurance** e **fonte de estudo** do NX Gest: explica *como o sistema é* (arquitetura, engenharia) e *como validamos/entregamos* (testes, pipeline, operação). Cada documento **resume e referencia** as fontes oficiais (não duplica conteúdo — princípio SKILL-009).

> Leitura sugerida em ordem. Cada documento aponta para os docs-fonte quando você quiser profundidade.

---

## Índice

| Doc | O que responde |
|---|---|
| [01-VISAO-GERAL.md](01-VISAO-GERAL.md) | O que é o NX Gest? Qual a stack e os ambientes? |
| [02-ARQUITETURA.md](02-ARQUITETURA.md) | Como o sistema está organizado? Camadas, módulos, fluxo, ADRs |
| [03-ENGENHARIA.md](03-ENGENHARIA.md) | Como o backend/frontend/banco funcionam na prática? |
| [04-TESTES.md](04-TESTES.md) | Como validamos? Camadas de teste, o que cobre, como rodar |
| [05-PIPELINE.md](05-PIPELINE.md) | Como uma mudança vai de PR → CI → staging → produção? |
| [06-OPERACAO.md](06-OPERACAO.md) | Como operar? Deploy, backup, rollback, monitoramento |
| [07-SEGURANCA.md](07-SEGURANCA.md) | Como protegemos o sistema? Auth, rate limits, hardening |
| [08-GLOSSARIO.md](08-GLOSSARIO.md) | Termos do domínio e técnicos usados nos docs |
| [09-CHECKLISTS.md](09-CHECKLISTS.md) | Checklists operacionais: sanidade, regressão, release, QA manual |

---

## Trilha de estudo recomendada

### Nível 1 — Visão geral (30–60 min)
1. `01-VISAO-GERAL.md` — o sistema, a stack, os ambientes
2. `docs/product/00-PROJECT.md` — visão e escopo
3. `docs/product/01-DOMAIN.md` — entidades e domínio

### Nível 2 — Arquitetura e engenharia (1–2 h)
4. `02-ARQUITETURA.md` — camadas, módulos, fluxo
5. `docs/engineering/00-ARCHITECTURE.md` + `docs/foundation/ADR-001-Arquitetura.md`
6. `03-ENGENHARIA.md` — backend, frontend, banco
7. `docs/engineering/04-BACKEND.md` + `docs/engineering/03-FRONTEND.md` + `docs/engineering/01-DATABASE.md`

### Nível 3 — Qualidade e entrega (1–2 h)
8. `04-TESTES.md` — camadas de teste e como rodar
9. `docs/engineering/TESTES.md` + `docs/product/07-CASOS-DE-USO-API.md`
10. `05-PIPELINE.md` — CI/CD completo
11. `docs/engineering/06-PRODUCAO.md §1.1` + `.github/workflows/{ci,cd}.yml`

### Nível 4 — Operação e segurança (1 h)
12. `06-OPERACAO.md` + `docs/engineering/06-PRODUCAO.md`
13. `07-SEGURANCA.md` + `docs/engineering/SEGURANCA.md`

### Nível 5 — Prática de QA
14. `09-CHECKLISTS.md` — use como guia em cada validação
15. Rode os comandos do `04-TESTES.md` localmente
16. Valide o staging (`https://nxgestao.duckdns.org`, seed `teste123!`)

---

## Fontes oficiais

- **Produto:** `docs/product/` · **Arquitetura/engenharia:** `docs/engineering/` · **Decisões:** `docs/decisions/` · **Planos:** `docs/plans/` · **Skills:** `docs/skills/`
- **Status atual:** `docs/STATUS.md` · **Mudanças recentes:** `docs/UPDATES.md`
