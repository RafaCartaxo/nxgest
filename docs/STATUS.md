# STATUS — situação conferida

**Última revisão:** 20/11/2026. Este documento distingue operação comprovada, trabalho local e histórico. Não declara todos os fluxos de produto revalidados nesta data.

## Publicação comprovada

| Item | Evidência |
|---|---|
| Produção | https://nxgest.com.br |
| Staging | https://nxgestao.duckdns.org |
| SHA publicado | `f804aaf6702a00dab522afa88758e2b70e01a8dc` |
| CI/build único | [44764236119 — success](https://github.com/RafaCartaxo/nxgest/actions/runs/44764236119) |
| Staging | [44765108964 — success](https://github.com/RafaCartaxo/nxgest/actions/runs/44765108964) |
| CD e finalização | [44765426852 — success](https://github.com/RafaCartaxo/nxgest/actions/runs/44765426852) |
| Imagem nos dois ambientes | `sha256:8da0c59a1aae20e2a61fec358c37edcd2ee6bf6a6994f497435be8700ec3e4bf` |
| Resultado observado | health/DB conectados, recibos atestados e finalização sem pending/active |
| Modo e aprovações | Pré-clientes; reviewers de staging e production preservados |
| Prazo das policies vigentes | 23/11/2026 às 23:59:59 UTC; renovação exige fontes/hashes/autoridades coerentes |

O gatilho do CD é o sucesso de `Staging verificado` em main, tentativa 1; staging é acionado pelo CI aprovado de um push em main. PR e CI manual não substituem esse evento. Detalhes: [pipeline](qa/05-PIPELINE.md) e [runbook](engineering/06-PRODUCAO.md).

## Validação e seus limites

O CI acima registrou **215 testes unitários/UI em 46 arquivos** e **286/286 cenários de smoke**, além dos gates de segurança, deploy e backup com fixtures. O teste de fingerprint passou 7/7. Essas contagens pertencem ao SHA indicado, não são metas fixas para revisões futuras.

A auditoria documental local cruza 74 rotas/contratos de API e 29 rotas/telas frontend. Links e contagens coerentes não demonstram todos os comportamentos nem atualizam automaticamente instruções de operação. A revisão atual corrigiu README, pipeline, operação e a descrição iterativa de dataFinal; não repetiu uma regressão manual completa de UI.

## Consolidação operacional em validação

- Instalação limpa por `npm ci` e build no Node 24 passaram; 216 testes unitários/UI passaram.
- Resend aceitou um envio para o destinatário simulado oficial (`delivered@resend.dev`). Não foi usado destinatário humano.
- Backup real de banco/anexos com retomada da aplicação concluído em 32 segundos. A primeira restauração revelou dependência de `search_path` em `f_unaccent`, corrigida no código e coberta pela validação de schema.
- Publicação da consolidação e nova restauração no VPS permanecem em execução; não confundir com a publicação comprovada acima.

## O que permanece separado

- **Recuperação:** o experimento BA10 foi arquivado fora da árvore ativa. A consolidação adota pausa controlada para backup associado e ensaio isolado; ver [backup e retorno](engineering/09-BACKUP-ROLLBACK.md). A restauração completa no VPS ainda precisa passar após publicação da correção de `f_unaccent`.
- **Consolidação:** branch `chore/consolidacao-operacional-20261120`, baseada na main publicada. Todo WIP anterior foi copiado e verificado antes da retirada da árvore ativa. Runtime, CI e instalação passam a Node 24 LTS, sem dependências SQLite.
- **Limpeza local:** removidos 112 PDFs sintéticos sem referência local e caches antigos (~345 MiB); 6 arquivos não sintéticos preservados; fixtures antigas em quarentena. Código/testes BA10 preservados em snapshot externo.
- **Recuperação intermediária:** CD44761356067 permaneceu failure após aplicar uma imagem; a reconciliação manual preservou originais e foi registrada separadamente. O CD44765426852 posterior é a prova automática positiva.

## Histórico e planejamento

O [snapshot de 28/08/2026](arquivo/STATUS-2026-08-28.md) preserva planos, métricas e entregas daquele período. Ele não é inventário atual de produção. O [roadmap](product/04-ROADMAP.md) mantém sua matriz histórica com inventário revisado; [índice de planos](plans/README.md) e [backlog](plans/BACKLOG.md) detalham frentes que exigem confirmação própria, sem presumir conclusão.

Ver [atualizações](UPDATES.md) e [checklist de 20/11](engineering/tasks/2026-11-20/CHECKLIST.md).
