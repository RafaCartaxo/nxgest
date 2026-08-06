# PLAN-042 — Anexos do cliente: comprovante de residência (foto ou PDF)

**Status:** Concluído

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** identidade visual "Nexus" + facilitação da operação (follow-up do PLAN-041)

**Briefing para IA:** `Lovable-Anexos-NXGestao.md`

---

## Objetivo

Dar ao cliente uma seção de **anexos** (attachments) — começando pelo **comprovante de residência**, que o cliente costuma enviar (foto pelo celular **ou** PDF) para melhor identificação/regularização. Cuidado central: **receber → transformar → armazenar de forma coerente** (sem imagens/PDFs gigantes).

## Escopo

| # | Entrega | Prioridade |
|---|---------|------------|
| 1 | Tabela `anexos` (`id, clienteId, tipo, nomeOriginal, mime, tamanho, caminho, criadoPor, createdAt`) + migração boot | Alta |
| 2 | Armazenamento em arquivo: `/data/uploads/<clienteId>/` (dentro do volume `nxgestao_data`) | Alta |
| 3 | Upload multipart (`multer`) + **validação em duas camadas** (limites abaixo) | Alta |
| 4 | Endpoints autenticados/escopados: `POST`/`GET /api/clientes/:id/anexos` · `GET .../anexos/:anexoId/file` · `DELETE .../anexos/:anexoId` | Alta |
| 5 | Seção **Anexos** no `ClienteDetail` (upload com compressão de imagem no front, PDF direto; prévia; lista; abrir) | Alta |
| 6 | **Backup inclui `/data/uploads`** (`backup-nxgestao.sh` + `deploy.sh`) | **Crítica** |
| 7 | i18n + 02-API + 07 (CTs) + BR + UPDATES | Média |

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Formato | Aceita **imagem (foto)** e **PDF** | Cliente manda foto pelo celular OU PDF — facilitar, sem distinguir pro usuário |
| Pipeline | **Imagem**: front comprime (canvas ≤1600px, JPEG/WebP) antes de enviar · **PDF**: envia como está | Navegador faz o trabalho de imagem (sem `sharp`); servidor valida |
| Armazenamento | Arquivo em `/data/uploads/<clienteId>/` + metadados em `anexos` | Volume `nxgestao_data` já monta `/data` → **sem mudança no compose**; `Dockerfile` cria a pasta |
| Entrega | `GET .../anexos/:anexoId/file` **autenticado e escopado** (empresa/usuário) | Dado sensível (LGPD) — nunca estático público |
| Limites | Imagem ≤**1MB** (pós-compressão) · PDF ≤**5MB** · **guarda global `multer` 5MB** (413 antes de processar) | Comprovante simples; gigante não faz sentido no MVP |
| Validação | Servidor valida **MIME real** (JPEG/PNG/WebP/PDF) + tamanho por tipo (`ANEXO_LIMITE` 413/422) | Não confia no front |

## Limites e validação (detalhe)

| Camada | Regra |
|---|---|
| Front (UX) | Valida tipo + tamanho antes de enviar; mensagem i18n ("O PDF deve ter no máximo 5MB" / "A imagem deve ter no máximo 1MB") |
| `multer` | `limits.fileSize = 5MB` — qualquer arquivo maior → **413** no ato |
| Servidor (pós-recebimento) | MIME real na allowlist; **imagem > 1MB → 422 `ANEXO_LIMITE`** mesmo <5MB; **PDF > 5MB → 413**; tipo fora da allowlist → 422 `ANEXO_TIPO` |
| Dimensão | Front sempre redimensiona imagem ≤1600px (barra imagem gigante de poucos bytes) |

> Limites **conservadores de propósito** no MVP (comprovante simples). Podem subir por template de negócio no futuro (whitelabel).

## Regras de negócio
| BR | Descrição |
|----|-----------|
| BR-102 (nova, quando implementar) | Anexos por cliente: imagem (≤1MB, ≤1600px) ou PDF (≤5MB); guarda global 5MB; acesso escopado (operador: clientes próprios; admin/sócio: empresa/subárvore; super_admin: qualquer); remoção registra quem/cuando; dado sensível — nunca servido publicamente |

## API
- `POST /api/clientes/:id/anexos` (multipart, `field: arquivo`, opcional `tipo`) → 201
- `GET /api/clientes/:id/anexos` → lista (metadados, sem bytes)
- `GET /api/clientes/:id/anexos/:anexoId/file` → stream (Content-Disposition inline/attachment)
- `DELETE /api/clientes/:id/anexos/:anexoId` → remove arquivo + linha
- Escopo: `resolveUsuarioAlvo` (operador → só os próprios; admin → empresa; super → `?empresaId=`)

## Documentação (quando implementar — matriz SKILL-009)
- `02-API.md` (endpoints de anexos) · `07-CASOS-DE-USO-API.md` (CTs: limite 413/422, tipo inválido, escopo cross-tenant 403/404) · `06-CASOS-DE-USO.md` (UC: operador anexa comprovante)
- `02-BUSINESS-RULES.md` (BR-102) · `05-MAPEAMENTO-TELAS.md` (§5 Detalhe do Cliente — seção Anexos) · `UPDATES.md` · este PLAN + briefing

## ⚠️ Ajustes obrigatórios de infra (quando implementar)
- `Dockerfile`: criar `/data/uploads` + chown (padrão do `/data`)
- `package.json`: adicionar `multer`
- **Backup**: estender `/opt/scripts/backup-nxgestao.sh` (VPS) e o `scripts/deploy.sh` para incluir `/data/uploads` — hoje só o `gestao.db` é copiado; anexo perdido no desastre = dado perdido
- `06-PRODUCAO.md`: seção de backup atualizada

## Validação (quando implementar)
- `npm run build` · `npm run docs:audit` · `npm run audit:styles`
- Manual: upload imagem + PDF; limites 413/422; prévia/abrir; escopo (operador não vê anexo de outro); remoção; backup gera arquivo com uploads

## Referências
- `PLAN-041` (avatar/foto — base visual) · `PLAN-038/039/040` (identidade)
- `Lovable-Anexos-NXGestao.md` (briefing para IA)
