# 07 — Segurança

**Status:** Ativo · **Fonte:** `docs/engineering/SEGURANCA.md` · `docs/plans/PLAN-066-hardening-seguranca.md` · `docs/engineering/06-PRODUCAO.md`

---

## Postura geral

Segurança é **by design**: fail-closed, mínima superfície, segredos fora do repo, hardening em camadas. Base: PLAN-066 (P0 concluído · P1 parcial · P2 pendente).

---

## Autenticação e autorização

| Tema | Como funciona |
|---|---|
| Hash de senha | bcryptjs |
| Token | JWT (expiração 7d) — payload `{ userId, role, empresaId }` |
| Fail-closed | Sem `JWT_SECRET` → erro (produção não autentica) |
| Middlewares | `auth` (401) · `admin`/`super-admin` (403) · `module` (403) · `capability` (403) |
| Empresa inativa | Login bloqueado (403 `EMPRESA_INATIVA`) · conta pendente → 403 `ACCOUNT_PENDING` |
| Rate limit login | 10/15min por IP (Cloudflare `CF-Connecting-IP`) |

---

## HTTP e infra

| Item | Estado |
|---|---|
| HTTPS | Caddy + Let's Encrypt (automático) + **HSTS** (inclui subdomínios, preload) |
| Security headers | Helmet + **CSP** (styles inline + Google Fonts + blob p/ PDF viewer) |
| CORS | **Fail-closed** em produção sem `CORS_ORIGIN` (origin: false) |
| Trust proxy | Apenas Caddy (`X-Forwarded-For`) |
| Firewall (VPS) | **Pendente (P1)** — firewalld + fail2ban no SSH (doc §11) |
| SSL mode | Cloudflare Full (strict) **recomendado** (pendente) |

---

## Rate limits (resumo)

| Limiter | Rota | Default |
|---|---|---|
| Login | `/api/auth/login` | 10/15min por IP |
| Forgot | `/api/auth/forgot` | 3/15min por e-mail+IP |
| Leads | criar/confirmar/reenviar | 10·10/3 por IP |
| Autenticado | todas com `userRateLimit` | 600/min por usuário |

---

## Uploads (fotos/anexos)

- Foto do usuário: `validarFoto` — allowlist MIME + **magic bytes**, sem SVG; limites de tamanho (≤1MB decodificados).
- Anexos: MIME real detectado, tipo permitido (imagem/PDF), limite, extensão de segurança.

---

## E-mail (fail-closed)

- Resend de `no-reply@nxgest.com.br`; domínio verificado.
- **Produção sem `RESEND_API_KEY` → 503 `EMAIL_UNAVAILABLE`** (nunca mente sucesso).
- Dev sem chave: loga o link no console (não quebra).

---

## Segredos e credenciais

- `.env` (prod) e `.env.staging` **fora do repo** (gitignored, chmod 600 no VPS).
- Credenciais externas em `~/.config/nxgestao/` (chave SSH, senhas, ACESSOS).
- Secrets GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
- Backup off-site **cifrado** (gpg/age) — LGPD.

---

## Dependências

- `npm audit --omit=dev` → **0 vulnerabilidades** (18/08) · dependabot semanal (npm + actions) · react-router 7.18.2 (fix GHSA-337j/CVE-2025-68470).
- Vulns dev-only restantes (vite/vitest) — major bump, fora de escopo (monitorar).

---

## Gaps e pendências (PLAN-066)

| Item | Status |
|---|---|
| P0 — helmet/CSP/CORS/HSTS/trust proxy | ✅ |
| P1 — clientIp nos limiters · rate limit por usuário · backup cifrado · firewalld/fail2ban | 🔵 parcial (firewall pendente) |
| P2 — JWT curto/revogação · Cloudflare WAF · 2FA · senha mín. 8 | ⏳ |
| Cloudflare SSL Full (strict) | ⏳ recomendado |

---

## Documentos relacionados

- `docs/engineering/SEGURANCA.md` — postura e gaps
- `docs/plans/PLAN-066-hardening-seguranca.md` — plano completo
- `docs/foundation/ADR-003-Auth-Autorizacao.md` — decisão de auth
- `docs/engineering/06-PRODUCAO.md` — hardening do host (firewalld/fail2ban)
