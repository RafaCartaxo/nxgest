# Documentação do Projeto

Bem-vindo à documentação oficial do sistema de gestão de cobranças em campo.

## Seções

| Seção | Descrição |
|---|---|
| [Foundation](foundation/README.md) | Visão, princípios, norte estratégico e ADRs |
| [Product](product/README.md) | Domínio, regras de negócio, PRD e roadmap |
| [Engineering](engineering/README.md) | Arquitetura, backend, frontend, banco, API |
| [Design](engineering/README.md) | UX, design system, tokens, componentes e padrões (dentro de engineering/) |
| [Decisions](decisions/README.md) | Registro de decisões arquiteturais (ADRs) |
| [Plans](plans/README.md) | Planos de implementação de funcionalidades |
| [QA](qa/README.md) | Material de QA + fonte de estudo (arquitetura, engenharia, testes, pipeline, operação) |
| [Skills](skills/README.md) | Processos oficiais de desenvolvimento |
| [Templates](templates/README.md) | Templates para documentação |
| [Tasks](engineering/tasks/README.md) | Checklists de execução por data |
| [Atualizações](UPDATES.md) | Registro resumido de melhorias e correções recentes |
| [Status](STATUS.md) | Visão de relance: planos em aberto, pendências de produção, deploys |

## Como navegar

1. Comece pelo [INDEX.md](INDEX.md) para visão geral completa
2. Veja o [STATUS.md](STATUS.md) para a situação atual (planos em aberto, prod, pendências)
3. Consulte o [ROADMAP.md](product/04-ROADMAP.md) para saber a fase atual
4. Veja o [MAPEAMENTO-TELAS.md](engineering/05-MAPEAMENTO-TELAS.md) para as telas existentes
5. Veja os casos de uso de validação: [fluxos](product/06-CASOS-DE-USO.md) e [API](product/07-CASOS-DE-USO-API.md)
6. Para manter tudo alinhado (fonte única de verdade), use a [SKILL-009](skills/SKILL-009-documentation-sync.md) ou o comando `audita-docs`
7. Cada seção possui seu próprio README com a lista de documentos disponíveis

## Convenções

- Documentos seguem o padrão `NN-NOME.md` (ordem de leitura recomendada)
- ADRs seguem o padrão `ADR-NNN-Titulo.md`
- Templates disponíveis em [templates/](templates/)
- Checklist de execução em [tasks/](engineering/tasks/)
