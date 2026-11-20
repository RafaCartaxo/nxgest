# Backup e retorno do serviço — preparação operacional

**Revisão de escopo: 20/11/2026.** O [CD pré-clientes](../STATUS.md) foi comprovado com origem/recibos/imagem e finalização reais. Este documento trata do caminho separado de **backup e recuperação integral com dados**, cuja prova operacional continua pendente. Fixtures e ensaio PostgreSQL sintético não demonstram restore em produção, compatibilidade de schema nem consistência entre banco e anexos.

**BA10 não é necessário para repetir o CD pré-clientes já validado.** Ele desenvolve drenagem de escritores, identidade/ACK, barreira e journal para captura/retorno consistentes. Há implementação local incompleta em `src/shared/maintenance/`, alterações em handlers/middlewares/startup e scripts `ba10-*`; isso é trabalho de produto/infra em andamento, não somente um ensaio descartável do deploy. Não está publicado na main nem comprovado operacionalmente. Pode ser isolado/arquivado em entrega própria por decisão de escopo, preservando patch, arquivos não rastreados e evidências; não apagar diretórios avulsos porque o código local já os importa.

Manter verificadores, testes de regressão e ferramentas do fluxo publicado. Diagnósticos ad hoc e fixtures geradas pertencem a arquivo/quarentena fora do build; não são dependências da aplicação publicada.

## Conjunto e integridade

`scripts/backup-nxgest.sh` é o candidato versionado para `/opt/scripts/backup-nxgest.sh`. A produção recusa a promoção se o executável instalado divergir desta versão; instalação e comparação no host são operações futuras autorizadas, nunca implícitas. Ele compartilha `nxgest-deploy.lock` com deploy/recuperação, lê somente PG_USER/PG_DB/PG_PASSWORD do env como dados e não expõe valores. A instalação operacional atual e suas permissões não foram inspecionadas.

Cada diretório em `/opt/backups/<id>` contém `database.dump`, `uploads.tar.gz`, `mounts.txt`, `mount-sources.sha256`, `runtime-config.txt`, `metadata.txt`, `SHA256SUMS` e `COMPLETE`. Os metadados identificam o conjunto, imagem, tag de retenção e SHA alvo quando conhecido. Os mounts registram tipo, nome e destino; as origens no host são representadas somente por hash. Proteger todo o conjunto como dado sensível, sem publicar conteúdo em logs/evidências; recuperar caminhos originais a partir de inventário seguro externo. A configuração resumida não inclui envs; configurações completas e segredos necessários permanecem sob controle seguro externo. Imagem anterior é identificada pelo container e recebe uma tag dedicada verificada. Não há prune automático nem descarte/rotação automática; capacidade e retenção são responsabilidade operacional.

Dump precisa ser não vazio e passar `pg_restore -l`; o arquivo de anexos precisa passar verificações gzip/tar, mesmo quando o diretório de uploads estiver legitimamente vazio. Diretório ausente, inacessível ou erro de leitura bloqueiam sucesso; não se cria tar vazio como substituto de erro. Componentes são escritos em diretório parcial privado, associados por SHA-256 e publicados sem sobrescrever outro conjunto; apenas o marcador `COMPLETE` final identifica uma execução concluída. A interrupção pode deixar diretórios incompletos para avaliação, sem substituir o último conjunto íntegro.

`scripts/verify-backup.sh <diretório-do-conjunto>` valida ID, marcador, associação, hashes e estrutura tar, sem restaurar dados. `pg_restore -l` e hashes **não provam que o banco pode ser restaurado nem que os dados estão consistentes entre banco e anexos**. Antes de publicação, operador deve planejar janela/consistência e demonstrar restore completo em ambiente isolado autorizado; a coleta sequencial não é snapshot transacional entre banco e anexos.

`scripts/pull-backup.sh` aceita ID explícito e verifica o diretório completo após cópia para staging privado, sem sobrescrever; foi exercitado somente com transporte dublado. Autenticidade da origem, transporte externo real e restauração exigem autorização e validação próprias.

## Preflight de promoção e rollback

**NO-GO para recuperação integral:** o preflight/retorno com dados continua bloqueado sem prova de compatibilidade e integridade restaurada. A imagem atual tem proveniência e SHA comprovados pela cadeia de 20/11; isso não autentica retroativamente o legado nem demonstra restore. Declaração humana e rótulo não substituem essas provas.

O caminho legado de `scripts/deploy.sh` falha antes de rede/build se o backup instalado estiver ausente, divergir do script versionado, falhar, ou se o conjunto e as evidências não passarem `scripts/rollback-preflight.sh`. A chamada é feita sob o lock de NXG-031, preserva o gate CI → staging mesmo SHA e não oferece bypass automático. Ausência ou divergência de imagem/tag, configuração de runtime, mounts, provas de configuração/schema, autorização ou decisão de dados bloqueia a promoção.

