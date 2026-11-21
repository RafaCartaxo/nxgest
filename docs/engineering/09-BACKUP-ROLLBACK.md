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
| Retenção | local de30dias preparada; depende de off-site saudável; protege os dois conjuntos mais novos, último restore e conjuntos sem recibo externo |
| Monitor externo | GitHub Actions a cada2h: health/DB públicos e chave SSH exclusiva para leitura de frescor/prova; falhas deixam workflow vermelho; entrega de e-mail depende das preferências de notificações do GitHub |

A referência [3-2-1 da CISA](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf) recomenda manter três cópias em pelo menos dois meios/domínios de falha, uma externa, e validar restauração periodicamente. O cron sozinho não atende perda do VPS. A cópia externa contínua ainda depende de conta/bucket e credenciais. O monitor externo roda no GitHub; um canal adicional (e-mail/webhook) não foi configurado. Não se promete RPO externo de12h enquanto a cópia externa permanecer manual. RTO de recuperação real não foi medido; os6s observados são a pausa do backup, não o tempo total de recuperação de um incidente.

## Backup atual

`backup-maintenance.sh` usa o lock de deploy para impedir concorrência com publicação. Recusa topologia inesperada, banco com porta publicada e conexões externas remanescentes. Em falha, tenta retomar o mesmo container e preserva o conjunto parcial para diagnóstico.

Cada diretório completo em `/opt/backups/<id>` contém dump custom do PostgreSQL, tar de uploads, inventário dos anexos, fingerprints das tabelas, metadados da imagem/container e `SHA256SUMS`. O marcador `COMPLETE` só é publicado depois das verificações. Diretórios parciais não são backups válidos. Diretório e arquivos são privados; a imagem de origem recebe uma tag associada ao backup.

```bash
# No VPS, depois da instalação operacional dos scripts:
bash /opt/scripts/nxgest/backup-maintenance.sh
bash /opt/scripts/nxgest/backup-restore-check.sh /opt/backups/ID-EXATO
```

`backup-verify-latest.sh` usa o mesmo lock e chama o restore existente. Não há fallback silencioso para um conjunto antigo quando o último publicado está corrompido. Depois do sucesso e cleanup, grava recibo atômico privado em `/opt/backups/.state/restore`, com instante, ID e hash do manifesto. O monitor não presume sucesso pela existência do cron ou de um dump.

Os scripts precisam permanecer juntos com `backup-maintenance-common.sh`, `host-jq.sh` e `container-health.sh`. Usam `PROJECT_DIR=/opt/nxgestao`, `BACKUP_DIR=/opt/backups` e os containers de produção por padrão. Não dependem de Node no host: executam o runtime da imagem aprovada.

## Instalação operacional e monitoramento

Depois da publicação pelo CD, executar como root no VPS `bash scripts/install-backup-jobs.sh <SHA-APROVADO>` a partir de `/opt/nxgestao`. O instalador exige a revisão exata publicada (aceita o checkout detached criado pelo CD), lock livre e ausência de deploy pendente/ativo; salva os scripts e cron anteriores em `.git/nxgest-backup-install.*`, instala scripts dessa revisão, cron com timeout45min/15min e `infra/backup-logrotate.conf`. Logs600, rotação semanal, oito arquivos, compressão com atraso; não há limpeza automática dos diretórios parciais para diagnóstico.

O workflow `.github/workflows/backup-monitor.yml` executa a cada duas horas (minuto17 UTC) e manualmente. Usa os secrets existentes VPS_HOST/VPS_USER e `VPS_BACKUP_MONITOR_KEY`, exclusivo desse monitor. No authorized_keys, a chave precisa de `restrict,command="/bin/bash /opt/scripts/nxgest/backup-status.sh"`; não concede shell, upload ou alteração de backup. A identidade do host é conferida pelo arquivo já fixado `infra/staging-known-hosts` e seu alias, compartilhado pelo mesmo VPS. Nenhum segredo ou conteúdo do backup é impresso.

O monitor falha com backup local de mais de14h, restore ausente/vencido em9dias, recibo divergente ou última tentativa de criação/restore com erro. Marcadores de falha só são limpos depois de uma execução bem-sucedida do mesmo job. Quando existe configuração off-site, exige prova da cópia do conjunto mais recente; sem configuração, exibe aviso explícito, sem atestar proteção externa. O workflow verifica também health/DB mesmo que a VPS esteja inacessível. Falhas aparecem no Actions; notificações por e-mail dependem da configuração da conta. Jobs agendados do GitHub podem atrasar e não constituem SLA de monitoramento.

