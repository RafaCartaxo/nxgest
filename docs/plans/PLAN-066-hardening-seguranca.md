# PLAN-066 — Hardening de Segurança (P0/P1/P2)

**Status:** 🔵 Em execução — **P0 implementado (07/08)** · P1/P2 pendentes

**Versão:** 1.0

**Início:** 07/08/2026

**Origem:** assessment de segurança 07/08 (resumo em `docs/engineering/SEGURANCA.md`)

**Execução:** P0 concluído (trust proxy · helmet/CSP · CORS fail-closed · HSTS no Caddy). Próximo: P1. Regras em `AGENTS.md`.

---

## Objetivo

Fechar os gaps de segurança identificados. Não reinventa o que já está bom — endereça as lacunas reais e trava regressão com CTs.

## O que JÁ está bom (não mexer)

- Auth JWT com secret forte; role/empresa resolvidas do **banco**; bloqueio de empresa inativa (BR-106) e conta convidada (PLAN-065).
- Autorização em camadas (auth/requireModule/admin/super/capability/`resolveUsuarioAlvo`).
- zod em toda entrada; forgot/login com resposta **genérica** (sem enumeração).
- Uploads seguros (MIME sem SVG, magic bytes, limites, endpoint autenticado) — PLAN-042/058.
- Segredos fora do repo (`~/.config/nxgestao`); VPS SSH só por chave; container roda como `node`.
- Login/me/getOperador **não retornam senha** (sanitizados).
- Rate limit no login/forgot/ativar/reset (mas veja P0-1).

---

## P0 — Rápido / baixo risco (fazer primeiro)

### 1. `trust proxy` — destrava o rate limit atrás do Caddy 🔴
- **Arquivo:** `src/main.ts`
- **Mudança:** `app.set("trust proxy", 1)` logo após `const app = express()`.
- **Por quê:** hoje `req.ip` = IP do Caddy → todos compartilham o bucket do rate limit (brute-force efetivo). Com `trust proxy: 1`, o Express usa o `X-Forwarded-For` do Caddy (único proxy).
- **CTs:** T-01, T-02.

### 2. Security headers — `helmet` + Caddy
- **Backend:** `npm i helmet` · em `src/main.ts`: `app.use(helmet())` (antes das rotas).
- **CSP (atenção):** Vite build gera JS/CSS externos — começar com `contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"] } }` (estilos inline do Tailwind podem precisar). **Testar no preview** — se quebrar algo, relaxar só o necessário e registrar.
- **Caddyfile** (`{$DOMAIN} { header { Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" } reverse_proxy app:8080 }`).
- **CTs:** T-03, T-07.

### 3. CORS fail-closed
- **Arquivo:** `src/main.ts` — hoje `cors(corsOrigin ? { origin: corsOrigin } : {})` deixa **tudo aberto** se `CORS_ORIGIN` vazio.
- **Mudança:** se `NODE_ENV === "production" && !CORS_ORIGIN` → logar erro claro e usar `origin: false` (recusa CORS), **não** refletir origem.
- **CT:** T-04.

---

## P1 — Médio

### 4. Dependências
- `npm audit fix` (body-parser — não-breaking).
- Avaliar `drizzle-orm` → 0.45.2 (fix de SQL injection em identifiers; **major bump**, testar `tsc`/build/smoke).
- **Rotina:** `npm audit` como checagem periódica (registrar em `SEGURANCA.md`).

### 5. Hardening do VPS (documentar em `06-PRODUCAO.md`)
- Verificar/ativar `firewalld` (só 80/443 + SSH) e `fail2ban` no SSH. Documentar.

### 6. Rate limit global / por usuário
- Avaliar middleware de rate limit nas rotas autenticadas (ex.: 300 req/min por usuário) — protege abuso/carga.
- **CTs:** D-03.

### 7. Backup off-site criptografado
- Criptografar a cópia off-site (gpg/age) — contém dados pessoais/financeiros.
- **CT/processo:** P-04.

### 8. Timeouts no Caddy (slowloris)
- Adicionar timeouts (`request_timeout`/`read_timeout`/`write_timeout`) no Caddyfile.
- **CT:** T-08.

---

## P2 — Futuro (decisões de produto)

- **JWT:** token mais curto (12–24h) + revogação (`jti`/blacklist) OU documentar decisão de manter localStorage + 7d (mitigado por CSP/headers).
- **Cloudflare WAF / Under Attack** quando a URL migrar pro `nxgest.com.br` (o A record já é proxied).
- **2FA** para admin/super_admin.
- **Senha mínima 8** (hoje 6 — produto decide).

---

## CTs NOVOS (Dado/Quando/Então)

### Transporte / proxy / headers (T)

