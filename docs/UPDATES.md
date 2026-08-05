# Atualizações

Registro resumido das alterações recentes — melhorias e correções, para acompanhamento. Detalhes completos nos PLANs linkados.

## 04/08/2026 — PLAN-038 · Refinamentos de identidade (essência do mockup Lovable)

**Adicionado / Corrigido**
- **`PageHeader`**: sai o banner gradiente → **título limpo** (Sora) + **badge de ícone suave** + **data no topo** (eyebrow, na Central) — vale para as 10 landings.
- **`KpiCard`** no estilo Lovable: **barra de tom** à esquerda + `label` + **`value-lg`** (Sora/tabular) + hint; variants → tons.
- **`Card`**: `rounded-xl bg-card` + props `tone` (barra lateral) e `interactive`.
- **Ações rápidas na Central**: grade de **cards-ícone** (Receber, Minha rota, Novo cliente, Fechar caixa — gated por módulo); `ClienteDetail` com o mesmo estilo em grade.
- **Sidebar com seção "Administração"** agrupando **Painel Admin** + **Empresas** (por papel).
- **Overscroll corrigido**: não arrasta além da tela (`overscroll-behavior-y: none`), gradiente sem `background-attachment: fixed` (quebra no iOS) e alturas em `100dvh`.
- **Seletor de tema** em **bolinhas de gradiente + nome do tema atual** (compacto, alvo de toque grande) e botão **claro/escuro só com ícone**.
- **`RotaCobrancaSection` removida da Central** (a ação rápida "Minha rota" cobre a navegação).
- **Marca no topo do drawer** (Logo + "NX Gestão" + botão X na mesma linha) e barra mobile mais fina; seção **"Administração" visível sem scroll** na sidebar.
- **Central com nova hierarquia**: **KPIs → Ações rápidas → Cobranças do dia** (estado → ação → fila, alinhado ao mockup). UC-001 e mapeamento §1 atualizados.
- i18n pt/en/es (`admin.painel`, `operacoes.acoesRapidas` + rótulos).

Referência: [PLAN-038](plans/PLAN-038-identidade-visual-nexus.md)

## 04/08/2026 — PLAN-038 · Identidade Visual "Nexus" + sidebar lateral

**Adicionado**
- **Logo Nexus** (cérebro em rede neural com hub central): componente `Logo`/`LogoLockup` (variantes lg/sm/mono), `favicon.svg` e `logo-nexus.svg`.
- **Tokens de identidade** no `index.css` (modelo OKLCH, port do Lovable): brand/accent, estados semânticos soft/text, `--sidebar-*`, gradientes page/brand/text/mesh, `--font-display` (Sora), e o hook **`--tenant-primary`** para whitelabel no tema "default". Aliases `--color-*` mantidos (nada quebra).
- **Sidebar lateral** (`AppLayout`) substituindo a navbar de topo: **desktop fixa à esquerda** (marca + navegação vertical + usuário/tema/idioma/sair) e **drawer mobile** (hamburger).
- **Login redesenhado**: logo Nexus grande + "NX Gestão" (texto em gradiente) + tagline "Gestão centralizada para o seu negócio" + card de acesso.
- Tipografia **Sora** nos títulos (h1-h3) + Inter no corpo; fundo em gradiente de marca; botão primário em gradiente.
- **Removido:** `Navbar.tsx` (substituído pelo `AppLayout`).

