# 06 — Produção (Runbook de Operação)

## 1. Visão geral do ambiente

| Componente | Configuração atual |
|---|---|
| Produção | https://nxgest.com.br |
| Homologação | https://nxgestao.duckdns.org |
| VPS | `172.245.152.223`, AlmaLinux 8.10, SSH por chave |
| Aplicação | Node 24 LTS + Express, frontend React compilado na mesma imagem |
| Banco | PostgreSQL 16, sem porta publicada no host de produção |
| Proxy/TLS | Caddy; DNS de nxgest.com.br no Cloudflare |
| E-mail | Resend, remetente `no-reply@nxgest.com.br` |
| Checkout | `/opt/nxgestao`; `.env` privado, fora do Git |
| Dados | Volume `/data`, anexos em `/data/uploads`; volume PostgreSQL separado |
| Backup | `/opt/backups`, conjunto associado de banco/anexos e imagem preservada |

SQLite e Redis não fazem parte da stack atual. A aplicação inicia schema/migrações no boot. Não apontar uma instância de teste para o banco publicado.

O [STATUS](../STATUS.md) registra a última publicação comprovada e os limites da consolidação. O provedor não oferece snapshot: backup no mesmo VPS não protege contra perda do host. Manter cópia externa privada.

## 1.1 — Pipeline CI/CD

`push/merge main` → **CI** → **Staging verificado** → **CD**. PRs validam o código, mas não publicam. CI manual não substitui o push elegível. O build ocorre uma vez; staging e produção promovem a mesma imagem atestada, sem rebuild no VPS.

Staging e production exigem aprovação de seus environments. Além dos checks verdes, confirmar run/SHA/tentativa, origem do artifact, policies e controlador antes de aprovar. Policies vencidas ou divergentes bloqueiam o fluxo.

## 2. Acesso SSH

```bash
ssh -o BatchMode=yes root@172.245.152.223
```

Usar a chave operacional provisionada; não copiar a chave para o repositório. As chaves restritas dos runners são diferentes da chave administrativa e entram por gateways com comandos limitados.

## 3. Credenciais

Acessos externos são mantidos fora do projeto em `~/.config/nxgestao/`. No VPS, `/opt/nxgestao/.env` deve permanecer regular e privado (0600). Nunca imprimir seu conteúdo em logs ou copiar credenciais para fixtures.

Produção exige `DATABASE_URL`, `JWT_SECRET`, endereço público, CORS e configuração de e-mail corretos. Domínio DNS/TLS, Resend e GitHub não são provisionados apenas pelo clone do código.

## 4. Deploy de atualizações (fluxo normal)

1. Implementar e validar em branch; abrir PR para main. CI inclui tipos/build, auditorias, unitários/UI, smoke isolado e invariantes do PostgreSQL.
2. Integrar a PR; o push de main produz a imagem e sua atestação.
3. Aprovar o environment staging após conferir o CI de origem. A homologação verifica bytes/origem, aplica a imagem, confere banco/health e publica recibo atestado.
4. Aprovar production após conferir o staging de origem. CD promove a mesma imagem, valida configuração/DB/health, atesta o recibo e finaliza os journals da operação.
5. Conferir Actions, identidade efetiva da imagem nos dois ambientes, `/api/health` e frontend público. Não considerar apenas o HTTP do proxy como prova da imagem executada.

