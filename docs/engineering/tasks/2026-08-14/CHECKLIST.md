# CHECKLIST — PLAN-075: fechamento do fluxo de conta (F4/F6 + revisão + R6 + smoke)

**Data:** 14/08/2026

**Planos/refs:** `docs/plans/PLAN-075-dados-cadastrais-acesso-seguranca-email.md`

> Fechamento do PLAN-075: fluxo de confirmação de e-mail (F4), bloqueio de conta suspensa (N3), itens de revisão R1–R4, remoção do `adminSenha` na criação de empresa (R6) e migração do `smoke-api.mjs` para o modelo de convite (P-04, tabela `convites`).

## Status (catálogo oficial)

| Emoji | Significado |
|---|---|
| ✅ | Entregue / concluído |
| 🔵 | Em execução (parcial — parte concluída) |
| ⏳ | Aguardando algo (deploy, externo, decisão) |
| 🚨 | Parado há 7+ dias / urgente |
| ❌ | Bloqueado / falhou |
| 🐛 | Bug encontrado (referenciar card/CT) |
| 🔁 | Retestado / revalidado |

## Entregue

- [x] **F4 — troca de e-mail (A1–A5)** — `VerificarEmailPage` (rota pública `/verificar-email?token=`), registro em `App.tsx`, `LoginPage` respeita `state.from`, chaves i18n pt-BR/en/es, `05-MAPEAMENTO-TELAS.md` e `UI-COVERAGE.md` atualizados (27 telas)
- [x] **N3 — conta suspensa (B6/B7)** — `ContaSuspensaScreen` + `ProtectedRoute` bloqueando `status === "suspenso"`; chaves `auth.contaSuspensa*` e `errors.CONTA_SUSPENSA` nas 3 línguas
- [x] **R1 (D9)** — validação de formato de e-mail no `trocarEmail` (422 `VALIDATION_ERROR`)
- [x] **R2 (D10)** — `PerfilPage` usa `ApiError.message` em trocar/cancelar e-mail
- [x] **R3 (D11)** — `OperadorDetail` desacoplado: área de conta renderiza com `operador` sozinho, falha de caixa não derruba página
- [x] **R4 (D12)** — bloqueio de auto-suspensão/reativar no controller **e** no `EditarOperadorUseCase`
- [x] **R6 (G15/G16)** — `adminSenha`/`adminSenhaHash` removido de `CriarEmpresaInput`/`UseCase`/repo(port+impl)/controller/`ConverterLeadUseCase`; frontend (`EmpresaForm`, `SuperAdminPage`, `empresa.service`) e i18n sem o campo; admin de nova empresa nasce convidado
- [x] **Testes unitários (F13/F14)** — `TrocarEmail` (6), `VerificarEmail` (5), `CancelarTrocaEmail` (4), `EditarOperador` (4) — 19 testes
- [x] **Smoke migrado p/ P-04 (item E)** — helpers `inserirConvite`/`convitesCount`/`ativarUsuario` (tabela `convites`, N2); cenários com `senha` no create/update convertidos (ADM-060/061/N3/062/063, EMP-073/095b/074/096/097, MOD-098, MOD-G-S/S2, SUSP-S, P13-2, AC-15/17/05/07, SE-01/04, SM-1/2, SC-001..004, `criarUsuario` TR, SUP-6); SE-01/SE-04 e AC-15 agora leem `convites`; `doc 07` sincronizada (API-UC-034/035/040, CT-060/061/062/063/073/079, seção FLUXO DE CONTA)
- [x] **Seed + limiter p/ smoke** — `seed-demo.mjs` limpa `convites` no RESET (FK p/ `usuarios`); `publicoLimiter` de `/ativar` ganhou env `PUBLICO_RATE_LIMIT_MAX` (o smoke ativa ~30 usuários); `.env.example` e doc 07 atualizados

## Revisão e fechamento (rodada da tarde — code review + smoke novo)

