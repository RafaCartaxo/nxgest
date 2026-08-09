# CHECKLIST — Lote de fixes (anexos/CSP · GPS · rota · PWA · e-mail · IPv6)

**Data:** 08/08/2026

> Fixes levantados de observações em produção (07–08/08). **Deploy pendente** — o usuário pediu pra juntar antes de subir.

## CTs padronizados (origem → causa → fix)

| CT | Módulo | Sintoma | Causa raiz | Status |
|---|---|---|---|---|
| CT-ANX-01 | Anexos (PDF) | modal abre, iframe em **branco** | CSP `frame-src` (fallback `default-src 'self'`) bloqueia `blob:` no `<iframe>` (`AnexosSection.tsx:211`) — regressão do P0/CSP de 07/08 | ✅ fix: `frameSrc: ['self','blob:']` (validado no preview) |
| CT-ANX-02 | Anexos (imagem) | imagem "não carrega/erro" (foto de perfil carrega) | **sem anexo imagem em prod** pra reproduzir (só 1 PDF no banco/uploads, com permissões ok); `img-src` já tem `blob:` + fetch autenticado → deve renderizar | ⏳ verificação manual pós-deploy (upload de imagem + abrir) |
| CT-GEO-01 | Geo/endereço | captura coords ok, **campos vazios** | CSP `connect-src 'self'` bloqueia o reverse geocode `nominatim.openstreetmap.org` (`geocoding.ts:29`) — regressão do P0/CSP | ✅ fix: `connectSrc: ['self','https://nominatim.openstreetmap.org']` (validado no preview) |
| CT-GEO-02 | Geo/navegação | localização "não fica disponível para navegar" | `maps.ts:14` navega por coords (primeiro); coords são salvas mesmo sem texto (`ClienteForm.capturarBloco`) → indisponibilidade = coords não persistidas (não salvou). Com CT-GEO-01 resolvido, fluxo normal volta | ✅ coberto pelo fix do CT-GEO-01 + verificar coords-only no preview |
| CT-ROT-01 | Rota | lista **não atualiza** após pagar | refetch só no botão "Concluir" (`RotaPage:602`); fechar por X/backdrop no passo comprovante não refaz `fetch()` (`PagamentoModal` sucesso `onClose={fechar}`). Backend já exclui pagos (`WHERE saldoPendente > 0`) | ✅ fix: refetch em **qualquer** fechamento pós-pagamento (`handlePagamentoClose` + flag `pagamentoFeitoRef`) |
| CT-ROT-02 | Rota | verificar estado de "atendimento concluído" | empty state + `RouteProgress` + resumo; depende do CT-ROT-01 (contadores) | ⏳ verificação manual pós-deploy |
| CT-PWA-01 | PWA | instala na área de trabalho, **ícone genérico** | `public/` só tinha `favicon.svg`; sem `manifest.webmanifest`/ícones/apple metas | ✅ fix: manifest + icons 192/512/maskable + apple-touch-icon + metas (validado no preview: assets 200) |

## Fixes extras (do diagnóstico de produção)

- [x] **E-mail fail-closed em prod** (`criarMailer`): `NODE_ENV=production` sem `RESEND_API_KEY` → `FailingMailer` (503 `EMAIL_UNAVAILABLE`), **nunca mente o 200 verde**; dev continua `ConsoleMailer`. Validado no preview: forgot existente → **503** · inexistente → **200** genérico (anti-enumeração mantida). `vitest` novo (`mailers.test.ts`).
- [x] **IPv6 rate-limit** (`ERR_ERL_KEY_GEN_IPV6`): `ipKeyGenerator(req.ip ?? "")` nos limiters custom (`forgot` em `auth.routes.ts` · `reconfirmar` em `lead.routes.ts`).
- [x] **CSP refinada** (`src/main.ts`): `frameSrc: ['self','blob:']` (PDF) + `connectSrc` com Nominatim (GPS).

## QA

- [x] `tsc` · `build` · `audit:ui/styles/modules` · `vitest` **43/43** (40 + 3 mailer) · `docs:audit` 0 divergências
- [x] **Preview CSP (NODE_ENV=production)**: headers com `frame-src blob:` + `connect-src nominatim` · forgot 503/200 · manifest+icons 200
- [x] Smoke **248/248** (instância isolada; NODE_ENV ≠ produção → console mailer, sem impacto)

## Pendências pós-deploy (verificação manual)

- [ ] CT-ANX-02: upload de anexo **imagem** e abrir no modal (confirmar render)
- [ ] CT-ROT-02: rota concluída/parcial — contadores e empty state
- [ ] CT-PWA-01: reinstalar/abrir o app instalado e conferir ícone/nome/theme
- [ ] CT-GEO-01/02: capturar localização no form → campos preenchem + navegar disponível

---

# Deploy produção (08/08) — lote de correções

**Alvo:** `nxgestao.duckdns.org` · **commit:** `55cfeca`

- [x] VPS `git pull` → `55cfeca` + `./scripts/deploy.sh` (backup + gates UI + build + up)
- [x] Pós-deploy: health ok · `/` 200 · CSP `frame-src 'self' blob:` + `connect-src ... nominatim` · manifest+icons 200
- [x] **E-mail fail-closed ativo**: `forgot` de e-mail **existente** → **503 EMAIL_UNAVAILABLE** (sem o 200 verde) · **inexistente** → **200** genérico (anti-enumeração)
- [x] Log sem `ERR_ERL_KEY_GEN_IPV6` (0 ocorrências) · causa do 503 logada (`[EMAIL] Falha no envio do reset`)
- [x] Banco íntegro: 7 usuários · 0 leads · 1 anexo · 1 token reset órfão (do teste de forgot; expira em 30min)

**Verificações manuais pendentes (pós-deploy):** CT-ANX-02 (upload imagem + abrir) · CT-ROT-02 (estado concluído) · CT-PWA-01 (ícone do instalado) · CT-GEO-01/02 (captura → campos + navegar)

---

# Fase 5+6 — Fix HEIC anexos + link /quero-conhecer no login (08/08)

- [x] `processarAnexo` aceita `image/heic`·`image/heif`·tipo vazio/`application/octet-stream` → tenta decodificar + converter p/ JPEG (iPhone "Alta eficiência"); não decodificou → `ANEXO_TIPO` com orientação
- [x] i18n `anexos.tipoErro` orienta iPhone ("Formato mais compatível")
- [x] `LoginPage` ganhou link "Interessado em usar o NX Gest? → Quero conhecer" (`/quero-conhecer`)
- [x] i18n `auth.interesse`/`auth.queroConhecerLink` ×3
- [x] QA: tsc · build · vitest 74 · audit:ui (147) · docs:audit 0

---

# HOTFIX — rate limit bloqueava login/API em prod (09/08)

- [x] Causa: `Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10)` com string vazia (compose injetava '' — chave ausente no `.env` do VPS) → `max:0` → express-rate-limit v7/v8 bloqueia TUDO (429 no login)
- [x] Fix: `envNumber()` (src/shared/utils/env.ts + test) aplicado em loginLimiter + userRateLimit
- [x] VPS `.env`: LOGIN_RATE_LIMIT_MAX=10 · USER_RATE_LIMIT_MAX=600 · SUPER_ADMIN_EMAIL/SUPER_ADMIN_DEFAULT_PASSWORD (random) — compose agora passa SUPER_ADMIN_*
- [x] Deploy ec1530b · validado: login NÃO mais 429 (401 credencial; rate limit ok) · health ok
