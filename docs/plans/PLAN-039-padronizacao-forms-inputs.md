# PLAN-039 — Padronização de Forms & Inputs (identidade "Nexus")

**Status:** Em andamento (documentação/mapa concluídos)

**Versão:** 1.0

**Início:** 04/08/2026

**Última atualização:** 04/08/2026

**Roadmap:** follow-up do PLAN-038 (identidade visual) — padronizar todos os formulários

---

## Objetivo

Padronizar **todos** os formulários e controles de entrada com a identidade visual "Nexus" (PLAN-038) e o **padrão canônico de input** (`Field`). Hoje todos os inputs usam o estilo antigo (`rounded-md border px-3 py-2`).

## Escopo

| # | Entrega | Prioridade |
|---|---------|------------|
| 1 | Token `--border-strong` (index.css) + `border.strong` (tailwind) | Base |
| 2 | Componente `Field` compartilhado (`shared/components/Field/Field.tsx`) | Base |
| 3 | `ClienteNovo`/`ClienteEdit` → `PageHeader` + `Field` | **FOCO** |
| 4 | `ContratoNovo`/`ContratoEdit` → `PageHeader` + `Field` (+ restyle select cliente/date) | **FOCO** |
| 5 | `ClienteCard` lista/detalhe → avatar com iniciais + ícones (prepara foto futura) | **FOCO** |
| 6 | Demais forms (OperadorForm, EmpresaForm, GastoForm, Perfil, Caixa, OperadorDetail, Login, Rota, Pagamento, ContratoDetail, ContratoList, SearchBar) | **FU** (mapeado em `07-FORMS-INPUTS.md`) |
| 7 | Documentação: DS v2 (seção Inputs + Bordas) + `engineering/07-FORMS-INPUTS.md` (mapa) | Done |

## Mapa completo

Ver `docs/engineering/07-FORMS-INPUTS.md` — tabela com os **16 arquivos**, controles, estado atual, ação e prioridade (FOCO / FU).

## Decisões

| Decisão | Escolha |
|---------|---------|
| Raio do input | **`rounded-xl`** (16px) — alinha com cards/modais da identidade |
| Componente | **`Field`** compartilhado (label + input + erro) como único padrão |
| Escopo de execução | **4 forms de foco** (cliente/contrato) agora; restante mapeado como follow-up |
| Avatar no cliente | Com iniciais (prepara a foto do cliente futura); **sem** avatar no `ContratoCard` |

## Validação
- `npm run build` · `npm run audit:styles` · `npm run docs:audit` · conferência manual nos 4 forms

## Referências
- `engineering/design/02-DESIGN-SYSTEM.md` (DS v2 — Inputs/Bordas)
- `engineering/07-FORMS-INPUTS.md` (mapa completo)
- PLAN-038 (identidade "Nexus")