- **T-01** Rate limit real — Dado >10 logins inválidos/15min **de IPs distintos (via X-Forwarded-For)** | Quando o 11º | Então 429 (se falhar por IP, o `trust proxy` não está ok).
- **T-02** Proxy — Dado request via Caddy com `X-Forwarded-For: 1.2.3.4` | Então `req.ip === "1.2.3.4"` (não o IP do Caddy).
- **T-03** Headers — Dado `GET /` e `GET /api/health` | Então resposta tem `X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`.
- **T-04** CORS fail-closed — Dado produção sem `CORS_ORIGIN` | Quando origem externa requisita | Então bloqueada (sem `Access-Control-Allow-Origin` refletido).
- **T-05** HTTP→HTTPS — Dado `http://` | Então 301 pra `https://`.
- **T-06** TLS — Dado handshake | Então certificado Let's Encrypt válido (não expirado).
- **T-07** Clickjacking — Dado app em iframe | Então bloqueado (`X-Frame-Options`/`frame-ancestors`).
- **T-08** Slowloris — Dado conexão parcial mantida | Então Caddy encerra (timeout).

### Ciclo de conta (A — lacunas do PLAN-065)

- **A-07** Expiração — Dado token de convite vencido (>7d) | Quando ativa | Então 400/403 + orientação de reenviar. (idem reset 30–60min, lead 24h)
- **A-09** Reenvio — Dado `reenviar-convite` | Então token anterior deixa de funcionar (invalida).
- **A-10** Senha não vaza — Dado `login`/`me`/`getOperador` | Então resposta NÃO contém `senha` nem `senhaHash` (regressão).
- **A-14** Logout — Dado logout | Então token limpo no cliente; **documentar decisão** (sem revogação server-side nesta versão).
- **A-15** Fail-closed — Dado `NODE_ENV=production` sem `JWT_SECRET` | Então app não inicia (erro claro).

### Entrada (I)

- **I-01** Body — Dado JSON > 2mb | Então 413 `PAYLOAD_TOO_LARGE`.
- **I-02** Malformado — Dado JSON inválido | Então 400 (não 500).
- **I-05** XSS — Dado `<script>alert(1)</script>` em campo (lead/cliente) | Então renderiza como texto (sem execução).
- **I-07** Path traversal — Dado filename de upload com `../` | Então rejeitado.

### Carga / DDoS (D)

- **D-01** Dado rajada em `/api/leads` (quero-conhecer) | Então 429.
- **D-02** Dado rajada em `/auth/forgot`/`/ativar`/`/reset` | Então 429.
- **D-03** Dado N requisições autenticadas além do teto | Então 429 (rate limit por usuário).
- **D-04** Dado DDoS L7 na URL futura `nxgest.com.br` | Então Cloudflare (A proxied) absorve; habilitar WAF.

### Privacidade (P)

- **P-02** Dado erro de login | Então log não contém senha/token/CPF.
- **P-03** Dado `GET /api/health` | Então só `{status, db}` — sem versão/path.
- **P-04** Dado backup off-site | Então arquivo criptografado.
- **P-05** Dado lead descartado | Então dados pessoais removidos (LGPD, PLAN-064).

## Regressão — referenciar existentes (não duplicar)

- Auth 401/403/roles/escopo/IDOR: `07` API-CT-006/087 · 012/022/057/059/085 · 098..101
- Whitelabel: API-CT-094/106..119 · MOD-G-CT-1/5 · Capacidades (API-UC-CAP)
- Upload: API-CT-089..094 · Financeiro: estorno 032..034 · caixa 044..046 · pagamento 028
- Senha: API-CT-062/079/075/076/077 · Empresa inativa: smoke SUSP · Rate login: API-CT-004
- PLAN-065: `07` FLUXO DE CONTA — AC-CT-13/15/05/08/20 · ES-CT-02/03/05 · SE-CT-01

## Arquivos afetados

| Ação | Arquivo |
|---|---|
| Alterar | `src/main.ts` (trust proxy · helmet · CORS fail-closed) |
| Alterar | `Caddyfile` (headers HSTS · timeouts) |
| Alterar | `package.json` (+helmet) |
| Alterar | `docs/engineering/06-PRODUCAO.md` (firewall/fail2ban · backup cripto · timeouts) |
| Novo | `docs/engineering/SEGURANCA.md` |
| Alterar | `docs/product/07-CASOS-DE-USO-API.md` (CTs T/A/I/D/P — na execução) |

## Validação

- `tsc` · `npm run build` · `audit:ui/styles/modules` · `npm test` · `docs:audit`
- CTs novos + regressão existente (smoke) · preview manual (CSP não quebra telas)
- ⚠️ CSP: testar no browser (dev server) antes de fechar a diretiva

## Notas

- `trust proxy: 1` é seguro porque o **único** proxy externo é o Caddy.
- CSP `'unsafe-inline'` para styles só se o Tailwind exigir; tentar sem primeiro.