Referência: [PLAN-038](plans/PLAN-038-identidade-visual-nexus.md) · protótipo de referência [site-personality-plus](https://github.com/RafaCartaxo/site-personality-plus)

## 04/08/2026 — PLAN-037 · Coerência do whitelabel (P025): combos validados + Central adapta

**Adicionado**
- **`contratos ⇒ clientes`** no grafo de dependências (backend + frontend) e **validação transitiva** de combos — `PATCH modulos ["rota"]` → 422 "requer: contratos, clientes". Combos órfãos são impossíveis (BR-092).
- **Central se adapta por módulo (P025/UC-081):** KPIs financeiros gated por `contratos`, "Pendentes do Dia"/clientes pendentes por `cobrancas`; skip de fetches de módulos off; estado vazio coerente ("Nenhum módulo operacional ativo"). Princípio-base do multi-negócio: **dado de módulo off nunca aparece**.
- **CTs API-CT-117/118** (dependência + transitiva) · **UC-081** sem gap · **smoke 107/107**.

**Visão registrada (roadmap 5.10):** evolução para **um app, vários negócios** — F2 branding por tenant (`empresa.tema`), F3 URL por tenant (resolução por Host + Caddy multi-domínio), F4 templates de negócio (`tipo_negocio`).

Referência: [PLAN-037](plans/PLAN-037-coerencia-whitelabel-central-adapta.md)

## 03/08/2026 — PLAN-036 · Whitelabel: enforcement de módulos no backend (P024)

**Adicionado**
- **403 por módulo desativado** — o v1 do whitelabel (PLAN-031) era só gating de UI; agora a API bloqueia módulos off com `MODULE_DISABLED`.
- **Middleware `requireModule('<id>')`** (`src/shared/middleware/module.middleware.ts`): lê `empresas.modulos` por request (o JWT não carrega módulos) e devolve **403** quando o módulo está off.
- **Aplicado** no mount de `clientes`, `contratos`, `caixa`, `gastos`, `pagamentos` (=contratos) e por endpoint em `/operacoes`: `POST /visitas` (rota), `GET /historico-atrasos` (cobrancas).
- **Super admin:** sem `?empresaId=` → gestão global (não bloqueado); com `?empresaId=` → respeita os módulos da empresa-alvo (mesma regra do `resolveUsuarioAlvo`).
- **Fallback (BR-093):** empresa sem `modulos` = todos ativos.
- **Limite do v1:** endpoints compartilhados com a Central (`/operacoes/cobrancas`, `pagamentos-hoje`, `parcelas-hoje`, `parcelas-semana`) seguem abertos — gating por módulo único quebraria Rota/Atendidos/Cobranças.
- **Frontend:** `errors.MODULE_DISABLED` traduzido (PT/EN/ES).
- **Validação:** teste real em instância isolada (módulo off → 403; ativo → 200; compartilhado → 200; super admin com/sem `?empresaId=`); CTs API-CT-106..110; UC-079; BR-093 ampliada.

**Registro corrigido:** PLAN-016 e FEATURE-temp (prévia de pagamento) marcados como **Concluído** — estavam com status stale apesar de implementados.

**Bug encontrado e corrigido na validação (fuso horário):** a query de cobranças comparava `date(h.createdAt)` (UTC) com `hoje` (data local) — em determinados horários do dia (UTC já no dia seguinte vs local) a visita registrada não refletia na lista. Corrigido para `date(h.createdAt, 'localtime')` (`operacoes.repository.impl.ts`). O `smoke` voltou a passar **105/105**.

**Casos de teste ampliados** — `07`: API-CT-111..116 (sócio gated, só central → 403 em todas as rotas operacionais, efeito imediato no backend, sem bypass por `?empresaId=`, pagamentos=contratos, empresa inexistente → 404); `06`: UC-080 (efeito imediato) e UC-081; `smoke`: MOD-098/099.

**Gap registrado (follow-up P025):** a **Central não se adapta por módulo** — exibe "Pendentes do Dia" e KPIs de caixa mesmo com `cobrancas`/`caixa` off (UC-081/BR-093); registrar como pendência no backlog.

Referência: [PLAN-036](plans/PLAN-036-whitelabel-enforcement-backend.md)

## 03/08/2026 — PLAN-035 · Temas em componentes + Hero headers nos módulos

**Adicionado**
- **Tema agora "pega" em todos os componentes** — eliminadas ~150 classes fixas da paleta (`blue/red/green/yellow/gray-*`) que contornavam os tokens do PLAN-031: foco de input (`focus:ring/border-primary`), links, hover de cards, dots de status, spinners de loading, toasts do `FeedbackOverlay` e botão danger passaram a usar os tokens. O que é brand segue a paleta; o que é semântico (`danger/success/warning`) permanece fixo.
- **Header hero nos módulos** — novo componente `PageHeader` (banner em gradiente + ícone + título + subtítulo + ação + voltar), replicando o padrão do Super Admin nas landings: Central, Clientes, Contratos, Caixa, Gastos, Cobranças, Rota, Atendidos, Administração e Empresas. Ações principais (Novo Cliente/Contrato, Fechar Semana, Ver na Rota, Nova Empresa) no header como botão branco (`Button variant="onDark"`). Páginas de novo/editar/detalhe mantêm o header compacto.
- **i18n** — subtítulos novos nas 3 línguas (PT/EN/ES).
- **Guarda de regressão** — `npm run audit:styles` falha se surgir cor fixa da paleta em `frontend/src`.
- **Registro corrigido** — `05-MAPEAMENTO-TELAS.md` reordenado e renumerado (seções alinhadas à tabela Visão Geral; rótulo de `/cobrancas` corrigido) + "Checklist para Novas Telas" atualizado com as novas convenções.
- **Validação** — UCs 073–078 em `06-CASOS-DE-USO.md` (tema em componentes, hero operador/gestão, i18n, contraste, regressão).

Referência: [PLAN-035](plans/PLAN-035-temas-componentes-e-hero-headers.md)

## 03/08/2026 — PLAN-034 · Atraso no card do contrato (lista)

**Adicionado**
- `GET /api/contratos` devolve por contrato `emAtraso` (Σ saldo vencido), `parcelasEmAtraso` e `diasEmAtraso` (BR-099) — estendendo o agregado que já calculava `saldoPendente`/`parcelasPagas`.
- `ContratoCard` (list-item) mostra a linha vermelha **"N parcelas em atraso · R$ Y · D dias"** (pontinho danger) quando há parcelas vencidas.
- UC-072 · API-CT-105 · mapeamento v1.22.
- A **lista de clientes** permanece enxuta — espaço reservado para a futura **foto do cliente**.

Referência: [PLAN-034](plans/PLAN-034-atraso-card-contrato.md)

## 03/08/2026 — PLAN-033 · Situação Financeira do cliente (P015)

**Adicionado**
- `GET /api/clientes/:id` devolve a **situação financeira** do cliente: `valorEmAtraso`, `parcelasEmAtraso`, `diasEmAtraso`, `valorVenceHoje`, `ultimoPagamento` (não estornado) e `lucroPrevisto` (BR-096..098).
- **ClienteDetail** com grade 2×2 de KPIs (`SituacaoFinanceira`): Saldo Devedor · Em atraso · Vence hoje · Lucro previsto + linha "Último pagamento". `SaldoInfo` removido.
- **P015 concluído** (lucro previsto) — BACKLOG marcado.
- **Removido**: o bloco "Histórico de atrasos" da view de atrasados (gráfico de evolução + tabela de `snapshots_atraso`) — o snapshot só era gravado ao abrir as Cobranças (sem job diário) → dado esparso; o dado ao vivo (banner) e o detalhe do cliente cobrem a necessidade. O endpoint `historico-atrasos` permanece no backend (API-UC-022).
- UC-071 · API-CT-103/104 · mapeamento v1.21.

Referência: [PLAN-033](plans/PLAN-033-atrasos-cliente-historico.md)

## 03/08/2026 — Correção: parcela `Parcial` vencida na ParcelaList

**Corrigido**
- `ParcelaList` só marcava como **Vencida** (vermelha) parcelas `Pendente` — uma parcela **`Parcial` com vencimento passado** aparecia **azul** (como "vence hoje"), confundindo o estado. Agora **qualquer** parcela com saldo pendente e vencimento no passado fica vermelha/"Vencida" (inclusive `Parcial`), e os contadores não contam as vencidas como "pendentes".
- `PagamentoModal` passou a exibir a regra de distribuição ("Aplicado das parcelas mais antigas para as mais recentes", BR-044) que já existia na i18n mas não era renderizada.

## 03/08/2026 — UX: estorno visível + terminologia "Atendidos × Visitados" + i18n

**Corrigido**
- **Estorno visível no detalhe do contrato**: `findByContratoId` passou a retornar `estornadoEm/Por/Motivo` — o pagamento estornado agora aparece **riscado** + badge "Estornado" + motivo (antes o campo não vinha da listagem e o estorno "nada ocorria" na tela).
- **Terminologia padronizada (UC-070)**: "Atendido" é o guarda-chuva (visitado + não encontrado + promessa + pagos); "Visitado" é só o subtipo. **Contadores nos filtros** (Atendidos/Cobranças) e **breakdown nos banners** ("1 visitado · 2 não encontrados · 3 promessas") — resolve a confusão de banner com 6 atendidos e filtro "Visitado" zerado.
- **i18n do banner de atrasados**: `atrasadosResumo` usava chaves simples `{clientes}`/`{total}` (não interpoladas) — corrigido para `{{...}}`; varredura confirma 0 chaves simples restantes.

## 03/08/2026 — PLAN-032 · Papéis hierárquicos (sócio)

**Adicionado**
- **Papel `socio`** — mesmas funções do admin em escopo menor (subárvore); login cai no painel escopado (`/admin`).
- **`usuarios.chefeId`** (o "chefe") + migração no boot; hierarquia: admin → sócio → operador (3 níveis, sem sub-sócio no v1).
- **Escopo de dados por nível**: operator = próprio · sócio = subárvore · admin = empresa (recebido hoje, equipe, KPIs, `?usuarioId=`).
- **Sócio cria operador do grupo** (só `operator`, chefe = ele) — BR-095.
- BR-094 (hierarquia/subárvore) + revisão de BR-056/057/066/081; UCs 064-069; CTs API 098-102.

Referência: [PLAN-032](plans/PLAN-032-papeis-hierarquicos-socio.md)

## 03/08/2026 — PLAN-031 · Temas & gradientes + Super Admin whitelabel (módulos por empresa)

**Adicionado**
- **5 temas por usuário** (default, aurora, ocean, grape, sunset) × claro/escuro — seletor com swatches na engrenagem; base para whitelabel.
- **Gradientes modernos** (tokens `--gradient-page/accent/text`): fundo do app, LoginPage, botão primário "brand", navbar ativo.
- **Super Admin como centro de controle**: página redesenhada (banner em gradiente) + **ativar/desativar módulos por empresa** — `PATCH /api/admin/empresas/:id/modulos` (BR-092).
- **7 módulos granulares** (`clientes, contratos, caixa, gastos, rota, cobrancas, atendidos`; `central` sempre on), com **dependências** (`gastos⇒caixa`; `rota/cobrancas/atendidos⇒contratos`) e **"só central"** permitido (BR-093).
- **Gating de UI**: `RequireModule` (rotas), Navbar, Central, Caixa (gastos), ClienteDetail (contratos) — módulo off oculta superfícies.
- `login`/`me`/`empresas` agora retornam `modulos`; `EmpresaForm` migrado para o `Modal` base (fix do backdrop cru).

**Follow-up (P024):** enforcement no backend (403 por módulo desativado) — v1 é gating de UI.

Referência: [PLAN-031](plans/PLAN-031-temas-modulos-whitelabel.md)

## 03/08/2026 — PLAN-030 · Admin: visão da equipe

**Melhorado**
- **KPIs de Operação do painel admin agora mostram o total da equipe** (admins + operadores + próprio), com subtítulo "da equipe · N operadores" — antes mostravam os dados do próprio admin (BR-087 → **BR-091**).
- **Click no KPI → modal de contribuição por operador** ("quanto cada um geriu": clientes, contratos ativos, recebido hoje); click no operador → `OperadorDetail` (preservando `?empresaId=`).
- **Novo endpoint `GET /api/admin/equipe`** (operadores + totais; coerência Σ = agregado da empresa).
- **KPI "Resultado do Dia" virou "Recebido hoje"** (Σ do dia da equipe) — rótulo honesto e decomposto por operador.
- **EquipeModal** com stats + navegação ao operador; `ResultadoDiaModal` removido (sem uso).
- **Navbar**: links **"Administração"** (admin) e **"Empresas"** (super) visíveis — administração deixa de ficar escondida na engrenagem.

Referência: [PLAN-030](plans/PLAN-030-admin-visao-equipe.md)

## 03/08/2026 — Validação da API (smoke 104 cenários)

**Validado** — `scripts/smoke-api.mjs` executou **104 cenários** da base `07-CASOS-DE-USO-API.md` contra instância isolada (seed em `/tmp`, `PORT=3002`): **todos PASS**, incluindo coerência (saldo cai após contrato, `recebidoHoje` sobe após pagamento, auditoria após ajuste, movimentação reversa no estorno, login novo/antigo na troca de senha, empresa + login do admin novo), as **variações V1–V8**, os testes de **módulos/whitelabel** (MOD-091..096) e de **hierarquia/sócio** (SC-001..006 — subárvore, escopo por nível, acesso fora da subárvore → 404).

**Cruzamento fluxos × API:** 06 ↔ 07 mapeados — sem endpoint órfão. Achados de coerência corrigidos: "resultado do dia" do operador é calculado no front (`recebidoHoje − aReceberHoje`, diferente do admin `entradas − saídas`), shape dos indicadores de `cobrancas` (5), 7 KPIs no mapeamento §1, `totalPeriodo` em `GET /gastos`, janela "a vencer" verificada.

**Ajustes decorrentes:**
- `dataPromessa` **obrigatória** quando `tipo=promessa` (422) — `operacoes.controller.ts`.
- **Senha mín. 6** no `POST/PATCH /api/admin/operadores` (400) — não dependia só do front.
- `LOGIN_RATE_LIMIT_MAX` (env, default 10) — elevar limite em teste/smoke.
- `07-CASOS-DE-USO-API.md` corrigida para a realidade do código (204 nos deletes, 403 auto-rebaixar/remover, 400 role/senha, enum `nao_localizado`, `percentualJuros`, escopo `?usuarioId=`) + CTs 078–087; collection regenerada.
- **P021** registrado no backlog (pagamento a mais do total — observação de produto, sem implementação).

Referência: [07-CASOS-DE-USO-API](product/07-CASOS-DE-USO-API.md) · [PLAN-029](plans/PLAN-029-senha-perfil.md)

## 03/08/2026 — PLAN-029 · Senha e Perfil do Usuário

**Adicionado**
- **Mostrar/ocultar senha no login** — toggle Eye/EyeOff no campo senha (UC-041).
- **Troca da própria senha** — novo endpoint `PATCH /api/auth/senha` (BR-089/090): valida a senha atual (incorreta → 422, sem deslogar), exige nova ≥ 6 caracteres; o token atual permanece válido.
- **Página "Meus dados" (`/perfil`)** para todos os perfis — dados do usuário + troca de senha; acesso pela engrenagem do Navbar e pela aba "Meus dados" do painel admin.

**Fora de escopo:** "esqueci minha senha" → backlog P020 (sem infra de e-mail; admin redefine via `PATCH /api/admin/operadores/:id`).

Referência: [PLAN-029](plans/PLAN-029-senha-perfil.md)

## 03/08/2026 — Documentação alinhada + SKILL-009 (Documentation Sync)

**Alinhado**
- `05-MAPEAMENTO-TELAS.md` v1.15: telas Caixa, Gastos, OperadorDetail, Atendidos, Cobranças adicionadas; contagem corrigida (19 telas).
- `06-CASOS-DE-USO.md` v1.1: UCs 039-052 (auth + CRUDs básicos).
- `02-BUSINESS-RULES.md` v1.7: BR-089/090.
- `02-API.md`: `parcelas-hoje`, `parcelas-semana`, `health` documentados.
- **Novo** `07-CASOS-DE-USO-API.md`: base de casos de uso e cenários de teste da API (UCs + CTs por endpoint).
- **`api-collection.json` reconstruída**: 40 → 41 requests espelhando a 07 (gerada por `scripts/build-collection.mjs`).

**Mecanismo novo**
- **SKILL-009** (`docs/skills/SKILL-009-documentation-sync.md`): fonte única de verdade + matriz de propagação.
- `scripts/audit-docs.mjs`: auditoria de consistência (código ↔ 02-API ↔ 07 ↔ collection ↔ mapeamento).
- Agente `.opencode/agents/docs-sync.md` + comandos `audita-docs` / `atualiza-docs`.

## 02/08/2026 — PLAN-028 · Estorno de Pagamento pelo Admin

**Adicionado**
- **Estorno de pagamento** (fatia 1 do P013 — Contexto do Operador): admin/super_admin pode **reverter por completo** um pagamento registrado por engano. O operador registra o valor correto novamente se precisar.
- **Como funciona**: reverter cada parcela (volta estado/saldo/dataQuitacao), movimentação reversa (`saida`/`Cancelamento`), contrato volta a `Ativo` se estava finalizado; pagamento original **nunca é deletado** (BR-029), marcado com `estornadoEm`/`estornadoPor`/`estornoMotivo` + registro em `auditoria_estornos`.
- **Níveis de acesso**: operator → 403; admin estorna dentro da própria empresa; super_admin qualquer (via `resolveUsuarioAlvo`).
- **Contexto do operador**: admin vê os **contratos do operador** no `OperadorDetail` e abre o contrato em modo **somente leitura** (sem editar/excluir/pagar), com botão "Estornar" + modal de motivo.
- **Escopo `?usuarioId=`** estendido para leitura de contrato, pagamento e cliente (padrão do caixa).

Referência: [PLAN-028](plans/PLAN-028-estorno-pagamento.md)

## 02/08/2026 — Correção do backup de produção (WAL)

**Corrigido (crítico)**
- **Backups automáticos estavam inúteis** — o banco roda em WAL mode (dados vivos no `.db-wal` ~1MB), e o script copiava só `gestao.db` cru → arquivos de 4KB **vazios** (validado: "no such table: usuarios").
- **Script corrigido** (`/opt/scripts/backup-nxgestao.sh`): `wal_checkpoint(TRUNCATE)` antes do `cp` + **validação embutida** (`SELECT COUNT(*) FROM usuarios` > 0; backup vazio vira `.invalid`).
- **Backup pré-deploy**: `scripts/deploy.sh` agora chama o backup **antes** do build — todo deploy gera snapshot do estado anterior.
- **Cópia off-site corrigida**: `~/.config/nxgestao/backups/backup-offsite-gestao.db` estava vazia (4KB) → substituída pelo backup consistente (241KB, dados reais).
- Backup validado: `gestao-20260802-115822.db` (236KB, 5 usuários, 7 clientes).

## 02/08/2026 — Deploy no VPS (PLAN-023 → PLAN-027)

**Deploy do código atual em produção** (`https://nxgestao.duckdns.org`):
- Produção passou de PLAN-022 para o topo local (PLAN-023/024/025/026/027) — commit `dc435dc`.
- Migração aplicada no boot: tabela `auditoria_caixa` criada; dados reais preservados (5 usuários, 1 empresa).
- **Gap encontrado e corrigido**: os backups automáticos copiavam só `gestao.db` (4096 bytes, WAL não incluído) — **incompletos**. Feito checkpoint + backup manual correto (`/opt/backups/gestao-manual-20260802-112054.db`, 204KB). Ajuste do script de backup é pendência.
- Validado: health OK, login admin OK, `GET /api/caixa/auditoria` 200, frontend novo servido.

## 02/08/2026 — PLAN-027 · Histórico de ajustes do Caixa Base

**Adicionado**
- **Histórico de ajustes visível** — o registro de ajuste do Caixa Base (gravado pelo PLAN-026, BR-088) agora é consultável e exibido: novo endpoint `GET /api/caixa/auditoria` (paginação + `adminNome` via JOIN) e bloco "Histórico de ajustes" no detalhe do operador (admin) e na página de caixa (operador). Ambos os papéis enxergam data, `R$ anterior → R$ novo`, quem ajustou e o motivo.
- **Segurança mantida** — operador só vê o próprio histórico (ignora `?usuarioId=`); admin consulta operadores da própria empresa; super admin qualquer.

Referência: [PLAN-027](plans/PLAN-027-exibicao-historico-caixa.md)

## 02/08/2026 — PLAN-026 · Sprint 1 do backlog (Auditoria + Modais + Nomenclatura)

**Adicionado**
- **Auditoria de Caixa (P014)** — todo ajuste do Caixa Base agora grava um registro em `auditoria_caixa` (operador-alvo, admin responsável, valor anterior/novo, motivo e data). O campo `motivo` é **obrigatório** no `POST /api/caixa/ajuste` (tabela separada — não gera movimentação financeira, preservando o saldo). Nova BR-088.
- **Componente `Modal` base compartilhado** (`shared/components/Modal/Modal.tsx`) — mecânica uniforme (Escape, backdrop configurável, `overflow` oculto, `role=dialog`). Refatorados `ConfirmModal`, `EquipeModal`, `ResultadoDiaModal`, `PagamentoModal` e o modal do `OperadorForm` (que ganhou o fechamento por Escape).
- **Nomenclatura da equipe (P012)** — a lista admin agora separa em subseções "Administradores" e "Operadores" (antes "Operadores" como rótulo genérico).

Referência: [PLAN-026](plans/PLAN-026-auditoria-modais-nomencleatura-admin.md)

## 01/08/2026 — PLAN-025 · Ajuste do Caixa Base exclusivo de admin

**Corrigido**
- **Regressão de permissão no ajuste do Caixa Base** — o PLAN-021 havia liberado o operador a ajustar a própria base (BR-084). Reverteu: o ajuste é **regra exclusiva de `admin`/`super_admin`** (rota com `adminMiddleware`, operador recebe 403 e a seção "Ajustar Caixa Total" some da tela). BR-079 reativada, BR-084 revogada.

**Melhorado**
- **Contexto para o super admin** — ao entrar numa empresa (`/admin/empresas/:id`), breadcrumb/voltar para a lista + linha "Administrador da empresa"; o card de empresa na lista mostra o admin (nome/email).

Referência: [PLAN-025](plans/PLAN-025-regra-exclusiva-ajuste-caixa.md)

## 01/08/2026 — PLAN-024 · Página do Administrador

**Corrigido**
- **Ajuste de saldo não refletia no operador** — o admin só conseguia ajustar o próprio Caixa Base (`CaixaPage` grava no `req.userId`). Agora a página do operador (`OperadorDetail`) tem o bloco "Ajustar caixa base do operador", que grava no operador certo via `?usuarioId=`.
- **Cards de operadores quebrados em telas estreitas** (badge por cima do nome, ícones espaçados) — lista reescrita no padrão `Card`/`Card.Actions` do sistema, com `flex-wrap`.
- **Feedback do ajuste de caixa:** valor zerado/vazio era descartado silenciosamente; agora avisa "Informe um valor maior que zero." e a falha de ajuste mostra mensagem própria ("Erro ao ajustar caixa.") em vez do erro genérico de carregamento.
- **Remover com destaque de perigo:** o botão de remover operador voltou a ficar vermelho (nova variante `danger` em `QuickActions`/`Card.Actions`).

**Melhorado**
- **KPIs clicáveis:** Equipe (Admins/Operadores) abre modal com a lista; Clientes e Contratos navegam para as telas (admin); Resultado do Dia abre modal com entradas/saídas do dia.
- **KPIs de Operação escopados por usuário (admin self)** — agora batem com `/clientes`, `/contratos` e o caixa ao navegar (antes agregavam a empresa inteira). Super admin mantém visão agregada por empresa — BR-087.
- **Equipe reordenada:** administradores no topo, depois operadores, ambos em ordem alfabética; o usuário logado aparece na lista com a tag "Eu" (sem editar/remover no próprio card).

Referência: [PLAN-024](plans/PLAN-024-admin-organizacao-kpis.md)

## 01/08/2026 — PLAN-023 · Ajustes pós-validação

**Corrigido**
- **Tela em branco na Rota de Cobrança** ao visitar o último cliente pendente — o índice de navegação usava `items.length` (não encolhe ao visitar) em vez de `sortedItems.length` (só pendentes). Adicionado fallback visual de carregamento no lugar do render vazio.
- **Parcela que vence hoje sem destaque** — agora tem estilo próprio "Vence Hoje" (precedência: vencida > vence hoje > pendente) e contador separado no resumo.

**Melhorado**
- **Filtro "Todos" dos atendidos** passa a incluir os pagamentos do dia, deduplicados (cliente que pagou não aparece duas vezes).
- **Lista de atrasados** ganhou resumo (clientes distintos + valor total) e **histórico de 30 dias** — snapshot diário automático a cada abertura das cobranças, com endpoint `GET /api/operacoes/historico-atrasos` e BR-086.

Referência: [PLAN-023](plans/PLAN-023-ajustes-pos-validacao.md)

## 01/08/2026 — PLAN-021/022 · Painel admin

**Melhorado**
- Painel admin com contexto de empresa, KPIs por seção, Admins × Operadores, login por role e engrenagem na navbar.
- "Contratos Ativos" agora conta só `estado = 'Ativo'` (Finalizado/Cancelado excluídos) — BR-085.
- Resultado do Dia em módulo com cor verde/vermelha + tooltip de composição; header indica o nível (admin/empresa + badge); idioma movido para a engrenagem.

Referência: [PLAN-021](plans/PLAN-021-admin-contexto-kpis.md) · [PLAN-022](plans/PLAN-022-admin-kpis-ajuste.md)