Antes de uma promoção futura, o operador autorizado precisa gerar e verificar um conjunto preliminar sob o mesmo lock, após autorização específica; usa os hashes de mounts/runtime e a imagem desse conjunto para preparar as evidências. O deploy criará novo conjunto e exigirá que seus valores continuem iguais; se o runtime mudou, interrompe e exige nova revisão. O operador deve preparar, fora do Git versionado, três arquivos privados identificados pelo diretório Git: `nxgest-rollback-evidence`, `nxgest-config-evidence` e `nxgest-schema-evidence`. A prova sintética de schema deve conter exatamente `schema_status=compatible`, `previous_sha=<SHA>` e `reviewer=<id>` em linhas separadas; isso só permite detectar contradições e não autentica nem libera produção. Os dois últimos contêm apenas referências/revisões não secretas verificáveis; o primeiro contém exatamente uma linha por chave no formato `chave=valor`, sem espaços ou segredos:

```text
previous_sha=<SHA completo da revisão da imagem anterior>
target_sha=<SHA completo validado para o deploy>
image=sha256:<ID completo da imagem anterior>
mounts_sha256=<SHA-256 de mounts.txt>
sources_sha256=<digest de mount-sources.sha256>
runtime_sha256=<SHA-256 de runtime-config.txt>
config_sha256=<SHA-256 da evidência não secreta de configuração>
schema_sha256=<SHA-256 da evidência não secreta de schema/migração>
schema_status=compatible
strategy=application
loss_decision=acknowledged
authorization=approved
reviewer=<identificador não secreto do responsável>
```

`strategy` aceita `application` ou `data`; a primeira só é permitida quando a compatibilidade do banco atual com a imagem anterior estiver comprovada. A segunda exige decisão explícita sobre perda de dados, janela e autorização de restauração — o preflight não restaura nada. O revisor deve associar o SHA anterior à imagem real e verificar volumes, bind mounts, variáveis/segredos necessários e compatibilidade/migrações por evidência externa; os hashes ligam os registros, mas **não provam por si só que a avaliação humana está correta**. Os arquivos não devem conter senhas, tokens ou envs completos. Dados ausentes, desconhecidos ou divergentes exigem parar e escalar; não preencher valores fictícios para liberar produção.

## Retorno e verificação

O procedimento é deliberadamente não destrutivo: não automatiza troca de imagem, `pg_restore`, limpeza de volume ou cópia sobre anexos. Após uma decisão explícita e autorização operacional, uma equipe deve escolher e executar um plano específico testado para aplicação apenas ou restauração de dados. Restauração de dados pode perder alterações posteriores ao backup e requer confirmação de consistência e acesso exclusivo; imagem ou schema sem prova bloqueiam o retorno.

Depois de executar o plano autorizado, comparar conteúdo de banco e anexos com evidência apropriada e registrar a declaração não secreta `sha=<SHA> integrity=verified` em arquivo privado. `scripts/verify-rollback-return.sh <conjunto> <SHA> <URL-/api/health> <declaração>` verifica o conjunto, a declaração e health JSON com `status=ok` e `db=connected`; exige `curl` e `jq`. Timeout, resposta ausente/ambígua, integridade não declarada ou SHA inválido bloqueiam o resultado. A declaração é uma atestação humana, não uma prova automática de restore: QA/operação deve conferir a evidência real. Não incluir tokens ou conteúdo de env na declaração.

## Checklist da recuperação integral — não concluído operacionalmente

| Item | Responsável sugerido | Evidência exigida antes de agir |
|---|---|---|
| Host, checkout, SHA em execução e ausência de concorrência fora do lock | Operador | Estado e revisão conferidos sem valores secretos |
| Envs, Actions Secrets e permissões | Operador de acessos | Presença/uso e responsável, sem conteúdo |
| Backup de banco e anexos, conjunto, cópia externa e ensaio de restore | Operador de dados | ID/hashes, destino isolado e comparação de conteúdo |
| Imagem anterior, configuração, volumes e bind mounts | Operador de infraestrutura | Identidade, tag preservada e evidência recuperável não secreta |
| Schema/migrações, estratégia e perda tolerada | Responsável técnico e dono dos dados | Revisão de compatibilidade, decisão e autorização explícitas |
| CI, staging no mesmo SHA e produção | QA e operador | Gates e health verificados antes da promoção |
| Domínio, DNS, TLS e e-mail | Operador autorizado do domínio | Confirmação efetiva nos provedores e teste autorizado, sem credenciais |

