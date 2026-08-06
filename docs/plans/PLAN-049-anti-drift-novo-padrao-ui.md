# PLAN-049 — Anti-drift do novo padrão de UI (audit estendido)

**Status:** Concluído

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** governança de UI — fechamento do anti-drift pós-PLAN-047/048

---

## Objetivo

Impedir que os padrões canônicos introduzidos nos PLAN-047/048 "vazem" de volta: extender o **`npm run audit:ui`** para travar, mecanicamente, os padrões fora-do-canônico do novo design system.

## Escopo

| # | Check novo no `audit:ui` | Regra |
|---|--------------------------|-------|
| 1 | `<select>` / `<textarea>` **crus** em módulos | usar `FieldSelect`/`FieldTextarea` |
| 2 | **Header inline de modal** (`flex items-center justify-between border-b border-border-light px-4 py-3`) | usar `title`/`descricao` do `Modal` |
| 3 | `role="tab"` fora de `shared/components/Tabs/` | usar `Tabs` |
| 4 | `<Modal>` **sem `title`** (janela de 12 linhas após a abertura do tag) | assinatura Lovable obrigatória |

## Validação
- `npm run audit:ui` limpo (105 arquivos, 0 ocorrências) ✅
- Regressão: os 4 checks passaram a varrer todo `frontend/src` sem falso-positivo nos 105 arquivos

## Referências
- `scripts/audit-ui.mjs` · `UI-COVERAGE.md` · `AGENTS.md`
- PLAN-044 (governança original) · PLAN-047/048 (padrões que este plano protege)
