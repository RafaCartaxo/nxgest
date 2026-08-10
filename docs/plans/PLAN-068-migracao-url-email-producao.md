# PLAN-068 — Migração de URL para `nxgest.com.br` + e-mail em produção

**Status:** ✅ Implementado (08/08) — URL oficial + e-mail ativo · F5 (aposentar duckdns) aguardando confirmação

**Versão:** 1.0

**Início:** 07/08/2026

**Origem:** domínio `nxgest.com.br` adquirido + DNS/Cloudflare configurado e verificado no Resend · **Depende:** PLAN-065 (e-mail) · **Coordena:** PLAN-066 (segurança) e PLAN-067 (testes)

**Execução:** fora deste chat (deploy via runbook `06-PRODUCAO.md`). Regras em `AGENTS.md`.

---

## Objetivo

1. App respondendo em **`https://nxgest.com.br`** (URL oficial) via Cloudflare → VPS/Caddy.
2. **E-mail transacional em produção** (Resend) — fecha o PLAN-065.
3. Aposentar o **duckdns** só após confirmação total.

## Estado atual (verificado 07/08)

- DNS: NS → Cloudflare (autoritativo) ✅ · A raiz proxied → VPS `172.245.152.223` ✅ · www CNAME → raiz ✅ · SPF/DKIM/MX/DMARC **no ar** ✅.
- **Resend: domain verified ✅** (enviará de `no-reply@nxgest.com.br`).
- App ainda em `nxgestao.duckdns.org` (`DOMAIN`/`CORS_ORIGIN`/`APP_URL` duckdns).
- ⚠️ **Gap:** `docker-compose.prod.yml` **não passa** `APP_URL`/`MAIL_*` ao container do app → sem isso o e-mail não sai em produção.
- Frontend usa API **relativa** (`BASE_URL="/api"`) → migração não quebra o app.

## Decisões travadas

1. **www → redireciona pro apex** · 2. **SSL mode Full (strict)** no Cloudflare · 3. **duckdns mantido** até migração 100% (Caddy serve os 3 hostnames na transição) · 4. **Execução** no outro chat.

---

## F1 — Pré-check

- [ ] Resend **Verify verde** (já está ✅).
- [ ] Cloudflare **SSL/TLS → Overview → Full (strict)** — guia: Dashboard → domínio → **SSL/TLS** → **Overview** → selecionar **Full (strict)**. (Evita loop de redirect com o Caddy.) ⚠️ Fazer **antes** do deploy.
- [ ] A raiz = `172.245.152.223` no Cloudflare (proxied) — confirmado ✅.

## F2 — Config no repo

- **`docker-compose.prod.yml`** — adicionar ao container `app` (gap):
  ```yaml
  - APP_URL=${APP_URL}
  - MAIL_PROVIDER=${MAIL_PROVIDER}
  - RESEND_API_KEY=${RESEND_API_KEY}
  - MAIL_FROM=${MAIL_FROM}
  ```
  (`DOMAIN` já é passado ao caddy.)
- **`Caddyfile`** — servir os **3 hostnames na transição** (duckdns + novo + www→apex):
  ```
  {$DOMAIN}, www.{$DOMAIN}, nxgestao.duckdns.org {
      @www host www.{$DOMAIN}
      redir @www https://{$DOMAIN}{uri} permanent
      header { Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" }
      reverse_proxy app:8080
  }
  ```
  (No fim da migração, remover `nxgestao.duckdns.org`.)
- **`.env.production.example`**: `DOMAIN=nxgest.com.br` · `CORS_ORIGIN=https://nxgest.com.br` · `APP_URL=https://nxgest.com.br`.

## F3 — Deploy no VPS (runbook `06-PRODUCAO.md`)

1. Editar `/opt/nxgestao/.env`:
   - `DOMAIN=nxgest.com.br` · `CORS_ORIGIN=https://nxgest.com.br`
   - `MAIL_PROVIDER=resend` · `RESEND_API_KEY=<chave do Resend>` · `MAIL_FROM=no-reply@nxgest.com.br`
   - **`APP_URL` mantém duckdns NESTA etapa** (ver sequência F4).
