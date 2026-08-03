# Skills

As Skills definem os processos oficiais utilizados durante o desenvolvimento do projeto.

Cada Skill possui uma responsabilidade única e complementa as demais, formando um fluxo de trabalho consistente e alinhado à arquitetura do sistema.

| Skill | Responsabilidade |
|--------|------------------|
| [SKILL-001](SKILL-001-documentation-reviewer.md) | Revisão da documentação |
| [SKILL-002](SKILL-002-architecture-guardian.md) | Garantia da arquitetura |
| [SKILL-003](SKILL-003-feature-planner.md) | Planejamento de funcionalidades |
| [SKILL-004](SKILL-004-vertical-slice-builder.md) | Implementação de Vertical Slices |
| [SKILL-005](SKILL-005-code-reviewer.md) | Revisão de código |
| [SKILL-006](SKILL-006-bug-investigator.md) | Investigação de bugs |
| [SKILL-007](SKILL-007-ux-reviewer.md) | Avaliação de UX e experiência do operador |
| [SKILL-008](SKILL-008-release-reviewer.md) | Revisão de release e documentação final |
| [SKILL-009](SKILL-009-documentation-sync.md) | Sincronização da documentação (fonte única de verdade + matriz de propagação + auditoria) |

## Fluxo recomendado

1. Planejar a funcionalidade (SKILL-003)
2. Implementar como Vertical Slice (SKILL-004)
3. Revisar o código (SKILL-005)
4. Validar a arquitetura (SKILL-002)
5. Atualizar ou revisar a documentação (SKILL-001)
6. **Manter a documentação sincronizada** (SKILL-009) — rodar `node scripts/audit-docs.mjs` e aplicar a matriz de propagação
7. Utilizar a SKILL-006 sempre que houver investigação de problemas ou comportamentos inesperados.