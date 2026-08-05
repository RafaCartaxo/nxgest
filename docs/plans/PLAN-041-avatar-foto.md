# PLAN-041 — Avatar com foto (usuário/operador/cliente)

**Status:** Planejado

**Versão:** 1.0

**Início:** 05/08/2026

**Última atualização:** 05/08/2026

**Roadmap:** identidade visual "Nexus" (follow-up do PLAN-038/039/040) + whitelabel

**Briefing para IA:** `Lovable-Avatar-NXGestao.md`

---

## Objetivo

Levar o avatar de **iniciais** (hoje só na sidebar, `AppLayout`) para a **opção de foto** em todos os perfis — **usuário/operador/admin** (self-service + admin gerencia) e **cliente**. Foto **normalizada na entrada** (resize + compressão → data URL pequena) para não inflar o armazenamento.

## Escopo

| # | Entrega | Prioridade |
|---|---------|------------|
| 1 | Componente `Avatar` compartilhado (`shared/components/Avatar/Avatar.tsx`) — foto \| fallback iniciais | Alta |
| 2 | Util `processarImagem` (`shared/utils/processarImagem.ts`) — canvas → resize ≤200px + JPEG/WebP q~0.7 → data URL (~10-20KB) | Alta |
| 3 | Backend: `usuarios.foto` + `clientes.foto` (TEXT null, ALTER idempotente); `login`/`me`/`operadores`/`clientes` devolvem `foto` | Alta |
| 4 | `PATCH /api/auth/foto` (foto própria) · `PATCH /api/admin/operadores/:id` e `POST/PATCH /api/clientes` aceitam `foto` | Alta |
| 5 | Aplicar nas superfícies (mapa abaixo) | Alta |
| 6 | i18n (pt/en/es) + DS v2 (seção Avatar) + mapeamento telas + UPDATES | Média |

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Armazenamento da foto | **Data URL** (base64) normalizada em `foto` (coluna TEXT) | Sem infra de arquivo; ~10-20KB por foto; carrega rápido (essencial pro operador) |
| Transformação | Front via `canvas` (resize ≤200px + JPEG/WebP q~0.7) | Navegador faz o trabalho; servidor só valida tamanho/tipo — sem deps nativas |
| Limite | Foto ≥500KB de entrada → rejeitada (422 `FOTO_LIMITE`) | Não armazenar "gigante" |
| Quem define | **Próprio usuário** (Perfil) **e** **admin** (OperadorForm/OperadorDetail) | Pedido explícito: facilitar pro usuário, mas admin gerencia a equipe |
| Cliente | Foto no cadastro/edição (`ClienteNovo/Edit`) + exibição em `ClienteCard`/`ClienteDetail` | Identificação visual do cliente |
| `CobrancaCard` | **Fora de escopo agora** — variante futura (com/sem foto); o operador vê a foto no perfil do cliente (tab/botão já existente) | Registrar observação; não bloquear o MVP |

## Mapa de superfícies

| Superfície | Arquivo | Mudança |
|---|---|---|
| Sidebar — usuário logado (desktop + drawer) | `shared/layout/AppLayout.tsx` | `Avatar` (foto \| iniciais) no rodapé do usuário |
| Meus dados — foto própria | `modules/auth/pages/PerfilPage.tsx` | seção foto: upload (resize) / prévia / remover |
| Lista de operadores (admin) | `modules/admin/components/OperadoresList.tsx` | `Avatar` por operador |
| Modal da equipe (KPIs) | `modules/admin/components/EquipeModal.tsx` | `Avatar` |
| Contribuição por operador | `modules/admin/components/ContribuicaoModal.tsx` | `Avatar` |
| Detalhe do operador | `modules/admin/pages/OperadorDetail.tsx` | `Avatar` (e admin define foto) |
| Form do operador (admin) | `modules/admin/components/OperadorForm.tsx` | campo foto |
| Cadastro/edição do cliente | `modules/cliente/pages/ClienteNovo.tsx`, `ClienteEdit.tsx` | campo foto |
| Card do cliente | `modules/cliente/components/ClienteCard.tsx` | `Avatar` (foto \| iniciais — já tem iniciais) |
| Detalhe do cliente | `modules/cliente/pages/ClienteDetail.tsx` | `Avatar` maior + foto |

## Regras de negócio
| BR | Descrição |
|----|-----------|
| BR-101 (nova, quando implementar) | `foto` (data URL) opcional em `usuarios`/`clientes`, normalizada ≤200px e ≤500KB na entrada; usuário altera a própria via `PATCH /api/auth/foto`; admin/sócio/super_admin definem foto de operador do escopo; operador define foto do próprio cliente |

## API
`PATCH /api/auth/foto` + `foto` em `login`/`me`/`operadores`/`clientes` + `foto` aceita em `PATCH /api/admin/operadores/:id` e `POST/PATCH /api/clientes` — documentar em `02-API.md` e `07` (CTs) quando implementar.

## Documentação (quando implementar — matriz SKILL-009)
- `02-DESIGN-SYSTEM.md` (seção **Avatar**) · `05-MAPEAMENTO-TELAS.md` (foto na Sidebar/ClienteCard/ClienteDetail)
- `02-API.md` · `07-CASOS-DE-USO-API.md` (CTs foto: validação, limite, escopo) · `06-CASOS-DE-USO.md` (UC)
- `02-BUSINESS-RULES.md` (BR-101) · `UPDATES.md` · este PLAN + briefing

## Validação (quando implementar)
- `npm run build` · `npm run audit:styles` (Avatar só com tokens) · `npm run docs:audit`
- Manual: upload/remover foto no Perfil; admin define foto do operador; foto do cliente no cadastro e cards; fallback iniciais sem foto

## Referências
- `PLAN-038` (tokens/sidebar) · `PLAN-039` (forms/inputs — base do `Field`) · `PLAN-040` (painel admin)
- `Lovable-Avatar-NXGestao.md` (briefing para IA)
