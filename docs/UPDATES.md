# Atualizações

Registro resumido das alterações recentes — melhorias e correções, para acompanhamento. Detalhes completos nos PLANs linkados.

## 06/08/2026 — WS7: transições de papel blindadas + fixes de UI (date, dropdown, labels)

**Corrigido (segurança/consistência)**
- **Sócio promovendo via `PATCH`:** o `create` já bloqueava (403) sócio criando admin/sócio, mas o `update` não — um sócio podia promover operadores da subárvore a `admin`/`socio` pela API. Guard espelhado no `update` (`role` ≠ `operator` → 403).
- **Chefe órfão no rebaixamento:** rebaixar `admin→operator`/`sócio→operator` (ou `admin→sócio` com subordinado sócio) deixava subordinados com chefe inválido (`validarChefe` proíbe). Agora **bloqueado (422)** com contagem de subordinados ativos dentro da mesma transação (`NaoPodeRebaixarComSubordinadosError`).
- **Higiene de chefe:** ao virar `admin`, `chefeId` é zerado (admin não tem chefe).

**UI (pontos de verificação)**
- **P4 — date fields:** `input[type="date"]` normalizado com `appearance: none` + `min-width: 0` (ContratoForm/GastoForm/Rota) — o campo respeita `width: 100%` e não estoura para a direita; ícone de calendário restaurado via `::-webkit-calendar-picker-indicator`.
- **P5 — dropdown ClienteSelect:** posicionamento `absolute` era **cortado pelo `overflow-hidden` do `Card`** (novo contrato); agora `position: fixed` calculado do trigger (escapa do clip) + fecha em scroll/resize.
- **P6 — labels de contrato:** "Quantidade de Parcelas"/"Number of Installments" quebravam o label no grid 2 col em pt/en (es curto alinhava). Labels encurtados: pt "Parcelas" · en "Installments" · es "Cuotas".

**QA:** smoke ~**140** (CTs de transição 120-131 + regressões) · gates verdes (build, audits, docs, vitest).

Referência: [07-CASOS-DE-USO-API](product/07-CASOS-DE-USO-API.md) (matriz de transições) · BR-103

## 06/08/2026 — Roles (sócio) + foto do usuário + Anexos + Empresa + ContratoForm/Rota

Lote de fechamento de material pendente (identidade "Nexus" + PLAN-041/042 + Lovable):

**Corrigido**
- **Rótulo de papel incompleto:** operador promovido a **sócio** continuava com a tag "Operador" em `OperadorDetail`, `PerfilPage`, `ContribuicaoModal`, `EquipeModal` (sócios fora dos modais) e `AdminPage` (badge "Super Admin" para sócio). Consolidado num helper único `shared/utils/role.ts`; `EquipeModal` aceita `socio`; novo KPI **Sócios** (`totalSocios` no dashboard).
- **Sessão stale pós-promoção:** o middleware usava a claim de `role` do JWT (7 dias); agora resolve `role`/`empresaId` do **banco** a cada request — corrige 403 pós-promoção e acesso indevido pós-rebaixamento sem relogin.

**Adicionado / Melhorado**
- **Foto do usuário/operador (PLAN-041 completo):** `PATCH /api/auth/foto` (self) + `foto` em `login`/`me`/`operadores` + `PATCH /admin/operadores/:id` aceita `foto`; PerfilPage (AvatarField), OperadorForm, Avatares em OperadoresList/EquipeModal/ContribuicaoModal/OperadorDetail/sidebar. BR-101.
- **Anexos do cliente (PLAN-042):** tabela `anexos`, 4 endpoints escopados (`POST/GET/file/DELETE /api/clientes/:id/anexos*`), `multer` (guarda 5MB → 413), validação de **MIME real** (magic bytes) + limites (imagem ≤1MB · PDF ≤5MB), storage `UPLOADS_DIR` (Docker `/data/uploads` · dev `./uploads`), `AnexosSection` na ficha do cliente. **Backup inclui `/data/uploads`** (06-PRODUCAO). BR-102.
- **Empresa (super admin, Lovable):** `EmpresaCard` no padrão (tone ativa/inativa, Avatar, documento, contagem de operadores, badges de módulos, botão "Módulos (X/Y)") + `EmpresaForm` com Nome fantasia/CNPJ/Situação — todos **opcionais** (não impedem cadastro). `PATCH /api/admin/empresas/:id`.
- **ContratoForm compartilhado:** seletor de cliente buscável (`ClienteSelect` wireado), Cards Condições/Resumo vivo, edit bloqueado com parcela paga — fim do combobox artesanal.
- **Rota no padrão:** GPS como `StatusBadge`, sem botão X redundante, comprovante via `Modal` base, promessa com `Field`, `RouteProgress` em `Card`, estados via `EstadoTela`.
- **Anti-drift:** `audit-docs` passa a varrer **sub-routers** montados via `router.use` (anexos) — sem rota invisível à auditoria.

