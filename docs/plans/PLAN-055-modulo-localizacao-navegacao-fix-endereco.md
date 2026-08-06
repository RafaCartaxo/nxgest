# PLAN-055 — Módulo de localização/navegação + fix do endereço (base p/ o redesign visual)

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" — correção de dados de endereço/navegação + modulação (camada de base)

---

## Objetivo

Corrigir o **bug de navegação** (editar o endereço capturado com GPS não reflete no "Navegar") e **modularizar** a lógica de endereço/localização/navegação num único módulo `shared/geo/` — camada de base para o redesign visual dos cadastros (briefing `Lovable-Cadastro-Rota-NXGestao.md`).

## Decisões (confirmadas)

1. **GPS no endereço principal também** (colunas `lat`/`lng` já existem no banco — hoje mortas).
2. **Editar o texto descarta as coords** + indicador "📍 Não capturada" + botão **Recapturar**.
3. **Alvo de navegação = comércio (padrão)** → **fallback: endereço principal**.
4. **Modulação segura**: `buildMapsUrl` mantém assinatura/regra (não quebra a Rota) + **vitest unit tests primeiro** + migração gradual com smoke/audit/build a cada passo.

## Escopo

### A. Módulo `shared/geo/`
- `types.ts` — `Localizacao`, `EnderecoTexto`, `TargetNavegacao`, `AlvoCliente`.
- `alvo.ts` — puras: `montarAlvo(endereco, localizacao)` (coords > texto, sem misturar) · `resolveAlvoCliente(cliente)` (comércio padrão → principal fallback) · `alvoNavegavel(alvo)`.
- `maps.ts` — `buildMapsUrl` movido de `utils/maps.ts` (regra idêntica). `utils/maps.ts` vira **re-export shim** (depois some).
- `hooks.ts` — `useGeolocation()` (getCurrentPosition + reverseGeocode; estados `capturando`/`erro`; cooldown).
- `CapturaLocalizacao.tsx` — controle de GPS com 3 estados: 📌 Capturar · 📍 Capturada (Recapturar) · 📍 Não capturada.

### B. Fix do endereço (frontend)
- `ClienteForm` compartilhado (extrai `ClienteNovo`/`ClienteEdit`).
- **Watcher** com flag `isGeocoding`: editar texto manualmente → coords descartadas (null no form).
- Submit envia `localizacaoComercio: null` / `localizacao: null` quando descartadas (backend já limpa — `UpdateClienteUseCase.ts:47-49`).
- Limpar endereço → limpa coords.
- **GPS no principal** (segundo bloco de captura) → grava `localizacao` (lat/lng).

### C. Backend
- `localizacao` (principal) em `CreateClienteInput`/`UpdateClienteInput` + use cases + repo (colunas `lat`/`lng`).
- Entity/API expõem `localizacao` (espelho de `localizacaoComercio`). Rota: sem mudança (query já COALESCE).

### D. Segurança / migração
- `buildMapsUrl` compatível → RotaPage/ClienteDetail seguem iguais.
- Vitest unit tests (N1–N12) **antes** de tocar consumidores.
- Migrar: ClienteDetail → `resolveAlvoCliente`; depois forms; RotaPage inalterada (usa `buildMapsUrl`).
- smoke 109/109 + audit + build a cada commit.

### E. Casos de teste
- **Unit (vitest)**: N1 sem endereço → sem alvo · N2 só principal (texto) · N3 comércio texto · N4 comércio coords → coords · N5 editar texto → coords descartadas → texto novo · N6 limpar comércio → cai no principal · N7 recapturar → coords novas · N8 coords sem texto (S7) · N9–N11 principal com coords (novo) · N12 endereço com 1 campo → sem alvo.
- **Form/GPS (unit + manual)**: F1 capturar · F2 permissão negada · F3 reverse geocode falha · F4 editar → "Não capturada" · F5 recapturar · F6 limpar → coords zeradas · F7 capturar principal · F8 cooldown.
- **API (smoke)**: P1 create coords · P2 create `localizacao` principal · P3 PATCH texto sem coords → coords zeradas · P4 zerar comércio → coords zeradas · P5 PATCH só localizacao → substitui · P6 coords sem texto · P7 limpar coords mantendo texto.
- **06-CASOS-DE-USO**: UC "Cadastro de endereço, localização e navegação".

## Referências
- Briefing do redesign visual: `Lovable-Cadastro-Rota-NXGestao.md`
- Bug confirmado: `ClienteEdit.tsx:116-119` (reenvia coords antigas) · `maps.ts` (coords > texto) · `UpdateClienteUseCase.ts:47-49` (null limpa)
- `shared/utils/{maps,geocoding,distance}.ts` · `frontend/src/modules/cliente/`