Nenhuma linha acima é uma alegação de verificação real nesta entrega. Checkout legado restaurado não equivale a rollback do serviço; o procedimento NXG-031 continua separado no runbook §7.


## Nova baseline — histórico e limites de recuperação

`baseline-evidence-fixture.mjs` e `synthetic-rehearsal.mjs` são exclusivamente sintéticos: sua chave, emissor, verificador e resultados não são uma fonte operacional. `synthetic-safe-extract.mjs` aceita somente tar restrito para fixture isolada. O harness `rehearsal-postgres-real.mjs` foi preparado e exercitado com dublês isolados; sua execução real exige autorização específica, contexto/socket e imagem PostgreSQL 16 preexistente fixados. QA aprovou CT-N04 com ressalvas após ensaio PostgreSQL real local, exclusivamente sintético, com observador independente antes da limpeza: foram conferidos conteúdo restaurado, anexo, hashes e limpeza dos recursos do ensaio. Isso não comprova saúde da aplicação nem restore ou rollback em produção. A cadeia GitHub e o vínculo da imagem atual foram comprovados em 20/11/2026; ver STATUS. A recuperação integral segue dependendo de validação própria. E1 da imagem legada permanece desconhecido; BA10 real e os NO-GO de preflight e retorno permanecem pendentes.

A seleção PG16 do ensaio exige política controlada em `<checkout>/.maestro/coord-qa/ct011-policies/`, ID exato e hash e referência de decisão previamente aprovados, informados separadamente antes de create/start; a política pressupõe usuário e checkout confiáveis. Permissões e hash não autenticam a origem. Ela não comprova proveniência de imagem de produção. A ausência da política bloqueia; não há política real provisionada por esta mudança. A checagem `pg_isready` posterior é readiness do PostgreSQL, não health da aplicação.

## Primeira baseline — desenho histórico

A baseline inicial bed9 foi publicada manualmente em 12/11; o CD recorrente posterior foi comprovado em 20/11. A descrição abaixo preserva o contrato de primeira entrada e não é a receita de promoção recorrente atual.

O CD local preparado responde ao término de `Staging verificado` ou a `workflow_dispatch` na main com ID exato de staging. Nos dois casos, o runner usa controlador previamente fixado e políticas externas separadas: `nxg-staging-policy-v1` para consultar repo/workflow/run/tentativa e verificar a atestação do recibo de staging; `nxg-build-base-v1` para verificar novamente a origem CI, tar e recibo. Os campos SHA, CI run, artifact, digest ZIP e digest tar devem coincidir; não há fallback por health genérico. O ID do workflow staging precisa ser obtido e confirmado por API autenticada e incorporado à política aprovada; não se supõe um ID antes da criação. A política de staging contém `version`, `decision`, `workflowId`, `candidateSha`, `sourceSha`, `signerSha`, `ghPath` e `ghSha256`; SHA do source de staging e SHA do signer são verificados separadamente e não precisam ser iguais ao candidato da aplicação.

Para a primeira entrada, o operador autorizado provisiona previamente, no diretório Git do host, `nxgest-first-baseline-policy` regular 0600 ou 0400 do usuário do deploy, com nove linhas exatas: `mode=first-baseline-v1`, `environment=production`, `sha=<SHA aprovado>`, `tar=<sha256:tar>`, `zip=<sha256:ZIP>`, `ci_run=<ID>`, `artifact=<ID>`, `staging_run=<ID>` e `decision=<referência aprovada>`. A referência é um identificador sem espaços; nenhum campo contém segredos. O hash SHA-256 desse arquivo é aprovado separadamente como `CT011_FIRST_POLICY_SHA256` no ambiente protegido. A política deve ser preparada após existir o recibo de staging; se o CD automático chegar antes, falha fechado. O disparo manual posterior continua exigindo o mesmo recibo atestado e artifact. Esta descrição não provisiona política nem executa operação.

Sob o lock do bootstrap, o host exige marker de staging no SHA, política e hash exatos, staging ainda com imagem aprovada e health/DB positivos. Ele grava um marker de pendência antes de qualquer troca, guarda uma cópia exclusiva do tar aprovado no diretório Git, carrega a imagem sem pull/build, sobe o app e compara o ID efetivo ao observado em staging, além de verificar health/DB. Só então grava marker de baseline estabelecida e emite recibo saneado. Marker estabelecido ou pendente impede repetir modo inicial; erro após criação da pendência exige investigação e procedimento aprovado, sem exclusão automática. O tar preservado é uma base candidata para recuperação futura, não prova de backup íntegro ou rollback executável. O caminho com exigência de recuperação integral permanece bloqueado por BA10/rollback; promoções pré-clientes explicitamente autorizadas têm contrato separado e já foram comprovadas.