**QA:** smoke **128/128** (FOT-001..004, ANE-089..093, EMP-095/095b, etc.) · gates verdes (build, audits, docs, vitest).

Referência: [PLAN-041](plans/PLAN-041-avatar-foto.md) · [PLAN-042](plans/PLAN-042-anexos-cliente.md)

## 06/08/2026 — PLAN-047 · Identidade visual "Nexus" — card de cobrança + componentes + anti-drift (consolidado)

> **Plano único** — absorve os antigos **PLAN-048..054** (arquivos removidos; histórico mapeado a commits no plano). Escopo completo e rastreabilidade em [PLAN-047](plans/PLAN-047-card-cobranca-dia-lovable-badges-modais.md).

**Adicionado / Melhorado**
- **Card de cobrança do dia** (Central, `/cobrancas`, `/atendidos` e Rota): display no padrão Lovable (tone bar, `StatusBadge`, `value-lg`), **sem avatar**, ações só na Rota. `diasEmAtraso` no backend (`CobrancaItem`, subquery `julianday`) + **CT OPS-018** no smoke.
- **Evolução do card (iterações):** fix da parcela (`proximoNumeroParcela` — antes mostrava saldo em R$ → "Parcela 30 de 20"), **altura uniforme** (4 linhas fixas), bairro/parcela em linhas próprias, linhas full-width (fim do truncamento no carousel/mobile) e "N dias de atraso" **alinhado ao fim do valor** (antes do ">").
- **Componentes compartilhados:** `Modal` com assinatura Lovable (`title`/`descricao`/`footer`) + **bottom-sheet mobile** (sweep dos 14 consumidores) · `FieldSelect`/`FieldTextarea` (migrados 3 `<select>`) · `Tabs` · `EstadoTela` unificado · `PageHeader`/`SectionHeader` (icon `size-11 rounded-xl`, título 28px/22px) · `StatusBadge` com **dot** · `Switch` canônico · `ParcelaList` com badges.
- **Admin:** `ModulosModal` v2 (descrição por módulo, Central sempre ativa, auto-completar deps, cascata-off) · `OperadorDetail` com `ContratoCard list-item`.
- **Anti-drift:** `npm run audit:ui` estendido (select/textarea cru, header inline de modal, `role="tab"` fora do Tabs, `<Modal>` sem `title`) — gate no deploy.
- **Docs:** `04-UI-COMPONENTS` v1.7 · `06-PRODUCAO` (gates) · `Lovable-NXGestao` superseded · `UI-COVERAGE` · índice de planos.

**Por quê:** fechar a identidade "Nexus" ponta a ponta (referência `site-personality-plus`), padronizar componentes e travar o padrão contra regressão — em um único plano rastreável.

Referência: [PLAN-047](plans/PLAN-047-card-cobranca-dia-lovable-badges-modais.md)

## 05/08/2026 — PLAN-046 · Fix do switch de módulos + engrenagem de configurações + coerência do grafo

**Corrigido**
- **Switch de ativar/desativar módulos:** a bolinha branca "saía" do pill (`rounded-full`) por falta de `overflow-hidden`/`left-0` — corrigido (`ModulosModal`).
- **Coerência do grafo refinado (PLAN-045):** CT-118 corrigido (`rota ⇒ cobrancas, contratos, clientes`) · CT-119 novo (`atendidos ⇒ cobrancas`) · UC-055 atualizado · **smoke MOD-100/101** (422 das novas deps).

