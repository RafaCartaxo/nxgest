# 05 — Pipeline CI/CD

**Revisado:** 20/11/2026. Fonte: workflows da main publicada `f804aaf6` e [runbook](../engineering/06-PRODUCAO.md).

## Sequência vigente

```text
push/PR → CI: qualidade + smoke + migração
push main aprovado → build único + recibo e atestações
                   → workflow Staging verificado → aprovação staging → aplicação/health/recibo atestado
                   → workflow CD → aprovação production → mesma imagem/health/recibo/finalização
```

Uma PR não publica. Staging não é um job de deploy dentro do CI. Os reviewers continuam exigidos; existir um trigger não elimina as aprovações do environment.

## Contratos dos workflows

| Workflow | Gatilho e resultado |
|---|---|
| `ci.yml` | push/PR/manual executam checks; build atestado somente para push/main após qualidade, smoke e migração |
| `staging.yml` | `workflow_run` do CI aprovado; exige push/main, tentativa 1 e workflow CI esperado; verifica origem e promove artefato antes de atestar/publicar recibo |
| `cd.yml` | `workflow_run` de Staging verificado success/main/tentativa 1; manual exige `staging_run` em main; valida recibo e os mesmos bytes antes de promover/finalizar |

Os grupos de concorrência de staging e produção são separados e não cancelam automaticamente a execução anterior. Um run em espera pode ocupar seu grupo. Não aprovar ou repetir uma execução antiga sem conferir seleção e configuração efetivas.

## Origem, configuração e efeitos

O SHA do candidato, o controlador aprovado e o image ID têm papéis distintos. Verificadores correlacionam repo/workflow/evento/run/tentativa, atestações, recibos e digests. Policies e authorities externas fixam controlador, decisões, prazo e configuração; secrets não são conteúdo do artifact. O GH oficial é instalado por versão/hash aprovados nos consumidores, independentemente da versão pré-instalada no runner. A mesma imagem chega a staging e produção sem rebuild.

Falha de origem, hash, política, lock, health ou identidade bloqueia a sequência. Falha após troca de imagem pode deixar serviço novo saudável e publicação pendente; health sozinho não comprova conclusão. Conferir recibo, marker, pending/active e passo de finalização. Preservar estado antes de qualquer reconciliação específica.

## Evidência atual

A cadeia [CI44764236119](https://github.com/RafaCartaxo/nxgest/actions/runs/44764236119) → [staging44765108964](https://github.com/RafaCartaxo/nxgest/actions/runs/44765108964) → [CD44765426852](https://github.com/RafaCartaxo/nxgest/actions/runs/44765426852) concluiu success em 20/11/2026, com mesma imagem e finalização conferidas. Estado e prazos: [STATUS](../STATUS.md).

## Backup e rollback

O deploy valida a promoção da imagem e a saúde do serviço. A recuperação de dados exige o procedimento de backup/restauração do runbook; não é demonstrada apenas pelo CD verde. O experimento BA10 foi arquivado em favor de manutenção curta explícita.

CD manual não é rollback por SHA/ref arbitrária. Não usar reset, checkout parcial, build improvisado ou scripts avulsos para contornar políticas. Imagem preservada, compatibilidade de dados e procedimento validado são pré-condições de retorno; ver [operação](06-OPERACAO.md) e [backup/rollback](../engineering/09-BACKUP-ROLLBACK.md).

## Review e referência

A branch main exige checks e revisão conforme a proteção efetiva do GitHub. Na execução registrada, os merges usaram a exceção administrativa existente, sem mudar as regras; isso é distinto dos reviewers de environments. Consultar a configuração atual antes de integrar ou liberar execução.

Definições versionadas: [CI](https://github.com/RafaCartaxo/nxgest/blob/f804aaf6702a00dab522afa88758e2b70e01a8dc/.github/workflows/ci.yml), [staging](https://github.com/RafaCartaxo/nxgest/blob/f804aaf6702a00dab522afa88758e2b70e01a8dc/.github/workflows/staging.yml), [CD](https://github.com/RafaCartaxo/nxgest/blob/f804aaf6702a00dab522afa88758e2b70e01a8dc/.github/workflows/cd.yml).
