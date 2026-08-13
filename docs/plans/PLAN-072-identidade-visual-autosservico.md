# PLAN-072 — Identidade visual da empresa: autosserviço + branding por tenant

**Status:** ⏳ Planejado (pronto p/ execução — análises e cenários registrados 13/08)

**Versão:** 1.0

**Início:** 13/08/2026

**Origem:** solicitação de melhoria da configuração de identidade visual do cliente (empresa/tenant): o administrador precisa **ver e editar** os dados de identidade da própria empresa dentro do NX Gest. Verificação cruzada feita com o fluxo de leads ("Quero conhecer"), o cliente com contratos e o papel super.

---

## Objetivo

Dar ao **admin/sócio** da empresa autosserviço de **identidade visual** (nome fantasia, paleta default do tenant, logo e contato de suporte), com **branding por empresa** aplicado a todos os usuários do tenant (login/navbar/app), mantendo o super admin como moderador. Aproveita o seam de whitelabel já existente no tema (`--tenant-primary`) e o padrão de completude do `ClienteForm` para o formulário de identidade.

**Princípio respeitado:** empresa **nunca nasce automaticamente** (PLAN-064) — este plano não cria tenants; apenas dá identidade a tenants já existentes.

---

## Contexto verificado (13/08)

| Item | Estado atual |
|---|---|
| Form da empresa (`EmpresaForm`) | Mínimo: nome, nomeFantasia, documento, ativa + admin no create — **só super edita** (`empresa.routes.ts:13`, `superAdminMiddleware`) |
| Admin/sócio | Só recebe `empresaNome` (string) via `login`/`me`; **não enxerga nem edita** a própria empresa |
| Temas | 5 paletas × light/dark/system **por usuário em localStorage** (`ThemeProvider.tsx`); CSS jsá tem seam `--tenant-primary` que sobrescreve `[data-theme="default"]` (`index.css:55,266-272`) |
| Logo | Marca estática "NX Gest" (`Logo.tsx`) — sem per-empresa; favicon **já lê tokens** e adaptaria a cor do tenant de graça (`favicon.ts`) |
| Colunas `empresas` | `id, nome, created_at, modulos, capacidades, documento, nome_fantasia, ativa` — **zero colunas de branding** (`database.ts:302-311`) |
| Migrações | `runMigrations` só tem `CREATE TABLE IF NOT EXISTS` + índices — **sem padrão `ALTER TABLE ADD COLUMN IF NOT EXISTS`** ainda (`database.ts:369-466`) |
| Leads (`/quero-conhecer`) | Lead → confirmação → painel super → conversão reusa `createEmpresa(nome = lead.empresa)` + convite. `CriarEmpresaInput` **já aceita** `nomeFantasia`, mas `ConverterLeadUseCase` não passa |
| Roadmap | F2 "Branding por tenant" (`04-ROADMAP.md:604`) e PLAN-040 item 5 preveem `empresa.tema` + nome/logo — sem coluna/cronograma; este plano executa a parte app-side do F2 |

---

## Decisões

| # | Decisão | Escolha |
|---|---|---|
| D1 | Escopo de edição (admin/sócio) | **Só identidade visual**: nomeFantasia · tema (5 presets) · logo · email/telefone de contato. Cadastral (nome jurídico, documento, `ativa`) continua **exclusivo do super** |
| D2 | Dono do branding | **Empresa define em autosserviço** (admin/sócio); **super modera** (vê e ajusta no painel dele, padrão `ModulosModal`/`CapacidadesModal`) |
| D3 | Alcance do tema | **Por empresa como default**, usuário pode sobrescrever: paleta da empresa = default de todos os usuários do tenant; preferência individual (localStorage) tem prioridade |
| D4 | Cor custom | **Fora da v1** — `--tenant-primary` só vale no tema `default` (`index.css:266-272`); cor custom exigiria contraste por tenant. v1 = empresa escolhe entre os **5 presets** |
| D5 | Logo | Reusa `validarFoto` (`foto.ts`): data URL, **sem SVG** (XSS), ≤1MB, magic bytes. Componente de upload **novo** (logo é quadrada; `AvatarField` é circular) |
| D6 | Suprface de branding | **Dentro do app**: sidebar + mobile header + header do AdminPage + favicon (cor). **Login/landing/`/quero-conhecer` seguem marca NX** — pré-auth, sem contexto de tenant (logo no login = F3/URL por tenant) |
| D7 | Leads | **Seed de identidade na conversão**: `nomeFantasia = lead.empresa` (v1, barato). **Onboarding com conteúdo** (super pré-configura branding em `EM_ONBOARDING`) = v1.5 |

