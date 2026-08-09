# NX Gest — Cadastro (Cliente/Contrato) + Rota + Botões: identidade e UX (briefing para IA/Lovable)

**Versão:** 1.0 — 06/08/2026

> Briefing consolidado de **4 entregáveis** da identidade "Nexus" aplicada aos fluxos de **cadastro e operação em campo**.
> A IA/Lovable deve produzir **design + componentes React** (no repo de referência `site-personality-plus`, pasta `src/components/nx/`), no mesmo espírito dos entregáveis anteriores (`Avatar`, `anexos`, `ModulosModal`, `cobranca`).
> **Regra de ouro: descrever e desenhar COMO DEVE FICAR (estado-alvo), não replicar o estado atual.**

---

## 1. Contexto do produto

**NX Gest** ("Nexus Gestão") — plataforma de gestão de cobranças em campo (microcrédito popular): o **operador** vai até o cliente cobrar parcelas pelo celular. Mobile-first é obrigatório (uso em pé, na rua).

- **Frontend:** React + Tailwind v3, identidade 100% dirigida por **CSS variables** (`--color-*`, `--brand-*`, gradientes `--gradient-*`). Fonte **Sora** (títulos, `font-display`) + Inter (corpo).
- **Layout:** sidebar lateral (`AppLayout`), conteúdo em `max-w-2xl`.
- **Referência visual oficial:** `docs/engineering/design/02-DESIGN-SYSTEM.md` + os componentes do próprio repo de referência (`src/components/nx/{kit,ui,cobranca,ModulosModal}.tsx`).
- **Regra de UI:** só componentes canônicos + tokens. **Nunca** cor hardcoded da paleta (`bg-blue-500` etc.) — o `npm run audit:styles` falha. Sem inputs crus (`<select>`, `<textarea>`, `<input>` com estilo antigo).

**Componentes canônicos já existentes (usar, não recriar):** `Card` (`rounded-xl bg-card` + tone), `KpiCard`, `StatusBadge` (pill `rounded-md` com **dot**), `PageHeader` (icon `size-11 rounded-xl` + título `text-[28px]`), `SectionHeader` (título `font-display text-[22px]`), `Field` / `FieldSelect` / `FieldTextarea` (inputs `rounded-xl min-h-12 border-strong`, label + erro, `focus:ring-primary`), `Modal` (assinatura Lovable: `title`/`descricao`/`footer` + bottom-sheet mobile), `Tabs`, `Switch`, `QuickActions`, `SearchBar`, `EstadoTela` (loading/erro/vazio), `CobrancaCard` (card de cobrança do dia, já pronto), `ParcelaList`.

---

## 2. Escopo — 4 entregáveis

1. **Componentes de ação (botões)** — `Button`/`ButtonLink` com variantes completas + vocabulário único por tipo de ação.
2. **Form de Cliente** (novo/editar) — layout em seções + controle de **GPS/localização**.
3. **Form de Contrato** (novo/editar) — seletor de cliente buscável + condições + resumo vivo.
4. **Tela de Rota** — organização das ações do slide + header/estados consistentes.

---

## 3. Estado atual (base — o que existe hoje e por que está ruim)

### 3.1 Botões
- `Button`/`ButtonLink` (`shared/components/Button.tsx`) só tem variantes **`primary | secondary | danger | ghost`** — faltam `soft`, `outline`, `success` (o Lovable já tem no `kit.tsx`).
- Botão **"Pagar"** da rota usa classes cruas `bg-success text-white hover:bg-success-hover shadow-sm` porque não há variante `success`.
- "Novo contrato" na ficha do cliente é um **`<Link>` cru** estilizado (`text-primary hover:underline`), fora do padrão.
- Labels com **seta literal "→"** ("Ver na rota →") em vez de ícone `ChevronRight`.
- As mesmas ações existem em **dois vocabulários**: chip `QuickActions` (Central) e `Button` (headers de lista) — precisa decidir **1 affordance canônica por tipo de ação**.

