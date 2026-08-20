# PLAN-071 — E-mail: deliverability (sair do spam) + política de envio dev/staging/prod

**Status:** ✅ Em execução — Fase 1 (código) e Fase 2 (config/docs/compose, incl. F1) concluídas em 11/08 · ✅ Fase 3 (DNS: DMARC `rua=`) concluída em 13/08 · ⏳ Fase 4 (monitoramento) · ⏳ endurecer DMARC (`p=quarantine`) após 2–4 semanas

**Versão:** 1.0

**Início:** 11/08/2026

**Origem:** e-mails transacionais do NX Gest caindo em spam (prod envia, mas não chega à caixa de entrada — caso relatado em 11/08). Decisões atuais: display name só ("NX Gest") · staging não envia real · DMARC `rua=` agora e `quarantine` depois · dev **nunca** envia.

---

## Objetivo

Tirar os e-mails transacionais (convite, reset, confirmação de lead) da caixa de spam **sem** trocar de provedor, atacando os fatores que pesam: domínio novo (~3 dias), `From: no-reply@` sem display name, DMARC fraco. Além disso, deixar a **política de envio explícita e à prova de acidente**: dev e staging não enviam e-mail real; produção envia via `MAIL_PROVIDER` real.

---

## Contexto verificado (11/08)

| Item | Estado |
|---|---|
| Domínio | `nxgest.com.br` — DNS movido p/ Cloudflare em 08/08; **~3 dias de envio** (reputação em construção) |
| DKIM | ✅ `resend._domainkey` publicado |
| SPF | ✅ raiz e `send` = `v=spf1 include:amazonses.com ~all` |
| DMARC | ✅ `v=DMARC1; p=none; rua=mailto:rafael.cartaxo@hotmail.com` (13/08) — relatório ativo; endurecer `p=quarantine` após 2–4 semanas |
| From | `no-reply@nxgest.com.br` **sem display name** — sinal clássico de automação |
| `MAIL_PROVIDER` | **config morta** — o código não lê (`criarMailer()` só olha `RESEND_API_KEY` + `NODE_ENV`) |
| Risco encontrado | dev **com** `RESEND_API_KEY` no `.env` usaria `ResendMailer` (enviaria real) — viola "dev não envia" |
| Staging | `deploy-staging.sh` gera `.env.staging` com `MAIL_PROVIDER=console` + chave vazia → **não envia** |

**Causa principal do spam:** domínio novo + `no-reply@` sem display name + assuntos em padrão phishing ("Confirme seu e-mail"). DMARC `p=none` **não causa** spam — só não dá blindagem/visibilidade.

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | From | Só **display name "NX Gest"**; endereço continua `no-reply@nxgest.com.br` (sem MX novo) |
| D2 | Staging | **Não envia real** — `MAIL_PROVIDER=console`; testes de envio real ficam restritos à produção/VPS |
| D3 | DMARC | `rua=` agora (parser gratuito, default **dmarcian**) → monitorar 2–4 semanas → `p=quarantine` |
| D4 | Dev | **Nunca envia** — `NODE_ENV=development` → `ConsoleMailer` sempre (ignora chave) |

---

## Fase 1 — Código (✅ 11/08)

### `src/shared/email/mailer.port.ts`
- `EmailMessage` ganha `replyTo?: string`.

### `src/shared/email/mailers.ts`
- `criarMailer()` passa a ler **`MAIL_PROVIDER`** (`console` | `resend` | `fail`):
  - **Regra dura:** `NODE_ENV=development` → `ConsoleMailer` **sempre** (ignora chave e `MAIL_PROVIDER`).
  - `resend` exige `RESEND_API_KEY`; sem chave → `FailingMailer` (fail-closed, 503).
  - `console` → `ConsoleMailer` · `fail` → `FailingMailer`.
  - Default (sem `MAIL_PROVIDER`): `production` → resend-se-chave / senão `FailingMailer`; demais → `ConsoleMailer` (compat).
- `fromAddress()`: `"NX Gest" <no-reply@nxgest.com.br>` montado de `MAIL_FROM_NAME` + `MAIL_FROM_ADDRESS` (fallback p/ `MAIL_FROM` legado).
- `ResendMailer.send`: envia `from` com display name e `reply_to` quando `replyTo` presente no payload.

### `src/shared/email/templates.ts`
- Assunto do lead menos phishing: **"Confirme seu interesse no NX Gest"** (pt) / "Confirm your interest in NX Gest" (en) / "Confirma tu interés en NX Gest" (es).
- `leadTemplate({ nome, link, lang })`: saudação "Olá, {nome}!" (pt) / "Hi, {nome}!" (en) / "Hola, {nome}!" (es).

### Call-sites
- `CriarLeadUseCase` e `ReenviarConfirmacaoUseCase`: passam `nome` ao `leadTemplate`.

