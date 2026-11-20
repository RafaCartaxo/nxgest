# 09 — Backup e recuperação

O procedimento atual usa PostgreSQL 16 e anexos do volume `/data`. O backup precisa representar o mesmo instante lógico para ambos. A estratégia é uma manutenção curta: interromper a aplicação, conferir ausência de outras conexões escritoras, copiar banco e anexos e retomar a mesma aplicação. O banco permanece ligado. A aplicação trata SIGTERM/SIGINT, fecha o servidor HTTP antes do pool e limita o encerramento a 20 segundos, abaixo do prazo do docker stop.

## Backup atual

`backup-maintenance.sh` usa o lock de deploy para impedir concorrência com publicação. Recusa topologia inesperada, banco com porta publicada e conexões externas remanescentes. Em falha, tenta retomar o mesmo container e preserva o conjunto parcial para diagnóstico.

Cada diretório completo em `/opt/backups/<id>` contém dump custom do PostgreSQL, tar de uploads, inventário dos anexos, fingerprints das tabelas, metadados da imagem/container e `SHA256SUMS`. O marcador `COMPLETE` só é publicado depois das verificações. Diretórios parciais não são backups válidos. Diretório e arquivos são privados; a imagem de origem recebe uma tag associada ao backup.

```bash
# No VPS, depois da instalação operacional dos scripts:
bash /opt/scripts/nxgest/backup-maintenance.sh
bash /opt/scripts/nxgest/backup-restore-check.sh /opt/backups/ID-EXATO
```

Os scripts precisam permanecer juntos com `backup-maintenance-common.sh`, `host-jq.sh` e `container-health.sh`. Usam `PROJECT_DIR=/opt/nxgestao`, `BACKUP_DIR=/opt/backups` e os containers de produção por padrão. Não dependem de Node no host: executam o runtime da imagem aprovada.

## Validação da restauração

`backup-restore-check.sh` verifica checksums antes de criar recursos. Restaura o dump em PostgreSQL novo, sem portas publicadas e sem rede de aplicação; extrai os anexos em outro volume e compara todas as tabelas e arquivos com o inventário original. Remove somente os recursos temporários que ele próprio criou e identificou com label exclusivo.

Sucesso exige as duas mensagens `RESTORE_VERIFIED` e `RESTORE_CLEANUP_COMPLETE`. Um dump criado com sucesso não demonstra restauração. O ensaio não substitui o banco nem os anexos publicados.

O teste real de consolidação identificou que `f_unaccent` dependia de `search_path`, impedindo reconstruir seu índice no `pg_restore`. A definição em `src/database.ts` passa a qualificar função e dicionário com `public`; `valida-modelo.mjs` verifica a normalização com `search_path` vazio no CI.

## Recuperação da aplicação

Restaurar dados na produção é uma operação diferente do ensaio: exige parada, seleção explícita do conjunto e volumes de destino e validação de compatibilidade entre imagem e schema. A promoção automática atual valida origem da imagem, configuração, banco conectado e health; não executa restauração automática do banco.

Antes de recuperar, conferir imagem de origem em `metadata.txt`, arquivos completos e teste de restauração positivo. Preservar os volumes atuais até validar o destino. A tag de imagem local e os arquivos no mesmo VPS não protegem contra perda do host: é necessário manter uma cópia externa privada, incluindo dump, uploads, metadados e a imagem exportada ou sua origem recuperável.

## Histórico

Os protocolos anteriores, primeira baseline e experimento BA10 estão no [arquivo histórico](../arquivo/2026-11-20-backup-protocolos-anteriores.md). Não são pré-requisitos do procedimento atual. O trabalho experimental foi preservado fora da árvore ativa; não instalar seus handlers na aplicação publicada.

Para publicação e acesso: [runbook de produção](06-PRODUCAO.md). Para instalar uma máquina: [setup](08-SETUP-NOVA-MAQUINA.md).
