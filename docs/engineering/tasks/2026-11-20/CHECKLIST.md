# CHECKLIST — Coerência documental, README e separação do BA10

**Data:** 20/11/2026

**Planos/refs:** README, STATUS, runbook, QA, BR-108/PLAN-085 e CI44764236119

> Revisão solicitada pelo usuário após o CD validado. Alinha documentação ao código/main publicado; preserva o trabalho local BA10 e distingue história de estado atual.

## Status (catálogo oficial)

| Emoji | Significado |
|---|---|
| ✅ | Entregue / concluído |
| 🔵 | Em execução (parcial — parte concluída) |
| ⏳ | Aguardando algo (deploy, externo, decisão) |
| 🚨 | Parado há 7+ dias / urgente |
| ❌ | Bloqueado / falhou |
| 🐛 | Bug encontrado (referenciar card/CT) |
| 🔁 | Retestado / revalidado |

## Entregue

- [x] README, índices, STATUS, guias de pipeline/operação/testes e runbook alinhados ao fluxo CI → staging → CD, com aprovações e validade das policies.
- [x] Snapshot de agosto preservado em docs/arquivo; roadmap distingue inventário atual de planejamento histórico.
- [x] BA10 documentado como drenagem/barreira/backup/restore parcial, separado do deploy pré-clientes validado. Nenhum descarte dos seus scripts/handlers.
- [x] BR-108, domínio e PLAN-085 descrevem ajuste de domingo a cada parcela, conforme backend/frontend existentes.
- [x] npm docs:audit usa o modo estrito já implementado, para falhar diante de divergências.

## Validação (rodar antes de finalizar)

- [x] Tipagem backend e frontend: tsc --noEmit e tsc --noEmit -p frontend/tsconfig.json, ambos exit0.
- [x] Testes focais existentes de geração/data final e ativação de convite: 37/37 em 3 arquivos.
- [x] npm run docs:audit (estrito) sem divergências.
- [x] npm run audit:links sem erros.
- [x] git diff --check nos arquivos desta revisão.

## Pendências

- [ ] Recuperação integral BA10/backup/rollback continua pendente; não é critério de fechamento desta revisão documental.
- [ ] Renovação das policies após 23/11/2026 23:59:59 UTC é operação própria; prazo não foi ampliado.
- [ ] Alterações desta revisão são locais, sobre branch anterior com WIP; não houve commit/push/deploy.

## Observações

A evidência CI215 testes/286 smoke pertence ao SHA f804 publicado. Nesta revisão só a suíte focal foi reexecutada localmente. Não foi feita nova regressão manual completa de UI nem mudança em regra de negócio ou execução de banco/produção. A auditoria estrutural não substitui revisão semântica dos documentos.

## Consolidação operacional posterior, autorizada pelo usuário

- [x] WIP e BA10 preservados em snapshot com hashes fora da árvore ativa; nova branch baseada na main.
- [x] SQLite retirado; Node 24 LTS alinhado em instalação, CI e Docker.
- [x] Build e 216 testes unitários/UI passaram.
- [x] Backup real com pausa e retomada medido em 32 segundos; Resend aceitou envio a destinatário simulado.
- [x] Corrigida função f_unaccent incompatível com pg_restore; invariantes verificadas com search_path vazio.
- [ ] Publicar a consolidação pelo CI→staging→CD e repetir restauração real no VPS.

Os itens de BA10 nas seções anteriores registram a revisão documental anterior. O procedimento ativo passou a manutenção curta explícita, sem seus handlers experimentais.