### 3.2 Form de Cliente (novo/editar)
- Form duplicado em `ClienteNovo.tsx` e `ClienteEdit.tsx` (~270 linhas cada), **sem componente compartilhado**.
- 17 campos: nome, telefone, CPF, comércio, telefoneComercio, logradouro, numero, complemento, bairro, cidade, estado, comercioLogradouro, comercioNumero, comercioBairro, comercioCidade, comercioEstado, comercioLat/Lng.
- 3 seções com `SectionHeader` (Dados do cliente / Endereço do comércio / Endereço), grids mistos (1 col + 3/4 col), endereço do comércio recolhível.
- **GPS só no endereço do comércio** (botão "📍 Usar local atual" + reverse geocode Nominatim). **Não há GPS no endereço residencial** (as colunas `lat`/`lng` do banco existem e ficam vazias).
- **Bug conhecido (corrigir no app em paralelo):** editar o texto do endereço do comércio **não descarta** as coordenadas capturadas → o "Navegar" abre o mapa no ponto antigo. O estado-alvo abaixo já prevê a UX correta.

### 3.3 Form de Contrato (novo/editar)
- Form duplicado em `ContratoNovo.tsx` e `ContratoEdit.tsx`, **sem componente compartilhado**.
- 4 campos (valorBase, percentualJuros, quantidadeParcelas, dataInicio) + **combobox de cliente artesanal** (3 refs, inputs crus, dropdown cru) — fora do padrão.
- Resumo vivo em **box cru** (`rounded-xl bg-surface-secondary`).
- Edit é **bloqueado** (aviso) se alguma parcela já foi paga.

### 3.4 Rota
- `CobrancaCard` já está no padrão (topo do slide).
- Mas o resto: pill de **GPS cru** no header (deveria ser `StatusBadge`), **X de fechar redundante** (duplica o back), **comprovante = modal artesanal** (duplica o `Modal`, com scroll-lock manual), **promessa = input de data cru**, `RouteProgress` **sem `Card`**, skeletons `rounded-md` (padrão banido), e o **card de ações com 3 tratamentos visuais diferentes** empilhados (chips → botão sólido → chips).

---

## 4. COMO DEVE FICAR (estado-alvo por entregável)

### 4.1 Entregável 1 — Componentes de ação (botões)

**`Button`/`ButtonLink` canônico:**
- Base: `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`.
- Variantes: **`primary`** (`bg-primary text-primary-foreground hover:bg-primary-hover`) · **`soft`** (`bg-primary-light text-primary-text`) · **`outline`** (`border border-border-strong bg-surface hover:bg-surface-hover`) · **`ghost`** (`text-text-secondary hover:bg-surface-hover hover:text-text-primary`) · **`danger`** (`bg-danger text-primary-foreground`) · **`success`** (`bg-success text-white hover:bg-success-hover`).
- Sizes: `sm` (`min-h-9 rounded-lg px-3 text-sm`) · `md` · `lg` (`min-h-12`) · `block` (`w-full min-h-12`).
- `ButtonLink` espelha as mesmas variantes/sizes com `to` (react-router).

**Vocabulário único por tipo de ação (decisão de produto):**

| Tipo de ação | Onde | Componente |
|---|---|---|
| Criar (ex.: "Novo cliente", "Novo contrato") | `PageHeader action` | `ButtonLink` `primary` |
| Ação contextual rápida (ex.: Central) | grid da Central | chip `QuickActions` |
| Ver/abrir contexto (ex.: "Ver rota") | junto ao título da seção | `Button` `ghost` `size="sm"` |
| Enviar form ("Salvar") | footer do form | `Button` `primary` (block no mobile, à direita no desktop) |
| Ação positiva de destaque ("Registrar pagamento") | card da rota | `Button` `success` `block` |
| Cancelar | ao lado do salvar | `Button` `ghost` |

**Regras:** nunca seta literal "→" em label (usar ícone `ChevronRight` se precisar de affordance); nunca `<Link>` cru (usar `ButtonLink`); nunca classe de cor crua (usar variante).

### 4.2 Entregável 2 — Form de Cliente (novo/editar)

**Estrutura da página:**
- `PageHeader` (ícone; título "Novo cliente" / "Editar cliente"; `back`).
- Form em **seções em `Card`** (cada grupo vira um card `rounded-xl border bg-card`), ordem:
  1. **Card "Identificação"** — nome, telefone, CPF. Grid 2 col (desktop) / 1 col (mobile).
  2. **Card "Comércio"** — nome do comércio, telefone do comércio.
  3. **Card "Localização do comércio"** — **controle de GPS** + endereço (logradouro, número, bairro, cidade, UF).
  4. **Card "Endereço residencial"** — **controle de GPS** + endereço (logradouro, número, complemento, bairro, cidade, UF).