**Melhorado**
- **Engrenagem única no topo** (`Topbar`): tema (clica e alterna claro/escuro), cores (5 paletas) e idioma (PT/EN/ES) num só dropdown — com o **idioma selecionado visível** no trigger (no lugar do nome do tema). Consistência visual (`rounded-xl` + tokens).

Referência: [PLAN-046](plans/PLAN-046-fix-switch-modulos-engrenagem-coerencia-grafo.md)

## 05/08/2026 — PLAN-045 · Modularização para o whitelabel real (Module Manifest + Central composável)

**Adicionado**
- **Module Manifest** (`src/modules/admin/domain/modules.ts`): cada módulo declara `labelKey, surfaces, dados, widgets, capacidades, dependsOn, ucs`; `ALL_MODULES`/`DEFAULT_MODULOS`/dependências **derivados** dele. Espelho frontend com `MODULE_WIDGETS` + `isWidgetActive` + ícones.
- **Grafo refinado:** `rota ⇒ cobrancas` e `atendidos ⇒ cobrancas` (agregadores da fila de cobrança); `pagamentos` = capacidade de `contratos`; `caixa` com 2 formas (isolada × integrada).
- **Central composável:** o dashboard renderiza os **widgets dos módulos ativos** (KPIs, ações rápidas, pendentes, atendidos) — fim do gating manual por `hasModule`. **Fix do dead-end:** "Ver resumo → /atendidos" só aparece com `atendidos` ativo.
- **`npm run audit:modules`** — valida o manifest (IDs, deps espelhadas, grafo sem ciclo, widget com 1 dono) — **gate no deploy**.
- **`docs/product/08-UC-MODULOS.md`** — matriz UC/CT × módulo (validação on/off) · **ADR-006** (manifest) · template de novo módulo (UI-COVERAGE).
- BR-092/093 atualizadas (grafo + Central composável).

**Por quê:** o whitelabel real (novos negócios plugáveis) precisa de uma **fonte única** do que cada módulo é/expõe. Novo módulo = entrada no manifest + superfícies + widgets + UCs — sem rework.

Referência: [PLAN-045](plans/PLAN-045-modularizacao-whitelabel.md) · [ADR-006](foundation/ADR-006-Module-Manifest.md) · [08-UC-MODULOS](product/08-UC-MODULOS.md)

## 05/08/2026 — PLAN-044 · Governança de UI / Anti-drift

**Adicionado**
- **`npm run audit:ui`** (novo script): falha se padrão legado do pré-"Nexus" voltar (`rounded-md` em módulos, `bg-secondary-light`, `border-l-*`, `variant="onDark"`, `RotaCobrancaSection`, `bg-gradient-accent` fora do Button, grid fixo). **Gate no deploy** (impede subir legado).
- **`UI-COVERAGE.md`** — inventário canônico (19 telas × shell+superfícies; componentes+consumidores; padrões→canônico; legado rastreado).
- **`scripts/consumers.mjs`** + protocolo: **componente compartilhado mudou → varre consumidores no mesmo PR**.
- **Checklist para Novas Telas corrigida** — antes ensinava `rounded-md` (padrão antigo); agora `Field`/canônico + rows/badges/skeletons/modais + gate `audit:ui`.
- **ADR-005** "Por que o redesign deixou débito" (5 raízes + guardrails).
- **Correções:** RotaPage modal comprovante (`rounded-xl bg-card`) · UC-074 (banner → PageHeader) · `04-UI-COMPONENTS` (canônicos) · `AGENTS.md` (audit:ui + protocolo).

**Por quê:** o redesign deixou débito invisível por falta de inventário, auditoria só de cor, checklist stale e sem protocolo de shared-component. Com guardrails mecânicas, o whitelabel granular não acumula drift.

Referência: [PLAN-044](plans/PLAN-044-governanca-ui-anti-drift.md) · [ADR-005](foundation/ADR-005-UI-Governance.md)

## 05/08/2026 — PLAN-043 · Polimento final da identidade "Nexus"