### `src/shared/email/templates.ts` — identidade visual NX (Fase 1b, 13/08)
- **Layout único reutilizável** (`montar`) com identidade NX: marca **"NX Gest"** violeta (`#0520ae`), título/corpo em `Arial/Helvetica` (compatibilidade máxima), **botão CTA** `#0520ae` com `min-width`, **rodapé institucional** por idioma ("Se não foi você, ignore." + "NX Gest — gestão de cobranças em campo").
- Cores da marca (equivalente hex do tema `default`): primária `#0520ae` · hover `#02116c` · texto `#1f2430`/`#5b626f` · fundo `#f4f8fc` · borda `#dde3ea`.
- Os 3 templates (`convite`/`reset`/`lead`) usam o mesmo layout — só título/corpo/botão mudam. Textos atuais preservados.

### `src/shared/email/mailers.test.ts`
- Mantidos: prod sem chave → `FailingMailer` · dev sem chave → `ConsoleMailer`.
- Novos: dev **com** chave → `ConsoleMailer` · `MAIL_PROVIDER=resend`+chave → `ResendMailer` · `fail` → `FailingMailer` · payload com display name e `reply_to`.

---

## Fase 2 — Config / deploy / docs (✅ 11/08)

- `.env.example`: `MAIL_PROVIDER=console` + nota "development nunca envia" · `MAIL_FROM_NAME=NX Gest` · `MAIL_FROM_ADDRESS=no-reply@nxgest.com.br`.
- `.env.production.example`: `MAIL_PROVIDER=resend` · `MAIL_FROM_NAME=NX Gest` · `MAIL_FROM_ADDRESS=no-reply@nxgest.com.br` (substitui `MAIL_FROM`).
- `scripts/deploy-staging.sh`: default `.env.staging` → `MAIL_PROVIDER=console` · `RESEND_API_KEY=` · `MAIL_FROM_NAME=NX Gest` · `MAIL_FROM_ADDRESS=no-reply@nxgest.com.br`.
- `docker-compose.prod.yml` + `docker-compose.staging.yml`: repassar **`MAIL_FROM_NAME`/`MAIL_FROM_ADDRESS`** ao container (**F1** — sem isso o display name não chega em prod/staging; `MAIL_FROM` segue como fallback).
- `docs/engineering/06-PRODUCAO.md` §9: display name, `MAIL_PROVIDER`, política dev/staging/prod, DMARC (rua→quarantine), warm-up.

> **Manual pendente — `.env` do VPS:** adicionar `MAIL_FROM_NAME="NX Gest"` (o `MAIL_FROM_ADDRESS` legado já cobre o endereço via fallback).

---

## Fase 3 — DNS (✅ 13/08, manual, Cloudflare)

1. ✅ Adicionado relatório ao DMARC: `_dmarc.nxgest.com.br` TXT →
   `v=DMARC1; p=none; rua=mailto:rafael.cartaxo@hotmail.com` (aplicado em 13/08; propagado).
2. ⏳ Monitorar 2–4 semanas (SPF/DKIM verdes no mail-tester, sem bounces/complaints).
3. ⏳ Endurecer: `p=quarantine; rua=mailto:<destino>` (manter `rua` para seguir recebendo relatório). **Depois do período de monitoramento.**

---

## Fase 4 — Monitoramento / aquecimento (⏳ após deploy)

- `npm run mail:test -- <email>` + **`mail-tester.com`** — score antes/depois (meta ≥9/10).
- Resend dashboard: deliverability, opens, bounces, complaints — acompanhar primeiras semanas.
- Volume baixo e consistente (já transacional); **não** disparar campanhas no domínio novo.

---

## CTs (Dado/Quando/Então)

- **EM-01** dev nunca envia — Dado `NODE_ENV=development` + `RESEND_API_KEY` setada | Quando `criarMailer()` | Então `ConsoleMailer` (nenhum e-mail real).
- **EM-02** produção envia — Dado `MAIL_PROVIDER=resend` + chave | Então `ResendMailer`; falha de envio → 503 `EMAIL_UNAVAILABLE`. Staging permanece em `ConsoleMailer`.
- **EM-03** display name — Dado `MAIL_FROM_NAME=NX Gest` | Então payload do Resend tem `from: "NX Gest" <no-reply@nxgest.com.br>`.
- **EM-04** reply-to — Dado `EmailMessage` com `replyTo` | Então payload inclui `reply_to`.
- **EM-05** DMARC — Dado DNS após Fase 3 | Então `_dmarc` contém `rua=` (e, após período, `p=quarantine`).
- **EM-06** dev não dispara Resend — Dado dev rodando | Então nenhuma chamada HTTP a `api.resend.com` (gravação de fetch em teste).

---

## Ordem de execução

```text
Fase 1 — Código (mailer + templates + testes)          ✅
Fase 2 — Config / deploy / docs                         ✅
Fase 3 — DNS (DMARC rua → quarantine)                   ⏳ manual
Fase 4 — Monitoramento / aquecimento                    ⏳ após deploy
```

---

## Critérios de aceitação

dev e staging **nunca** enviam (mesmo com chave — coberto por EM-01/EM-06) · produção envia com display name "NX Gest" · e-mail de teste com display name "NX Gest" ≥9/10 no mail-tester e chega na caixa de entrada (não spam) em Gmail e Hotmail · DMARC com `rua=` e depois `quarantine` · `npm test` + `docs:audit` limpos.

## Fora de escopo

Caixa corporativa `contato@` (Zoho/MX) · BIMI · IP dedicado Resend · tracking domain próprio — reavaliar após o aquecimento (2–4 semanas).
