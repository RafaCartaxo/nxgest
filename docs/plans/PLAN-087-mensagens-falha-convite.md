# PLAN-087 — Mensagens de falha de convite (ativação)

**Status:** ✅ Implementado (28/08) — backend + frontend + e-mail + BR-109 + docs + testes

**Versão:** 1.0

**Início:** 28/08/2026

**Origem:** **incidente real de produção** — operador recebeu link antigo de convite (após reenvio), clicou, viu "Token inválido ou já utilizado" e **travou duas pessoas** sem saber o que fazer. O `AtivarContaUseCase` colapsava **6 motivos de falha em 2 erros**; a tela de ativação só ramificava `TOKEN_EXPIRED`. Investigação completa no anexo da nota do vault `NX Gest - Reposicionamento de identidade (PLAN-086)`.

---

## Objetivo

Diferenciar cada motivo de falha da ativação de convite, com código e mensagem próprios, e **dar saída** ao usuário — sem mudar o fluxo de negócio do convite (invalidação N2, lazy-expire N1.10, binding `email_alvo` N1.7 permanecem intactos).

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Mapeamento de falhas | 6 códigos distintos: `TOKEN_INVALID` (inexistente), `TOKEN_EXPIRED` (vencimento), `CONVITE_REVOGADO`, `CONVITE_JA_USADO`, `CONVITE_SUBSTITUIDO` (**novo** — link trocado por reenvio), `CONVITE_EMAIL_NAO_CONFERE` |
| D2 | Frontend | Lookup código→chave i18n no `AtivarPage` (ativa 6 chaves órfãs) + **ação de saída** "Ir para o login" (dívida AC-07) |
| D3 | E-mail preventivo | `convite.seguro` informa **prazo real (7 dias)** e orienta usar **sempre o último convite** — mitigação na origem (revisão: entra aqui, não no PLAN-086) |
| D4 | BR | **BR-109** nova (próximo livre) — diferenciação dos motivos; BRs existentes imutáveis |
| D5 | Fluxo de negócio | **Nenhuma mudança** no ciclo de vida do convite — só mensagens/códigos |

---

## Arquivos alterados

### Backend
| Arquivo | Mudança |
|---|---|
| `src/modules/auth/domain/errors/auth.error.ts` | +4 erros (`ConviteRevogadoError`, `ConviteJaUsadoError`, `ConviteSubstituidoError`, `ConviteEmailNaoConfereError`) |
| `src/modules/auth/application/use-cases/AtivarConta/AtivarContaUseCase.ts` | mapa das 6 falhas → erros próprios |
| `src/modules/auth/presentation/controllers/auth.controller.ts` | `ativar` → 4 códigos novos (400) |
| `src/modules/auth/application/use-cases/AtivarConta/AtivarContaUseCase.test.ts` | **novo** — 9 testes (6 falhas + vencimento real + lazy-expire + sucesso) |

### Frontend
| Arquivo | Mudança |
|---|---|
| `frontend/src/modules/auth/pages/AtivarPage.tsx` | lookup código→i18n + ação de saída "Ir para o login" |
| `frontend/src/i18n/locales/{pt-BR,en,es}.json` | ativa 6 órfãs + pares novos `conviteInvalido`/`conviteSubstituido` |

### E-mail / regras / docs
| Arquivo | Mudança |
|---|---|
| `src/shared/email/templates.ts` | `convite.seguro` (3 idiomas) — prazo 7 dias + "use o último convite" |
| `docs/product/02-BUSINESS-RULES.md` | **BR-109** (PLAN-087) |
| `docs/engineering/02-API.md` | tabela de erros do `POST /api/auth/ativar` |
| `docs/product/07-CASOS-DE-USO-API.md` | AC-CT-08 → `CONVITE_JA_USADO` + AC-CT-21..25 novos |
| `docs/product/06-CASOS-DE-USO.md` | UC de operador — conferência do link substituído |
| `scripts/build-collection.mjs` + `docs/api-collection.json` | descrição do `/auth/ativar` |

---

## Verificação

- `npx tsc --noEmit` · `npm test` (9 testes novos de `AtivarContaUseCase`) · `docs:audit` · `audit:ui/styles/modules`
- Manual: ativar com token antigo após reenvio → mensagem "use o último convite" + botão ir ao login