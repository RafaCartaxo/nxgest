# DESIGN SYSTEM

**Status:** Aprovado

**Versão:** 2.0

**Última atualização:** 02/07/2026

---

# Objetivo

Definir a identidade visual oficial do sistema, estabelecendo padrões para tipografia, cores, componentes, espaçamento e comportamento da interface.

Este documento representa a fonte oficial das decisões visuais do projeto.

Toda nova tela deverá seguir estas diretrizes antes da implementação.

---

# Princípios

A interface deverá transmitir:

- Clareza
- Rapidez
- Consistência
- Legibilidade
- Simplicidade

Elementos visuais deverão comunicar informação, nunca decorar a interface.

O operador deve compreender rapidamente o estado do sistema mesmo com pouca leitura.

---

# Identidade Visual

O sistema deverá adotar uma linguagem visual limpa, moderna e discreta.

Características:

- poucos elementos decorativos;
- bastante espaço em branco;
- bordas discretas;
- cores neutras;
- destaque para informações financeiras;
- uso de cores apenas para comunicar estados.

---

# Header Navigation

Toda tela deverá possuir uma barra de navegação no topo com:

```
  <  Título da Página    [Ação Primária]
```

Características:

- `<` é o botão de voltar (ChevronLeft do Lucide), na cor `text-gray-400 hover:text-gray-600`
- O título fica à direita do `<` com `flex-1`
- Ações primárias (ex: "Novo", "Editar") ficam à direita com `ml-auto`

Essa barra está presente em todas as páginas exceto a Central de Operações.

---

# Tipografia

## Fonte Oficial

Inter

A mesma fonte deverá ser utilizada em toda a aplicação.

Não deverão existir múltiplas famílias tipográficas.

---

## Escala Tipográfica

| Uso | Tamanho | Peso | Classe Tailwind |
|------|----------|------|----------------|
| Título da Página | 28px | SemiBold (600) | `text-3xl font-semibold` |
| Título de Seção | 22px | SemiBold (600) | `text-xl font-semibold text-gray-800` |
| Título de Card | 18px | SemiBold (600) | `text-lg font-semibold` |
| Valor Financeiro | 24px | Bold (700) | `text-2xl font-bold` |
| Texto Principal | 16px | Regular (400) | `text-base` |
| Inputs | 16px | Regular (400) | `text-base` |
| Botões | 16px | Medium (500) | `text-base font-medium` |
| Texto Auxiliar | 14px | Regular (400) | `text-sm` |
| Legendas | 12px | Medium (500) | `text-xs font-medium` |
| Badges | 12px | Medium (500) | `text-xs font-medium` |

---

## Regras

Inputs nunca deverão possuir tamanho inferior a 16px.

Evitar utilização excessiva de Bold.

Preferir Regular, Medium e SemiBold.

---

# Espaçamento

Todo o sistema deverá utilizar uma escala baseada em múltiplos de 8.

Valores oficiais:

- 4px
- 8px
- 16px
- 24px
- 32px
- 40px
- 48px

Espaçamentos arbitrários deverão ser evitados.

---

# Grid

Toda tela deverá seguir um grid consistente.

Preferências:

- Layout mobile-first
- Componentes alinhados
- Espaçamentos constantes
- Padding uniforme

---

# Bordas

Raio padrão (identidade Nexus — PLAN-038):

- **Cards / Modais / Inputs / Selects:** `rounded-xl` (16px)
- **Botões:** `rounded-md` (12px)
- **Badges:** `rounded-full`

Aplicação:

| Componente | Raio | Classe |
|-----------|------|--------|
| Cards | 16px | `rounded-xl` |
| Inputs / Selects | 16px | `rounded-xl` |
| Modais | 16px | `rounded-xl` |
| Badges | 9999px | `rounded-full` |
| Botões | 12px | `rounded-md` (herdado do base do Button) |

---

# Sombras

Sombras deverão ser discretas.

Sempre que possível, utilizar bordas leves em vez de sombras pesadas.

O objetivo é transmitir limpeza visual.

---

# Paleta

A maior parte da interface deverá utilizar tons neutros.

As cores deverão representar apenas estados.

## Estados

Verde

- pagamento realizado
- sucesso

Amarelo

- pagamento parcial
- atenção

Azul

- cobrança prevista
- informação

Vermelho

- atraso
- erro

Cinza

- informação secundária
- elementos auxiliares

---

# Ícones

Os ícones deverão utilizar uma única biblioteca em todo o sistema.

Biblioteca oficial:

Lucide React

Importação:

```tsx
import { ChevronLeft, ChevronDown, Menu } from "lucide-react"
```

Uso:

```tsx
<ChevronLeft className="h-5 w-5" />
```

