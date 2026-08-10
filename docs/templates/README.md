# Templates

Modelos reutilizáveis para documentação do projeto.

| Template | Para que serve |
|----------|----------------|
| [DOCUMENT.template.md](DOCUMENT.template.md) | Documentos de engenharia/foundation/product (cabeçalho padrão: status, versão, data) |
| [FEATURE.template.md](FEATURE.template.md) | Feature/tomada de decisão (SKILL-003 antes do plano virar PLAN) |
| [MODULE.template.md](MODULE.template.md) | Novos módulos de backend/frontend |
| [ADR.template.md](ADR.template.md) | Novas decisões arquiteturais (ADR) — armazenadas em `foundation/` |
| [CHECKLIST.template.md](CHECKLIST.template.md) | Daily de trabalho em `docs/engineering/tasks/YYYY-MM-DD/` — estrutura fixa (Entregue → Validação → Pendências → Observações) |

## Convenções

- Documentos seguem `NN-NOME.md` em cada seção; ADRs `ADR-NNN-Titulo.md`.
- O `CHECKLIST.template.md` é o ponto de partida de qualquer daily nova — copiar para
  `docs/engineering/tasks/<data>/CHECKLIST.md` e preencher. Catálogo de status: ver a
  seção "Status" do próprio template.