**Concluído**
- **Superfícies ANTIGO → padrão canônico:** `GastoForm`/`GastoList` (fluxo de gastos), `SearchBar`, `SuccessState`, `ErrorBanner`.
- **Inputs → `Field`/canônico + botões → `Button`:** Perfil, Login (com mostrar/ocultar senha), Caixa (ajuste), OperadorDetail, ContratoDetail (estorno), Rota (data promessa), PagamentoModal, "usar local atual".
- **Rows/listas → `Card`/`rounded-xl bg-card`:** Caixa (histórico de ajustes + movimentações), EquipeModal, ContribuicaoModal, AtendidosPage, ContratoDetail (pagamentos), **CobrancaCard detail (Rota do dia)** — saiu o `border-l-4`.
- **Skeletons** `bg-secondary-light` → `bg-surface-hover` (7 arquivos).
- **Navbar com 3 dropdowns** (`Topbar`): **tema claro/escuro** + **paletas (cores)** + **idioma**, no topo mobile e desktop; removidos do rodapé da sidebar.
- **Fix layout QuickActions:** grade adapta ao nº de ações — os 3 botões (navegar/whatsapp/ligar) do perfil do cliente voltam **lado a lado**.
- **Gap encontrado e corrigido:** badge **GPS da Rota invisível** (texto branco no PageHeader claro — estilo do banner antigo) → tokens semânticos.
- **Docs stale corrigidos:** MAPEAMENTO (Header notes, §13 SuperAdmin, Perfil), DS (Header de página — sem banner; "navbar ativo"), TOKEN, 06 (UC-019), `07-FORMS-INPUTS` (mapa **concluído**).

Referência: [PLAN-043](plans/PLAN-043-polimento-final-identidade-nexus.md)

## 05/08/2026 — Estabilidade: fix BR-091 (admin × movimentação) + hardening do middleware

**Corrigido**
- **BR-091 (regressão do PLAN-032):** o dashboard de **admin self** agregava **só os dados do próprio admin** (`admin.controller.ts` passava `req.userId!`) — operador registrava pagamento e o "Recebido Hoje"/Total Clientes/Contratos Ativos do admin **não refletiam**. Corrigido: admin/super agregam a **equipe** por empresa (sócio mantém subárvore). Asserção de regressão no smoke (`EQ-088`).
- **`equipe` por operador sempre 0 (novo bug encontrado na asserção):** a query do `recebidoHoje` da equipe usava `and(...userIds.map(eq))` → `userId = A AND userId = B AND ...` (sempre falso com >1 usuário) → o breakdown "da equipe · N operadores" e o `EquipeModal` mostravam **R$ 0** para qualquer operador. Corrigido para `inArray(pagamentos.userId, userIds)` (`admin.repository.impl.ts`). É a outra metade do "movimentação não reflete no admin".
- **`requireModule` sem try/catch:** middleware async do enforcement podia deixar request pendurado + unhandled rejection no Express 4 se a query de `empresas` falhasse. Agora `next(err)` (padrão do `authMiddleware`).
- **Smoke MOD-097/098/099:** restore dos `modulos` agora em `try/finally` — falha de asserção não deixa a empresa de teste com módulos parciais (anti-flakiness).

**Registrado (BACKLOG P024 — observações de design):** enforcement parcial de `cobrancas`/`atendidos` (dado via endpoint compartilhado permanece aberto) e super admin com `?usuarioId=` sem `?empresaId=` ignora o gating (by design).

**Validação:** `npm run build` ✅ · `smoke:api` **107/107** (inclui novas asserções BR-091 e equipe) · `docs:audit` ✅

## 05/08/2026 — Planos de identidade visual (038–042) + briefings Lovable

