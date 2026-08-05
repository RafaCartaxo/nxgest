# NX Gestão — Anexos do cliente: comprovante de residência (foto ou PDF) — briefing para IA

## 1. Contexto do produto

**NX Gestão** ("Nexus Gestão") — plataforma de gestão multi-negócio (whitelabel).
Backend **Node + Express + TypeScript + SQLite** (better-sqlite3 + Drizzle); frontend
**React + Tailwind v3**, mobile-first, identidade por **CSS variables** ("Nexus", PLAN-038).
Multi-tenant por `empresaId` (isolamento via JOIN), papéis `operator/socio/admin/super_admin`,
módulos por empresa com enforcement no backend (403 — PLAN-036) e **Central adapta por módulo**
(PLAN-037). Avatar/foto do usuário e do cliente em `PLAN-041`.

**DS v2** (`docs/engineering/design/02-DESIGN-SYSTEM.md`) é a referência visual oficial.

## 2. Escopo — anexos do cliente

O cliente costuma enviar o **comprovante de residência** (foto pelo celular **ou** PDF) para
melhor identificação/regularização. Queremos uma seção de **anexos** por cliente que aceite os
dois formatos, com **tratamento cuidadoso**: receber → transformar → armazenar de forma
coerente (sem imagens/PDFs gigantes).

## 3. Estado atual (base)

- **Não existe** anexo/upload em lugar nenhum (sem `multer`, sem pasta de uploads).
- Dados ficam em SQLite no volume Docker (`/data/gestao.db`); **backup copia só o `gestao.db`**.
- Detalhe do cliente (`ClienteDetail`) tem `PageHeader` + cards padrão — será a casa da seção "Anexos".

## 4. O que quero (prioridade)

1. **Tabela `anexos`**: `id, clienteId, tipo, nomeOriginal, mime, tamanho, caminho, criadoPor, createdAt` (migração idempotente no boot).
2. **Armazenamento em arquivo**: `/data/uploads/<clienteId>/` (dentro do volume `nxgestao_data` — **sem mudar o compose**). `Dockerfile` cria a pasta + chown (padrão do `/data`).
3. **Upload multipart (`multer`)** com validação em **duas camadas**:
   - **Front (UX):** valida tipo + tamanho antes de enviar; imagem passa por **compressão via canvas (≤1600px, JPEG/WebP)**; PDF vai como está. Mensagens i18n claras.
   - **Servidor:** `multer` `limits.fileSize = 5MB` (413 global) + valida **MIME real** (allowlist: JPEG/PNG/WebP/PDF) + **tamanho por tipo** (imagem >1MB → 422 `ANEXO_LIMITE`; PDF >5MB → 413; tipo fora → 422 `ANEXO_TIPO`).
   - **Limites (propositadamente conservadores no MVP):** imagem ≤ **1MB** · PDF ≤ **5MB** · guarda global **5MB**.
4. **Endpoints (todos autenticados e escopados — LGPD):**
   - `POST /api/clientes/:id/anexos` (multipart, campo `arquivo`, opcional `tipo`) → 201
   - `GET /api/clientes/:id/anexos` → lista (metadados, sem bytes)
   - `GET /api/clientes/:id/anexos/:anexoId/file` → stream (`Content-Disposition` inline/attachment)
   - `DELETE /api/clientes/:id/anexos/:anexoId` → remove arquivo + linha (audita quem/cuando)
   - **Escopo:** operador → só os próprios clientes; admin/sócio → empresa/subárvore; super_admin → `?empresaId=`. Cross-tenant → 403/404.
5. **Seção "Anexos" no `ClienteDetail`:**
   - Botão de upload (aceita imagem/PDF), prévia (thumbnail de imagem; ícone de arquivo p/ PDF), lista (nome, tipo, tamanho, data), abrir/baixar e remover.
   - Visual no padrão Nexus: `Card rounded-xl bg-card`, `PageHeader`, `StatusBadge`, tokens.
6. **⚠️ Backup obrigatório:** estender o script de backup (VPS `/opt/scripts/backup-nxgestao.sh`) e o `deploy.sh` para incluir `/data/uploads` — senão anexo some no desastre. Atualizar `06-PRODUCAO.md`.

## 5. Padrões a seguir (obrigatórios)

- **Imagem**: front sempre comprime (canvas ≤1600px) antes de enviar; nunca arquivo cru gigante.
- **Segurança de arquivo**: nunca servir via estático público — sempre pelo endpoint autenticado/escopado.
- **Limites**: imagem ≤1MB, PDF ≤5MB, `multer` 5MB (413) — servidor não confia no front.
- **Erros**: códigos próprios (`ANEXO_LIMITE` 413/422, `ANEXO_TIPO` 422) + i18n pt/en/es.
- **UI**: `Card`, `PageHeader`, `Modal` base, `Button`, tokens — nunca cor fixa da paleta (`npm run audit:styles` falha).
- **i18n**: rótulos em pt-BR, en, es (ex.: `cliente.anexos`, `cliente.anexar`, `cliente.anexoLimite`, `cliente.anexoRemover`).
- **Backend**: padrão dos controllers (try/catch + códigos); `resolveUsuarioAlvo` para escopo.

## 6. Entregáveis

- [ ] Tabela `anexos` + migração idempotente + `/data/uploads/<clienteId>/` no boot
- [ ] `multer` configurado (5MB) + validação MIME real + tamanho por tipo
- [ ] Endpoints POST/GET lista/GET file/DELETE com escopo por papel
- [ ] Seção "Anexos" no `ClienteDetail` (upload com compressão no front, prévia, lista, abrir/remover)
- [ ] **Backup inclui `/data/uploads`** (VPS + deploy.sh) + `06-PRODUCAO.md` atualizado
- [ ] i18n (pt/en/es) completo
- [ ] `npm run build` ✅ · `npm run docs:audit` ✅ · `npm run audit:styles` ✅

## 7. Restrições técnicas

- Node/Express + **better-sqlite3 + Drizzle**; frontend React + Tailwind **v3**.
- **Não adicionar libs nativas de imagem** (`sharp`/`jimp`) — compressão no front via canvas.
- Adicionar `multer` ao `package.json` (dependência pequena).
- Volume Docker `/data` já existe — `/data/uploads` fica dentro dele.
- Preservar isolamento multi-tenant e escopos por papel (BRs).

## 8. Referência

- Plano: `docs/plans/PLAN-042-anexos-cliente.md`
- `PLAN-041` (avatar/foto — base) · `PLAN-036/037` (whitelabel/enforcement) · DS v2.
