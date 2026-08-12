# CHECKLIST — <título curto da entrega>

**Data:** DD/MM/AAAA

**Planos/refs:** `docs/plans/PLAN-NNN-<nome>.md` (ou briefing, ou HANDOFF)

> Contexto em 1-2 linhas: o que esta entrega faz e por que (referenciar plano/briefing/PR).

## Status (catálogo oficial)

| Emoji | Significado |
|---|---|
| ✅ | Entregue / concluído |
| 🔵 | Em execução (parcial — parte concluída) |
| ⏳ | Aguardando algo (deploy, externo, decisão) |
| 🚨 | Parado há 7+ dias / urgente |
| ❌ | Bloqueado / falhou |
| 🐛 | Bug encontrado (referenciar card/CT) |
| 🔁 | Retestado / revalidado |

## Entregue

- [ ] **<área ou componente>** — o que foi feito (marcar `[x]` ao concluir)
- [ ] **<área ou componente>** — o que foi feito

## Validação (rodar antes de finalizar)

- [ ] `npx tsc --noEmit` limpo
- [ ] `npm run build` verde
- [ ] `npm run audit:ui` · `npm run audit:styles` · `npm run audit:modules` verdes (se UI mudou)
- [ ] `npm test` verde (`n` testes)
- [ ] `npm run smoke:api` (instância isolada) — `N/250`
- [ ] `npm run docs:audit` sem divergência (SKILL-009)
- [ ] Preview mobile + desktop (se UI mudou)

## Pendências

- [ ] <itens que ficaram para depois — CTs manuais pós-deploy, revisão pendente etc.>

## Observações

- <decisões tomadas, bugs pré-existentes corrigidos, desvios do plano>
