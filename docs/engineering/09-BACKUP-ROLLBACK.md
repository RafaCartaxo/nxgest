# 09 — Backup e recuperação

O procedimento atual usa PostgreSQL 16 e anexos do volume `/data`. O backup precisa representar o mesmo instante lógico para ambos. A estratégia é uma manutenção curta: interromper a aplicação, conferir ausência de outras conexões escritoras, copiar banco e anexos e retomar a mesma aplicação. O banco permanece ligado. O [pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html) já produz um snapshot consistente do banco; a pausa existe para associar também os arquivos externos de anexos ao mesmo estado, não por uma exigência do dump isolado. A aplicação trata SIGTERM/SIGINT, fecha o servidor HTTP antes do pool e limita o encerramento a 20 segundos, abaixo do prazo do docker stop.

## Rotina aplicada e limites

| Item | Aplicação atual |
|---|---|
| Criação automática | cron `/etc/cron.d/nxgest-backup`, todos os dias às02h/14hUTC |
| Conteúdo | PostgreSQL + anexos associados, inventário e checksums; manutenção curta da aplicação |
| RPO local nominal | até12h, condicionado ao sucesso do último job; conferir log/COMPLETE |
| Prova do agendamento | backup `20261121T020001Z-1098303-1910` foi criado pelo cron e restaurado:20 tabelas/9 anexos, sem divergências |
| Ensaio periódico | `backup-verify-latest.sh`: seleciona o último conjunto publicado e executa restore real isolado, sem parar a aplicação |
| Agenda do ensaio | domingo03h30UTC; timeout15min; log privado separado |
| Cópia externa | cópia privada da consolidação já restaurada em outra máquina; repetição automática ainda sem destino configurado |
| Retenção | formato atual não elimina conjuntos automaticamente; política proposta de30dias só deve ser automatizada junto de verificação/cópia externa e proteção do último restore válido |
| Alertas | falhas retornam código não-zero e ficam no log; não há canal externo de notificação configurado |

A referência [3-2-1 da CISA](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf) recomenda manter três cópias em pelo menos dois meios/domínios de falha, uma externa, e validar restauração periodicamente. O cron sozinho não atende perda do VPS. Ainda falta escolher o destino externo e o canal de alerta para completar essa automação. Não se promete RPO externo de12h enquanto a cópia externa permanecer manual. RTO de recuperação real não foi medido; os6s observados são a pausa do backup, não o tempo total de recuperação de um incidente.

## Backup atual

`backup-maintenance.sh` usa o lock de deploy para impedir concorrência com publicação. Recusa topologia inesperada, banco com porta publicada e conexões externas remanescentes. Em falha, tenta retomar o mesmo container e preserva o conjunto parcial para diagnóstico.

Cada diretório completo em `/opt/backups/<id>` contém dump custom do PostgreSQL, tar de uploads, inventário dos anexos, fingerprints das tabelas, metadados da imagem/container e `SHA256SUMS`. O marcador `COMPLETE` só é publicado depois das verificações. Diretórios parciais não são backups válidos. Diretório e arquivos são privados; a imagem de origem recebe uma tag associada ao backup.

```bash
# No VPS, depois da instalação operacional dos scripts:
bash /opt/scripts/nxgest/backup-maintenance.sh
bash /opt/scripts/nxgest/backup-restore-check.sh /opt/backups/ID-EXATO
```

`backup-verify-latest.sh` usa o mesmo lock e chama o restore existente. Não há fallback silencioso para um conjunto antigo quando o último publicado está corrompido.

Os scripts precisam permanecer juntos com `backup-maintenance-common.sh`, `host-jq.sh` e `container-health.sh`. Usam `PROJECT_DIR=/opt/nxgestao`, `BACKUP_DIR=/opt/backups` e os containers de produção por padrão. Não dependem de Node no host: executam o runtime da imagem aprovada.

## Validação da restauração

`backup-restore-check.sh` verifica checksums antes de criar recursos. Restaura o dump em PostgreSQL novo, sem portas publicadas e sem rede de aplicação; extrai os anexos em outro volume e compara todas as tabelas e arquivos com o inventário original. Remove somente os recursos temporários que ele próprio criou e identificou com label exclusivo.

Sucesso exige as duas mensagens `RESTORE_VERIFIED` e `RESTORE_CLEANUP_COMPLETE`. Um dump criado com sucesso não demonstra restauração. O ensaio não substitui o banco nem os anexos publicados.

O teste real de consolidação identificou que `f_unaccent` dependia de `search_path`, impedindo reconstruir seu índice no `pg_restore`. A definição em `src/database.ts` passa a qualificar função e dicionário com `public`; `valida-modelo.mjs` verifica a normalização com `search_path` vazio no CI.

## Restaurar em outra máquina

Foi validado o mesmo conjunto com imagens exportadas do Docker26 (VPS) e importadas no Docker29/containerd, em Linux. Exportar tanto a imagem da aplicação quanto a imagem PostgreSQL indicada por `database_image` nos metadados; uma tag de registry atual não substitui essas identidades. Manter checksums das exportações junto da cópia externa.

1. Importar as duas imagens com `docker image load -i ARQUIVO.tar.gz` e anotar os IDs locais apresentados.
2. Provisionar jq aprovado em `.git/nxgest-tools/jq` conforme [setup](08-SETUP-NOVA-MAQUINA.md), com hash e permissões conferidos.
3. Definir `NXGEST_PROJECT_DIR` para o checkout e `NXGEST_BACKUP_DIR` para o diretório privado que contém o bundle; executar o restore check.
4. Se o Docker representar a imagem importada por manifest digest em vez do config digest de origem, informar `NXGEST_RESTORE_APP_IMAGE` e `NXGEST_RESTORE_DB_IMAGE` com os IDs locais completos. O script exporta a configuração dessas imagens e exige seu hash original antes de criar o banco temporário. Imagem divergente ou exportação ambígua são recusadas. Metadados e checksums originais permanecem intactos.

Os nomes opcionais acima são apenas para o ensaio de restore; não alteram policies ou seleção de imagem do CD. A aplicação atual é `linux/amd64`; outra arquitetura exige emulação compatível ou um build atestado próprio. Executar os scripts operacionais em Linux com ferramentas GNU (WSL2/VM quando necessário).

## Recuperação da aplicação

Restaurar dados na produção é uma operação diferente do ensaio: exige parada, seleção explícita do conjunto e volumes de destino e validação de compatibilidade entre imagem e schema. A promoção automática atual valida origem da imagem, configuração, banco conectado e health; não executa restauração automática do banco.

Antes de recuperar, conferir imagem de origem em `metadata.txt`, arquivos completos e teste de restauração positivo. Preservar os volumes atuais até validar o destino. A tag de imagem local e os arquivos no mesmo VPS não protegem contra perda do host: é necessário manter uma cópia externa privada, incluindo dump, uploads, metadados e a imagem exportada ou sua origem recuperável.

## Histórico

Os protocolos anteriores, primeira baseline e experimento BA10 estão no [arquivo histórico](../arquivo/2026-11-20-backup-protocolos-anteriores.md). Não são pré-requisitos do procedimento atual. O trabalho experimental foi preservado fora da árvore ativa; não instalar seus handlers na aplicação publicada.

Para publicação e acesso: [runbook de produção](06-PRODUCAO.md). Para instalar uma máquina: [setup](08-SETUP-NOVA-MAQUINA.md).
