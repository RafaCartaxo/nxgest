# PLAN-056 — Port do material Lovable: botões + GpsControl + ClienteForm em Cards + vocabulário + Preferências

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** identidade visual "Nexus" — aplicação do material Lovable (briefing `Lovable-Cadastro-Rota-NXGestao.md`)

---

## Objetivo

Portar para o app os entregáveis prontos do Lovable (`site-personality-plus`): variantes de `Button`, o `GpsControl` (3 estados), o `ClienteForm` em Cards, o `ClienteSelect` e as **Preferências em modal** (substituindo os dropdowns da Topbar). Aplicar o **vocabulário único de botões** nas telas.

## Verificação do material Lovable (06/08)

| Entregável | Status no repo |
|---|---|
| `kit.tsx` — variantes `success/soft/outline` + sizes | ✅ |
| `gps.tsx` — `GpsControl` (3 estados, acessível, controlled) | ✅ |
| `geo.ts` — adaptador (simulado) · `preferencias.tsx` (tema/idioma) | ✅ |
| `ClienteForm.tsx` — 4 Cards + fix da invalidação · `ClienteSelect.tsx` | ✅ |
| `ContratoForm` · `/rota` · wiring das telas (`central`/`clientes`) | ❌ **pendente** — solicitar ao Lovable |

## Escopo (fases)

| Fase | Entrega |
|---|---|
| **F1** | `Button.tsx`: variantes `soft`/`outline`/`success` + `size` (`sm/md/lg/block`), base `rounded-xl min-h-11`; "Registrar pagamento" → `variant="success"` (fim da classe crua). `GpsControl` (port, tokens do app, i18n `gps.*`) substitui o `CapturaLocalizacao`; `formatarCoords` no módulo geo |
| **F2** | `ClienteForm` em **4 Cards** (Identificação · Comércio · Localização do comércio · Endereço residencial), UF como `FieldSelect` (`UFS`), `GpsControl` ligado ao `useGeolocation` (estado capturada/invalidada/vazio). Lógica do fix preservada |
| **F3** | Vocabulário de botões: setas "→" removidas dos labels (i18n), "Ver na rota" → `Button ghost sm` + `ChevronRight`, ClienteDetail `<Link>` cru → `ButtonLink` |
| **F4** | `ClienteSelect` (port prop-driven) — pronto para o `ContratoForm` |
| **F5** | **Preferências em modal**: `ThemeProvider` ganha `mode` (`light/dark/system`, persistido, isDark derivado, compat chaves antigas); `PreferenciasModal` (Modo Tabs · Cores swatches · Idioma); Topbar → engrenagem abre o modal (remove os 3 dropdowns) |

## Validação
- `npm run build` · `audit:ui` · `audit:styles` · vitest 18 · `docs:audit` ✅ (a cada fase)
- smoke: API inalterada (frontend-only)

## Referências
- Briefing: `Lovable-Cadastro-Rota-NXGestao.md` · Material: `site-personality-plus/src/components/nx/{kit,gps,ClienteForm,ClienteSelect,preferencias}.tsx`
- `Button.tsx` · `shared/geo/GpsControl.tsx` · `ClienteForm.tsx` · `ClienteSelect.tsx` · `ThemeProvider.tsx` · `PreferenciasModal.tsx` · `Topbar.tsx`
