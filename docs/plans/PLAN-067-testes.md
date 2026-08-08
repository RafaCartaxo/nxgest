# PLAN-067 — Implementação de Testes (unit + UI + CI)

**Status:** ✅ Pronto para execução (handoff)

**Versão:** 1.0

**Início:** 07/08/2026

**Origem:** assessment de testes 07/08 + cruzamento com o código · **Backlog P022** (destrava o "adiado desde 03/08")

**Execução:** fora deste chat. Regras em `AGENTS.md`.

---

## Objetivo

Tornar **testes parte integrada do projeto**: infra `vitest` + `jsdom` + RTL + coverage + **CI**, com cobertura priorizada por risco (use-cases do negócio → shared/segurança → lógica front → UI crítica), preservando o smoke de API existente.

## Estado atual

| Camada | Hoje | Meta |
|---|---|---|
| Unit (vitest) | 7 arquivos / 40 testes | crescer p/ use-cases + shared + utils |
| Use-cases backend | 2 / 50 | prioridade: financeiro + conta + leads + admin |
| Shared/segurança (scope/jwt/foto/middleware) | 0 | fechar ciclo com PLAN-066 |
| UI (RTL/jsdom) | 0 | P022 + telas críticas |
| Integração API | smoke 248/248 ✅ | manter + CI |
| Coverage | ❌ | v8 + threshold gradual |
| CI | ❌ | GitHub Actions |

## Estratégia (camadas)

`Unit use-case (back)` → `Unit shared/segurança` → `Unit lógica/estado (front)` → `Component/UI (RTL)` → `smoke API` → `CI + coverage` — cada camada vira gate.

---

## F0 — Infraestrutura

- **Deps:** `jsdom` · `@testing-library/react` · `@testing-library/jest-dom` · `@testing-library/user-event` · `@vitest/coverage-v8@^1` (compatível com vitest 1.6 — **não** v2).
- **`vitest.config.ts`** (raiz): `environment: 'node'` default; componentes usam docblock `// @vitest-environment jsdom`; `coverage: { provider: 'v8', reporter: ['text','html'], thresholds: { statements: 50 } }` (meta inicial, **reportar sem bloquear** no começo).
- **Setup:** `frontend/src/test/setup.ts` (`@testing-library/jest-dom` + polyfill de canvas p/ `comprovante`).
- **Scripts:** `test` (unit+UI) · `test:coverage` · `test:watch`.
- **CI — `.github/workflows/ci.yml`** (push/PR): node 20 → `npm ci` → `tsc` → `npm run build` → `audit:ui/styles/modules` → `npm test` → `docs:audit` · job extra: **smoke-api** com DB isolado (`DB_PATH=/tmp/nxgestao-smoke.db node scripts/seed-demo.mjs` + `node scripts/smoke-api.mjs`).

## F1 — Unit: use-cases + shared/segurança (prioridade alta)

Padrão já existe (mocks de ports com `vi.fn` — modelo `EsquecerSenhaUseCase.test.ts`/`CriarLeadUseCase.test.ts`).

### Use-cases

- **Financeiro:** CreatePagamento (distribuição BR-045/046) · PreviewPagamento · EstornarPagamento · AjustarCaixaBase (motivo obrigatório, valor absoluto, escopo admin) · LiquidarSemana
- **Conta:** Login (credenciais inválidas, convidado → 403) · AtivarConta · RedefinirSenha · **Convidar** (senha opcional → convite; **reenvio invalida token anterior — SE-04**; o reenvio vive AQUI, não em use-case separado) · AlterarSenha
- **Leads:** CriarLead (dedup e-mail, e-mail já usuário) · ConfirmarLead (token) · ConverterLead · DescartarLead (LGPD) · ReenviarConfirmacao
- **Admin:** CriarOperador (roles/senha-convite) · EditarOperador (auto-rebaixar/remover/reatribuir/convite) · RemoverOperador · ListarEquipe (subárvore) · CriarEmpresa
- **Operações:** RegistrarVisita (tipos visitado/nao_localizado/promessa + data)
- **Cliente/Contrato:** Create/Update/Delete com regras (CPF duplicado, bloqueio com pagamentos)

### Shared / segurança (fecha o ciclo com o PLAN-066)

- `scope.ts` → `resolveUsuarioAlvo` (operator → self · admin → `?usuarioId=`/self · socio → subárvore/403 · super → `?empresaId=`)
- `jwt.ts` → sign/verify/expiração · **fail-closed sem `JWT_SECRET`**
- `foto.ts` → `validarFoto` (magic bytes/MIME, sem SVG)
- **middlewares:** `auth` (401 · 403 `EMPRESA_INATIVA` · 403 `ACCOUNT_PENDING`) · `module` (403) · `capability` · `admin`/`super-admin`

## F2 — Unit: lógica + estado frontend

- **utils:** `masks` · `parseDateLocal` · `formatarData` · `atendimento` (resumoAtendidos/totalClientesAtendidos) · `comprovante` (canvas, jsdom) · `role` · `distance` (completar)
- **schemas:** cliente · contrato · gasto
- **estado/infra:** `AuthContext` (login/logout/refresh/convidado) · `ThemeProvider` (persistência/aplicação) · `api/client` (erros/413) · `i18n/config`

## F3 — Component/UI (RTL + jsdom)

Padrão: `render` com providers (Auth/Theme/I18n) + mock de `apiRequest`/serviços; jest-dom. Telas **sem react-query** (só `main.tsx` usa) → providers mínimos.

- **P022 (destravar):** LoginPage (toggle senha, erro, redirect por role) · PerfilPage (troca senha: validação, 422) · AdminPage (KPIs equipe + click→ContribuicaoModal) · ContribuicaoModal/EquipeModal · AppLayout/BottomTabBar/UserMenu (links e gating por role/módulo)
- **Críticos novos:** RotaPage (contador "Parada X de N", ações pagar/promessa/visitado/não-encontrado com mock; **mock `navigator.geolocation`**) · PagamentoModal (preview, `sucessoContent`/comprovante) · Ativar/Recuperar/Resetar (fluxo de conta) · QueroConhecer/LeadsAdmin

## F4 — Coverage + rotina

- `npm run test:coverage` no CI (threshold 50% inicial, subir gradual; reportar sem bloquear no início).
- **AGENTS.md:** `npm test` obrigatório; **feature nova inclui teste** (gate de review).

## F5 — Docs

- `docs/engineering/TESTES.md` (estratégia, como rodar, convenções, coverage) · este PLAN-067 · atualizar `BACKLOG` (P022 sai de "adiado" → PLAN-067) · `ROADMAP` (5.5/5.8) · `plans/README` · `UPDATES`.

## Critérios de aceite

- `npm test` verde (unit + UI) · `test:coverage` ≥ meta · **CI verde no push** · smoke 248/248 mantido · `audit:ui/styles/modules` e `docs:audit` ✅ · nenhuma regressão.

## Riscos / notas

- vitest 1.6 → `@vitest/coverage-v8@^1` (não v2); jsdom compatível.
- Canvas do comprovante no jsdom → polyfill no setup.
- RotaPage usa `useWatchPosition` → mock `navigator.geolocation` no teste.
- smoke exige DB isolado (seed-demo) — job separado no CI.
- Independente do PLAN-066 (segurança) — podem rodar em paralelo.

## Decisões assumidas

1. **Escopo da 1ª rodada:** F0 + F1 (prioritários) + F3-P022 + CI + coverage gradual.
2. **CI:** agora (GitHub Actions). **E2E (Playwright):** roadmap futuro.
3. **Coverage:** 50% statements, reportando sem bloquear no início.
