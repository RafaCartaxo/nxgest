# Lovable — Perfil & Conta: Meus dados · Operador (form/detail/lista) · Ativação · Verificação de e-mail · Conta suspensa

**Versão:** 2.0

**Data:** 14/08/2026

**Base:** PLAN-075 (commitado `552f7b9`) + **telas Stitch `stitch_personality_plus_portal` portadas (14/08)** — identidade "Nexus" integrada nas 8 superfícies.

> Registro para a IA de visual: descreve **como as telas estão hoje** (estado real do código, após o port das telas Stitch). Redesign/ajustes devem **respeitar a arquitetura** — tokens Nexus, componentes canônicos, `lucide-react`, i18n pt/en/es, dark + 5 paletas, whitelabel.
> **Regra de ouro:** não criar novos padrões/tokens/componentes — reutilizar os canônicos. O port já mapeou os tokens Material 3 do Stitch para os tokens Nexus existentes.

## Regras obrigatórias (não pode faltar)

- **Só tokens** (`bg-card`, `bg-surface`, `text-text-*`, `bg-primary-light`, `border-border`, etc.) — nunca cor fixa da paleta.
- **Componentes canônicos:** `Card` (com `tone` = tone stripe), `Field`, `FieldSelect`, `Button`, `Modal` (`footer` para ações), `StatusBadge`, `KpiCard`, `SectionHeader`, `ConfirmModal`, `Avatar`/`AvatarField`, `SuccessState`, `ErrorBanner`, `PublicPageShell`, `SearchBar`, `CollapsibleSection`, `CaixaKpis`, `EstadoTela`, `QuickActions`, `Logo`.
- **Ícones:** `lucide-react` (nunca Material Symbols).
- **i18n pt/en/es** · **a11y** (`aria-*`, `role`, foco visível) · **mobile-first** (alvos de toque `min-h-11`/`min-h-12`).
- **Whitelabel:** cor sempre via `--tenant-primary` (via `--color-primary`).
- **Dark + 5 paletas** funcionando em tudo.
- Feedback unificado via `useFeedback`; `aria-live` nas mensagens.
- **Nunca `fixed bottom`** nas páginas (o `AppLayout` já tem `BottomTabBar` fixa no mobile + `pb-28` no `main`).

---

## 1 — Meus dados (`PerfilPage` · `/perfil`)

**Estado atual (portado do Stitch):**

- **PageHeader** (ícone `User`, título, botão voltar).
- **Banner de pendência de e-mail** (se `emailPendente`): card com **tone stripe amarela**, ícone `Info`, copy "Enviamos um link para **X**..." + botão **Cancelar troca** (soft).
- **Bento grid** (`lg:grid-cols-12`, `max-w-5xl`):
  - **Coluna principal (8col)**: card **Dados pessoais** (`AvatarField` + Nome + Telefone + botão Salvar) · card **Conta** (E-mail com **selo `BadgeCheck` "E-mail verificado"** ou badge `⚠` pendente; Status; Role; Empresa; **"Trocar e-mail" no rodapé do card** com `border-t`, botão outline).
  - **Coluna lateral (4col)**: card **Segurança** (senha atual/nova/confirmar + botão Trocar senha).
- **Modais:** **Trocar e-mail** (novo e-mail + senha atual) · **Cancelar troca** (senha atual, danger).

**Estados:** carregando · erro · convidado (badge Convidado) · suspenso (tela cheia — ver §7).

---

## 2 — Operador: form (`OperadorForm` — dentro de um `Modal` no `AdminPage`)

**Estado atual (portado do Stitch):**

- **Sem campo de senha** — cadastro gera convite (PLAN-075 P-04).
- **3 seções em `Card` tone** (espelha o Meu Perfil), cada uma com **título `font-display` dentro do card**:
  - **Dados pessoais** (`tone="success"`): `AvatarField` em **coluna própria** à esquerda + **Nome** + **Telefone** (opcional) com respiro à direita.
  - **Acesso** (`tone="info"`): **E-mail** (sem campo "Confirmar e-mail").
  - **Permissões** (`tone="neutral"`): **Role** (`FieldSelect`; travado em Operador quando ator é sócio) · **Chefe** (`FieldSelect`, só p/ Operador/Sócio) · **callout do convite em bloco próprio** (caixa `bg-primary-light` + ícone `Mail` + copy do convite, quando novo).
- **Validação inline** no submit (nome ≥ 3, e-mail com `@`), erros com foco/scroll.
- **Botões no `Modal.footer`** (Cancelar ghost + Enviar convite/Salvar primary) — o form expõe `submit()` via ref (`OperadorFormHandle`). **Sem** submit `fixed`/sticky (evita conflito com o bottom-sheet do modal).

