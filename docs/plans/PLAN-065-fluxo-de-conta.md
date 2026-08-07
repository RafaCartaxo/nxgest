# PLAN-065 — Fluxo de conta: convite/ativação + esqueci a senha + infra de e-mail

**Status:** ✅ Pronto para execução (handoff)

**Versão:** 1.0

**Início:** 07/08/2026

**Origem:** backlog `docs/plans/BACKLOG.md` — P020 (re-escopado) + decisões de produto 07/08

**Dependência de produção:** domínio real `nxgest.com.br` + verificação no Resend (SPF/DKIM/DMARC). **Não bloqueia desenvolvimento** (modo dev loga o link no console).

---

## Objetivo

Completar o **ciclo de vida da conta** que nunca foi construído: usuário convidado ativa a própria senha, e quem esqueceu recupera por e-mail. Usa **Resend** como provedor de e-mail transacional.

> O que **já existe** e NÃO muda: login JWT, roles (operator/admin/socio/super), multi-tenant, whitelabel, isolamento por operador, troca de senha (Perfil), foto, empresa inativa (403), rate limit no login.

---

## F1 — Infra de e-mail (Resend)

- Provider **abstrato**: `src/shared/email/mailer.port.ts` + impl `resend.mailer.impl.ts` (troca futura p/ SES sem retrabalho).
- Env (`.env.example` + `.env.production.example`): `MAIL_PROVIDER=resend` · `RESEND_API_KEY` · `MAIL_FROM=no-reply@nxgest.com.br` · `APP_URL=https://nxgestao.duckdns.org` (migra com o domínio).
- **Modo dev:** sem `RESEND_API_KEY` → loga o link no console (não quebra dev).
- Templates HTML + texto (pt/en/es): convite · reset de senha · confirmação de lead.
- Pré-requisito de produção (documentar em `06-PRODUCAO.md`): domínio `nxgest.com.br` registrado + registros TXT (SPF/DKIM/DMARC) criados no registro.br + domínio verificado no Resend.

## F2 — Convite e ativação

- `usuarios.senhaHash` → **nullable** (convidado ainda não definiu senha). Migração Drizzle.
- Nova tabela `auth_tokens` (`id, usuarioId, tipo: "convite"|"reset"|"lead", hash, expiraEm, usadoEm, createdAt`) — token aleatório `crypto.randomBytes(32)` com **hash SHA-256**, **single-use**, **expiração** (convite 7d, reset 30–60min, lead 24h); **reenvio invalida tokens anteriores** do mesmo tipo.
- `POST /api/admin/operadores`: **senha opcional** → sem senha = gera convite (e-mail) e usuário fica `convidado`.
- `POST /api/admin/operadores/:id/reenviar-convite` (admin) — novo token + novo e-mail.
- `POST /api/auth/ativar` { token, senha } (público) — valida token, define `senhaHash`, marca token usado, ativa.
- Login de conta convidada → **403** com mensagem "ativação pendente".
- `GET /api/auth/me` devolve `status` (`convidado`/`ativo`).

## F3 — Esqueci a senha

- `POST /api/auth/forgot` { email } (público, rate limit 3/15min por email+IP) → **resposta genérica 200** (não revela se o e-mail existe) + e-mail com link `APP_URL/resetar-senha?token=...`.
- `POST /api/auth/reset` { token, senha } (público, rate limit) — valida, redefine `senhaHash`, invalida token.

## Frontend

- **Login** (`/login`): link **"Esqueci minha senha"** → tela de recuperação; login de convidado mostra mensagem.
- **Telas públicas** (fora do `ProtectedRoute`, no `App.tsx`): `/recuperar-senha` (email) · `/resetar-senha` (?token=) · `/ativar` (?token= do convite).
- **Perfil** (`/perfil`): **inalterado** (troca de senha já existe).
- **Admin** (`OperadorForm`): senha vira **opcional**; `OperadoresList` ganha badge **"Convite pendente"** + ação **reenviar convite**.
- **Super** (`EmpresaForm`/`createEmpresa`): `adminSenha` opcional → convite pro admin da empresa.
- **`AuthContext`**: trata usuário convidado (redireciona/mensagem).
- i18n pt/en/es (chaves `auth.*` novas).

## Segurança

Tokens aleatórios + hash no DB · expiração · single-use · reenvio invalida anteriores · resposta genérica no forgot · rate limit público · senha mín. 6 (BR) · não logar token.

