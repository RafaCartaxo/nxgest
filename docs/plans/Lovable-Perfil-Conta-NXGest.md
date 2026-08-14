# Lovable — Perfil & Conta: Meus dados · Operador (form/detail/lista) · Ativação · Verificação de e-mail · Conta suspensa

**Versão:** 1.0

**Data:** 13/08/2026

**Base:** PLAN-075 (cadastro e acesso: dados, autosserviço, segurança de e-mail, convite, suspensão) — implementado no working tree, aguardando identidade/UX.

> Briefing para redesenhar **7 superfícies** com cara de app, mantendo a identidade "NX Gest" intacta.
> **Regra de ouro:** descreve **como deve ficar** (estado-alvo), não o estado atual. Não criar novos padrões/tokens — usar os canônicos.

## Regras obrigatórias (não pode faltar)

- **Só tokens** (`bg-card`, `bg-surface`, `text-text-*`, `bg-primary-light`, `border-border-strong`, etc.) — nunca cor fixa da paleta.
- **Componentes canônicos:** `Card`, `Field`, `Button`, `Modal` (bottom-sheet mobile), `StatusBadge`, `KpiCard`, `SectionHeader`, `ConfirmModal`, `Avatar`/`AvatarField`, `SuccessState`, `ErrorBanner`, `PublicPageShell`.
- **i18n pt/en/es** · **a11y** (`aria-*`, `role`, foco visível) · **mobile-first** (alvos de toque `min-h-11`/`min-h-16`).
- **Whitelabel:** cor sempre via `--tenant-primary` (via `--color-primary`).
- **Dark + 5 paletas** funcionando em tudo.
- Feedback unificado via `useFeedback` (loading/success/error) em toda ação; `aria-live` nas mensagens.

---

## 1 — Meus dados (`PerfilPage` · `/perfil`)

**Estado-alvo:**

- **Header de perfil (hero)** no topo da página (não colado num form):
  - `Avatar` grande centralizado (upload/remover com overlay) + **nome** grande + badges de **Role** e **Status** (Ativo ✓ verde · Convidado ⚠ amarelo · Suspenso ⛔ vermelho) + **Empresa** como linha secundária.
- **Card "Dados pessoais"** (editável): campos **Nome** e **Telefone** (opcional). Botão **Salvar** com **dirty-state** (só ativo quando algo mudou) + feedback inline ("Dados atualizados ✓").
- **Card "Conta"** (leitura, `definition list` visual — não linhas `label:` cruas):
  - **E-mail** com selo ao lado: `✓ E-mail verificado` (green) ou `⚠ Verificação pendente` (warning).
  - **Status** (badge), **Role** (badge colorido), **Empresa**.
  - **Troca de e-mail** como **bloco de ação próprio dentro de Conta** (não em Segurança): botão com ícone + copy "Trocar e-mail" e sublinhado "requer verificação do novo endereço".
  - Se `emailPendente`: **banner de destaque** (warning) explicando o passo a passo — "Enviamos um link de confirmação para **X**. Seu e-mail atual continua valendo até você confirmar." + botão **Cancelar troca** (text/danger).
- **Card "Segurança"**: form de senha (atual/nova/confirmar) + botão "Trocar senha". Separado do restante por hierarquia, não por 3 cards idênticos.
- **Modais** (mantém fluxos): **Trocar e-mail** (novo e-mail + senha atual) · **Cancelar troca** (senha atual, confirm danger).

**Estados:** carregando · erro · convidado (mostra "defina sua senha pelo link recebido") · suspenso (bloqueio global, ver §6).

---

## 2 — Operador: form (`OperadorForm`)

**Estado-alvo:**

- **Sem campo de senha** — cadastro gera convite (regra PLAN-075 N4). Copy em destaque: **callout** com ícone "O usuário receberá um convite por e-mail e definirá a própria senha na ativação" (não texto muted solto).
- 3 blocos com `Card`/divisores claros (não labels `uppercase` soltos):
  - **Dados pessoais**: `AvatarField` + **Nome** + **Telefone** (opcional).
  - **Acesso**: **E-mail** + **Confirmar e-mail** (campo duplicado, boa prática — evita convite para endereço errado).
  - **Permissões**: **Role** (`FieldSelect`: Operador/Sócio/Admin) com **helper** descrevendo cada papel · **Chefe** (só para Operador/Sócio; Sócio vê role travado).
- **Validação inline** (on blur) com `aria-describedby`; erros focados/scrollados.
- Botões: **Cancelar** (ghost) · **Salvar** / **Enviar convite** (primary). No mobile, **submit fixo (sticky bottom)** — form longo.

---

## 3 — Operador: detalhe (`OperadorDetail` · `/admin/operadores/:id`)

**Estado-alvo (reorganização em 3 grupos):**

