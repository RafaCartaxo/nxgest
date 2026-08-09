# Lovable — Polimento de UI: Configurações · Central/Fechar caixa · Ajuste de caixa do operador · Admin

**Versão:** 1.0

**Data:** 07/08/2026

> Briefing para redesenhar **4 superfícies** com cara de app, mantendo a identidade "Nexus" intacta.
> **Regra de ouro:** descreve **como deve ficar** (estado-alvo), não o estado atual. Não criar novos padrões/tokens — usar os canônicos.

## Regras obrigatórias (não pode faltar)

- **Só tokens** (`bg-card`, `bg-surface`, `text-text-*`, `bg-primary-light`, `border-border-strong`, etc.) — nunca cor fixa da paleta.
- **Componentes canônicos:** `Card`, `Field`/`FieldTextarea`, `Button`, `Modal` (bottom-sheet mobile), `KpiCard`, `Tabs`, `StatusBadge`, `QuickActions`.
- **i18n pt/en/es** · **a11y** (`aria-*`, `role`, foco visível) · **mobile-first** (alvos de toque `min-h-11`/`min-h-16`).
- **Whitelabel:** cor sempre via `--tenant-primary` (via `--color-primary`).
- **Dark + 5 paletas** funcionando em tudo.

## 1 — Configurações (`PreferenciasModal`)

Estado-alvo:
- Mobile = **bottom-sheet com alça**; desktop = dialog centralizado (`max-w`).
- **Card de preview ao vivo** no topo: mini-mock da UI (título, botão, KPI) refletindo paleta + modo selecionados em tempo real.
- **Modo** (Claro/Escuro/Sistema): controle **segmentado compacto** (3 pills com ícones Sun/Moon/Monitor) — não tabs full-width.
- **Cor** (5 paletas): swatches circulares com **anel de seleção** + nome; 2 col mobile / 3–4 desktop.
- **Idioma** (PT/EN/ES): linhas com nome completo + sigla em badge, check na selecionada.
- Rodapé: botão "Concluído" (fecha). Só muda layout; a lógica (palette/mode/lang) permanece.

## 2 — Central: Fechar caixa

Estado-alvo:
- Ação **"Fechar caixa" abre um modal** direto na Central (quando módulo caixa ativo), com:
  - **Resumo do dia:** Saldo em mãos · Recebido hoje · Gastos hoje (valores reais).
  - Botão primário "Fechar caixa" (com confirmação/feedback de sucesso). Vazio/erro tratados.
- "Ações rápidas" mantém as demais (Receber · Minha rota · Novo cliente).

## 3 — Ajuste de caixa base do operador (`OperadorDetail`)

Estado-alvo:
- **Card próprio:** header "Ajustar caixa base" + contexto (Caixa base atual · Saldo atual como mini-KPIs).
- `Field` (valor com máscara) + `FieldTextarea` (motivo, obrigatório) com **validação inline**.
- Botão "Salvar ajuste" (block mobile / alinhado desktop). Feedback de sucesso/erro no lugar.

## 4 — Página do Administrador (`AdminPage`)

Estado-alvo:
- Hierarquia clara: cabeçalho (empresa/role) → **KPIs de equipe** (Admins · Sócios · Operadores, clicáveis) → **KPIs de operação** (Clientes · Contratos · **Recebido hoje em destaque**) → **Equipe** (avatar + role badge + status do convite: "Ativo"/"Convite pendente" + reenviar) → busca.
- Tabs **Equipe/Meus dados** mantidas (admin self); "Meus dados" limpo (caixa + perfil).
- Espaçamento/hierarquia consistentes; estados vazio/carregamento canônicos.

## Entregáveis

4 variações no padrão Nexus (estado-alvo): **mobile + desktop + dark + 5 paletas**.
