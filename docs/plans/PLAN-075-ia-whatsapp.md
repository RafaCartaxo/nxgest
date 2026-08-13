# PLAN-075 — IA F1: WhatsApp inteligente (P017)

**Status:** ⏳ Planejado (pronto p/ execução)

**Versão:** 1.0

**Início:** 12/08/2026

**Origem:** Backlog **P017 — Mensagens Inteligentes do WhatsApp** · plano mestre **PLAN-074** (F1 de 5)

**Execução:** módulo `ai` novo + endpoint + frontend, seguindo o padrão do projeto (port + provider + use-case).

---

## Objetivo

Personalizar a mensagem de cobrança via WhatsApp usando o contexto real do cliente/contrato (situação atrasado/vence hoje, nº de parcelas, dias em atraso, total pendente) em vez do template genérico atual. **IA só gera o texto** — nunca executa transação; o operador abre o `wa.me` e decide. **Fallback garantido** ao template atual quando a IA estiver indisponível.

## Estado atual (o que existe)

- **Template estático** via i18n (`operacoes.whatsappTemplate`, pt/en/es) usado em 2 lugares:
  - `ClienteDetail.handleWhatsApp` — capacidade `cliente:whatsapp`, usa `saldoDevedor`
  - `RotaPage.handleWhatsApp` — capacidade `rota:whatsapp`, usa `totalPendente`
- **Comprovante** (`pagamento:comprovante_whatsapp`): função `montarTextoComprovante` **duplicada** em `RotaPage.tsx` e `ContratoDetail.tsx` — **fora da IA** (texto factual), só consolidar.
- Gating de capacidades é **só de UI** (`hasCapability`), pois são aberturas de URL (BR-104: "WhatsApp/Ligar/Navegar são aberturas de URL — gating só de UI").

## Arquitetura (Clean Architecture — padrão do projeto)

```
src/modules/ai/
├── application/
│   ├── ports/ai.provider.ts          ← IGeradorIA { gerarTexto(system, user): Promise<string> }
│   └── use-cases/GerarMensagemWhatsApp/
│       ├── GerarMensagemWhatsAppUseCase.ts
│       └── GerarMensagemWhatsAppUseCase.test.ts
├── infrastructure/providers/
│   ├── console.provider.ts           ← dev: loga (não chama API) — mesmo papel do ConsoleMailer
│   ├── failing.provider.ts           ← fail-closed: throw → 503 AI_UNAVAILABLE (nunca mentir)
│   └── gemini.provider.ts            ← REST via fetch (sem dep npm, como ResendMailer)
└── presentation/routes/ai.routes.ts  ← POST /whatsapp/sugerir
```

**Padrão copiado de:** `src/shared/email/mailers.ts` (port + Console/Failing/Resend + política por `NODE_ENV`).

## Endpoint

**`POST /api/ai/whatsapp/sugerir`** (auth + rate limit por usuário)

**Input:** `{ clienteId?, contratoId?, contexto: "cliente" | "rota" }`
- Valida escopo via `resolveUsuarioAlvo` (operador vê só os seus; admin/socio na subárvore/empresa).
- Gating: módulo (clientes/rota) + capacidade (`cliente:whatsapp` / `rota:whatsapp`) → 403 `CAPABILITY_DISABLED` quando off.

**Prompt (montado no backend, escopo resolvido):** nome, situação (atrasado/vence hoje), nº de parcelas em aberto, dias em atraso, total pendente — **sem PII desnecessária** (sem endereço/telefone extra).

**Resposta:** `{ texto: string }`
- **Fallback:** se `AI_PROVIDER` não configurado / falha / timeout → devolve o `whatsappTemplate` atual (i18n) — operador nunca fica sem mensagem.

**Regras:**
- IA **só gera texto** — nenhum efeito colateral, nenhuma transação.
- Multi-tenant: prompt montado só com dados do escopo; nada vaza entre empresas.
- Idempotente/read-only: GET-like de geração, sem escrita (exceto log de auditoria de uso, se decidido).

## Env (novas chaves)

| Chave | Exemplo | Uso |
|---|---|---|
| `AI_PROVIDER` | `console` (dev) / `fail` (sem chave) / `gemini` | Seleção do provider |
| `GEMINI_API_KEY` | `AIza...` | Chave da Gemini API (free tier) — **nunca no repo** |

Arquivos a tocar: `.env.example` · `.env.production.example` · `docker-compose.prod.yml` · `docker-compose.staging.yml`.

## Frontend

- `ClienteDetail.handleWhatsApp` e `RotaPage.handleWhatsApp` passam a chamar o endpoint (loading via `useFeedback`) → **fallback ao template** se falhar (sem quebrar o fluxo atual).
- `montarTextoComprovante` → movido para utilitário `shared/` (ex.: `shared/utils/comprovante.ts`) sem mudar comportamento — **fora da IA**.
- i18n novas (pt/en/es) se necessário (ex.: erro de IA / label "gerar").

## Testes e CTs

**Unit** (`GerarMensagemWhatsAppUseCase.test.ts`):
- Provider mockado retorna texto → use-case devolve o texto.
- Provider falha (throw) → use-case devolve o **fallback** (template).
- Sem provider configurado → fallback.

**Smoke/CT:**
- Sucesso: `POST /whatsapp/sugerir` → 200 `{ texto }`.
- IA off (`AI_PROVIDER=fail`) → 200 com o **mesmo texto do template** (fallback).
- Sem capacidade → 403 `CAPABILITY_DISABLED`.
- Escopo: operador com `clienteId` de outro → 404.
- Módulo off → 403 `MODULE_DISABLED`.

## Critérios de aceite

- Mensagem personalizada com contexto real quando a IA responde.
- Fallback idêntico ao comportamento atual quando a IA está off.
- Nenhuma transação executada pela IA · escopo respeitado · 403 nas gates.
- `tsc` · build · audits · `npm test` · `docs:audit` · smoke 250/250 mantido.
- Chave `GEMINI_API_KEY` só no `.env` do VPS (nunca no repo).

## Fora de escopo (F1)

- Comprovante com IA (mantém factual — só consolida a duplicação).
- F2-F5 (resumo do dia, priorização de rota, OCR, FAQ) — ver PLAN-074.
- Pagamento real pelo WhatsApp / integração oficial WhatsApp Business API (só gera o texto; abertura segue via `wa.me`).

## Provider — Gemini Flash-Lite (decisão)

- **Free tier** (~1.000 RPD) cobre dev/teste e uso pequeno/médio; produção estável → **ativar billing** (~US$1-2/mês).
- A **port** permite trocar de provedor trocando 1 implementação (não reescrever use-cases).
- Alternativas avaliadas e descartadas: Claude (caro/lento para o caso), OpenAI (mais caro no volume, sem ganho), DeepSeek (privacidade/OCR fraco).