- Footer: "Salvar" (`primary`, block no mobile) + "Cancelar" (`ghost`).

**Controle de GPS/Localização (componente novo da identidade — destaque):**
Um bloco por endereço (comércio E residencial), com **3 estados visuais**:
- **📌 Capturar localização** — botão inicial; ao tocar, captura GPS + reverse geocode (preenche os campos de endereço).
- **📍 Localização capturada** — depois de capturada: badge/indicador "Localização capturada" + botão **Recapturar** (pequeno, `ghost`/`soft`). Os campos de endereço vêm preenchidos.
- **📍 Não capturada** — quando o usuário **edita manualmente** qualquer campo de endereço após a captura: as coordenadas são **descartadas** (o endereço digitado passa a ser a fonte; a navegação passa a usar o texto) e o controle volta a oferecer "Capturar localização" (ou mostra "Não capturada" + "Recapturar").
- Erro de GPS (permissão negada): mensagem visível, nada gravado.
- Reverse geocode sem sucesso: coordenadas **mantidas** + aviso "Preencha o endereço manualmente".
- Cooldown ~2s entre capturas.

**Observação de produto:** o alvo de navegação da ficha é **comércio (padrão)**; sem comércio, usa o **residencial** (com ou sem coordenadas). Isso é regra do app — mas o desenho deve deixar claro qual localização está capturada em cada bloco.

### 4.3 Entregável 3 — Form de Contrato (novo/editar)

**Estrutura da página:**
- `PageHeader` (ícone; título "Novo contrato" / "Editar contrato"; `back`).
- **Seletor de cliente (novo)** — no lugar do combobox artesanal: campo de busca com dropdown no padrão da identidade (tipo `FieldSelect` buscável: input de busca + lista de opções "Nome · telefone" / "Nome · bairro", com vazio "Nenhum cliente encontrado"). No **edit**, cliente em `Card` read-only (nome + telefone + endereço curto).
- **Card "Condições"** — valor base (moeda, máscara), percentual de juros, quantidade de parcelas, data inicial. Grid 2 col (desktop) / 1 col (mobile).
- **Card "Resumo" (vivo)** — total a receber, nº de parcelas, data final. Calculado em tempo real conforme os campos.
- Footer: "Salvar" (`primary`) + "Cancelar" (`ghost`).
- **Edit:** se alguma parcela já foi paga, mostrar aviso (`ErrorBanner`/box `warning`) e **bloquear edição**.

### 4.4 Entregável 4 — Tela de Rota

**Estrutura:**
- `PageHeader` (ícone Route; título "Minha rota"; `back`; **status GPS como `StatusBadge`** — "GPS ativo" (`success`) / "GPS inativo" (`neutral`) — não pill cru).
- Sem botão X redundante (o `back` do PageHeader já cobre).
- **Slide do carousel** (`CobrancaCard` já pronto no topo) + **UM card de ações coerente** (`Card.Root variant="collection"`), com:
  - Grupo 1 — contato/navegação (`QuickActions`): **Navegar** (só quando há alvo) · **WhatsApp** · **Ligar** · **Abrir contrato**.
  - **Ação principal** — **"Registrar pagamento"** como `Button` `success` `block` (bem destacada).
  - Grupo 2 — resultado (`QuickActions`): **Visitado** · **Não Encontrado** · **Promessa** (ocultos quando já aplicados).
  - Os 3 grupos visualmente coerentes (divisórias `border-b`/`border-t`, mesmo padding) — **não** 3 tratamentos diferentes.
  - Barra de "processando" (`animate-pulse h-1`) quando operando.
- **`RouteProgress`** (progresso da rota: visitados/pendentes/promessas/pagos) **dentro de um `Card`** (não div solto).
- **Modal de Promessa:** `Modal` base (`title` "Registrar promessa", `footer` Cancelar/Salvar) com campo de data via **`Field`**.
- **Comprovante de pagamento:** usar o **`Modal` base** (nunca overlay artesanal; o `Modal` já cuida de scroll-lock/Escape).
- Loading/empty: `EstadoTela` (nada de `rounded-md` cru em skeleton).