A troca pode interromper o serviço e afetar sessões ou escritas em trânsito; não há duração medida nem garantia de zero downtime. O código não remove volumes, dados ou `.env`, mas iniciar a aplicação pode executar criação/migração de schema e produzir escritas normais. Operação e QA devem avaliar compatibilidade, escritores, janela, retenção e consequências antes de usar o fluxo. A imagem legada continua sem origem comprovada; dados descartáveis não autorizam reset ou apagamento. Origem/transporte/aplicação/health do fluxo pré-clientes já têm evidência real em 20/11. Este fato não demonstra backup/restore ou generaliza os contratos históricos para dados reais.

### Pausa controlada e metadados GH do runner — desenho histórico

Atualização 20/11: reviewers foram preservados; as policies e authorities foram provisionadas e a cadeia executada. Os consumidores agora instalam GH oficial 2.103.3 por hashes aprovados; não dependem do GH pré-instalado no runner.

O job `build-artifact` registra no resumo do próprio job, associado ao run e SHA, apenas o resultado de `command -v gh`, caminho físico, versão e SHA-256 do binário pré-instalado. A consulta de versão recebe ambiente vazio e não imprime env, credenciais ou token. O resumo é observação vinculada ao job, não prova autônoma de identidade, correção ou procedência do binário. Nenhum valor foi coletado pela implementação local.

Após QA do candidato, a Coordenação planeja usar a proteção dos ambientes `staging` e `production` como pausa operacional: consultar por API autenticada o run/SHA aprovado, resolver o ID real do workflow staging e conferir os metadados públicos do GH antes de provisionar as políticas controladas e liberar o job correspondente. No desenho inicial essa configuração ainda era futura; a configuração e a execução atuais estão registradas no STATUS. A política de build fixa `version=nxg-build-base-v1`, `decision`, `expiresAt`, `repo`, `sourceSha`, `signerSha`, `workflowId`, `ghPath`, `ghSha256`; o run e artifact são resolvidos pelo evento/API, não pelo pacote. A política de staging fixa `version=nxg-staging-policy-v1`, `decision`, `workflowId`, `candidateSha`, `sourceSha`, `signerSha`, `ghPath`, `ghSha256`. A decisão e o hash de cada arquivo são aprovados separadamente; signer/source/candidato são conceitos distintos.

Configuração usada pelo código, sem valores: em ambos os ambientes, variável `CT011_CONTROLLER_SHA`, Secret `CT011_BUILD_POLICY`, variáveis `CT011_BUILD_POLICY_SHA256` e `CT011_BUILD_POLICY_DECISION`; em produção, Secret `CT011_STAGING_POLICY`, variáveis `CT011_STAGING_POLICY_SHA256`, `CT011_STAGING_POLICY_DECISION` e `CT011_FIRST_POLICY_SHA256`. Transporte usa os Secrets existentes `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`; a chave pública aceita está em `infra/staging-known-hosts`. A política inicial e suas nove linhas no host estão descritas acima. A Coordenação não deve tratar o JSON do artifact como autoridade nem expor conteúdo de Secrets.

O runner de CI e os runners de staging/produção são máquinas efêmeras diferentes: o caminho, versão e hash observados no build **não garantem** os mesmos bytes nos jobs seguintes. A política deve apontar para binário e hash efetivamente confiáveis no job consumidor; o verificador rechecá-los-á e falhará fechado se divergirem. A existência de um resumo CI não demonstra por si que isso seja possível antes da liberação do job. O workflow atual instala e confere a versão oficial fixada antes da verificação; a passagem real foi comprovada. Não usar o GH local 2.94 como substituto do executável aprovado. Node/GH são necessários no runner, não no VPS.

### Health do container selecionado

Os gates locais de staging, retry e primeira baseline agora exigem health interno além do smoke da URL pública. `container-health.sh` resolve e reconfere ID e imagem, executa Node dentro desse ID e consulta `127.0.0.1` usando a porta `PORT` do ambiente do container, sem imprimir seu valor ou resposta. Exige HTTP 200 e JSON com `status=ok` e `db=connected`; ausência de porta, falha, timeout ou troca de identidade bloqueia. O host precisa de GNU `timeout` e Docker; Node é executado na imagem da aplicação, não no host. A sonda tem limites de tempo e tamanho de resposta. URL pública continua sendo smoke adicional: não demonstra, isoladamente, a rota ou o conteúdo de frontend servidos pelo proxy. A correlação entre recibo, imagem, container e health foi conferida na publicação de 20/11; isso não valida recuperação integral ou todas as telas do frontend.
