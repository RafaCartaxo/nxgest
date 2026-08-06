# PLAN-058 — Foto com qualidade + lightbox (640px) + segurança by-design do upload

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" + qualidade da foto do perfil/cliente (follow-up PLAN-041/057)

---

## Objetivo

A foto de avatar era comprimida para **≤200px (JPEG q0.7, ~20KB)** — o dado salvo É 200px, então "ampliar" não tinha resolução pra mostrar. Este plano sobe a resolução armazenada para **640px (q0.8, ~80-150KB)**, adiciona **lightbox** (clique no avatar abre a foto ampliada) e **endurece o upload de foto** no servidor (segurança by-design, evita retrabalho na fase de segurança).

## Escopo

| # | Entrega | Prioridade |
|---|---------|------------|
| 1 | `processarImagem`: `MAX_LADO` 200 → **640px**, JPEG **q0.8** | Alta |
| 2 | **Lightbox**: prop `ampliar` no `Avatar` (botão → `Modal` com a imagem `max-h-[75vh]`); ativo em `ClienteCard` (lista+detalhe), `OperadorDetail`, `AppLayout` (sidebar), `AvatarField` (Perfil/Forms) | Alta |
| 3 | **Validação de foto no servidor** (`shared/utils/foto.ts`): allowlist de MIME `data:image/(jpeg\|png\|webp\|gif)` (**exclui `svg`** — vetor de XSS armazenado fora do contexto `<img>`), **magic bytes** do base64 decodificado (JPEG/PNG/WebP/GIF — impede conteúdo mascarado) e teto **1MB decodificados** | Alta |
| 4 | Caps: `foto` em `CreateClienteInput`/`UpdateClienteInput` (helper + `max(2_000_000)` chars pre-filtro) · `auth.controller`/`admin.controller` `alterarFoto`/PATCH operador usam o helper (1MB) | Alta |
| 5 | i18n `avatar.verFoto` (pt/en/es) + docs (02-API, BR-101, UI-COVERAGE, UPDATES) | Média |
| 6 | Smoke: CTs de foto grande/válida/mascarada/svg/cap (clientes + auth) | Alta |

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Resolução | **640px**, JPEG q0.8 | 7-20× o tamanho de exibição (avatares 32-96px); ~80-150KB é o equilíbrio qualidade × storage/rede. 800px = ~2× storage por ganho marginal |
| Armazenamento | Mesma coluna `foto` (data URL) | Avatares por design em data URL (PLAN-041); sem infra nova |
| Cap servidor | **1MB decodificados** (helper `validarFoto`) | Teto duro; 640px cabe com folga; `express.json` 2mb cobre o body |
| MIME | `jpeg\|png\|webp\|gif` (allowlist) | **`svg` excluído** — data URL SVG pode carregar script se o valor sair do contexto `<img>` (defesa em profundidade) |
| Conteúdo | Magic bytes do base64 | JPEG `FF D8 FF` / PNG / WebP (`RIFF..WEBP`) / GIF (`GIF8`) — rejeita "imagem" com conteúdo arbitrário |
| Fotos antigas | Ficam 200px até re-upload | Aceitável; hint no Perfil opcional |
| Lightbox | `Modal` base (scroll-lock/Escape/backdrop nativos) | Reuso do componente canônico |

## Segurança (by-design, não é "sprint de segurança")

- `validarFoto` centralizado em `shared/utils/foto.ts`, usado em **4 pontos** (create/update cliente, auth foto, admin operador foto) — coerência e uma fonte.
- Servidor **nunca confia no cliente**: valida MIME, magic bytes e tamanho real decodificado.
- `<img>` para render (SVG-em-img não executa script) — já era o caso; a allowlist impede SVG de entrar no storage.

## Documentação (matriz SKILL-009)
- `02-API.md` (caps e MIME da foto no PATCH clientes e `PATCH /api/auth/foto`) · `02-BUSINESS-RULES.md` (BR-101 atualizada)
- `UI-COVERAGE.md` (corrige `⏳` stale de Avatar/Anexos + registra lightbox) · `plans/README.md` · `UPDATES.md` · este PLAN

## Validação
- `npm run build` · `audit:ui` · `audit:styles` · `docs:audit` · vitest · smoke (clientes CLI-E6..E9 · auth FOT-004..007)
- Manual: subir foto de celular (640px) e conferir nitidez no avatar e no lightbox (Perfil/ClienteCard/OperadorDetail/sidebar)

## Referências
- `PLAN-041` (avatar/foto) · `PLAN-042` (anexos — padrão de MIME/magic bytes) · `PLAN-057` (avatar aplicado)
- `frontend/src/shared/utils/processarImagem.ts` · `shared/components/Avatar/Avatar.tsx` · `src/shared/utils/foto.ts`
