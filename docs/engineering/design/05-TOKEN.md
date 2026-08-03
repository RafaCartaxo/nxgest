# TOKENS

**Status:** Aprovado

**Versão:** 1.2

**Última atualização:** 11/07/2026

---

# Objetivo

Definir os Design Tokens oficiais do projeto conforme implementado no código.

# Tipografia

| Token | Valor | Tailwind |
|-------|-------|----------|
| `font-family-base` | `Inter` | `font-sans` |
| `font-size-page-title` | `28px` | `text-3xl` |
| `font-size-section-title` | `22px` | `text-xl` |
| `font-size-card-title` | `18px` | `text-lg` |
| `font-size-financial-value` | `24px` | `text-2xl` |
| `font-size-body` | `16px` | `text-base` |
| `font-size-input` | `16px` | `text-base` |
| `font-size-button` | `16px` | `text-base` |
| `font-size-auxiliary` | `14px` | `text-sm` |
| `font-size-caption` | `12px` | `text-xs` |
| `font-size-badge` | `12px` | `text-xs` |
| `font-weight-regular` | `400` | `font-normal` |
| `font-weight-medium` | `500` | `font-medium` |
| `font-weight-semibold` | `600` | `font-semibold` |
| `font-weight-bold` | `700` | `font-bold` |

# Espaçamento

| Token | Valor | Tailwind |
|-------|-------|----------|
| `spacing-xxs` | `4px` | `p-1` |
| `spacing-xs` | `8px` | `p-2` |
| `spacing-sm` | `12px` | `p-3` |
| `spacing-md` | `16px` | `p-4` |
| `spacing-lg` | `24px` | `p-6` |
| `spacing-xl` | `32px` | `p-8` |
| `spacing-xxl` | `40px` | `p-10` |
| `spacing-xxxl` | `48px` | `p-12` |

# Border Radius

| Token | Valor | Tailwind |
|-------|-------|----------|
| `radius-sm` | `4px` | `rounded-sm` |
| `radius-md` | `12px` | `rounded-md` |
| `radius-lg` | `16px` | `rounded-lg` |
| `radius-full` | `9999px` | `rounded-full` |

# Cores

## Cores Semânticas (Estados)

| Token | Valor | Tailwind |
|-------|-------|----------|
| `color-primary` | `#2563EB` | `blue-600` |
| `color-primary-hover` | `#1D4ED8` | `blue-700` |
| `color-primary-light` | `#DBEAFE` | `blue-100` |
| `color-primary-text` | `#1E40AF` | `blue-800` |
| `color-success` | `#16A34A` | `green-600` |
| `color-success-hover` | `#15803D` | `green-700` |
| `color-success-light` | `#DCFCE7` | `green-100` |
| `color-success-text` | `#166534` | `green-800` |
| `color-success-border` | `#BBF7D0` | `green-200` |
| `color-warning` | `#CA8A04` | `yellow-600` |
| `color-warning-light` | `#FEF9C3` | `yellow-100` |
| `color-warning-text` | `#854D0E` | `yellow-800` |
| `color-danger` | `#DC2626` | `red-600` |
| `color-danger-hover` | `#B91C1C` | `red-700` |
| `color-danger-light` | `#FEE2E2` | `red-100` |
| `color-danger-text` | `#991B1B` | `red-800` |
| `color-info` | `#2563EB` | `blue-600` |
| `color-info-light` | `#DBEAFE` | `blue-100` |
| `color-info-text` | `#1E40AF` | `blue-800` |
| `color-secondary` | `#6B7280` | `gray-500` |
| `color-secondary-light` | `#F9FAFB` | `gray-50` |

## Cores Estruturais (Superfície / Texto / Borda)

| Token | Valor | Tailwind |
|-------|-------|----------|
| `color-surface` | `#FFFFFF` | `bg-surface` |
| `color-surface-secondary` | `#F9FAFB` | `bg-surface-secondary` |
| `color-surface-hover` | `#F3F4F6` | `bg-surface-hover` |
| `color-text-primary` | `#1F2937` | `text-text-primary` |
| `color-text-secondary` | `#6B7280` | `text-text-secondary` |
| `color-text-muted` | `#9CA3AF` | `text-text-muted` |
| `color-border` | `#D1D5DB` | `border-border` |
| `color-border-light` | `#E5E7EB` | `border-border-light` |

## Dark Mode (`.dark`)

Todas as cores são definidas como CSS custom properties no `index.css`, com
sobrescrita no bloco `.dark { }`. O toggle é feito via classe `dark` no `<html>`,
gerenciada pelo `ThemeProvider` (`shared/theme/`).

# Sombras

| Token | Valor | Tailwind |
|-------|-------|----------|
| `shadow-card` | `0 1px 3px 0 rgb(0 0 0 / 0.1)` | `shadow-sm` |
| `shadow-dropdown` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | `shadow-lg` |

---

# Temas e Gradientes (PLAN-031)

O tema é **100% dirigido por CSS variables** (`--color-*`, mapeadas no Tailwind). Cada tema é um bloco `[data-theme="<id>"]` (light) + `[data-theme="<id>"].dark` no `index.css`.

| Token | Uso | Tailwind |
|-------|-----|----------|
| `--gradient-page` | Fundo ambiente da página (body) | `.bg-gradient-page` |
| `--gradient-accent` | Acentos (botão primário "brand", navbar ativo) | `.bg-gradient-accent` |
| `--gradient-text` | Texto em gradiente (títulos) | `.text-gradient` |

## Paletas (temas)

| Tema | Primary | Gradiente |
|------|---------|-----------|
| `default` | azul `#2563EB` | azul → violeta |
| `aurora` | violeta `#7C3AED` | índigo → violeta → rosa |
| `ocean` | teal `#0D9488` | azul → teal |
| `grape` | violeta `#6D28D9` | violeta → fúcsia |
| `sunset` | laranja `#EA580C` | laranja → rosa |

> **Seam de whitelabel:** o tema vem da preferência do usuário (localStorage). No futuro, `empresa.tema` aplica a paleta do cliente a todos os usuários do tenant (Fase 5.10).
