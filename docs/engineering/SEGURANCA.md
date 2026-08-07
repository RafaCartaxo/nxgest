# SEGURANÇA — Postura e processos

**Status:** Ativo

**Última atualização:** 07/08/2026

> Documento vivo da postura de segurança do NX Gestão. Correções priorizadas: `plans/PLAN-066-hardening-seguranca.md`.

---

## Visão

Proteger dados financeiros e pessoais (LGPD), garantir acesso por papel/empresa e manter disponibilidade.

Princípios: **defense in depth** · **menor privilégio** · **fail-closed**.

## O que JÁ está bom (base)

- Auth JWT com secret forte; role/empresa resolvidas do **banco**; bloqueio de empresa inativa (BR-106) e conta convidada (PLAN-065).
- Autorização em camadas (auth/requireModule/admin/super/capability/`resolveUsuarioAlvo`).
- zod + respostas genéricas (sem enumeração) · uploads seguros (sem SVG / magic bytes / limites) · senha nunca retorna na API.
- Segredos fora do repo (`~/.config/nxgestao`); VPS SSH por chave; container non-root; `.env` chmod 600.

## Gaps e ameaças (resumo — detalhe no PLAN-066)

| Área | Status |
|---|---|
| Rate limit atrás do proxy (`trust proxy`) | ✅ P0 feito (07/08) |
| Security headers (helmet/CSP/HSTS) | ✅ P0 feito (07/08) — CSP testado no build (Google Fonts liberadas) |
| CORS fail-closed | ✅ P0 feito (07/08) |
| E-mail: falha de envio tratada (503 EMAIL_UNAVAILABLE + rollback de lead) | ✅ feito (07/08) |
| Expiração/reenvio de tokens de conta | ⚠️ P1 (CTs A-07/A-09) |
| Rate limit global/por usuário · DDoS L7 | ⚠️ P1/P2 |
| Firewall/fail2ban no VPS | ⚠️ P1 (verificar/documentar) |
| Backup off-site criptografado | ⚠️ P1 |
| Timeouts no Caddy (slowloris) | ⚠️ P1 (syntax do `servers` block a validar) |
| JWT localStorage + 7d sem revogação | ⚠️ P2 (decisão) |
| Dependências (`npm audit`) | ⚠️ rotina |

## Processos

- **`npm audit`** — checar periodicamente; tratar runtime primeiro (dev-only é baixo risco).
- **Novo endpoint público** — exige rate limit + zod + resposta genérica quando aplicável.
- **Novo upload** — allowlist MIME (sem SVG), magic bytes, limite, endpoint autenticado.
- **Segredos** — nunca no repo; `.env` chmod 600 no VPS; credenciais em `~/.config/nxgestao`.
- **Deploy** — seguir `06-PRODUCAO.md`; `.env` de produção só no VPS.
- **CTs de segurança** — novos entram em `07-CASOS-DE-USO-API.md` na execução do PLAN-066; existentes servem de regressão.

## Responsabilidades

- **Admin/super** controlam empresas/usuários (convite, roles, módulos/capacidades).
- **Operador** tem escopo por usuário/subárvore (`resolveUsuarioAlvo`).
- **Super admin** é o único com gestão global (empresas/leads).

## Como reportar

- Bug de segurança → tratar como prioridade; registrar no CHECKLIST do dia + CTs de regressão.
