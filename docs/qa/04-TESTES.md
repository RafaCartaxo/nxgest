# 04 — Testes (Estratégia de QA)

**Status:** Ativo · **Fonte:** `docs/engineering/TESTES.md` · `docs/product/07-CASOS-DE-USO-API.md` · `docs/product/06-CASOS-DE-USO.md`

---

## Pirâmide de camadas

```text
                 Component/UI (RTL/jsdom)
               Unit lógica frontend
            Unit shared/segurança
         Unit use-case (backend)
      Smoke API (integração, contagem registrada no CI)
    CI/CD (gates automáticos) · Cobertura
```

| Camada | Onde | Exemplo | Cobre |
|---|---|---|---|
| Unit use-case | `src/modules/*/application/use-cases/**/*.test.ts` | Login, CriarLead, ConfirmarLead, DescartarLead, Convidar | Regras de negócio dos casos de uso |
| Unit shared/segurança | `src/shared/utils/*.test.ts` | `scope`, `foto`, `jwt`, `clientIp`, `env` | Helpers críticos e segurança |
| Unit lógica front | `frontend/src/shared/**/*.test.ts` | `geo/alvo`, `modules`, `capacidades`, `estadoGps` | Lógica pura do frontend |
| Component/UI | `frontend/src/**/*.test.tsx` (jsdom) | `LoginPage` | Interação de UI (renders, submit, toggle) |
| Integração API | `scripts/smoke-api.mjs` | contagem registrada no CI (DB isolado + seed) | Endpoints + coerência de retornos |

---

## Como rodar

```bash
npm test               # unit + UI (vitest) — gate obrigatório
npm run test:safety    # segurança de staging e smoke — gate obrigatório, também no CI
npm run test:deploy    # transição de deploy em repositórios e serviços dublados
npm run test:backup    # backup, política e retorno somente com fixtures/dublês
npm run test:watch     # watch
npm run test:coverage  # cobertura v8 (report-only, meta sobe gradual)
```

### Smoke API (integração — contagem registrada no CI)

> **Regra de ouro:** o smoke **não é idempotente** — rate limiters vivem em memória e tokens de lead são single-use. **Cada execução exige DB novo + processo novo.** Re-run no mesmo processo polui (LD-06 token já usado, LD-12 429) e dá falsos negativos.

**Caminho recomendado (orquestrador — codifica todas as invariantes):**

```bash
source ~/.nvm/nvm.sh && nvm use      # Node ≥20 (.nvmrc)
SMOKE_DATABASE_URL=postgres://nxgest:nxgest-dev@localhost:55432/nxgest_smoke npm run smoke:local  # somente banco isolado; recria DB → schema → seed → sobe :3002 → roda o smoke → teardown
```

Configure uma instância PostgreSQL exclusiva na porta indicada e `SMOKE_DATABASE_URL` explícita (host local, porta explícita diferente de 5432 e 5433, URL sem parâmetros e banco `nxgest_smoke` ou `nxgest_smoke_sufixo`). A variável `DATABASE_URL` não autoriza o alvo. `--no-recreate` ainda executa schema/seed e exige banco de teste. O `scripts/smoke.mjs` faz: `DROP/CREATE` do banco alvo (nunca o dev), `create-schema` via `npx tsx`, `seed-demo`, sobe o servidor em `SMOKE_PORT` (3002) com rate limits ampliados (`LOGIN_RATE_LIMIT_MAX`/`USER_RATE_LIMIT_MAX`/`PUBLICO_RATE_LIMIT_MAX`/`LEADS_RATE_LIMIT_MAX`) e derruba no fim (PID em `.smoke.pid`). Subcomandos: `npm run smoke:up` (só sobe a pilha) · `npm run smoke:down` (derruba) · `node scripts/smoke.mjs --no-recreate` (depuração).

**Execução manual:** usar o orquestrador e o banco dedicado descritos acima. O CI prepara PostgreSQL efêmero no próprio job. Não copiar receitas antigas de DROP/CREATE para o banco de desenvolvimento, nem executar o smoke contra produção. Para anexos locais, configurar `UPLOADS_DIR` exclusivo do ambiente de teste.

---

## Audits (gates de qualidade)

| Audit | Comando | O que falha |
|---|---|---|
| UI | `npm run audit:ui` | Padrão legado/fora-do-canônico no frontend (PLAN-044/047) |
| Styles | `npm run audit:styles` | Cor fixa da paleta no frontend (PLAN-035) |
| Modules | `npm run audit:modules` | Module Manifest incoerente (whitelabel, PLAN-045) |
| Docs | `npm run audit:docs` | Rota sem doc / doc sem rota (SKILL-009) |

---

## Convenções (resumo)

- **Backend use-case:** mocks de Ports com `vi.fn`.
- **Componentes:** providers mínimos (Auth/Theme/I18n mockados) + `vi.mock` de serviços; docblock `// @vitest-environment jsdom`.
- **Segredos:** nunca hardcoded; `JWT_SECRET` setado por teste com restore.
- **React:** única cópia (root 18.3.1) via workspaces + `dedupe` no vitest — **não** instalar react 19 nem cópia aninhada.
- **Feature nova inclui teste** (gate de review): use-case/lógica + smoke quando aplicável.

---

## Evidência publicada em 20/11/2026

No [CI44764236119](https://github.com/RafaCartaxo/nxgest/actions/runs/44764236119), SHA f804: **215 testes unitários/UI em 46 arquivos** e **286/286 cenários de smoke**, além dos gates de segurança, transição, backup e correções. O teste novo de fingerprint passou 7/7. As contagens são daquela revisão; consultar o run da revisão avaliada em vez de usar um número fixo como critério.

`docs:audit` local confere74 rotas/contratos API e29 rotas/telas frontend. Isso valida correspondência estrutural, não todos os comportamentos de negócio nem todas as descrições operacionais. O backup atual tem fixtures de manutenção/retomada; a recuperação exige também o ensaio real isolado descrito no runbook.

---

## Documentos relacionados

- `docs/engineering/TESTES.md` — estratégia e rotina
- `docs/product/07-CASOS-DE-USO-API.md` — cenários da API (fonte do smoke)
- `docs/product/06-CASOS-DE-USO.md` — fluxos de validação por tela
- `docs/plans/PLAN-067-testes.md` — plano de testes (infra + próximas camadas)


## Correções de backup — gate isolado

`npm run test:corrections` executa a suíte de `scripts/corrections.check.mjs` em uma cópia sintética, sem rede. Requer Linux, Node.js 20 ou superior, bubblewrap (`bwrap`), namespaces de usuário/PID/rede habilitados, os utilitários usuais e `/usr/bin/docker`, `/usr/bin/curl`, `/usr/bin/ssh` e `/usr/bin/scp` disponíveis para serem encobertos por guardas. Sem qualquer requisito, o runner falha antes dos testes; não há fallback sem isolamento. As guardas são sondadas por PATH, caminho absoluto e subprocesso. A execução do gate em GitHub Actions foi comprovada no CI acima; isso não transforma fixtures de backup em prova de restore real.