---

## 5. Padrões obrigatórios (não pode faltar)

- **Inputs:** `Field` / `FieldSelect` / `FieldTextarea` (`rounded-xl min-h-12 border-strong` + label + erro + `focus:ring-primary`) — nunca input/select/textarea cru.
- **Cards:** `Card.Root` (`rounded-xl border bg-card`), `tone` p/ destaque de estado.
- **Header de página:** `PageHeader` (icon `size-11 rounded-xl`, título `text-[28px]`+`truncate`).
- **Título de seção:** `SectionHeader` (`font-display text-[22px]`).
- **Modal:** `Modal` base (`title`/`descricao`/`footer`) — nunca duplicar overlay/Escape/scroll.
- **Badge:** `StatusBadge` (pill com dot) — nunca pill/span cru.
- **Botões:** `Button`/`ButtonLink` com as variantes do Entregável 1 — nunca classes de cor cruas.
- **Cores:** SEMPRE tokens (`bg-primary`, `text-danger-text`, `bg-card`, `bg-success`, ...) — nunca cor da paleta hardcoded.
- **Ícones:** lucide-react; affordance com `ChevronRight`/ícone, nunca seta literal "→".
- **i18n:** rótulos em **pt-BR, en, es** (arquivos `frontend/src/i18n/locales/*.json`).
- **Mobile-first:** tudo usável com polegar, em pé, na rua (alvos de toque `min-h-11`+, grids colapsam p/ 1 col).
- **Acessibilidade:** `aria-*` nos controles de GPS/seletor, `role` correto.

---

## 6. Entregáveis (checklist)

- [x] `Button`/`ButtonLink` com variantes `primary | soft | outline | ghost | danger | success` + sizes `sm | md | lg | block` (PLAN-056)
- [x] Vocabulário único por tipo de ação (tabela do 4.1) aplicado nas telas (PLAN-056 F3)
- [x] `ClienteForm` (novo/editar) em Cards: Identificação · Comércio · Localização do comércio · Endereço residencial (PLAN-056 F2)
- [x] Controle de **GPS/Localização** com 3 estados (Capturar / Capturada+Recapturar / Não capturada) — para comércio E residencial (PLAN-056 F2)
- [x] `ContratoForm` (novo/editar): seletor de cliente buscável + Condições + Resumo vivo + edit bloqueado (WS6 — implementado no app, não no Lovable)
- [x] **Rota:** `StatusBadge` de GPS · card de ações coerente (contato / "Registrar pagamento" `success` / resultado) · `RouteProgress` em `Card` · promessa com `Field` · comprovante com `Modal` · `EstadoTela` nos estados (WS6)
- [x] Tudo com tokens, `Field`/`Card`/`Modal`/`StatusBadge`/`Button`, ícones lucide, i18n pt/en/es, mobile-first

---

## 7. Checklist "não esquecer" (detalhes críticos)

1. **GPS nos DOIS endereços** (comércio E residencial) — não só no comércio.
2. **Controle de GPS com 3 estados** (Capturar / Capturada+Recapturar / Não capturada) — o estado "Não capturada" acontece quando o texto é editado manualmente.
3. **Alvo de navegação = comércio padrão → residencial fallback** (regra do app; o desenho deve deixar claro qual localização cada bloco tem).
4. **Variante `success` no `Button`** (usada no "Registrar pagamento") — resolve o botão verde que hoje usa classe crua.
5. **Sem "→" literal** em labels — ícone `ChevronRight`.
6. **Sem `<Link>` cru** — sempre `ButtonLink`.
7. **Seletor de cliente do contrato buscável** — substituir o combobox artesanal.
8. **Edit de contrato bloqueado** quando há parcela paga (aviso visível).
9. **Comprovante e Promessa** usam o `Modal` base (nada de overlay artesanal).
10. **`RouteProgress` dentro de `Card`** (não div solto).
11. **Skeletons/loading/empty** via `EstadoTela` — nunca `rounded-md` cru.
12. **i18n completo** em pt-BR, en, es em TODOS os novos rótulos.
13. **Tokens apenas** — o `npm run audit:styles` falha com cor hardcoded.
14. **Mobile-first** — toques `min-h-11`+, grids colapsam para 1 coluna.
