# FORMS & INPUTS — Mapa de padronização (identidade "Nexus")

**Status:** FOCO concluído · FU mapeado (PLAN-039)

**Última atualização:** 04/08/2026

> **FOCO concluído:** `Field` criado, token `border-strong` adicionado, 4 forms de cliente/contrato migrados (PageHeader + Field) e `ClienteCard` com avatar/iniciais. Os itens **FU** seguem pendentes (mapeados abaixo).

---

---

## Objetivo

Mapear **todos** os formulários e controles de entrada do frontend para padronizá-los com a identidade visual "Nexus" (PLAN-038) e a especificação canônica de input (DS v2 — seção Inputs).

## Padrão canônico de input (`Field`)

Componente compartilhado: `frontend/src/shared/components/Field/Field.tsx`

- **label:** `mb-1.5 block text-sm font-medium text-text-secondary` (sem `:` no final);
- **input:** `min-h-12 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary`;
- **erro:** `mt-1 block text-xs text-danger-text`.

> **Raio:** inputs passam de `rounded-md` (12px) para `rounded-xl` (16px), alinhando com cards/modais (PLAN-038). Inputs nunca abaixo de 16px (`text-base`).

## Mapa de formulários / controles

Legenda de prioridade: **FOCO** = escopo do PLAN-039 (cliente/contrato cadastro/edição) · **FU** = follow-up (mapeado, não executado nesta rodada).

| Módulo | Arquivo | Controles | Estado atual | Ação | Prioridade |
|---|---|---|---|---|---|
| Cliente | `cliente/pages/ClienteNovo.tsx` | 16 (text: nome, telefones, cpf, comércio, endereços; captura de localização) | header custom `< + h1>`; inputs `rounded-md border px-3 py-2` | `PageHeader` + `Field` | FOCO |
| Cliente | `cliente/pages/ClienteEdit.tsx` | 16 (mesmos do cadastro) | idem | `PageHeader` + `Field` | FOCO |
| Contrato | `contrato/pages/ContratoNovo.tsx` | 5 (select cliente custom + valorBase, juros, parcelas, dataInicio date) | idem | `PageHeader` + `Field` + restyle select/date | FOCO |
| Contrato | `contrato/pages/ContratoEdit.tsx` | 4 (parcelas, datas etc.) | idem | `PageHeader` + `Field` | FOCO |
| Admin | `admin/components/OperadorForm.tsx` | 6 (nome, email, senha, role, chefe) | inputs `rounded-md` | `Field` | FU |
| Admin | `admin/components/EmpresaForm.tsx` | 4 (nome + módulos) | `rounded-md` | `Field` | FU |
| Gasto | `gasto/components/GastoForm.tsx` | 4 (valor, categoria, data, observação) | `rounded-md` | `Field` | FU |
| Auth | `auth/pages/PerfilPage.tsx` | 3 (senha atual, nova, confirma) | `rounded-md` | `Field` | FU |
| Caixa | `caixa/pages/CaixaPage.tsx` | 2 (ajuste valor + motivo) | `rounded-md` | `Field` | FU |
| Admin | `admin/pages/OperadorDetail.tsx` | 2 (ajuste caixa: valor + motivo) | `rounded-md` | `Field` | FU |
| Auth | `auth/pages/LoginPage.tsx` | 2 (email, senha) | `rounded-md` (página já redesenhada) | `Field` | FU |
| Operações | `operacoes/pages/RotaPage.tsx` | 1 (promessa — date) | `rounded-md` | `Field` | FU |
| Pagamento | `pagamento/components/PagamentoModal.tsx` | 1 (valor) | `rounded-md` | `Field` | FU |
| Contrato | `contrato/pages/ContratoDetail.tsx` | 1 (motivo estorno) | `rounded-md` | `Field` | FU |
| Contrato | `contrato/pages/ContratoList.tsx` | 1 (filtro cliente — dropdown custom) | `rounded-md` | restyle `rounded-xl` | FU |
| Shared | `shared/components/SearchBar/SearchBar.tsx` | 1 (busca) | próprio | restyle p/ identidade | FU |

## Pontos de atenção (gaps)

- **Token `border-strong` ausente** — precisa ser adicionado em `index.css` (`--border-strong`) e no `tailwind.config.js` (`border.strong`) para o padrão do `Field`.
- **Componente `Field` não existe** — será criado (`shared/components/Field/Field.tsx`) como único padrão de input do app.
- **Headers dos forms** (ClienteNovo/Edit, ContratoNovo/Edit) usam o padrão antigo `< ChevronLeft + h1>` — migram para `PageHeader`.
- **Seletor de cliente (ContratoNovo)** e **input de data** precisam de restyle para `rounded-xl`.
- **Cards de cliente** (`ClienteCard`) — lista e detalhe — serão atualizados (avatar com iniciais + ícones), preparando a futura **foto do cliente**.
- Controles de **caixa de busca** (`SearchBar`) e **filtros dropdown** (ContratoList) são follow-up de restyle.

## Referências

- `engineering/design/02-DESIGN-SYSTEM.md` — seção Inputs (DS v2)
- `plans/PLAN-039-padronizacao-forms-inputs.md`
- PLAN-038 (identidade "Nexus") — base visual