---

## Modelo de dados (migração)

Novas colunas em `empresas` (via **CREATE para banco novo** + **ALTER para banco existente** — criar o padrão `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` no `runMigrations`, G3):

```sql
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "tema" TEXT;               -- paleta id (default/aurora/ocean/grape/sunset)
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "logo" TEXT;               -- data URL (validarFoto: jpg/png/webp/gif ≤1MB, sem SVG)
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "email_contato" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "telefone_contato" TEXT;
```

> **G3 (risco operacional):** sem o ALTER, um banco de prod já existente quebra na primeira edição de branding. Migração tem 2 caminhos: `CREATE TABLE IF NOT EXISTS` (incluindo as colunas novas no DDL) **e** `ALTER ... ADD COLUMN IF NOT EXISTS` (para bancos criados antes). Idempotente — rodar 2x não muda nada.

---

## Backend

| Arquivo | Mudança |
|---|---|
| `src/database.ts` | Colunas novas em `empresas` (DDL do CREATE + bloco ALTER) |
| `src/modules/admin/domain/empresa.entity.ts` | `Empresa`/`EmpresaComStats` ganham `tema`, `logo`, `emailContato`, `telefoneContato` |
| `src/modules/admin/infrastructure/repositories/empresa.repository.impl.ts` | `toComStats` + campos novos; `update` aceita branding; `create` aceita `tema`/`logo`/`contato` |
| `src/modules/admin/presentation/controllers/empresa.controller.ts` | `update` estende campos de branding (super); novo handler de autosserviço |
| `src/modules/admin/presentation/routes/empresa.routes.ts` | `GET/PATCH /api/admin/me/empresa` (admin/sócio, **escopado por `req.empresaId` do JWT** — nunca aceita id no body) |
| `src/modules/leads/application/use-cases/ConverterLead/ConverterLeadUseCase.ts` | Seed: passsar `nomeFantasia: lead.empresa` ao `criarEmpresa.execute` (D7) |
| `src/modules/auth/presentation/controllers/auth.controller.ts` | `enriquecer` (`:38`) passa a devolver `empresa: { nome, nomeFantasia, tema, logo, emailContato, telefoneContato }` em `login`/`me` (substitui `empresaNome` plano — manter compat) |

Regras de segurança:
- Autosserviço exige token; admin **da empresa A** jamais altera a empresa B (escopo por JWT) — mesmo padrão de `PATCH /api/auth/foto`/`senha`.
- `ativa`/`documento`/`nome` **não** são aceitos no autosserviço (só via endpoint do super).
- Logo validada com `validarFoto` no backend (nunca confiar no cliente).

---

## Frontend

| Arquivo | Mudança |
|---|---|
| `frontend/src/modules/auth/services/auth.service.ts` `+` `AuthContext.tsx` | Tipo `User` ganha `empresa` (branding); `refreshUser` puxa o objeto completo (G6) |
| `frontend/src/modules/admin/pages/AdminPage.tsx` | Nova aba **"Identidade da empresa"** (admin/sócio, `isAdminSelf`) — form com Cards canônicos: nomeFantasia, paleta (swatches), logo (uploader), email/telefone de contato |
| `frontend/src/modules/admin/components/` | Novo `EmpresaIdentidadeForm.tsx` + `LogoUploader.tsx` (padrão DS, reusa lógica de validação); i18n pt/en/es |
| `frontend/src/modules/admin/pages/SuperAdminPage.tsx` | Novo **BrandingModal** (moderação do super: ver/ajustar tema/logo/contato da empresa) — padrão `ModulosModal`/`CapacidadesModal` |
| `frontend/src/shared/theme/ThemeProvider.tsx` | Paleta inicial = `localStorage` (`nxgest_palette`) **??** `user.empresa.tema`; usuário sem override cai na paleta da empresa (D3) |
| `frontend/src/shared/layout/AppLayout.tsx` | Sidebar + mobile header: logo da empresa (se houver) + `nomeFantasia` — fallback marca NX (G7) |
| `frontend/src/shared/theme/favicon.ts` | Nenhuma mudança necessária — já lê tokens do tema efetivo (G5, bônus grátis) |
| `frontend/src/shared/components/Logo.tsx` | Novo prop/componente de logotipo do tenant (ou reuso `img` com fallback) |
| `frontend/src/modules/leads/components/` | (v1.5) etapa de branding no onboarding — não implementar na v1 |

