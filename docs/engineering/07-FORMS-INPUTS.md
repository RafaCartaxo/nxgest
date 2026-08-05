# FORMS & INPUTS — Mapa de padronização (identidade "Nexus")

**Status:** Concluído (PLAN-039 FOCO + PLAN-043 FU restantes)

**Última atualização:** 05/08/2026

> **Todos os formulários migrados para o padrão canônico** (`Field` ou inputs `rounded-xl border-strong`): cliente/contrato (PLAN-039), admin (PLAN-040), e os follow-ups do PLAN-043 (Gasto, Perfil, Caixa, OperadorDetail, ContratoDetail, Rota, Pagamento, Login, ContratoList, SearchBar).

---

## Objetivo

Mapear **todos** os formulários e controles de entrada do frontend para padronizá-los com a identidade visual "Nexus" (PLAN-038) e a especificação canônica de input (DS v2 — seção Inputs).

## Padrão canônico de input (`Field`)

Componente compartilhado: `frontend/src/shared/components/Field/Field.tsx`

- **label:** `mb-1.5 block text-sm font-medium text-text-secondary` (sem `:` no final);
- **input:** `min-h-12 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary`;
- **erro:** `mt-1 block text-xs text-danger-text`.

> **Raio:** inputs em `rounded-xl` (16px), alinhando com cards/modais (PLAN-038). Inputs nunca abaixo de 16px (`text-base`).
> **Seletores/date:** mesmos tokens (`min-h-12 rounded-xl border-border-strong`).

## Mapa de formulários / controles — estado atual

| Módulo | Arquivo | Controles | Estado |
|---|---|---|---|
| Cliente | `cliente/pages/ClienteNovo.tsx` | nome, telefones, cpf, comércio, endereços, GPS | ✅ `PageHeader` + `Field` (PLAN-039) |
| Cliente | `cliente/pages/ClienteEdit.tsx` | idem cadastro | ✅ `PageHeader` + `Field` (PLAN-039) |
| Contrato | `contrato/pages/ContratoNovo.tsx` | select cliente custom + valor/juros/parcelas/data (date) | ✅ `PageHeader` + `Field` + select `rounded-xl` (PLAN-039) |
| Contrato | `contrato/pages/ContratoEdit.tsx` | idem | ✅ `PageHeader` + `Field` (PLAN-039) |
| Admin | `admin/components/OperadorForm.tsx` | nome, email, senha, role, chefe | ✅ `Field` + selects canônicos (PLAN-040) |
| Admin | `admin/components/EmpresaForm.tsx` | nome + admin (nome/email/senha) | ✅ `Field` (PLAN-040) |
| Gasto | `gasto/components/GastoForm.tsx` | valor, categoria (select), data (date), observação | ✅ `Field` + select canônico (PLAN-043) |
| Auth | `auth/pages/PerfilPage.tsx` | senha atual, nova, confirma | ✅ `Field` + `Card` (PLAN-043) |
| Auth | `auth/pages/LoginPage.tsx` | email, senha (+ mostrar/ocultar) | ✅ `Field` (PLAN-043) |
| Caixa | `caixa/pages/CaixaPage.tsx` | ajuste valor + motivo | ✅ inputs canônicos `rounded-xl` + `Button` (PLAN-043) |
| Admin | `admin/pages/OperadorDetail.tsx` | ajuste caixa: valor + motivo | ✅ inputs canônicos + `Button` (PLAN-043) |
| Operações | `operacoes/pages/RotaPage.tsx` | promessa — date | ✅ input canônico (PLAN-043) |
| Pagamento | `pagamento/components/PagamentoModal.tsx` | valor | ✅ input canônico (PLAN-043) |
| Contrato | `contrato/pages/ContratoDetail.tsx` | motivo estorno | ✅ input canônico (PLAN-043) |
| Contrato | `contrato/pages/ContratoList.tsx` | filtro cliente (dropdown custom) | ✅ `rounded-xl` (PLAN-043) |
| Shared | `shared/components/SearchBar/SearchBar.tsx` | busca | ✅ `rounded-xl border-strong` (PLAN-043) |

## Referências

- `engineering/design/02-DESIGN-SYSTEM.md` — seção Inputs (DS v2)
- `plans/PLAN-039-padronizacao-forms-inputs.md` · `plans/PLAN-043-...` (polimento)
- PLAN-038 (identidade "Nexus") — base visual