**Registrado**
- **PLAN-041 — Avatar com foto** (usuário/operador/cliente): componente `Avatar` + `processarImagem` (data URL ≤200px) + `usuarios.foto`/`clientes.foto`; self-service + admin define; foto normalizada na entrada.
- **PLAN-042 — Anexos do cliente** (comprovante de residência): foto ou PDF, limites rígidos (imagem ≤1MB / PDF ≤5MB / `multer` 5MB → 413), `/data/uploads` no volume, endpoints autenticados/escopados (LGPD), **backup passa a incluir uploads**.
- **Briefings Lovable** no padrão do `Lovable-Admin-NXGestao.md`: `Lovable-Avatar-NXGestao.md` (041) e `Lovable-Anexos-NXGestao.md` (042).
- `docs/plans/README.md`: PLAN-038/039/040/041/042 adicionados ao registro (estavam ausentes).

**Status dos planos de identidade:** PLAN-038 Concluído · PLAN-039 Em andamento · PLAN-040 Concluído · PLAN-041/042 Planejado.

Referência: [PLAN-041](plans/PLAN-041-avatar-foto.md) · [PLAN-042](plans/PLAN-042-anexos-cliente.md)

## 05/08/2026 — PLAN-040 · Painel Admin (identidade + UX de módulos/empresas)

**Adicionado / Corrigido**
- **Forms do admin** (`OperadorForm`, `EmpresaForm`) → componente **`Field`** (inputs canônicos `rounded-xl min-h-12 border-strong`; selects no mesmo padrão).
- **`ModulosModal` v2**: cada módulo vira linha com **switch (toggle)**, **hint de dependência** ("Requer: X", BR-092/093 — bloqueia toggle quando dependência off) e **agrupamento** (Base · Financeiro · Cobrança em campo). Estilo `rounded-xl bg-card`.
- **`AdminPage`**: abas em **pills da identidade** (`rounded-xl`, ativa `bg-primary-light`) + caixas `rounded-xl`.
- **`EmpresaList`**: **avatar de iniciais** + badge de módulos ("Todos ativos" / "N módulos").
- `Field` virou `forwardRef` (suporta `ref` p/ scroll/foco em erro).
- i18n pt/en/es (grupos de módulos, "Requer", "Todos ativos", contagem).
- **Deploy em prod** do acúmulo (PLAN-038/039 + admin) — `git push` + `deploy.sh` no VPS.

Referência: [PLAN-040](plans/PLAN-040-admin-identidade.md) · [Lovable-Admin-NXGestao](plans/Lovable-Admin-NXGestao.md)

## 04/08/2026 — PLAN-039 · Padronização de Forms & Inputs (FOCO) + mapa

**Adicionado / Corrigido**
- **`Field`** compartilhado (`shared/components/Field/Field.tsx`) — input canônico da identidade: `rounded-xl min-h-12 border-strong` + label + erro.
- Token **`--border-strong`** (index.css + tailwind `border.strong`).
- **`ClienteNovo`/`ClienteEdit`** → `PageHeader` + `Field` (dados + endereços).
- **`ContratoNovo`/`ContratoEdit`** → `PageHeader` + `Field` (+ select de cliente e date em `rounded-xl`).
- **`ClienteCard`** (lista/detalhe) com **avatar de iniciais** + ícones (prepara a futura **foto do cliente**).
- **Documentação**: `docs/engineering/07-FORMS-INPUTS.md` (mapa completo dos 16 arquivos de forms) e **DS v2** (seção Inputs + tabela Bordas).
- **Follow-up mapeado (FU):** OperadorForm, EmpresaForm, GastoForm, PerfilPage, CaixaPage, OperadorDetail, LoginPage, RotaPage, PagamentoModal, ContratoDetail, ContratoList, SearchBar.

Referência: [PLAN-039](plans/PLAN-039-padronizacao-forms-inputs.md) · [07-FORMS-INPUTS](engineering/07-FORMS-INPUTS.md)

## 04/08/2026 — Padronização pós-PLAN-038 (mapa de pendências)