## CTs

Ver seção "CTs" ao final (AC/ES/SE/EM/UI). Executar antes e depois da implementação (regressão).

## Arquivos

| Ação | Arquivo |
|---|---|
| Novo | `src/shared/email/mailer.port.ts` · `resend.mailer.impl.ts` |
| Novo | `src/modules/auth/application/use-cases/` (AtivarConta, EsquecerSenha, RedefinirSenha, Convidar, ReenviarConvite) |
| Novo | `src/modules/auth/domain/auth-token.entity.ts` |
| Alterar | `src/database.ts` (tabela `auth_tokens` + `usuarios.senhaHash` nullable) |
| Alterar | `src/modules/auth/presentation/routes/auth.routes.ts` (+forgot/reset/ativar) |
| Alterar | `src/modules/admin/presentation/...` (operadores: senha opcional + reenviar convite) |
| Alterar | `frontend/src/modules/auth/pages/LoginPage.tsx` · novo `RecuperarSenhaPage`/`ResetarSenhaPage`/`AtivarPage` |
| Alterar | `frontend/src/modules/admin/components/OperadorForm.tsx` · `OperadoresList.tsx` · `EmpresaForm.tsx` |
| Alterar | `frontend/src/App.tsx` (rotas públicas) · `AuthContext.tsx` · `auth.service.ts` |
| Alterar | locales pt-BR/en/es · `.env.example` · `06-PRODUCAO.md` |

## Validação

`tsc` · `npm run build` · `audit:ui/styles/modules` · `npm test` · `docs:audit` · smoke (forgot/reset/ativar) · preview manual dos 3 fluxos · regressão CTs.

---

## CTs — PLAN-065

### Convite / ativação
- **AC-01** admin cria operador sem senha → usuário `convidado` + e-mail de convite enviado
- **AC-02** admin cria com senha (legado) → sem convite (comportamento atual)
- **AC-03** criar com e-mail duplicado → 422
- **AC-04** link do convite abre tela "definir senha" com o nome do usuário
- **AC-05** definir senha válida → conta ativa + login funciona
- **AC-06** senha < 6 → erro
- **AC-07** token de convite expirado → erro + "reenviar convite"
- **AC-08** token já usado → erro (single-use)
- **AC-09** reenviar convite → novo token, anterior invalida
- **AC-10** login de conta convidada → 403 "ativação pendente"
- **AC-11** `GET /me` devolve status `convidado`/`ativo`
- **AC-12** super cria empresa + admin sem senha → convite pro admin

### Esqueci senha
- **ES-01** "Esqueci minha senha" no login → tela de e-mail
- **ES-02** e-mail existente → 200 genérico + e-mail com link
- **ES-03** e-mail inexistente → 200 genérico (não vaza)
- **ES-04** token reset expirado → erro
- **ES-05** reset define nova senha → login com a nova
- **ES-06** rate limit (várias tentativas) → bloqueio temporário
- **ES-07** token já usado → erro

### Segurança / tokens
- **SE-01** token aleatório, armazenado com hash (nunca em texto)
- **SE-02** expiração por tipo (convite 7d · reset 30–60min)
- **SE-03** single-use (não reutilizável)
- **SE-04** reenvio invalida token anterior do mesmo tipo
- **SE-05** migração `senhaHash` nullable correta (convidados sem senha, ativos inalterados)

### Infra e-mail
- **EM-01** sem `RESEND_API_KEY` → modo dev loga o link (não quebra)
- **EM-02** com chave → envia via Resend (`no-reply@nxgest.com.br`)
- **EM-03** templates pt/en/es com assunto/body/link corretos
- **EM-04** destinatário inválido → erro tratado (não 500)

### UI
- **UI-01** `/ativar`, `/resetar-senha`, `/recuperar-senha` acessíveis sem login
- **UI-02** Perfil inalterado (troca de senha segue funcionando)
- **UI-03** `OperadorForm` senha opcional + badge "Convite pendente" + reenviar
- **UI-04** i18n pt/en/es nos novos fluxos

---

## Referências

- `docs/plans/BACKLOG.md` (P020) · `docs/plans/PLAN-064-onboarding-comercial-leads.md` (depende deste)
- `docs/engineering/06-PRODUCAO.md` (domínio/Resend) · `AGENTS.md`
