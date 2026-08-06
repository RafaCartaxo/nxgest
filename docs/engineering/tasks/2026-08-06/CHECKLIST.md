# CHECKLIST — Card de cobrança: iterações de refinamento (PLAN-047 consolidado — antigos 050–054)

**Data:** 06/08/2026

> Itens originais de PLAN-050..054, consolidados sob o PLAN-047 (identidade visual "Nexus").

## 050 — Fix parcela + altura uniforme
- [x] Bug "Parcela 30 de 20": `CobrancaCard` usa `proximoNumeroParcela` (número real) — antes usava `proximaParcela` (saldo em R$)
- [x] Altura uniforme: subtítulo `truncate` · status `min-h-6` + `truncate` · valor `whitespace-nowrap` → 3 linhas fixas
- [x] Hierarquia de informação: primário (nome+valor) · secundário (bairro · parcela) · terciário (badge + dias)
- [x] Reflete nos 3 consumidores: fila `/cobrancas` + `/atendidos` · Central (carousel) · Rota

## 051 — Bairro/parcela em linhas próprias + dias sem truncar
- [x] 4 linhas fixas: Nome · Bairro · Parcela · StatusBadge
- [x] "N dias de atraso" na coluna direita sob o valor (text-xs danger) — nunca trunca
- [x] Uniformidade: coluna esquerda (4 linhas) sempre mais alta → mesma altura atrasado/vence hoje
- [x] Refino: dias alinhado na MESMA linha do badge (coluna direita `self-stretch` + `mt-auto`) — borda direita alinhada com o valor acima

## 052 — Alinhamento fino do "dias de atraso"
- [x] "dias de atraso" na linha do badge (coluna esquerda), `items-center` → centralizado com o badge
- [x] Saiu da coluna direita (sem `self-stretch`/`mt-auto`) → não passa mais o ">" do valor
- [x] `min-w-0 truncate` no texto (trunca só no carousel estreito)

## 053 — Linhas full-width
- [x] Causa raiz: coluna do valor `shrink-0` encolhia todas as linhas (dias sumia no carousel ~90px)
- [x] Só a linha 1 é 2 colunas (nome + valor); linhas 2–4 full-width
- [x] Bairro/parcela/"dias de atraso" passam a usar os 252px do card → não trunca no carousel/mobile

## 054 — "dias de atraso" alinhado ao fim do valor
- [x] Linha do badge com `justify-between` → dias vai para o final do card
- [x] `pr-5` condicional (quando há ">"): 20px = chevron 16px + gap 4px → dias termina no FIM DO VALOR (antes do ">")
- [x] Rota (sem ">"): sem padding → alinhado com o valor (à direita)

## Validação
- [x] `npm run build` · `audit:ui` · `audit:styles` · `docs:audit` (a cada iteração)
- [x] Mantidos ao final: altura uniforme · centralizado com o badge · sem truncar · valor à direita

---

# CHECKLIST — Briefing Lovable: Cadastro + Rota + Botões (para IA)

**Data:** 06/08/2026

- [x] `docs/plans/Lovable-Cadastro-Rota-NXGestao.md` — briefing consolidado (4 entregáveis): botões (`Button` variantes + vocabulário único) · form de cliente (seções em Card + controle GPS 3 estados, comércio E residencial) · form de contrato (seletor buscável + condições + resumo + edit bloqueado) · rota (StatusBadge GPS, card de ações coerente, RouteProgress em Card, Modal p/ comprovante/promessa)
- [x] Regra de ouro: descreve **como deve ficar** (estado-alvo), não o estado atual
- [x] Seção "não esquecer" com 14 detalhes críticos (GPS 2 endereços, variante success, sem "→", tokens, i18n, mobile-first, etc.)

---

# CHECKLIST — Review PLAN-055: fix deps + limpeza + coerência "Não capturada"

**Data:** 06/08/2026

- [x] Bug: `ClienteEdit` useEffect deps voltaram a `[id]` (feedback sem useMemo → loop de refetch no erro)
- [x] Limpeza: shim morto `shared/utils/maps.ts` removido · chave i18n órfã `cliente.usarLocalAtual` removida (3 locales)
- [x] Coerência UX: estado "Localização descartada" (aviso + botão Capturar) ao editar texto pós-captura (comércio + principal)
- [x] `tsc` · `audit:ui/styles` · vitest 18 · `docs:audit` · `build`

---

# CHECKLIST — Port do material Lovable (PLAN-056)

**Data:** 06/08/2026

- [x] F1: `Button` variantes soft/outline/success + size (base rounded-xl min-h-11) · "Registrar pagamento" → success · `GpsControl` (port) + `formatarCoords` + i18n gps.*
- [x] F2: `ClienteForm` em 4 Cards + UF FieldSelect (UFS) + GpsControl (fix preservado)
- [x] F3: vocabulário — sem "→" (i18n), "Ver rota" ghost sm + ChevronRight, ClienteDetail ButtonLink
- [x] F4: `ClienteSelect` (port prop-driven)
- [x] F5: `ThemeProvider` mode light/dark/system + `PreferenciasModal` + Topbar engrenagem→modal
- [x] Docs: PLAN-056 · plans README · UI-COVERAGE · 04-UI-COMPONENTS · UPDATES
- [x] Gates: build · audit:ui/styles · vitest 18 · docs:audit

## Pendência registrada (Lovable)
- [x] `ContratoForm` · `/rota` · wiring das telas (`central`/`clientes`) — **implementado no app (WS6)**: ContratoForm compartilhado (ClienteSelect wireado, Cards Condições/Resumo, edit bloqueado) + Rota no padrão (StatusBadge GPS, sem X, Modal comprovante, Field promessa, RouteProgress em Card, EstadoTela). Wiring da Central já coberto pelo PLAN-056.

---

# CHECKLIST — Alinhamento completo dos botões (padrão Lovable + tema)

**Data:** 06/08/2026

- [x] ClienteDetail "Ver contratos"/"Novo contrato" → `soft sm` + ícones (ChevronRight/Plus), iguais ao "Anexar"
- [x] `primary` plano (`bg-primary text-primary-foreground`) — texto segue o tema (sem `text-white`); `.dark --gradient-brand` claro (logo legível)
- [x] Tokens `--success-foreground`/`--danger-foreground` + `text-*-foreground` no `success`/`danger` (dark com contraste)
- [x] Cancelar → `ghost` (todos forms/modais) · paginação/WhatsApp mantidos `secondary`
- [x] CTAs de header → `primary sm` + ícone (Plus/Pencil/Wallet/Building2) · Salvar/Registrar → `Check`
- [x] "Meus dados" → `soft` + User · "Ajustar" → `soft sm` + Check
- [x] 5 micro-usos: Criar empresa/Salvar módulos/Confirmar pagamento + Check · Registrar gasto + Receipt · Ver cliente → soft
- [x] Vocabulário documentado em `04-UI-COMPONENTS.md`
- [x] tsc · audit:ui/styles · build