**Corrigido / Padronizado**
- **Botões `onDark` → `primary`** (5: Novo Cliente, Novo Contrato, Ver na Rota, Liquidar, Nova Empresa) — herança do banner gradiente antigo; variante `onDark` **removida** do `Button`.
- **Modais de KPI/semana** (`PagamentosHoje`, `PagamentosPeriodo`, `ParcelasHoje`, `GastosPeriodo`, `ContratosSemana`) e o **modal de promessa da Rota** passaram a usar o **`Modal` base** (remove duplicação de overlay/Escape/scroll); cards internos em `rounded-xl bg-card`.
- **`Modal` base** atualizado para `rounded-xl bg-card` (alinha todos os modais).
- **`ParcelaList`** no estilo do Lovable: lista `divide-y` com **dot de status** + número/vencimento + valor (tabular) + rótulos Vencida/Vence hoje (mantém clique p/ pagar).
- **`CobrancaCard`** com **barra de tom** (compact via `tone`, detail via `border-l`).
- **Detalhes → `PageHeader`**: ClienteDetail, ContratoDetail, OperadorDetail e PerfilPage (título limpo + voltar + ação).
- Banner de atrasados da CobrançaListPage em `rounded-xl`.

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

## 06/08/2026 — PLAN-055 · Módulo de localização/navegação + fix do endereço

**Corrigido**
- **Bug de navegação (endereço × GPS):** editar o texto do endereço (comércio OU principal) **não descartava** as coordenadas capturadas → o "Navegar" abria o mapa no ponto antigo. Agora o form **descarta as coords ao editar o texto** (indicador "Localização não capturada" + botão **Recapturar**) e o navegador passa a usar o endereço novo.

**Adicionado / Melhorado**
- **Módulo `shared/geo/`** (modulação do GPS/navegar, sem quebrar a rota): `montarAlvo` (coords > texto, sem misturar endereços) · `resolveAlvoCliente` (alvo = **comércio padrão** → principal fallback) · `alvoNavegavel` · `buildMapsUrl` (regra idêntica) · `useGeolocation` (captura + reverse geocode, cooldown) · `CapturaLocalizacao` (3 estados). **18 testes unitários** (N1–N12).
- **GPS no endereço principal** (colunas `lat`/`lng` que eram mortas): backend `localizacao` (Create/Update + repo) + botão no form do cliente.
- **`ClienteForm` compartilhado** (extrai ClienteNovo/ClienteEdit duplicados) com o fix embutido.
- **Smoke +7 CTs (GEO-001..007, total 116/116)** · UC-080 (06) · API-CT-100..105 (07).

**Por quê:** correção de dado (navegador ia pro endereço errado) + camada de base para o redesign visual dos cadastros (briefing `Lovable-Cadastro-Rota-NXGestao.md`).

Referência: [PLAN-055](plans/PLAN-055-modulo-localizacao-navegacao-fix-endereco.md)

## 06/08/2026 — PLAN-056 · Port do material Lovable (botões + GPS + form + Preferências)

**Adicionado / Melhorado**
- **`Button`/`ButtonLink` com variantes completas** (`soft`/`outline`/`success` + sizes `sm/md/lg/block`, base `rounded-xl min-h-11`) — o verde de "Registrar pagamento" agora usa `variant="success"` (sem classe crua).
- **`GpsControl`** (port do Lovable): controle de GPS com 3 estados (Capturar · Capturada+Recapturar · Não capturada/invalidada), acessível, usado no form do cliente (comércio + residencial).
- **`ClienteForm` em 4 Cards** (Identificação · Comércio · Localização do comércio · Endereço residencial) com UF como select — sobre a lógica do PLAN-055 (fix do endereço preservado).
- **Vocabulário único de botões**: sem setas "→" literais; "Ver rota" → `ghost sm` + `ChevronRight`; `ClienteDetail` sem `<Link>` cru.
- **`ClienteSelect`** (seletor de cliente buscável) — pronto para o `ContratoForm`.
- **Preferências em modal** (substitui os dropdowns da Topbar): Modo (claro/escuro/**sistema**) · Cores (paletas) · Idioma. `ThemeProvider` ganhou `mode` persistido (compat com chaves antigas).

**Pendente do Lovable:** `ContratoForm` · tela de Rota (`/rota`) · wiring das telas (`central`/`clientes` usarem o vocabulário novo).

**Por quê:** aplicar o material da rodada nova do Lovable (identidade) sobre a camada geo pronta (PLAN-055).

Referência: [PLAN-056](plans/PLAN-056-port-material-lovable-botoes-gps-form-preferencias.md)