> **G6 — sessões já logadas:** `AuthContext` carrega `me` só no login/`refreshUser`. Após salvar identidade, chamar `refreshUser()`; outros usuários veem a mudança ao recarregar (CT ID-24/ID-25).

> **UI/DS (AGENTS.md):** novas telas só com componentes compartilhados (PageHeader, Card, Field/FieldSelect, Modal com `title`, Tabs, Button, StatusBadge) e tokens. Rodar `audit:ui` + `audit:styles` após mudanças visuais e atualizar `docs/engineering/design/UI-COVERAGE.md`.

---

## Gaps mapeados (análise de verificação, 13/08)

| # | Gap | Mitigação |
|---|---|---|
| G1 | `me`/`login` não expõem branding | `enriquecer` devolve `empresa` completo |
| G2 | Sem endpoint self-service (tudo atrás de `superAdminMiddleware`) | Novo `GET/PATCH /admin/me/empresa` |
| G3 | Migração sem `ALTER ADD COLUMN` | Criar padrão ALTER (caminho duplo CREATE + ALTER) |
| G4 | `--tenant-primary` só no tema `default` | v1 sem cor custom (D4) |
| G5 | Favicon adapta cor, não logo | Aceito na v1 (documentar) |
| G6 | Sessões logadas não atualizam branding | `refreshUser()` pós-salvar + CTs |
| G7 | Login pré-auth sem contexto de tenant | v1 só dentro do app (D6) |
| G8 | `ConverterLeadUseCase` não seeda nomeFantasia | Seed na conversão (D7) |
| G9 | Super (`EmpresaForm`) e admin concorrem em `nome_fantasia` | Super mantém cadastral; branding em modal separado |
| G10 | Logo: `validarFoto` exclui SVG; avatar circular ≠ logo | Reusar validação; componente novo; SVG p/ v1.5 |
| G11 | `audit:styles` não pega hex/oklch em JS | v1 usa presets; cor custom (v1.5) via `root.style.setProperty` runtime |
| G12 | i18n + docs-sync (SKILL-009) | Chaves pt/en/es + `02-API.md`, `07`, `api-collection.json`, `UPDATES.md`, BACKLOG |
| G13 | Onboarding de leads é placeholder | v1.5 (com conteúdo de branding) |
| G14 | `AuthUser` frontend sem campo de branding | Atualizar tipo + serviço junto com backend |

---

## CTs

### Autosserviço (admin/sócio)
- **ID-01** admin abre `/admin` → aba Identidade → vê nomeFantasia, paleta, logo, contato atuais.
- **ID-02** altera nomeFantasia → salva → reflete em sidebar/mobile header e no card do super.
- **ID-03** troca paleta default → usuários do tenant (admin/sócio/operator) veem a nova como default (sem relogar — ver ID-25).
- **ID-04** usuário com paleta própria (localStorage) mantém a dela; usuário sem override cai na paleta da empresa.
- **ID-05** upload de logo válido (jpg/png/webp/gif ≤1MB) → aparece em sidebar/mobile header.
- **ID-06** upload inválido (SVG, outro tipo, >1MB) → 422 no endpoint e erro no campo (G10).
- **ID-07** remove logo → volta a marca NX.
- **ID-08** email/telefone de contato inválidos → erro; vazios → permitido.
- **ID-09** sócio acessa e edita igual ao admin.
- **ID-10** **operator NÃO vê a aba nem o endpoint** → 403.

### Persistência / sessão
- **ID-11** admin loga em outro dispositivo → identidade da empresa aplicada (não é só localStorage).
- **ID-12** `me`/`login` devolvem `empresa` com branding atualizado após salvar (G1).
- **ID-24** admin logado salva identidade → `refreshUser()` reflete sem relogar (G6).
- **ID-25** sessão de outro usuário do tenant aberta antes da edição → vê novo branding após reload.

