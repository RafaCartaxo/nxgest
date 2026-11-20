# 06 — Operação

**Revisado:** 20/11/2026. Resumo do [runbook](../engineering/06-PRODUCAO.md); não duplica procedimentos de recuperação.

## Ambientes

| Item | Referência |
|---|---|
| Produção | https://nxgest.com.br |
| Staging | https://nxgestao.duckdns.org |
| VPS | `172.245.152.223`, SSH por chave |
| Checkout operacional | `/opt/nxgestao` |
| Configuração privada | `.env` / `.env.staging` no host; não copiar para Git/logs |
| Dados | PostgreSQL e uploads em volumes separados por ambiente |
| Proxy | Caddy, rede compartilhada `nxgestao_net` |

## Publicação normal

Push/merge em main → CI/build atestado → Staging verificado → CD. Cada environment exige aprovação; recibos, origem, imagem, saúde e finalização fazem parte da prova. Ver [pipeline](05-PIPELINE.md) e [status publicado](../STATUS.md).

No manual GitHub, `CD → Run workflow` recebe `staging_run` e continua sujeito às mesmas verificações. Não há deploy livre por ref. Bootstrap/adoção/manutenção legados têm contratos e autorizações próprios no runbook; não usar `git pull` seguido de script avulso como receita de produção.

## Incidente e retorno

1. Registrar run/SHA/imagem/container e verificar se a falha ocorreu antes ou depois de efeitos.
2. Conferir health interno/público e estado de marker/selection/pending/active sem expor credenciais.
3. Preservar imagem anterior, dados, env e registros. Não apagar pending para liberar outra tentativa.
4. Se há efeito parcial, preparar reconciliação ou retorno específico, com lock, identidade/hash, backup/compatibilidade e resultado verificável.
5. Distinguir recuperação manual de sucesso do workflow; validar nova cadeia antes de declarar o CD corrigido.

Não há receita genérica segura de reset/checkout parcial/rebuild para rollback. Ver [runbook §4 e §7](../engineering/06-PRODUCAO.md) e [backup/retorno](../engineering/09-BACKUP-ROLLBACK.md).

## Backup

O candidato versionado cria um conjunto associado de banco/anexos/metadados/imagem e o verificador checa marcador/hashes/estrutura. Existir cron, dump ou tar não comprova restore nem consistência entre banco e arquivos. Instalação, capacidade, retenção e off-site devem ser conferidas na operação; não assumir que o código candidato seja a versão instalada. O provedor não oferece snapshot que substitua esse cuidado.

O experimento BA10 foi arquivado. O procedimento atual para backup consistente interrompe a aplicação por janela curta e verifica o conjunto em restauração isolada; conferir a evidência vigente no STATUS antes de declarar recuperação comprovada.

## Observação somente leitura

```bash
curl -fsS https://nxgest.com.br/api/health
curl -fsS https://nxgestao.duckdns.org/api/health
```

Logs e inspeções Docker são realizados no host autorizado, pelos caminhos do runbook; não imprimir env, conteúdo de anexos, senhas ou tokens. Para evidência de publicação, combinar saúde com origem/recibo/imagem e estado final, não apenas o HTTP200.
