# CHECKLIST — Inventário visual, branches e backup

- [x] Gerar inventário de rotas, componentes locais/compartilhados, consumidores, DOM/JSX, ícones, props, estados, CSS, temas, traduções e assets a partir do código.
- [x] Reconciliar MAPEAMENTO, UI-COVERAGE, catálogo de componentes, roadmap e índices; distinguir inventário estático de validação visual.
- [x] Integrar detector de divergências no gate documental; fornecer comando de regeneração.
- [ ] Arquivar patches de propostas dispensadas e WIP de ícones/Qase; excluir branches integradas/dispensadas e fechar PRs correspondentes sem atualizar dependências.
- [ ] Conferir execução real do cron e restaurar o backup agendado; automatizar ensaio periódico, documentar RPO, cópia externa e retenção.
- [ ] Validar tipos, build e auditorias; publicar mudanças pelo CI/CD; registrar evidências e limites.

Autorização: usuário dispensou trabalhos antigos, inclusive ícones, autorizou exclusão dos dados de teste e pediu reconciliação de inconsistências. Não é necessário zerar dados para inventariar a interface ou verificar o backup. Destino de off-site periódico e canal de alertas não foram fornecidos.

## Evidências e limites

O backup agendado20261121T020001Z-1098303-1910 foi restaurado com20 tabelas/9 anexos e cleanup completo. Oito testes do parser e11 testes de backup/manutenção passaram; tipos/build e auditorias passaram. Remotas antigas e seis propostas Dependabot foram removidas após bundle/patches; WIP ícones/Qase arquivado e removido. Restam dois worktrees legados em/tmp (um mantém branch local), fora do limite de escrita desta sessão; seus arquivos pendentes estão preservados no arquivo operacional. Não foram zerados dados, pois isso não traz benefício ao inventário ou à prova de recuperação.
