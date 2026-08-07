# PLAN-059 — Modularização fina: capacidades (BR-104) + guard de desativação (BR-105) + arquitetura

**Status:** Concluído

**Versão:** 1.0

**Início:** 06/08/2026

**Última atualização:** 06/08/2026

**Roadmap:** whitelabel granular (F4) — recursos finos por empresa + proteção de dados ao desativar módulos

---

## Objetivo

Evoluir o whitelabel do **nível de módulo** para **nível de recurso (capacidade)** e **proteger os dados** quando um módulo é desativado:

1. **Capacidades (BR-104):** ativar/desativar recursos individuais de um módulo por empresa (WhatsApp, Ligar, Navegar, Anexos, Comprovante via WhatsApp) — granularidade abaixo do módulo, com dono (módulo que precisa estar ativo).
2. **Guard de desativação (BR-105):** desligar módulo com dado financeiro em aberto passa a **bloquear** (409) em vez de "nada ocorrer" — caixa nunca é forcável; super admin pode forçar os demais com motivo (auditado).
3. **Arquitetura:** presentation deixa de tocar `infrastructure` (00-ARCHITECTURE.md) — orquestração em use-cases com ports.

## Decisões confirmadas

- **Capacidade = recurso fino de UM módulo dono** (`moduleOwner`). `null` = todas ativas; `[]` = nenhuma; dono off ⇒ capacidade inativa (persiste e volta ao reativar o módulo).
- **Só super admin** controla capacidades (mesma regra de módulos — BR-092).
- **Guard:** `contratos` (parcelas em aberto), `cobrancas` (pendências) e `caixa` (`caixa_base != 0`) **bloqueiam** (409). `caixa` **nunca** é forcável. `clientes`/`rota`/`atendidos`/`gastos` só confirmam (200 ecoando impacto).
- **`force: true` + motivo obrigatório (≤200)** sobrepõe o bloqueio dos financeiros exceto caixa; registrado em `auditoria_modulos`.
- **Enforcement de API** apenas onde há endpoint (`cliente:anexos` → 403 `CAPABILITY_DISABLED`). WhatsApp/Ligar/Navegar são aberturas de URL — gating só de UI.

## Escopo

| # | Entrega |
|---|---------|
| A | `CAPABILITY_MANIFEST` (8 capacidades) + coluna `empresas.capacidades` + `PATCH /capacidades` + `login`/`me` com `capacidades` + `requireCapability` (anexos) + gating frontend (`hasCapability`, `CapacidadesModal`) |
| B | Guard: `calcularImpactoDesativacao` (cascata + contagens), `PATCH /modulos` 409/force, `GET /impacto` (prévia), `auditoria_modulos` + `ImpactConfirmModal` |
| C | Arquitetura: `impacto.ts`/`errors` no domain · ports `IImpactoDesativacaoQuery`/`IAuditoriaModulosWriter` · use-cases `AtualizarModulos`/`AtualizarCapacidades`/`CalcularImpacto` · impls em infra (classes) · controller só mapeia erros |
| D | Smoke **156 → 184** (CAP-100..110, MOD-G-S/S2 + MOD-G-1..13, IMP-001/002) · vitest `hasCapability` (22 → 29) · `migracao:test` (ALTER em banco legado) |
| E | Docs: BR-104/105, 08-UC-MODULOS, 02-API, 07, collection, UI-COVERAGE, 01-DATABASE, `audit:modules` valida capacidades |

## Arquitetura (pós-refactor)

```
presentation (controller) — só mapeia erro → HTTP, zero infra
  └─ application/use-cases:
       AtualizarModulosUseCase (valida grafo → impacto → guard → motivo → persiste → auditoria)
       AtualizarCapacidadesUseCase
       CalcularImpactoUseCase
         ├─ application/ports: IEmpresaRepository · IImpactoDesativacaoQuery · IAuditoriaModulosWriter
  └─ domain: modules.ts · capacidades.ts · impacto.ts · errors/modulos.error.ts
  └─ infrastructure: empresa.repository.impl · impacto-desativacao.query.impl · auditoria-modulos.repository.impl
```

## Validação

- `npm run build` ✅ · `audit:ui` ✅ · `audit:styles` ✅ · `audit:modules` ✅ (capacidades espelhadas) · `docs:audit` ✅ (0 divergências) · `vitest` 29 ✅ · `smoke:api` **184/184** ✅ · `migracao:test` ✅

## Referências

- `src/modules/admin/domain/{modules,capacidades,impacto}.ts` · `domain/errors/modulos.error.ts`
- `application/ports/{impacto-desativacao,auditoria-modulos}.port.ts` · `application/use-cases/Atualizar*`, `CalcularImpacto`
- `infrastructure/queries/impacto-desativacao.query.impl.ts` · `infrastructure/repositories/auditoria-modulos.repository.impl.ts`
- `frontend/src/shared/modules/capacidades.ts` · `modales CapacidadesModal`/`ImpactConfirmModal` · `scripts/smoke-api.mjs` · `scripts/test-migracao.mjs`
- Base: PLAN-031/036/037/045/046 (whitelabel) · `08-UC-MODULOS.md` · `00-ARCHITECTURE.md`

## Dívida técnica / próximos passos

- **F4 multi-negócio:** capacidades já são desenhadas independentes de `tipo_negocio` — um negócio novo (agenda/vendas) declara capacidades próprias e reusa `whatsapp`/`ligar`/`navegar`. Quando entrar o `tipo_negocio`, revisar se `moduleOwner` precisa generalizar para "aplica-se a módulos".
- **Concorrência no guard:** impacto calculado e depois persistido (TOCTOU). SQLite serializa escritas; ok para ferramenta de admin — se escalar, envolver em transação.
- **`cliente:anexos`** é o único com enforcement de API hoje; se surgirem endpoints novos por capacidade, aplicar `requireCapability` no mount.