- [x] **B — login espelha `/me`** — `LoginUseCase` devolve `telefone`/`emailPendente`/`emailVerificado` (shape idêntico); teste novo (LoginUseCase 6)
- [x] **E — semântica de convite invalidado (achado 7)** — `AtivarContaUseCase`: `EXPIRADO` dentro do `expiraEm` → `TOKEN_INVALID`; vencimento real → `TOKEN_EXPIRED`; `marcarExpirado` sem param `agora` morto
- [x] **A — limpeza de código morto** — `senhaHash` fora de `IAdminRepository.create/update` (port+impl+CriarOperadorUseCase); i18n `adminSenhaCurta`/`adminSenhaObrigatoria` removido (3 línguas); `conviteStatusPorUsuario` delegado ao `ConviteRepository` (fonte única)
- [x] **P-07 — troca administrativa de e-mail de usuário ativo** — confirmada implementada (`admin.controller.update` → convidado troca direta + novo convite; ativo → `email_pendente` + verificação pelo dono); F4 item fechado no plano
- [x] **C — smoke N3 de usuário (`SUSP-USR-*`)** — suspender ativo → login 403 `CONTA_SUSPENSA`; token pré-suspensão → 403; `/me` → `status: "suspenso"`; reativar → 200; auto-suspensão 403; convidado 409; inexistente 404
- [x] **D — smoke de troca administrativa + CTs** — `ADM-TROC-CONV/ATIVO/DUP` + `SOC-TROC-SUB/FORA` no smoke; **doc 07 CT-P-12..15**
- [x] **Doc collection sem `adminSenha`** — `build-collection.mjs` (criar empresa/operador/editar) sem o campo; `docs/api-collection.json` regenerada; `02-API.md` (criar empresa/operador/editar + troca administrativa), `UC-046` reescrito, `BR-750`, `UPDATES.md` 14/08, PLAN-075 (F1–F7, N3/N4 notas)
- [x] **🐛 Fix — reuso de e-mail de operador removido (soft-deleted)** — `ADM-TROC-REUSE` no smoke expôs 500: `usuarios.email` tinha unique **hard** (`usuarios_email_key`) mas a dedup de aplicação ignora soft-deleted → reutilizar e-mail de operador removido passava na validação e explodia no UPDATE/INSERT. Correção alinhada ao padrão `clientes` (CPF): `usuarios.email` virou **índice único parcial** `idx_usuarios_email ON "usuarios"("email") WHERE "deleted_at" IS NULL` (drizzle schema + DDL idempotente com `DROP CONSTRAINT IF EXISTS "usuarios_email_key"`). CTs: `ADM-TROC-DUP` (dup vivo → 409) + `ADM-TROC-REUSE` (reuso 201/200)
- [x] **Port telas Stitch (`stitch_personality_plus_portal`, 14/08)** — identidade "Nexus" nas 8 superfícies: Perfil (bento 8col+4col, selo verificado, trocar e-mail no card Conta), OperadorForm (callout convite + botões no `Modal.footer` via ref), OperadorDetail (bento 3col + caixa 2col), OperadoresList (grid de cards, tone por role, contadores tabular-nums), ContaSuspensa (card warning + box aviso + LogOut), Ativar (spinner). **Sem token/componente/i18n novos** — tokens Nexus + canônicos + lucide. Rejeitados: M3, Material Symbols, sidebar mock, dados fictícios. `UI-COVERAGE.md` + `UPDATES.md` atualizados.
- [x] **Ajustes de consistência pós-port (QA review)** — OperadoresList: **botão "Acessar" restaurado** (sempre visível) + `aria-label` nos botões-ícone; OperadorForm: seções em `Card` tone (success/info/neutral) + avatar em coluna própria + código morto removido (`onCancel`, `loading`); PerfilPage: card Segurança alinhado (`Card` tone neutral); OperadorDetail: card "Desempenho" com sub-cards leves (fim da borda dupla `KpiCard` aninhado). **Pendências despriorizadas:** EmpresaForm→`Modal.footer` (B3) e spinner Resetar/Recuperar (B5).

## Validação (rodar antes de finalizar)

- [x] `npx tsc --noEmit` limpo (backend + frontend)
- [x] `npm run build` verde
- [x] `npm run audit:ui` · `npm run audit:styles` verdes
- [x] `npm test` verde (115 testes)
- [x] `npm run smoke:api` (instância isolada) — **251/251 ✅ (0 falhas)** — DB `localhost:5433`, seed reaplicado, `LOGIN_RATE_LIMIT_MAX=1000` + `PUBLICO_RATE_LIMIT_MAX=1000`
- [x] `npm run smoke:api` **re-rodado com os novos cenários** (SUSP-USR-*, ADM-TROC-*, SOC-TROC-*) — instância isolada, `--baseUrl http://127.0.0.1:3002`
- [x] **263/263 ✅** — smoke final com `ADM-TROC-CONV/ATIVO/DUP/REUSE` + `SOC-TROC-SUB/FORA` + `SUSP-USR-*` (0 falhas)
- [x] `npm run docs:audit` sem divergência (SKILL-009)

## Pendências

- [x] Commitar (Rafael confirma escopo/PR) — commit `552f7b9` (77 arquivos, sem push)
- [ ] Parar a instância smoke (porta 3002) que ficou no ar após a validação

## Observações

- **R6 registrado no plano** (`docs/plans/PLAN-075...md`, N4) — campo removido por completo; admin sempre convidado.
- **P-04 confirmado no código:** `admin.controller.create` destrutura sem `senha` e todo cadastro nasce `CONVIDADO`; `EditarOperadorUseCase` não tem mais `senha` no input (PATCH senha é ignorado).
- `auth_tokens` segue existindo para `reset` e `lead`; apenas o convite migrou para `convites` (N2).