2. `git pull` → `docker compose up -d` (recreate; **sem `--build` obrigatório** — só env/Caddyfile mudaram).
3. Caddy emite Let's Encrypt p/ `nxgest.com.br` (HTTP-01 via proxy). Se falhar: passar A pra **DNS only** (cinza) temporariamente → emitir → voltar proxy.
4. Validar: `https://nxgest.com.br` abre · `http://` → `https://` · `www` → apex · duckdns **ainda abre**.

## F4 — E-mail em produção (na ordem certa)

- [ ] 1. Validar o app **no novo domínio** (login, rota, admin via `https://nxgest.com.br`).
- [ ] 2. **Só então** trocar `APP_URL=https://nxgest.com.br` no `.env` + `docker compose up -d` (evita e-mails apontando pra URL não validada).
- [ ] 3. Convidar usuário → e-mail chega (`no-reply@nxgest.com.br`) e link = `https://nxgest.com.br/ativar?token=…`.
- [ ] 4. Esqueci a senha → e-mail + reset ok. Checar spam (SPF/DKIM/DMARC já ok).

## F5 — Aposentar duckdns

- [ ] Após confirmação total (app + email + www): remover `nxgestao.duckdns.org` do Caddyfile, `git pull` + `docker compose up -d`.
- [ ] Atualizar docs (URL oficial) — ver "Docs".

---

## Coordenação com PLAN-066 (segurança) 🔴

- **`trust proxy` / rate limit × Cloudflare:** com o Cloudflare na frente, o app tem **2 proxies** (Cloudflare + Caddy). `trust proxy: 1` sozinho pegaria o **IP do Cloudflare**, não o cliente.
- **Correção compartilhada (obrigatória):** helper `clientIp(req)` que **prioriza o header `CF-Connecting-IP`** (setado pelo Cloudflare) e cai pra `req.ip` (trust proxy) quando ausente. Implementado **no PLAN-066** (P0-1) e aplicado no rate limit. Sem isso, o brute-force fica cego de novo após a migração.
- **CTs T-01/T-02** (IP real) são **validados em produção, após esta migração**.
- **HSTS no Caddyfile**: o 066 adiciona; **não sobrescrever** aqui (este plano mantém o header).

## Coordenação com PLAN-067 (testes)

- **Independentes**: unit (use-cases/shared) e UI (RTL) e CI rodam sem depender do domínio → 067 roda em paralelo.
- Só a **validação final** dos CTs de segurança (T-01/T-02) acontece após esta migração.

## CTs / validação

- **T-05** (HTTP→HTTPS) · **T-06** (TLS válido) — do PLAN-066, aplicar aqui.
- **E2E manual:** login, rota, admin no `nxgest.com.br`; convite/reset por e-mail; `www`→apex; duckdns ainda vivo.

## Ponto de atenção futuro — Caixa corporativa

- Hoje o Cloudflare tem **MX nulo na raiz** (`nxgest.com.br MX → .` prio 0) = "não recebe e-mail". Isso é **proposital** (domínio novo sem caixa).
- Quando quiser `rafael@nxgest.com.br` (inbox/webmail): contratar provedor de caixa (ex.: Zoho Mail free · Google Workspace · M365) e **substituir o MX nulo** pelo MX real do provedor + records SPF/DKIM dele.
- **Não conflita com o Resend** (que usa `send.nxgest.com.br`). Implementação futura — registrar em `06-PRODUCAO.md`.

## Docs (atualizar na execução)

- `06-PRODUCAO.md` (visão geral URL oficial · env · seção e-mail "ligado" · caixa corporativa futura) · `AGENTS.md` (URL produção) · `.env.production.example` · `UPDATES.md`.

## Riscos / notas

- ACME via proxy pode precisar de janela DNS-only.
- SSL mode Full (strict) evita loop de redirect — ajustar antes do deploy.
- Não esquecer `APP_URL`/`MAIL_*` no compose (gap).
- Ordem de execução: **PLAN-066 P0** (com `CF-Connecting-IP`) → **este plano (068)** → **PLAN-067** em paralelo → validação final em produção.