É proibido utilizar SVGs inline ou outras bibliotecas de ícones.

Características:

- simples;
- consistentes;
- traço fino;
- boa leitura em dispositivos móveis.

---

# Componentes

## Feedback

O sistema deverá possuir um único componente oficial para comunicação de operações em andamento, sucesso, erro ou informações relevantes.

Esse componente deverá ser reutilizado por toda a aplicação.

O detalhamento completo do comportamento, estados, durações e fluxo do Feedback Global está definido em `plans/PLAN-004-feedback.md`.

### Regras

Não será permitido utilizar:

- spinner dentro de botões;
- barra superior de carregamento;
- múltiplos toasts para a mesma operação;
- notificações duplicadas.

O Feedback Global representa o único padrão oficial de comunicação entre o sistema e o operador durante operações assíncronas.

### Princípios

O operador nunca deverá questionar:

- se a operação iniciou;
- se ainda está sendo executada;
- se foi concluída;
- se ocorreu erro.

O componente deverá comunicar essas informações de forma clara, rápida e consistente.

## Botões

Um botão deverá possuir apenas uma ação principal.

Botões secundários deverão possuir menor destaque visual.

---

## Inputs

**Padrão canônico:** componente compartilhado `Field` (`frontend/src/shared/components/Field/Field.tsx`), com label + input + erro. Todos os formulários devem usar `Field` (mapeamento completo em `engineering/07-FORMS-INPUTS.md`).

Todos os inputs deverão:

- usar o estilo canônico: `min-h-12 w-full rounded-xl border border-border-strong bg-surface px-3.5` (raiz `rounded-xl` — identidade Nexus, PLAN-038);
- possuir altura confortável para toque (mín. 44px);
- utilizar fonte mínima de 16px (`text-base`);
- apresentar feedback visual ao receber foco com `focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary` (token, nunca cor fixa);
- exibir mensagens claras de erro (`text-danger-text`);
- labels não devem conter dois-pontos (`:`) no final do texto.

---

## Cards

Os cards representam a principal unidade visual do sistema.

Todo card deverá possuir:

- hierarquia clara;
- espaçamento interno consistente;
- ações agrupadas;
- leitura rápida.

### Cards em Listas

Cards clicáveis em listas (ex: lista de clientes, lista de contratos) devem:

- usar `hover:border-blue-300` como feedback de hover;
- evitar sombras (`shadow-sm`/`hover:shadow-md`) — preferir bordas leves conforme §162;
- manter padding consistente de `p-4` (16px).

> **Nota:** Componentes de domínio (ex: `ClienteCard`) podem compor `Card.Root` internamente
> para apresentar dados da entidade, mas nunca substituir as responsabilidades estruturais do Card.

---

## Badges

Badges deverão comunicar apenas estado.

Nunca substituir informações importantes.

---

## FAB

O botão flutuante deverá representar apenas a principal ação da tela.

Cada tela poderá possuir apenas um FAB.

---

## Modais

Modais deverão ser utilizados apenas quando evitarem mudança de contexto.

Sempre que possível:

- foco imediato;
- poucos campos;
- confirmação rápida.

---

# Estados da Interface

Todos os componentes deverão possuir comportamento consistente para:

- Normal
- Hover (quando aplicável)
- Focus
- Disabled
- Loading
- Error

---

# Feedback

Toda ação do operador deverá gerar resposta visual.

Exemplos:

- loading;
- sucesso;
- erro;
- confirmação;
- atualização de dados.

Nenhuma ação importante deverá ocorrer silenciosamente.

---

# Responsividade

O sistema será desenvolvido priorizando dispositivos móveis.

Diretrizes:

- mobile-first;
- área mínima confortável para toque;
- componentes adaptáveis;
- rolagem vertical preferencial;
- evitar rolagem horizontal.

---

# Acessibilidade

O sistema deverá respeitar:

- contraste adequado;
- tamanho mínimo de fonte;
- foco visível;
- linguagem simples;
- componentes fáceis de tocar.

---

# Busca

Inputs de busca textual devem seguir o padrão:

```tsx
<div className="relative">
  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
  <input
    type="text"
    placeholder="Buscar..."
    className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
```

Características:

- ícone `Search` do Lucide à esquerda, dentro de um container `relative`;
- input com `pl-10` para espaço do ícone;
- ícone com `pointer-events-none` para não interferir no foco.

---

# Consistência

Um componente criado para determinado comportamento deverá ser reutilizado em toda a aplicação.

Novos padrões visuais somente poderão ser adicionados quando realmente necessários.

Duplicação de componentes deverá ser evitada.

---

# Evolução

Toda alteração visual deverá preservar:

- identidade do sistema;
- consistência entre módulos;
- simplicidade de uso;
- legibilidade.

Mudanças que aumentem complexidade visual deverão ser evitadas.

---

# Referências

- NORTH-STAR.md
- PROJECT.md
- UX.md
- FRONTEND.md

---

# Gradientes (exceção deliberada — PLAN-031)

> **Regra de ouro:** as cores seguem apenas a paleta semântica (tokens), sem `emerald/purple/amber`.
>
> **Exceção deliberada:** os **accent gradients** (`.bg-gradient-accent`, `.bg-gradient-page`, `.text-gradient`) são a única exceção — cada tema define os gradientes próprios (`--gradient-*`). Aplicar com moderação: fundo ambiente, botão primário ("brand") e destaques — nunca "glitter" por tudo.

---

# Cores fixas da paleta são proibidas (PLAN-035)

> **Regra:** nenhuma classe Tailwind da paleta fixa (`bg-*/text-*/border-*/ring-*/focus:ring-*/focus:border-*` com `blue/red/green/yellow/gray/indigo/...`) pode existir em `frontend/src`. Tudo passa pelos tokens do tema:
>
> | Uso | Token |
> |-----|-------|
> | Brand (foco, links, hover de card, dots, spinner, toast de loading/info, sidebar ativo) | `primary` |
> | Erro/validação/asterisco obrigatório | `danger` / `danger-text` |
> | Sucesso / valores positivos | `success` / `success-text` |
> | Alerta / avisos | `warning` / `warning-text` |
> | Neutro / dot gray | `text-muted` / `surface-secondary` |
>
> - `primary` e gradientes **variam** por paleta; as cores semânticas (`danger`/`success`/`warning`) são **fixas** entre paletas.
> - Foco de input usa `focus:ring-primary` / `focus:border-primary` (não azul fixo).
> - O invariante é checado por `npm run audit:styles` (falha se surgir cor fixa) — rodar após qualquer mudança visual.

---

# Header de página (PLAN-038)

Duas formas de header, por tipo de tela:

| Tipo de tela | Padrão |
|--------------|--------|
| **Landing de módulo** (Central, Clientes, Contratos, Caixa, Gastos, Cobranças, Rota, Atendidos, Administração, Empresas) | `PageHeader` — **título limpo em Sora** + ícone em **badge suave** (`bg-primary-light text-primary-text`) + subtítulo + `eyebrow` opcional + ação/voltar. **Sem banner de gradiente.** |
| **Novo/editar/detalhe/settings** (ClienteNovo, ContratoEdit, OperadorDetail, Perfil, Login) | Header compacto — `< Back Título [Ação]` (`max-w-2xl`). |

> O `PageHeader` foi redesenhado no PLAN-038 (removido o banner `bg-gradient-accent` do PLAN-035). Ação no header usa `Button`/`ButtonLink` padrão (sem `variant="onDark"` — variante removida).

---

# Componente compartilhado mudou? (protocolo PLAN-044)

Mudou um componente compartilhado (`PageHeader`, `Card`, `KpiCard`, `Field`, `Modal`, `QuickActions`, `Button`, `StatusBadge`, `SearchBar`, `BottomTabBar`, `UserMenu`, ...)?

1. Liste os consumidores: `node scripts/consumers.mjs <componente>`.
2. Atualize **todos** os consumidores **no mesmo PR** (não deixar "adicionados depois" quebrados — precedente do badge GPS da Rota).
3. Rode `npm run audit:ui` + `npm run audit:styles` + `npm run docs:audit`.

---

# Redesign / novo módulo — critérios de conclusão (PLAN-044)

Todo plano de UI, redesign ou **novo módulo do whitelabel** deve fechar com:

- [ ] Usa **apenas** componentes compartilhados (catálogo `04-UI-COMPONENTS.md` / `UI-COVERAGE.md`)
- [ ] `npm run audit:ui` limpo (sem padrão legado) — **gate do deploy**
- [ ] `npm run audit:styles` limpo (sem cor fixa da paleta)
- [ ] `npm run audit:modules` limpo (Module Manifest coerente — PLAN-045)
- [ ] `UI-COVERAGE.md` atualizado (telas/componentes/legado)
- [ ] `npm run docs:audit` limpo (mapeamento/rotas coerentes)

---

# Central composável (PLAN-045)

O dashboard (Central) **compõe widgets dos módulos ativos** a partir do `MODULE_WIDGETS` (`frontend/src/shared/modules/modules.ts`) — cada widget tem **UM módulo dono**. Não adicionar KPI/ação "solto" na Central: registrar o widget no manifest do módulo dono e gatear com `isWidgetActive(modulos, "<widget>")`. Novo módulo → widget entra automaticamente na Central.
