# Tokens implementados

Reconciliado em21/11/2026 com o código. Fontes canônicas: [index.css](../../../frontend/src/index.css), [Tailwind](../../../frontend/tailwind.config.js), [paletas](../../../frontend/src/shared/theme/themes.ts) e [ThemeProvider](../../../frontend/src/shared/theme/ThemeProvider.tsx). Este documento localiza os contratos; o valor efetivo depende de paleta, modo e eventual variável de tenant. A tabela antiga de cores hex fixas e o ID `aurora` não representavam a implementação atual.

## Tipografia e escalas

| Contrato / utilitário real | Configuração | Evidência / limite |
|---|---|---|
| `--font-sans`, font-sans | Inter com fallbacks de sistema | index.css e theme.extend.fontFamily.sans |
| `--font-display`, font-display | Sora com fallback Inter/sistema | index.css e theme.extend.fontFamily.display |
| text-3xl | 1.875rem (30px com base16px) | Escala padrão Tailwind; não significa que todo título use esse tamanho |
| text-xl | 1.25rem (20px com base16px) | Títulos22px usam classe arbitrária text-[22px], como páginas públicas |
| text-lg / text-2xl | 1.125rem / 1.5rem | Tailwind; tamanhos efetivos por componente no [catálogo](04-UI-COMPONENTS.md) |
| text-base / text-sm / text-xs | 1rem / 0.875rem / 0.75rem | Rem acompanha a base e preferências; não atesta contraste ou zoom |
| font-normal / medium / semibold / bold | 400 / 500 / 600 / 700 | Utilitários Tailwind; composição depende do elemento |
| p-1 / p-2 / p-3 / p-4 | 0.25rem / 0.5rem / 0.75rem / 1rem | Escala de espaçamento; não existem variáveis CSS spacing-xxs etc. no contrato atual |
| p-6 / p-8 / p-10 / p-12 | 1.5rem / 2rem / 2.5rem / 3rem | Tailwind padrão |
| rounded-sm / rounded-md / rounded-lg / rounded-xl | 0.125rem / 12px / 0.5rem / 0.75rem | Somente md é sobrescrito no Tailwind; não usar o antigo lg=16px como verdade |
| `--radius` | 0.75rem | Variável em index.css; utilitário só a usa quando explicitamente ligado a ela |
| shadow-sm / shadow-lg | Escalas padrão Tailwind | Não há token CSS chamado shadow-card; conferir uso concreto |

As classes arbitrárias, clamp(), variantes e receitas por componente estão no [inventário](UI-INVENTORY.md). Não criar nomes de tokens que não existam no código.

## Cores e aliases semânticos

| Uso | Alias do Tailwind/CSS | Fonte efetiva |
|---|---|---|
| Primária | `--color-primary` → `--primary` | base usa `--brand-1`; dark/tema alteram os valores |
| Hover primário | `--color-primary-hover` → `--primary-hover` | base usa `--brand-2`; fórmulas próprias no modo dark |
| Fundo primário suave | `--color-primary-light` → `--primary-soft` | color-mix no espaço oklab |
| Texto primário da paleta | `--color-primary-text` → `--primary-text` | fórmula dependente da marca e modo |
| Superfície | `--color-surface` → `--surface` | OKLCH, sobrescrito no dark |
| Superfície secundária | `--color-surface-secondary` → `--muted` | Alias real; não fixar um gray-50 na documentação |
| Texto principal | `--color-text-primary` → `--foreground` | Base/dark em index.css |
| Borda | `--color-border` → `--border` | Base/dark em index.css |
| Success/danger/warning/info | Família `--color-*` ligada às variáveis semânticas | Valores e variantes reais extraídos no JSON, inclusive overrides de tema/mode |
| Focus/ring | ring e cores semânticas do Tailwind | Usar o contrato do componente; audit:styles recusa cores fixas da paleta |

Cores efetivas não são equivalentes constantes hex em todos os temas. Valores, seletores e declarações completas: recurso `frontend/src/index.css` em [ui-inventory.json](ui-inventory.json).

## Paletas, modo e gradientes

| Contrato | Configuração verificável |
|---|---|
| IDs atuais de paleta | default, violeta, ocean, grape, sunset — THEMES em themes.ts e seletores data-theme em index.css |
| Modo | light, dark ou system; ThemeProvider acompanha prefers-color-scheme e aplica classe dark |
| Persistência | nxgest_palette e nxgest_mode no localStorage; não é configuração do banco |
| Override de tenant | `--tenant-primary` é seam CSS opcional no tema default; sua existência não prova provisionamento por empresa |
| Fundo da página | `--gradient-page`, classe bg-gradient-page |
| Marca/acento | `--gradient-brand` / `--gradient-accent`, classes bg-gradient-brand / bg-gradient-accent |
| Mesh / texto | `--gradient-mesh` / `--gradient-text`, classes bg-mesh / text-gradient; text-brand-gradient também está no CSS |

## Responsividade e revisão

[UI-STATES](UI-STATES.md) resolve a configuração Tailwind e registra prefixos/evidências por rota: sm640px, md768px, lg1024px, xl1280px e2xl1536px. [AppLayout](../../../frontend/src/shared/layout/AppLayout.tsx) muda de topo/tab bar para sidebar em lg; [Modal](../../../frontend/src/shared/components/Modal/Modal.tsx) muda em sm. A ausência de prefixo numa página pode significar layout fluido; não certifica responsividade.

Revisão para repaginação:375/768/1280px, lados de cada breakpoint usado, zoom200%, teclado, safe-area, cinco paletas e claro/escuro. Aparência efetiva exige render; esta reconciliação documental não marca esses ensaios como executados.