---

## 3 — Operador: detalhe (`OperadorDetail` · `/admin/operadores/:id`)

**Estado atual (portado do Stitch):**

- **PageHeader**: título com nome + action com `Avatar` (sm) + badge de **role**.
- **Bento grid** (`lg:grid-cols-3`):
  - **Contato & Status** (`Card` tone neutral): E-mail, Telefone ("—" se vazio) + badges (Suspenso vermelho · Verificação pendente amarelo · Convite Pendente/Expirado amarelo, Revogado vermelho). **Sem** selo "✓ e-mail verificado".
  - **Desempenho** (`Card` tone info): 2 `KpiCard` (Clientes · Contratos ativos).
  - **Ações de Conta** (`Card` tone warning, `lg:col-span-3`): botões em linha — **Reenviar convite** (soft, se convidado) · **Revogar convite** (secondary, só convite PENDENTE, `ConfirmModal` danger) · **Reativar** (secondary) / **Suspender** (danger). Oculta quando `isSelf`.
- **Bloco Caixa** (se módulo): `CaixaKpis` + card Clientes (contador + Acessar) + card Contratos (contador + Acessar) + **Ajustar caixa** (primary, `AjustarCaixaModal`) + Histórico (`CollapsibleSection`). Falha do caixa → banner amarelo, página continua (R3).
- **Modais**: Revogar · Suspender/Reativar (`ConfirmModal`) · Ajustar caixa.

**Regra de segurança:** ações de conta **não aparecem para o próprio usuário** (`isSelf`).

---

## 4 — Operador: lista (`OperadoresList`)

**Estado atual (portado do Stitch):**

