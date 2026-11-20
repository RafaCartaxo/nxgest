# Scripts do NX Gest

Este diretório contém ferramentas de desenvolvimento, CI, operação e testes. Não é uma lista de comandos que devam ser executados em sequência. Scripts sem referência em `package.json` podem ser dependências de outros scripts, ferramentas manuais ou testes opt-in.

## Caminho da publicação

1. Push/merge em `main` inicia `.github/workflows/ci.yml`: qualidade, smoke e migração; depois, build único e atestações.
2. CI aprovado aciona `.github/workflows/staging.yml` pelo evento `workflow_run`. Apenas push de main, tentativa1 e workflow esperado são elegíveis.
3. O environment staging exige aprovação. O workflow verifica origem/artefato, aplica a imagem e publica o recibo atestado.
4. Staging aprovado aciona `.github/workflows/cd.yml` por `workflow_run`. O environment production exige sua própria aprovação.
5. CD verifica o recibo e promove a mesma imagem, sem rebuild; atesta/publica o recibo de produção e finaliza a transação.

Uma PR sozinha não publica. `workflow_dispatch` do CI não substitui o push elegível de main. O CD manual recebe `staging_run`, não uma ref arbitrária. Policies, controladores, prazos e chaves restritas também precisam ser válidos. O fluxo operacional atual é pré-clientes e mantém gates próprios; publicação bem-sucedida não comprova rollback integral.

Fonte operacional: [runbook](../docs/engineering/06-PRODUCAO.md). As condições exatas estão nos workflows, não neste resumo.

## Famílias e uso

| Família | Exemplos | Papel |
|---|---|---|
| Qualidade e documentação | `audit-*.mjs`, `check-dist.mjs`, `build-collection.mjs`, `consumers.mjs` | Checks e manutenção documental |
| Banco e smoke | `create-schema.mjs`, `migrate-modelo.mjs`, `valida-modelo.mjs`, `seed-demo.mjs`, `smoke*.mjs` | Preparação/validação de ambientes; seed e migrações alteram dados |
| Verificação de origem | `build-provider.mjs`, `build-attestation.mjs`, `verify-build-artifact.mjs`, `verify-staging-receipt.mjs` | Seleção, bytes e atestações |
| Publicação recorrente | `recurring-runner.mjs`, `recurring-staging-gateway.sh`, `recurring-production-entry.sh`, `recurring-host-policy.sh` | Runner, entrada SSH restrita e políticas do host |
| Aplicação e finalização | `staging-post-baseline-*.sh`, `production-preclients*.sh`, `container-health.sh`, `load-verified-image.sh`, `retain-verified-image.sh` | Estado, imagem, saúde e finalização; não chamar avulsamente |
| Bootstrap e recuperação | `deploy-bootstrap.sh`, `deploy*.sh`, `initial-baseline.sh`, `staging-adoption-*.sh` | Caminhos controlados de adoção/recuperação; não são lixo só por não serem o fluxo diário |
| Backup atual | `backup-maintenance.sh`, `backup-restore-check.sh`, `backup-maintenance-common.sh` | Pausa curta, dump + anexos associados, retomada e restauração isolada verificável |
| Recuperação e ferramentas anteriores | `backup-nxgest.sh`, `pull-backup.sh`, `verify-backup.sh`, `rollback*.sh`, `rehearsal*.mjs` | Compatibilidade com formatos anteriores; não misturar com o bundle maintenance-v1 |
| Testes e guardas | `*.check.*`, `*fixture*`, `test-*-isolated.sh`, `guards/` | Dublês/isolamento; alguns cenários são opt-in |

## Uploads e temporários

`uploads/` é armazenamento local de anexos, não código. Em produção, `UPLOADS_DIR=/data/uploads` aponta para volume persistente. Não apagar arquivos reais apenas porque não constam no banco local: eles podem pertencer a outro histórico/ambiente.

O smoke gera um PDF sintético de521bytes (`%PDF-1.4` seguido de espaços), adequado ao teste de MIME, mas sem estrutura de documento para um leitor PDF. Não usá-lo como documento real. Limpeza deve conferir conteúdo e referências no banco local, preservando documentos reais.

`.nxg-build-verified-*` contém downloads temporários; `.nxg035-fixture-*` e `.ba10-fixture-*` são áreas geradas por testes. Antes de limpar, conferir ausência de processos em uso, origem e evidências necessárias. Esses caminhos e `.maestro/` não entram no Git nem no contexto Docker.

## Arquivo e experimentos

O migrador SQLite e o experimento BA10 foram retirados da árvore ativa. O histórico Git e o snapshot operacional externo preservam o material; eles não são requisitos de instalação, publicação ou backup atual. Testes de segurança e recuperação que ainda verificam caminhos suportados permanecem no repositório.
