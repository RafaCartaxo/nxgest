# PLAN-079 — Estabilidade de deploy & prevenção do erro "text/html MIME" (PWA/cache)

**Status:** 🔵 Implementado (fases 1–4, 18/08) — aguardando deploy e validação manual em prod

**Versão:** 1.0

**Início:** 18/08/2026

**Origem:** após a integração do **code-splitting** (PLAN-077: `React.lazy` + `manualChunks`), usuários relataram o erro **`text/html is not a valid JavaScript MIME type`** ao navegar entre telas (Clientes, Caixa, etc.) em **produção**. Investigação confirmou a causa raiz no **service worker com cache-first mal versionado** + **fallback SPA capturando assets**.

---

## Contexto verificado (18/08)

| Item | Estado real |
|---|---|
| **Prod** | `nxgest.com.br` → `db: connected` · assets reais servem `text/javascript` (ex.: `index-CVV0tR-M.js` → `200 text/javascript`) |
| **Prod deployado** | CD verdes em `7cc1b76` (histórico pagamento), Express 5 (PR #10) — ambos **contêm code-splitting** |
| **Container prod** | `nxgestao-app-1` · `/app/frontend/dist/assets/` tem **70 chunks JS** coerentes com o `index.html` |
| **`frontend/public/sw.js`** | `const CACHE = "nxgest-v2"` — **fixo** (exige bump manual, que não está sendo feito) |
| **`src/main.ts:81-88`** | `express.static(frontendDist)` sem `maxAge`/`immutable` · fallback `app.get("/{*splat}")` devolve `index.html` para **qualquer rota**, inclusive `/assets/*.js` inexistente |
| **CI (smoke)** | flake `OPS-040`/`PAG-COH2` foi **corrigido** pela outra sessão (`f95aa7f`) — era fuso/horário do seed, não regressão |
| **Working tree** | limpo (só `DEPENDABOT-HANDOFF.md` untracked) · devboard (PLAN-078) **já commitado** (`0e80bf6`, `eea5000`) |
| **`main` local** | `eea5000` (devboard + fix flake + merge) — **4 commits à frente de `origin/main` (`8197501`)** |
| **`origin/main`** | `8197501` = meu commit de retries (que falhou no CI e foi revertido em `88b4ba1`) |

---

## Diagnóstico — causa raiz do erro "text/html MIME"

**Fluxo do bug (confirmado por teste real em prod):**

1. **Deploy novo** muda os **hashes** dos chunks (ex.: `ClienteList-BWZ8B5jY.js` → hash novo a cada build).
2. O `index.html` novo (network-first no SW) carrega o novo `index.js`, que faz `import()` dinâmico dos chunks da página.
3. O browser, ao clicar em "Clientes"/"Caixa", requisita o chunk — mas o **service worker (`sw.js`) com cache-first** pode entregar um chunk **antigo** do cache (hash desatualizado), **ou** o chunk não existe mais e o **fallback SPA** devolve `index.html` com `Content-Type: text/html`.
4. O browser rejeita com **`text/html is not a valid JavaScript MIME type`**.

**Três fatores agravantes (todos precisam ser resolvidos para solução definitiva):**

| # | Fator | Evidência |
|---|---|---|
| A | `sw.js` **sem cache-busting** (`CACHE = "nxgest-v2"` fixo) | `frontend/public/sw.js:8` |
| B | **Fallback SPA captura assets** — `/assets/nao-existe.js` → `200 text/html` | teste em prod: `curl .../assets/nao-existe.js` → `text/html` |
| C | `express.static` **sem `maxAge`/`immutable`** nos assets com hash (cache oportunista inexistente) | `src/main.ts:84` |

---

## Solução definitiva (fases)

### Fase 1 — Cache-busting automático do service worker (causa principal)

**Objetivo:** a cada build/deploy, o `CACHE` do SW muda → o `activate` (já existente em `sw.js`) **apaga os caches antigos automaticamente** → browser sempre busca os chunks novos.

**Mudanças:**

1. **`frontend/public/sw.js`** — trocar o valor fixo por placeholder:
   ```js
   const CACHE = "__NXGEST_CACHE_VERSION__"
   ```

2. **`frontend/vite.config.ts`** — plugin **inline** (sem dependência nova) que, no `closeBundle`, lê o `index.html` gerado, deriva um hash (ex.: sha1 do `index.html`), e substitui o placeholder no `sw.js` (que é copiado do `public/` para `dist/` pelo Vite):
   ```ts
   function cacheBustingSw(): Plugin {
     return {
       name: "nxgest-cache-busting-sw",
       closeBundle() {
         // lê dist/index.html → hash → reescreve dist/sw.js substituindo __NXGEST_CACHE_VERSION__
       },
     }
   }
   ```
   - **Chave do cache** (decisão): usar **hash do `index.html`** (robusto — muda em todo build de frontend; estável se não houver mudança). Alternativa: timestamp (menos estável).

3. **Registro SW já ok** — `main.tsx:15` registra `/sw.js` só em produção. **Sem mudança.**

**Efeito:** usuários com a página aberta recebem o SW novo no próximo load → `activate` limpa caches antigos → sem mistura de hashes.

---

### Fase 2 — Fallback SPA não capturar assets (defesa extra)

**Objetivo:** requests de assets (`/assets/*.js`, `.css`, imagens, etc.) **inexistentes** devem devolver **`404`** (e o `express.static` serve os existentes), **não** `index.html`.

**`src/main.ts:85`** — ajustar o fallback para excluir requests de arquivos:
```ts
app.use(express.static(frontendDist))
// Assets: deixar o express.static resolver; se não existe, 404 (não index.html).
app.use("/assets", (_req, res) => res.status(404).json({ code: "NOT_FOUND", message: "Recurso não encontrado." }))
// Fallback SPA: apenas navegação (sem extensão de arquivo).
app.get("/{*splat}", (req, res, next) => {
  if (/\.[a-zA-Z0-9]{2,5}$/.test(req.path)) return next()
  res.sendFile(path.join(frontendDist, "index.html"))
})
```
**Nota:** considerar também `/icons`, `/favicon*`, `/manifest*`, `/apple-touch*`, `/icon-*`, `/sw.js` — mas como esses existem no dist, o `express.static` os resolve antes do fallback; o `next()` cobre os inexistentes.

**Efeito:** em vez do confuso `text/html is not a valid JavaScript MIME type`, o browser recebe `404` limpo. O `React.lazy` mostra o erro de carregamento da página (com `ErrorBoundary` já existente), e o usuário dá refresh.

---

### Fase 3 — Cache correto nos assets com hash

**`src/main.ts:84`** — configurar `express.static`:
```ts
app.use(express.static(frontendDist, {
  maxAge: "1y",
  immutable: true,
  etag: true,
  index: false, // index.html tratado pelo fallback
}))
```
- Assets com hash (`index-*.js`, `chunk-*.js`) são **imutáveis** — cache longo correto (`immutable`).
- `index.html` **nunca** é cacheado pelo static (`index: false` + fallback), e o SW já é network-first para navegação.

**Efeito:** menos round-trips, e o navegador nunca revalida assets imutáveis.

---

### Fase 4 — Verificação de consistência do build (defesa contra deploy quebrado)

**`scripts/` ou passo de CI** — após o build, verificar que o `index.html` referencia chunks que **existem** no `dist` (evita deploy com `index.html`/assets divergentes — que é exatamente o cenário que misturou hashes).

**Script sugerido (`scripts/check-dist.mjs`):**
- Ler `dist/index.html`.
- Extrair todos os `src="/assets/*.js"`/`href="/assets/*.css"` referenciados.
- Para cada um, confirmar que o arquivo existe em `dist/`.
- Falhar com saída `1` se algum faltar.

**CI:** rodar após `npm run build` no job de teste (antes do smoke/deploy).

---

### Fase 5 — Estabilização do fluxo de trabalho (processo)

- **Rodadas de planejamento** antes de cada lote de execução (escopo, arquivos, validação, riscos) — este plano é o modelo.
- **Nunca `git reset --hard`** com working tree de outra sessão (precedente 18/08: perdeu trabalho do devboard, recuperado por local history). Usar `reset --soft`/commits seletivos.
- **Dono do working tree** quando há múltiplas sessões (definir antes de trabalhar).
- **Handoff** ao final de cada lote (tempo do SO, seção "suggested skills").

---

## Decisões de produto/arquitetura a confirmar

| # | Decisão | Recomendação |
|---|---|---|
| D1 | **Chave do cache SW** | Hash do `index.html` (robusto; muda em todo build de frontend) — **recomendado** |
| D2 | **Fallback assets → 404** | Sim — elimina o MIME confuso; `React.lazy` + `ErrorBoundary` tratam | 
| D3 | **`immutable` nos assets com hash** | Sim — correto (conteúdo imutável por nome) |
| D4 | **Verificação de consistência no CI** | Sim — barato e evita deploy quebrado |
| D5 | **Escopo do fix** | Fases 1–4 juntas (solução definitiva); Fase 5 é processo |

---

## Arquivos afetados (todos)

| Arquivo | Mudança |
|---|---|
| `frontend/public/sw.js` | `CACHE` → `__NXGEST_CACHE_VERSION__` (placeholder) |
| `frontend/vite.config.ts` | Plugin inline `cacheBustingSw` (injeta hash no `sw.js` no `closeBundle`) |
| `src/main.ts` | `express.static` com `maxAge/immutable/index:false` · `app.use("/assets")` 404 · fallback só p/ navegação |
| `scripts/check-dist.mjs` (novo) | Verifica consistência `index.html` ↔ chunks |
| `.github/workflows/ci.yml` | Passo `check-dist` após o build |
| `docs/plans/PLAN-079-deploy-estabilidade.md` | Este plano |
| `docs/UPDATES.md` / `docs/STATUS.md` | Registro da entrega |

---

## Validação (pós-implementação)

1. **Local:** `npm run build` → confirmar `sw.js` no dist com hash real (≠ placeholder) · `tsc` · `npm test` · audits (`ui`/`styles`/`modules`) · `docs:audit` · build.
2. **Consistência:** `node scripts/check-dist.mjs` → 0 divergências.
3. **Smoke:** `npm run smoke:api` (instância isolada, PG, node 20) → **274/274** (flake já corrigido em `f95aa7f`).
4. **CI/CD:** push → CI verde → staging → prod (gate).
5. **Manual em prod (pós-deploy):**
   - Aba anônima: abrir `nxgest.com.br` → navegar Clientes/Caixa/Contrato → **sem erro**.
   - **Hard-refresh** (Ctrl+Shift+R) e/ou limpar cache do site no DevTools → recarregar → sem erro.
   - **PWA instalado:** abrir o atalho → deve atualizar (novo `CACHE` limpa o antigo).
   - `curl` em um asset inexistente → `404` (não `text/html`).

---

## Pendências relacionadas (não fazem parte deste plano)

- **Descompasso `main` local × `origin/main`** — `main` local (`eea5000`) tem 4 commits à frente de `origin/main` (`8197501`): `88b4ba1` (revert retries), `f95aa7f` (fix flake), `0e80bf6` (devboard), `eea5000` (docs devboard). Precisa de **push** (e decisão sobre os 2 commits de retries/revert no remote).
- **PRs dependabot** (3 abertos) — manutenção.
- **Registro**: PLAN-079 criado; UPDATES/STATUS a atualizar na execução.

---

## Critérios de aceitação

- [ ] `sw.js` de prod com `CACHE` versionado por build (hash) — cache-busting automático.
- [ ] Fallback SPA **não** devolve `text/html` para assets — inexistente responde 404.
- [ ] `express.static` com `maxAge: "1y", immutable` para assets com hash.
- [ ] `check-dist` no CI verde (consistência `index.html` ↔ chunks).
- [ ] Erro "text/html MIME" **não reproduz** em prod (clientes/caixa/contrato) pós-deploy.
- [ ] `tsc` · testes · audits · `docs:audit` · smoke 274 · build verdes.