- **Agrupada por role** com labels `uppercase` (ADMINISTRADORES · SÓCIOS · OPERADORES), separador `border-b`.
- **Grid de cards** (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`) com **tone stripe por role** (admin=`info`, sócio=`success`, operador=`neutral`):
  - `Avatar` + nome + **todos os badges aplicáveis** (Suspenso · Verificação pendente · Convite · **Eu** · **Role**).
  - Linha secundária: **e-mail** com ícone `Mail` + **telefone** com `Phone`.
  - Rodapé (`border-t`): contadores **Clientes · Contratos** (`tabular-nums`) + actions (ícones: **Acessar → detail** sempre visível · Reenviar convite se convidado · Editar · Remover danger; Editar/Remover ocultos se `isSelf`). Todos com `aria-label`.
- **Busca** (no `AdminPage`) cobre **nome E e-mail** (`SearchBar`).

---

## 5 — Ativação (`AtivarPage` · `/ativar?token=`)

**Estado atual (página pública, `PublicPageShell`):**

- Título "Defina sua senha" + subtítulo. **Não exibe o nome do convidado** (backend retorna só `{ ok: true }`).
- **2 campos senha** (nova + confirmar) com **toggle eye** (`Field.right`). **Sem indicador de força.**
- Estados: sem token → "Link inválido" (`ErrorBanner`) · sucesso → `SuccessState` "Conta ativada!" → **Ir para o login** · `TOKEN_EXPIRED` → copy dedicada "Peça ao administrador para reenviar" · demais → `TOKEN_INVALID` genérico (mensagem do backend).
- Botão submit full-width com **spinner**; desabilitado durante envio.

---

## 6 — Verificação de e-mail (`VerificarEmailPage` · `/verificar-email?token=`)

**Estado atual (página pública, `PublicPageShell`):**

- Título "Confirmar novo e-mail" + subtítulo.
- Requisição automática ao carregar (uma vez); **sem sessão** → login com `state.from` e volta após autenticar.
- Estados: carregando (spinner) · sem token (`ErrorBanner`) · sucesso (`SuccessState` "E-mail confirmado!" → **Ir para Meus dados**) · erro (`ErrorBanner` específico + botão Ir para Meus dados).

---

## 7 — Conta suspensa (`ContaSuspensaScreen`)

**Estado atual (tela cheia, substitui o app quando suspenso):**

- **Tone de aviso (warning/amarelo)** — card com tone stripe, ícone `Ban` em círculo `bg-warning-light`.
- Logo NX + título "Conta suspensa" + **box de aviso** (`bg-warning-light` + `AlertTriangle`) com a copy atual ("Fale com o administrador da sua empresa...").
- **Um único botão: Sair** (primary, ícone `LogOut`). **Sem** "Tentar novamente".
- Sessão **mantida** (não desloga) — só bloqueia.

---

## 8 — Login (`LoginPage`) — ajuste pontual

- Mantém o fluxo atual; **redireciona de volta à rota de origem** via `state.from` (ex.: voltar a `/verificar-email`).
- Erro de conta suspensa (`CONTA_SUSPENSA`) com copy traduzida pt/en/es.

---

## Fora das telas hoje (não implementado — não inventar)

- **Perfil:** hero com avatar centralizado no topo (hoje: PageHeader + bento grid).
- **OperadorForm:** campo "Confirmar e-mail" (duplicado); submit fixo (sticky) na página (hoje os botões ficam no `Modal.footer`).
- **OperadorDetail:** selo "✓ e-mail verificado"; separação visual própria do bloco "Acesso" além do card warning.
- **OperadoresList:** badges priorizados com tooltip (hoje todos aparecem); busca por "tag" (só nome/e-mail).
- **AtivarPage:** nome do convidado (backend não provê); indicador de força; mensagens específicas para revogado/já usado/e-mail não confere (hoje `TOKEN_INVALID` genérico).
- **ContaSuspensaScreen:** tone danger/neutral; botão "Tentar novamente".

## Pendências de consistência futura (despriorizadas — QA review 14/08)

- **EmpresaForm → `Modal.footer` (B3):** o `EmpresaForm` (SuperAdminPage) ainda tem os botões dentro do form, diferente do `OperadorForm` (footer). Mover exige `requestSubmit` via ref (validação `required` nativa) + risco no fluxo de criação/edição de empresa (sem teste front direto, só smoke `EMP-*`). Fora de escopo do port.
- **Spinner nos botões de Resetar/Recuperar senha (B5):** páginas públicas que não passaram pelo port; adicionar o mesmo spinner do AtivarPage por consistência. Barato, porém fora do escopo desta rodada.

---

## Melhorias de UX sugeridas (anexo — para avaliar no Lovable)

Boas práticas que elevam a qualidade das 8 superfícies **sem criar novos padrões/tokens** — usam os canônicos existentes. Listadas por tela; prioridade sugerida (impacto × esforço).

| # | Melhoria | Tela | Impacto | Esforço |
|---|---|---|---|---|
| 1 | **Dirty-state no Salvar** — botão "Salvar" só ativo quando nome/telefone mudaram (hoje sempre habilitado) | Perfil | Alto | Baixo |
| 2 | **Trocar e-mail com copy de segurança** — sublinhado no card Conta: "requer verificação do novo endereço · seu e-mail atual segue valendo até confirmar" | Perfil | Alto | Baixo |
| 3 | **Suspensão com motivo opcional** — campo texto no `ConfirmModal` de suspender (registra por quê; útil na reativação) | OperadorDetail | Médio | Médio |
| 4 | **Badges priorizados na lista** — mostrar role sempre + 1 badge de estado (suspenso/convidado) com `title` explicando o resto (evita "muro de badges") | OperadoresList | Médio | Baixo |
| 5 | **Indicador de força de senha** (fraco/médio/forte) na primeira definição | AtivarPage | Médio | Baixo |
| 6 | **Nome do convidado na ativação** — "Olá, {nome}" quando o backend prover (hoje só `{ok:true}`) | AtivarPage | Médio | Backend |
| 7 | **Tone danger/neutral na Conta suspensa** — hoje é warning/amarelo; bloqueio total pede visual de bloqueio, não de aviso leve | ContaSuspensaScreen | Médio | Baixo |
| 8 | **Botão "Tentar novamente"** na Conta suspensa — revalida `me` (útil se já reativado) | ContaSuspensaScreen | Baixo | Baixo |
| 9 | **Mensagens específicas** para convite revogado / já usado / e-mail não confere (hoje caem em `TOKEN_INVALID` genérico) | AtivarPage | Médio | Backend |
| 10 | **Empty states** nos cards de Clientes/Contratos do OperadorDetail ("Nenhum cliente ainda") | OperadorDetail | Baixo | Baixo |

> **Não bloquear o port:** itens 5/6/9 dependem do backend (hoje `ativar` retorna `{ok:true}` sem nome). Itens 1/2/3/4/7/8/10 são puramente de front e podem entrar em qualquer rodada de polimento.

## Entregáveis

8 superfícies no padrão NX Gest (estado atual): **mobile + desktop + dark + 5 paletas** — Perfil · OperadorForm · OperadorDetail · OperadoresList · AtivarPage · VerificarEmailPage · ContaSuspensaScreen (+ ajuste de Login).

## Fora de escopo (por ora)

- **Empresas** (`/admin/empresas` + `EmpresaForm`/`EmpresaList`) — planejado depois.
- PLAN-072 (identidade visual da empresa: nomeFantasia/tema/logo/contato) — plano separado.
- Redesign da navbar/dashboard — não é parte do PLAN-075.
