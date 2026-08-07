# PLAN-064 — Onboarding Comercial e Aquisição de Empresas (Leads)

**Status:** ✅ Implementado — 07/08/2026

**Versão:** 1.0

**Início:** 07/08/2026

**Origem:** draft "PLAN-020 — Onboarding Comercial" (GPT) adaptado ao padrão do repo + decisões de produto 07/08 (Opção A: lead + aprovação do super admin)

**Dependência:** **PLAN-065** (infra de e-mail + convite/ativação). A **conversão** reusa `createEmpresa` + **convite**.

---

## Objetivo

Separar completamente o **fluxo comercial** do **fluxo operacional**. NÃO criar auto-cadastro de empresas: estruturar um processo de aquisição em que interessados demonstram interesse com segurança, mantendo o controle de criação de tenants pelo **Super Admin**.

## Princípio

Uma empresa **nunca nasce automaticamente**. Antes de existir uma empresa, existe um processo comercial. O fluxo operacional inicia apenas após o onboarding.

## Domínios

**Comercial** (novo): `Lead → Confirmação de e-mail → Onboarding → Empresa`
**Operacional** (inalterado): `Empresa → Administrador → Operadores`

## Conceitos

- **Lead:** empresa interessada. Sem acesso, sem tenant. Inicia o relacionamento comercial.
- **Onboarding:** processo de transformar Lead em cliente (validação, contato, negociação, configuração, aprovação). Ao final, nasce a empresa.

## Entidade Lead

```ts
Lead {
  id
  nomeResponsavel
  empresa
  email            // unique — dedup
  telefone?        // opcional
  origem           // default "Site" (Site | WhatsApp | Instagram | Indicacao | Manual | ...)
  status           // NOVO | EMAIL_CONFIRMADO | EM_ONBOARDING | CONVERTIDO | DESCARTADO
  createdAt
}
```

- Nova tabela `leads` (domínio comercial). Sem relação operacional com `empresas` até a conversão.

## Fluxo público — `/quero-conhecer`

- Rota **pública** no app (fora do `ProtectedRoute`), estilo do login (tokens).
- Campos: Nome · Empresa · E-mail · Telefone (opcional). Validação **zod**.
- Ao enviar: cria Lead `NOVO` · envia e-mail de confirmação · **não cria empresa/usuário/tenant**.
- **Dedup por e-mail:** se já existe lead com o mesmo e-mail → não cria + mensagem amigável ("Já existe uma solicitação utilizando este e-mail...").
- **Rate limit** na página pública.
- **Edge case:** e-mail que **já é usuário/empresa existente** → tratar (aviso), sem duplicado.

## Confirmação de e-mail

- Token de confirmação via `auth_tokens` (tipo `lead`, expiração 24h, single-use) — reusa a infra do PLAN-065.
- Clicar no link → `POST /api/leads/confirmar` → status `EMAIL_CONFIRMADO`.
- Token expirado → erro + "reenviar confirmação".

## Painel Super Admin — `/admin/leads`

- Nova rota protegida por `SuperAdminRoute` (padrão do `SuperAdminPage`).
- Lista com status/filtros (NOVO, EMAIL_CONFIRMADO, EM_ONBOARDING, CONVERTIDO, DESCARTADO).
- Ações (só super):
  - **Iniciar onboarding** → `EM_ONBOARDING`
  - **Converter** → `CONVERTIDO` + cria Empresa + Administrador pelo fluxo existente + **convite** + **auditoria** da conversão (quem/quando)
  - **Descartar** → `DESCARTADO` (+ limpeza de dados/LGPD)
- Não-super acessando `/admin/leads` → redirect (SuperAdminRoute).

## Conversão

`Lead(CONVERTIDO) → createEmpresa + admin (convite) → admin ativa → cliente ativo`

- Reusa o fluxo atual de criação de empresa + administrador, com `adminSenha` **opcional** → **convite** (PLAN-065).
- Após conversão: `Lead.status = CONVERTIDO`.

## Segurança

Confirmação de e-mail obrigatória · rate limit na página pública · proteção contra duplicados · isolamento total entre Leads e Empresas · auditoria da conversão · LGPD (retenção mínima; descarte remove dados pessoais).

## Fora de Escopo

Planos de assinatura · cobrança recorrente · trial automático · criação automática de tenant · ambiente sandbox · gateway de pagamento · CRM completo · funil/métricas.

## Evolução futura (preparado, não implementado)

Funil comercial · métricas de conversão · CRM simplificado · campanhas por origem · acompanhamento de onboarding · planos/assinaturas · trial controlado.

## CTs

### Página pública
- **LD-01** `/quero-conhecer` envia → cria lead `NOVO` + e-mail de confirmação
- **LD-02** e-mail duplicado → não cria + mensagem amigável
- **LD-03** validação (email inválido, campos obrigatórios) → erro
- **LD-04** rate limit na página pública
- **LD-05** não cria empresa/usuário/tenant

### Confirmação
- **LD-06** link de confirmação → status `EMAIL_CONFIRMADO`
- **LD-07** token expirado → erro + reenviar confirmação
- **LD-08** token usado → erro (single-use)

### Painel super admin
- **LD-09** `/admin/leads` lista com status/filtros
- **LD-10** iniciar onboarding → `EM_ONBOARDING`
- **LD-11** converter → empresa + admin (convite) + `CONVERTIDO` + auditoria
- **LD-12** descartar → `DESCARTADO` (+ limpeza LGPD)
- **LD-13** não-super acessa `/admin/leads` → redirect

### Integração/segurança
- **LD-14** `origem` default "Site"
- **LD-15** e-mail que já é usuário/empresa → tratado (sem duplicado)
- **LD-16** isolamento leads × empresas até a conversão
- **LD-17** conversão reusa `createEmpresa` + convite (admin ativa)
- **LD-18** LGPD — retenção mínima, descarte remove dados

## Arquivos

| Ação | Arquivo |
|---|---|
| Novo | `src/modules/leads/domain/` · `application/` · `infrastructure/` · `presentation/` (Clean Architecture) |
| Novo | `src/database.ts` — tabela `leads` (+ reuso `auth_tokens` tipo `lead`) |
| Alterar | `src/modules/admin/presentation/routes/empresa.routes.ts` (converter) |
| Novo | `frontend/src/modules/leads/` — página pública `QueroConhecerPage` + painel `LeadsAdminPage` |
| Alterar | `frontend/src/App.tsx` (rota pública `/quero-conhecer` + `/admin/leads`) · `i18n` · `SuperAdminPage`/nav (link Leads) |
| Docs | `06-CASOS-DE-USO.md` · `07-CASOS-DE-USO-API.md` · `08-UC-MODULOS.md` (se aplicável) · `UPDATES.md` |

## Validação

`tsc` · `npm run build` · `audit:ui/styles/modules` · `npm test` · `docs:audit` · smoke (lead → confirmação → conversão) · regressão CTs (LD-*).

---

## Referências

- `docs/plans/PLAN-065-fluxo-de-conta.md` (dependência: e-mail + convite)
- `docs/plans/BACKLOG.md` · `AGENTS.md`