### Moderação (super)
- **ID-13** super vê branding na lista/modal e pode ajustar nomeFantasia/tema/logo/contato.
- **ID-26** super edita cadastral no `EmpresaForm` e branding no modal separado — mudanças independentes não se sobrescrevem (G9).
- **ID-14** super suspende empresa (`ativa=false`) → acesso 403 (regressão BR-106), branding inalterado.
- **ID-15** super força desativação de módulo → branding permanece (regressão BR-092/093).

### Tema / identidade
- **ID-27** admin com paleta própria mantém a dela mesmo com tema da empresa trocado (D3).
- **ID-28** favicon muda de cor conforme o tema da empresa (G5).
- **ID-19** dark/light/sistema com a nova paleta mantém contraste acessível.

### Migração / API / segurança
- **ID-23** migração em **banco existente** (ALTER, dados preservados) + **banco vazio** (CREATE) — idempotente, roda 2x (G3).
- **ID-20** endpoint de identidade exige token; admin da empresa A não altera a empresa B (escopo por JWT).
- **ID-21** admin tenta editar nome jurídico/documento/ativa via autosserviço → não aceito/403 (exclusivo do super).
- **ID-30** logo inválida → 422 (coberto por ID-06).
- **ID-31** endpoint self-service com id no body → ignorado/403 (escopo por JWT).

### Cruzamento com leads ("Quero conhecer") e cliente com contratos
- **ID-22** lead converte → empresa nasce com `nomeFantasia` herdado do lead (LD-19) e admin ativado já vê a aba Identidade.
- **LD-19** converter lead → empresa nasce com `nomeFantasia` do lead (D7/G8).
- **LD-20** (v1.5) super pré-configura branding no onboarding → tenant nasce com paleta/logo/contato.
- **LD-21** admin ativado via convite já vê a aba Identidade com o que o super seedou.
- **LD-22** regressão LD-17 (conversão reusa `createEmpresa` + convite) continua verde.
- **LD-23** `/quero-conhecer` continua sem contexto de tenant (marca NX padrão — público intacto).
- **ID-16** cadastro/edição de cliente com contratos continua íntegro (regressão do `ClienteForm`).
- **ID-17** identidade da empresa não vaza pro cadastro de cliente (campos isolados).
- **ID-18** admin com módulos restritos (ex.: sem caixa) ainda vê a aba Identidade (independente de módulo).
- **ID-29** `/quero-conhecer`, login e landing seguem com marca NX padrão (G7).

---

## Ordem de execução

```text
Fase 1 — Migração (ALTER+CREATE) + entity/repo/controller (super)          [G3/G9/G14]
Fase 2 — me/login com `empresa` + endpoint autosserviço + seed do lead     [G1/G2/G8]
Fase 3 — Aba Identidade no AdminPage + i18n + refreshUser pós-salvar       [G6/G10]
Fase 4 — Aplicação do tema/logo: ThemeProvider + AppLayout + BrandingModal [D3/D6]
Fase 5 — Testes (CTs ID/LD) + audits + docs-sync (SKILL-009)               [G12]
```

## Critérios de aceitação

Admin/sócio edita identidade da empresa em autosserviço (escopo D1) · branding por empresa como default com override individual (D3) · super modera sem perder o cadastral (D9) · migração idempotente em banco novo e existente (G3) · `/quero-conhecer`, login e landing intactos · cliente com contratos sem regressão · `npm run build` + `audit:ui/styles/modules` + `npm test` + `docs:audit` limpos.

## Fora de escopo (v1)

Cor primária custom (`--tenant-primary`, G4) · logo no login/landing (F3 — URL por tenant) · SVG de logo (G10) · onboarding de leads com conteúdo (D7/G13) · favicon com logo do tenant (G5).

## Referências

- `04-ROADMAP.md` §5.10 F2 (branding por tenant) · PLAN-040 item 5 (branding) · PLAN-031 (temas/whitelabel) · PLAN-036/037 (enforcement/coerência)
- PLAN-064/065 (leads/convite) · PLAN-041/058 (`foto`/`validarFoto`) · PLAN-038/039 (identidade/forms)
- `AGENTS.md` (convenções UI + audits + docs-sync) · `docs/engineering/design/` (DS v2)