# CHECKLIST — PLAN-072: registro do plano de identidade visual da empresa

**Data:** 13/08/2026

**Planos/refs:** `docs/plans/PLAN-072-identidade-visual-autosservico.md`

> Registro do plano de autosserviço de identidade visual da empresa (admin/sócio edita nomeFantasia/tema/logo/contato, super modera, branding por tenant, seed na conversão de lead) + análise de verificação cruzada (gaps G1..G14 e CTs ID-/LD-) e verificação do fluxo "Quero conhecer" (leads).

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

- [x] **Análise de verificação** — estado atual dos 3 atores (cliente com contratos, empresa/whitelabel, super) + fluxo de leads (`/quero-conhecer`) cruzado
- [x] **Gaps mapeados** — G1..G14 com evidência de arquivo e mitigação
- [x] **Cenários (CTs)** — ID-01..31 + LD-19..23 (autosserviço, sessão, moderação, tema, migração/segurança, leads × identidade)
- [x] **Plano registrado** — `docs/plans/PLAN-072-identidade-visual-autosservico.md` (decisões D1..D7, modelo de dados com ALTER, backend/frontend, ordem de execução em 5 fases)
- [x] **Índice atualizado** — `docs/plans/README.md` (linha PLAN-072)
- [x] **PLAN-071 Fase 1b — identidade visual NX nos e-mails** — `templates.ts` com layout único (marca "NX Gest" violeta `#0520ae` · CTA `min-width` · rodapé institucional pt/en/es · cores da marca em hex). 3 templates (convite/reset/lead) usam o layout; textos preservados. Validado local (tsc · 91 testes · render HTML conferido). Local — aguardando commit.

## Validação (rodar antes de finalizar)

- [x] `npm run docs:audit` sem divergência (SKILL-009) — [resultado abaixo]

## Pendências

- [ ] Ajustes no plano quando o Rafael revisar (decisões D1..D7 / escopo v1 vs v1.5)
- [ ] Execução das fases 1..5 do PLAN-072 (não iniciadas — plano registrado)
- [ ] Registrar card/demanda no vault (QA Workspace) se aplicável

## Observações

- Decisões aprovadas pelo Rafael: admin/sócio edita **só identidade visual** (D1); empresa define, super modera (D2); tema por empresa como default com override individual (D3); cor custom/SVG/logo no login/onboarding com conteúdo = v1.5 (D4/D6/D7).
- G3 (migração `ALTER ADD COLUMN IF NOT EXISTS`) é o maior risco operacional — virou CT prioritário (ID-23).
- Favicon já adapta a cor do tenant de graça (G5) — nenhuma mudança em `favicon.ts`.