[CI](https://github.com/RafaCartaxo/nxgest/actions/workflows/ci.yml), [Staging](https://github.com/RafaCartaxo/nxgest/actions/workflows/staging.yml) e [CD](https://github.com/RafaCartaxo/nxgest/actions/workflows/cd.yml).

### 4.1 — Decisão, origem e promoção recorrente

O modo atual é pré-clientes. As authorities e policies em `.git/` fixam controlador, host, topologia, hashes das policies de runner e validade. Variáveis/Secrets dos environments precisam corresponder exatamente a essas fontes. Renovação exige alterar fontes, hashes e authorities de forma coordenada, sem operação ativa. Se o staging anterior foi aplicado sob outro hash, provisionar o registro privado `nxgest-staging-policy-transition-<hash-anterior>-<hash-novo>` em `.git/`: sete linhas exatas `version=staging-policy-transition-v1`, `environment=staging`, `from=sha256:<anterior>`, `to=sha256:<novo>`, `controller=<SHA completo>`, `decision=<decisão da policy nova>`, `expires_epoch=<validade da policy nova>`. Arquivo regular 0600 do operador. Conferir a policy anterior e seu journal antes de autorizar; não alterar o journal antigo. Ausência, divergência ou expiração bloqueiam a transição.

O controlador é um commit completo previamente aprovado; não é automaticamente o HEAD do artifact. Promover uma nova aplicação não significa trocar o controlador em cada deploy. Atualizá-lo quando seus scripts mudarem, após validar os novos contratos.

Os workflows instalam GH oficial 2.103.3: arquivo SHA256 `4c806978ffce1cec70853302a56d70ac6da4f19bae7adca4e1a8ab00633dd91d`, binário SHA256 `b768184570b12536be4ac1528893f6340d1c6a7b40b56ad45bca9cd0e87ad34d`. A verificação recusa executável divergente. O jq do host é provisionado em `.git/nxgest-tools/jq`, hash `b1c22172dd303f3be49e935aa56aa48a8b7a46e0bc838b4997d3bb451495870f`; não há instalação implícita no deploy.

Policies são verificadas por bytes, incluindo quebra de linha final. Ao atualizar Secrets, preservar os bytes exatos pela API sealed-box; não assumir que stdin do `gh secret set` conserva CR/LF. Não registrar plaintext em logs.

### Identidade estável da configuração de produção

O fingerprint compara configuração efetiva, ambiente operacional ordenado e HostConfig. Ignora labels voláteis do Compose. Defaults da imagem são identificados pela imagem exata e retirados da comparação; overrides diferentes continuam protegidos. Compose, arquivo de ambiente, mounts, redes, peers e identidade anterior têm guardas próprias. Não reescrever policies automaticamente para aceitar um estado inesperado.

### 4.2 — Caminho manual e modos anteriores

Para repetir uma promoção elegível: Actions → CD → Run workflow, informando `staging_run` exato aprovado. As mesmas verificações continuam obrigatórias. Um staging cujo SHA já está publicado não é uma nova publicação elegível.

`scripts/deploy-bootstrap.sh` permanece para bootstrap/recuperação especificamente autorizados, sob lock e policy do modo escolhido. Primeira baseline, adoção e reparo legado são contratos distintos; não são fallback para falha no recurring. Receitas históricas foram [arquivadas](../arquivo/2026-11-20-producao-runbook-anterior.md).

### 4.3 — Falhas e retorno operacional

Interromper novas promoções quando houver pending/active não finalizado. Preservar artifacts, recibos, journals e imagem anterior. Diagnosticar o ponto de falha e comparar o estado efetivo antes de reconciliar. Não apagar markers para forçar passagem, não usar reset destrutivo nem recriar volumes para resolver verificação de origem/configuração.

## 5. Backup

O procedimento atual é [backup e recuperação](09-BACKUP-ROLLBACK.md): pausa controlada da aplicação, dump + anexos no mesmo conjunto, retomada e restauração em recursos novos isolados. A instalação/execução comprovada é registrada no STATUS. Não tratar arquivos antigos soltos como conjuntos associados.

```bash
bash /opt/scripts/nxgest/backup-maintenance.sh
bash /opt/scripts/nxgest/backup-restore-check.sh /opt/backups/ID-EXATO
```

O cron está em `/etc/cron.d/nxgest-backup`, às02h/14hUTC, com caminho absoluto e log privado em `/var/log/backup-nxgest.log`. Cópia externa: transferir o diretório completo e preservar a imagem de origem exportada ou recuperável. `backup:pull` valida integridade, mas não executa restauração.

## 6. Logs e monitoramento

```bash
cd /opt/nxgestao
docker compose -f infra/docker-compose.prod.yml ps
docker logs --tail 100 nxgestao-app-1
docker logs --tail 100 nxgest-postgres
curl -fsS https://nxgest.com.br/api/health
curl -fsS https://nxgestao.duckdns.org/api/health
```

Health exige `status=ok` e `db=connected`. Logs da aplicação podem conter dados pessoais/tokens de desenvolvimento: não publicar dumps de logs nem env completos. Diagnóstico de frontend deve conferir HTML, assets e versão da imagem.

## 7. Rollback de emergência

Não há restauração automática de dados pelo CD. Antes de voltar uma imagem, confirmar compatibilidade de schema e dados, imagem preservada e backup com restore positivo. Um checkout antigo não restaura serviço nem banco. Recuperação real deve parar a aplicação, usar destinos explícitos, preservar os volumes anteriores e validar o conjunto restaurado antes de retomá-lo.

## 8. Administração de usuários

Preferir os fluxos autenticados da aplicação e os casos de uso documentados. Seeds/defaults são para bootstrap e demonstração; não são mecanismo diário de gestão de senhas. Não registrar senhas de produção em documentação. Ver [API](02-API.md) e [fluxos](../product/06-CASOS-DE-USO.md).

## 9. E-mail — Resend + domínio

`development` usa ConsoleMailer e não envia e-mail real. Staging/produção usam `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` opcional e `APP_URL` do ambiente. Chave ausente em produção falha fechada; timeout/rede são indisponibilidade, sem retry automático que duplique envio.

Validar pelo mailer compilado da própria imagem publicada. Para diagnóstico sem destinatário humano, usar o destinatário simulado oficial `delivered@resend.dev`. Registrar somente status/ID; chave e conteúdo pessoal permanecem privados. HTTP aceito pelo Resend não prova entrega em uma caixa humana. Conferir domínio/remetente, SPF/DKIM e eventos no provedor quando a entrega real apresentar problemas. Não copiar scripts candidatos nem instalar tsx pela rede no container publicado.

## 10. Problemas conhecidos e alertas

- Backup e imagem mantidos apenas no VPS não sobrevivem à perda do host.
- Policies possuem validade; renovar fontes/hashes/authorities coerentemente antes do vencimento.
- Migrações executam no boot; health conectado não demonstra compatibilidade de rollback.
- Testes automatizados não substituem revisão visual de todos os fluxos. [Telas](05-MAPEAMENTO-TELAS.md), [componentes](design/04-UI-COMPONENTS.md) e [design](design/UI-COVERAGE.md) permanecem disponíveis para evolução.

## 11. Hardening do host

Manter SSH por chave, portas do banco fechadas, segredos privados e gateways restritos. Backup e deploy compartilham lock. Para outra máquina/VPS, seguir [setup](08-SETUP-NOVA-MAQUINA.md), provisionar identidades e acessos próprios e validar restauração antes de assumir continuidade operacional.