- **Header**: avatar + nome + badge de role.
- **① Dados & acesso** (o foco do PLAN-075):
  - Card com **E-mail** (selo `✓ verificado`/`⚠ pendente` quando aplicável), **Telefone** ("—" se vazio), **Status do convite** (Pendente ⚠ / Expirado ⚠ / Revogado ⛔).
  - **Bloco "Convite"** (se convidado): **Reenviar convite** (soft) · **Revogar convite** (secondary, só convite PENDENTE).
  - **Bloco "Acesso"** separado com **tonalidade própria**: **Suspender** com copy clara "Bloqueia o acesso mantendo os dados" (gatilho `secondary` com ícone; confirmação `danger` no `ConfirmModal`). **Reativar** (secondary) quando suspenso. Suspensão **separada visualmente** dos botões "amigáveis" — nunca por acidente.
- **② Operação**: KPIs (Clientes · Contratos ativos) + cards Clientes/Contratos (contador + "Acessar").
- **③ Caixa** (só se módulo caixa): `CaixaKpis` · Ajustar caixa (primary) · Histórico de ajustes (colapsável).
- **Modais**: Revogar · Suspender/Reativar (ConfirmModal) · Ajustar caixa.

**Regra de segurança:** ações de conta **não aparecem para o próprio usuário** (`isSelf`).

---

## 4 — Operador: lista (`OperadoresList`)

**Estado-alvo:**

- Card por operador: avatar + nome + **role** sempre visível.
- **Badges priorizados** (evitar "muro de badges"): mostrar no máximo o essencial — `Suspenso` (⛔) ou `Verificação pendente` (⚠) ou `Convite` (⚠ pendente/expirado, ⛔ revogado) — com **tooltip** explicando o restante quando houver mais de um estado.
- Linha secundária: e-mail (truncado) + telefone (`text-muted`, oculto em telas < sm).
- Contadores: Clientes · Contratos.
- **Busca** cobrir nome **e e-mail** (hoje só nome).

---

## 5 — Ativação (`AtivarPage` · `/ativar?token=`)

**Estado-alvo (página pública, `PublicPageShell`):**

- Título "Defina sua senha" + subtítulo claro ("Bem-vindo(a)! Escolha uma senha para começar").
- **Nome do convidado** exibido (ex.: "Olá, Maria 👋") quando o backend prover.
- 2 campos senha (com toggle eye) + **indicador de força** (fraco/médio/forte) na primeira definição.
- Estados:
  - Sem token → "Link inválido" (`ErrorBanner`).
  - Sucesso → `SuccessState` "Conta ativada!" → botão **Ir para o login**.
  - **Convite expirado** → copy dedicada: "Este convite não é mais válido. **Peça ao administrador para reenviar** um novo convite." + link p/ login.
  - **Revogado / já usado / e-mail não confere** → mensagens específicas (PLAN-075 P-10) com ação clara.
- Botão submit full-width com spinner; desabilitado durante envio.

---

## 6 — Verificação de e-mail (`VerificarEmailPage` · `/verificar-email?token=`)

**Estado-alvo (página pública, `PublicPageShell`):**

- Título "Confirmar novo e-mail" + subtítulo "Confirme a troca pelo link recebido".
- Estados:
  - Sem token → "Link inválido ou incompleto" (`ErrorBanner`).
  - Sucesso → `SuccessState` "E-mail confirmado! ✓" → botão **Ir para Meus dados**.
  - Token expirado/inválido → `ErrorBanner` específico + botão **Voltar para Meus dados**.
- Carregamento: spinner central; sem sessão → redireciona ao login e volta após autenticar (fluxo já existe).

---

## 7 — Conta suspensa (`ContaSuspensaScreen`)

**Estado-alvo (tela cheia, substitui o app quando suspenso):**

- **Tone de bloqueio** — usar visual de bloqueio (danger/neutral), **não** warning/amarelo (amarelo = aviso leve).
- Logo NX + título "Conta suspensa" + copy "Seu acesso foi suspenso pelo administrador da sua empresa." 
- Botão **Sair** (primary) + botão secundário **Tentar novamente** (revalida `me` — útil se já reativado).
- Sessão **mantida** (não desloga) — só bloqueia.

---

## 8 — Login (`LoginPage`) — ajuste pontual

- Mantém fluxo atual; redireciona de volta à rota de origem após login (ex.: voltar a `/verificar-email`).
- Erro de conta suspensa (`CONTA_SUSPENSA`) com copy clara no form.

---

## Entregáveis

7 variações no padrão NX Gest (estado-alvo): **mobile + desktop + dark + 5 paletas** — Perfil · OperadorForm · OperadorDetail · OperadoresList · AtivarPage · VerificarEmailPage · ContaSuspensaScreen (+ ajuste de Login).

## Fora de escopo (por ora)

- **Empresas** (`/admin/empresas` + `EmpresaForm`/`EmpresaList`) — planejado depois.
- PLAN-072 (identidade visual da empresa: nomeFantasia/tema/logo/contato) — plano separado.
- Redesign da navbar/dashboard — não é parte do PLAN-075.