## Destino recomendado e ativação da cópia externa

Recomendação para este porte: **bucket privado Backblaze B2 em conta independente da VPS, acessado pela API S3, com Restic**. O Restic cifra o repositório antes do envio e permite restauração em outra máquina. Não há bucket/credencial configurado atualmente; nenhuma contratação foi feita. A disponibilidade de Object Lock no provedor não significa compatibilidade automática com o ciclo de locks/prune do Restic: não aplicar imutabilidade ao repositório sem validar essa integração. A conta administrativa deve usar MFA; restringir a chave ao bucket dedicado. Isso não torna a chave de escrita append-only.

1. Criar bucket privado e chave restrita ao bucket na conta externa. Guardar senha do Restic e credenciais de recuperação também fora da VPS, em cofre independente. Perder a senha impede recuperar o repositório cifrado.
2. Instalar Restic de origem oficial com versão e SHA256 conferidos; implementação validada com0.20.0. Não há download implícito nos jobs.
3. Criar `/opt/nxgestao/.git/nxgest-offsite.env` como root600, usando valores reais e endpoint da região do bucket:

```bash
RESTIC_REPOSITORY=s3:https://s3.REGIAO.backblazeb2.com/BUCKET/nxgest
AWS_ACCESS_KEY_ID=CHAVE-RESTRITA
AWS_SECRET_ACCESS_KEY=SEGREDO
RESTIC_PASSWORD_FILE=/CAMINHO/PRIVADO/restic-password
```

4. Criar a senha no arquivo privado600, fora do Git. Inicializar o repositório uma única vez: em shell root, `set -a; source /opt/nxgestao/.git/nxgest-offsite.env; set +a; /usr/local/bin/restic init`. Os placeholders não são credenciais válidas. Nunca colar valores em documentação ou logs.
5. Executar `bash /opt/scripts/nxgest/backup-offsite.sh`. Conferir `OFFSITE_VERIFIED` e executar `backup-status.sh`. O cron passa a chamar a cópia externa após cada criação quando essa configuração existir; falha externa não apaga o backup local nem mantém a aplicação parada.

A cópia inclui conjunto completo, imagens exatas da aplicação/PostgreSQL, `.env` de produção, Compose, Caddy e scripts de recuperação. As configurações contêm segredos e só vão no snapshot cifrado; o diretório temporário é privado e removido ao final. O snapshot completo é baixado e todos os hashes conferidos antes de emitir recibo por ID em `.state/offsite-ID`. Esse roundtrip é prova de bytes recuperáveis, não substitui o ensaio semanal de restauração PostgreSQL/anexos. Um transporte local real cifrado foi usado no teste de integração; conectividade com nuvem só poderá ser comprovada após configurar o bucket.

## Retenção

`backup-retention.sh --dry-run` lista candidatos; `--apply` elimina somente conjuntos completos de mais de30dias com recibo externo correspondente. Exige monitor saudável, protege os dois mais novos, o último restaurado, os conjuntos não copiados e os parciais. O job de criação chama `--apply` apenas depois de uma cópia externa verificada. Sem destino configurado, nada é eliminado. As tags de imagem não são removidas por essa rotina; ficam sujeitas às guardas de imagens existentes.

Para o repositório externo, adotar inicialmente30dias integrais, oito semanas e12meses. A limpeza remota fica separada da VPS, após configurar conta e testar restore; não foi ativada sem destino. Com credenciais administrativas e repositório dedicado, revisar primeiro a simulação:

```bash
restic forget --host nxgest-production --tag nxgest --group-by host --keep-within 30d --keep-weekly 8 --keep-monthly 12 --dry-run
```

Após aprovação dos candidatos, retirar `--dry-run`, acrescentar `--prune` e executar `restic check`. O agrupamento por host é explícito porque cada snapshot tem caminhos/ID próprios. Não usar lifecycle do bucket para apagar objetos internos do Restic por idade, pois blobs podem ser compartilhados entre snapshots. Ver [documentação de retenção](https://restic.readthedocs.io/en/stable/060_forget.html).

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
