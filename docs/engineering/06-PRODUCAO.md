# 06 — Produção (Runbook de Operação)

**Status:** Aprovado

**Criado:** 31/07/2026

**Projeto:** NX Gest

**Documentos relacionados:** `plans/PLAN-018-deploy.md` (deploy), `foundation/ADR-004-Infra-Deploy.md` (decisão de infra), `engineering/08-SETUP-NOVA-MAQUINA.md` (setup de máquina e Disaster Recovery)

---

## 1. Visão geral do ambiente

| Item | Valor |
|------|-------|
| URL | **oficial:** `https://nxgest.com.br` (PLAN-068 aplicado 08/08) |
| Homologação | **staging:** `https://nxgestao.duckdns.org` (desde 11/08 — ex-transitório de prod, agora QA) |
| IP do VPS | `172.245.152.223` |
| Provedor | VPS Hosting Service (`vpshostingservice.co`) |
| SO | AlmaLinux 8.10 |
| Docker | 26.1.3 + Compose v2.27.0 |
| Repo no VPS | `/opt/nxgestao` (clone do GitHub `RafaCartaxo/nxgest`) |
| Arquivo `.env` | `/opt/nxgestao/.env` (prod, chmod 600) · `/opt/nxgestao/.env.staging` (staging, chmod 600) |
| Banco | **PostgreSQL 16** (único banco — PLAN-070): prod em `nxgestao_pgdata` (container `nxgest-postgres`) · staging em `nxgestao_staging_pgdata` |
| Proxy + HTTPS | Caddy (container `nxgestao-caddy-1`), roteia 2 blocos: `nxgest.com.br → app:8080` · `nxgestao.duckdns.org → staging-app:8081` |
| Rede compartilhada | `nxgestao_net` (external) — permite o Caddy alcançar os dois stacks |

> **Alerta de infra:** o provedor **não oferece snapshots/backups**. A única proteção de dados é o backup cron (seção 5). Cópia off-site é responsabilidade manual.

---

## 1.1 — Pipeline CI/CD (desde 11/08)

| Etapa | Onde | Gatilho |
|-------|------|---------|
| **CI** (`.github/workflows/ci.yml`) | GitHub Actions | push/PR/manual |
| — job `test` | tsc · build · check-dist · audit:ui/styles/modules · vitest (154) · coverage · docs:audit | — |
| — job `smoke` | schema isolado → seed → smoke-api (278 cenários, DB/rate limits isolados) | — |
| — job `deploy-staging` | SSH → VPS → `scripts/deploy-staging.sh` → **staging no ar** | merge/push à `main`, após test+smoke |
| **CD** (`.github/workflows/cd.yml`) | GitHub Actions | `workflow_run` (CI concluído em main) + manual (`workflow_dispatch` com input `ref`) |
| — job `validate` | CI verde do push + health do staging (gate de promoção) | — |
| — job `deploy-prod` | environment `production` → SSH → `scripts/deploy.sh` → health pós-deploy | após `validate` |

**Regra de promoção:** produção **só recebe código que passou CI e staging**. No automático, o CD é acionado pelo `workflow_run` do CI (que inclui o deploy-staging). No manual, `Actions → CD → Run workflow` com opção de escolher `ref` (branch/tag/commit) para deploy sob demanda ou rollback.

**Secrets usados:** `VPS_HOST` · `VPS_USER` · `VPS_SSH_KEY` (privada `id_ed25519` sem passphrase, do host dev).

**Staging:** DB isolado + seed fake (200 clientes/29 usuários, senha `teste123!`). Seed aplicado **apenas na 1ª vez** (banco sem clientes). Produção nunca é tocada pelo deploy-staging.

---

## 2. Acesso SSH

- Acesso root **somente por chave SSH** (senha desabilitada).
- Chave pública instalada: `~/.ssh/authorized_keys` no VPS (ed25519 da máquina local de desenvolvimento).

```bash
ssh root@172.245.152.223
```

> Se a chave for perdida: recuperar acesso pelo painel do provedor (console/VNC) e reinstalar a chave em `/root/.ssh/authorized_keys` (passo a passo detalhado em [`08-SETUP-NOVA-MAQUINA.md §6.2`](08-SETUP-NOVA-MAQUINA.md#62-se-voc-gerou-uma-chave-ssh-nova-ou-perdeu-a-antiga)).

---

## 3. Credenciais

As credenciais **não ficam no repositório**. Localização dos valores:

| Credencial | Onde está | Nota |
|-----------|-----------|------|
| Admin default (`admin@cobranca.com`) | `.env` no VPS (`ADMIN_DEFAULT_PASSWORD`) + cópia local em `~/.config/nxgestao/vps-admin-pw.txt` | Senha gerada no deploy |
| Thalia N Medina (`thalianietomedina@hotmail.com`) | Cópia local `~/.config/nxgestao/thaliana-pw.txt` | Criada via admin em 31/07/2026 |
| `JWT_SECRET` | `.env` no VPS | Gerado com `openssl rand -hex 32` |
| Senha root do VPS | Cópia local `~/.config/nxgestao/vps-root-pw.txt` | Trocada no primeiro acesso; SSH usa chave |
| Usuários do sistema | Criados via `POST /api/admin/operadores` (role `admin`/`operator`) | Ver PLAN-017 |

> **Regra:** nunca versionar `.env`, senhas ou tokens. Trocar senha via `chpasswd` se vazar em chat/log.

### 3.1 — Acessos externos (contas fora do repo)

| Serviço | Conta | Como acessar | Detalhes |
|---------|-------|--------------|----------|
| Painel VPS (`vpshostingservice.co`) | `rafael.cartaxo@hotmail.com` | Login no site do provedor | Senha não registrada no repo — ver `~/.config/nxgestao/ACESSOS.md` |
| DuckDNS (`nxgestao.duckdns.org`) | `rafael.cartaxo@hotmail.com` | Login via Google (OAuth) | Domínio de **homologação (staging)** desde 11/08 |
| GitHub | `RafaCartaxo` | `gh` CLI (keyring) | Repo `RafaCartaxo/nxgest` |
| VPS SSH | `root` | Chave ed25519 local | Senha desabilitada (`PasswordAuthentication no`) |

> Todos os valores de senha externos ficam em **`~/.config/nxgestao/ACESSOS.md`** (chmod 600, fora do repo).

---

## 4. Deploy de atualizações (fluxo normal)

O deploy automático obtém o SHA validado pelo CI, bloqueia o checkout compartilhado e carrega o bootstrap diretamente desse SHA antes de trocar arquivos. O staging só registra o SHA após concluir com sucesso; produção exige esse mesmo SHA e backup obrigatório. Uma tentativa concorrente falha sem alterar o checkout. O checkout com alterações rastreadas ou arquivos novos não ignorados é recusado; arquivos ignorados em conflito com o alvo também bloqueiam a troca. Nunca use `reset --hard` para contornar o bloqueio.

Para operação manual **somente após autorização e validação do SHA no CI**, execute no checkout operacional. Use primeiro `staging`; produção só aceita o mesmo SHA registrado por staging. É necessário Git, Bash e `flock` (util-linux) no host; o helper e o script são carregados do SHA alvo. Ref antiga que não contém o bootstrap é recusada pelo fluxo normal; para recuperar apenas o checkout, siga as condições específicas da seção 7.

```bash
# No host operacional, após escolher um SHA completo e validado:
SHA=COLE_O_SHA_VALIDADO_DE_40_CARACTERES
MODO=staging  # production apenas após staging para o mesmo SHA
(
  set -euo pipefail
  cd /opt/nxgestao
  [[ "$SHA" =~ ^[0-9a-f]{40}$ ]]
  exec 9>"$(git rev-parse --git-path nxgest-deploy.lock)"
  flock -n 9
  git fetch --no-tags origin "$SHA"
  git show "$SHA:scripts/deploy-bootstrap.sh" | bash -s -- "$MODO" "$SHA"
)
```

O lock deve ser mantido durante fetch, checkout e deploy. Ele serializa apenas entradas que o utilizem: antes da primeira transição, o operador deve assegurar que não há scripts legados, outros comandos Git ou deploys externos concorrentes no checkout; não os encerre automaticamente. Interromper após o checkout pode deixar o HEAD no SHA alvo, sem construir; antes de repetir, verificar o estado e o backup. `.env`, `.env.staging`, dados, volumes e configurações operacionais permanecem externos ao Git. O marcador de staging fica no diretório Git e é invalidado antes de cada tentativa; não prova sozinho a saúde atual do serviço.

O `scripts/deploy.sh`:
1. Exige `.env` presente (senão aborta)
2. **Backup e preflight obrigatórios** — exige script instalado idêntico ao versionado, conjunto íntegro e evidências de imagem/configuração/schema e decisão aprovadas; falha fechada, sem bypass automático. Ver seção 5 e [procedimento de recuperação](09-BACKUP-ROLLBACK.md).
3. **Gates de UI** — roda `audit:ui`, `audit:styles` e `audit:modules` via `docker run node:20-slim` (o host não tem node no PATH); **aborta o deploy se qualquer gate falhar**
4. `docker compose --project-directory . -f infra/docker-compose.prod.yml build app`
5. `docker compose --project-directory . -f infra/docker-compose.prod.yml up -d`
6. A imagem anterior recebe tag dedicada; não há prune automático.

**Dados:** o volume `nxgestao_nxgestao_data` sobrevive a builds e `up`/`down` — o banco não é recriado.

**Validação pós-deploy:**

```bash
curl -s https://nxgest.com.br/api/health
# → {"status":"ok","db":"connected",...}
```

---

## 5. Backup

### 5.0 — PostgreSQL e anexos associados

O candidato versionado `scripts/backup-nxgest.sh` cria um conjunto associado, conserva a imagem anterior e falha fechado diante de ausência ou erro dos componentes. A instalação operacional real não foi verificada nesta entrega. Consulte [Backup e retorno do serviço](09-BACKUP-ROLLBACK.md) para formato, integridade, cópia off-site, evidências e limites de restauração. Hashes e listagem do dump não demonstram restore real.

---

## 6. Logs e monitoramento

| O que | Comando |
|-------|---------|
| Logs do app (tempo real) | `docker compose --project-directory /opt/nxgestao -f /opt/nxgestao/infra/docker-compose.prod.yml logs -f app` |
| Logs do Caddy | `docker compose --project-directory /opt/nxgestao -f /opt/nxgestao/infra/docker-compose.prod.yml logs -f caddy` |
| Status dos containers | `docker compose --project-directory /opt/nxgestao -f /opt/nxgestao/infra/docker-compose.prod.yml ps` |
| CPU/memória | `docker stats` |
| Disco | `df -h` |
| Processos | `docker ps` |
| Health check remoto | `curl -s https://nxgestao.duckdns.org/api/health` |

---

## 7. Rollback de emergência

Antes de um rollback que possa tocar dados, faça e verifique um backup conforme a seção 5. Após aprovação operacional, selecione um SHA de recuperação com CI válido, promova-o para staging e use o bootstrap por SHA da seção 4 para produção. O fluxo exige o mesmo SHA em staging e não descarta alterações no checkout. Um SHA histórico sem bootstrap ou dependências compatíveis exige plano de recuperação específico e revisão antes de qualquer operação.

Se apenas o processo travou e a imagem atual permanece válida, um operador autorizado pode avaliar o reinício do serviço `app` pelo Compose de produção, sem trocar a revisão ou recriar dados. Verifique o health e preserve os logs para diagnóstico.

### Recuperação do checkout legado após a primeira transição

Este procedimento recupera **somente os arquivos Git** de um SHA legado, sem executar seus scripts nem trocar imagens, containers, volumes ou dados. Ele foi testado com repositórios e backup sintéticos; **não foi testado em servidor real e não comprova rollback do serviço**. Antes de qualquer operação real, obtenha autorização, confirme backup recuperável, compatibilidade de schema e efeitos de bind mounts: a troca de arquivos pode remover caminhos usados por mounts (por exemplo `infra/Caddyfile`); não reinicie nem recrie serviços sem um plano próprio. Confirme que não há deploy legado ou Git fora do lock em andamento e que o checkout está limpo.

Escolha um SHA controlador **confiável que contenha** `scripts/deploy-recover-legacy.sh` e um SHA legado completo conhecido com Compose/Caddy na raiz. O arquivo de controle é lido do controlador, mesmo depois que o checkout muda. Ambos devem estar disponíveis no remoto. Nenhuma credencial ou conteúdo de env deve aparecer no registro da operação.

```bash
CONTROLADOR=COLE_O_SHA_CONTROLADOR_DE_40_CARACTERES
LEGADO=COLE_O_SHA_LEGADO_DE_40_CARACTERES
(
  set -euo pipefail
  cd /opt/nxgestao
  [[ "$CONTROLADOR" =~ ^[0-9a-f]{40}$ && "$LEGADO" =~ ^[0-9a-f]{40}$ ]]
  exec 9>"$(git rev-parse --git-path nxgest-deploy.lock)"
  flock -n 9
  git fetch --no-tags origin "$CONTROLADOR"
  git fetch --no-tags origin "$LEGADO"
  git show "$CONTROLADOR:scripts/deploy-recover-legacy.sh" | bash -s -- "$LEGADO"
)
```

A recuperação verifica o layout legado e a árvore limpa, exige `/opt/scripts/backup-nxgest.sh` executável e bem-sucedido, invalida o marcador de staging e usa checkout sem sobrescrever ignorados. Falha de backup, conflito ou ausência dos objetos interrompe sem descartar trabalho; se o checkout falhar após o backup, o marcador fica invalidado. Env e dados ficam externos ao Git. Verifique o SHA e o estado após o comando sem exibir envs. Para efetivamente voltar o serviço a uma imagem anterior, é necessário identificar uma imagem preservada, compatibilidade de dados e um procedimento de restauração testado e autorizado; esta rotina **não executa nem garante** esse rollback. Para voltar ao fluxo novo, repita o bootstrap da seção 4 para staging com SHA validado.

---

## 8. Administração de usuários

- **Criar usuário** (role `admin` ou `operator`): `POST /api/admin/operadores` com `{ nome, email, senha, role }` — requer token de um admin.
- **Listar**: `GET /api/admin/operadores`
- **Editar/remover**: `PATCH` / `DELETE /api/admin/operadores/:id`
- Detalhes em `plans/PLAN-017-admin-panel.md`.

---

## 9. E-mail — Resend + domínio (`nxgest.com.br`)

> Suporte ao **PLAN-065** (fluxo de conta: convite/ativação + esqueci a senha) e **PLAN-071** (11/08 — deliverability: sair do spam). Envio via **Resend** com display name **"NX Gest"** (`MAIL_FROM_NAME` + `MAIL_FROM_ADDRESS`).

### Estado (07/08)

- [x] Domínio `nxgest.com.br` **registrado** no registro.br
- [x] **Add Domain** no Resend (`no-reply@nxgest.com.br`)
- [x] **DNS movido para o Cloudflare** (plano Free) — NS `lara.ns.cloudflare.com` / `hunts.ns.cloudflare.com`
- [x] **Records no Cloudflare**: DKIM `resend._domainkey` · MX `send` (prioridade 10) · SPF `send` (`include:amazonses.com`) · **SPF da raiz corrigido** (`v=spf1 include:amazonses.com ~all`) · **DMARC `p=none`**
- [x] **Verificação no Resend ✅ verde** (07/08)
- [x] **E-mail em produção ATIVO (08/08, PLAN-068)**: `.env` do VPS com `MAIL_PROVIDER=resend` · `RESEND_API_KEY` · `MAIL_FROM=no-reply@nxgest.com.br` · `APP_URL=https://nxgest.com.br`; `docker-compose.prod.yml` passando `APP_URL`/`MAIL_*`; `forgot`/convite **enviam de verdade** (validado: forgot de e-mail existente → 200 + e-mail real). **Fail-closed**: sem chave/domínio não verificado → **503 EMAIL_UNAVAILABLE**.

### Política de envio por ambiente e deliverability (PLAN-071 — 11/08)

| Ambiente | `MAIL_PROVIDER` | Comportamento |
|---|---|---|
| dev (`NODE_ENV=development`) | qualquer | **`ConsoleMailer` — nunca envia** (regra dura, ignora a chave) |
| staging | `console` | não envia e-mail real |
| produção | `resend` + chave | envia real |
| default (sem `MAIL_PROVIDER`) | — | `production` → resend se houver chave, senão fail-closed · demais → console |

- **Display name:** `MAIL_FROM_NAME=NX Gest` (presente no `.env` do VPS) + `MAIL_FROM_ADDRESS`/fallback `MAIL_FROM=no-reply@nxgest.com.br` → From `NX Gest <no-reply@...>` (reduz sinal de automação/spam). **Corrigido (13/08):** `fromAddress()` trata `MAIL_FROM_ADDRESS` vazio com `||`/`.trim()` — nunca mais `NX Gest <>`.
- **Reply-To:** suportado no payload (`reply_to`); ainda sem endereço monitorado (aguarda caixa corporativa).
- **DMARC:** ✅ `v=DMARC1; p=none; rua=mailto:rafael.cartaxo@hotmail.com` aplicado (13/08, propagado). **Próximo:** monitorar 2–4 semanas (SPF/DKIM verdes, sem bounces) → **`p=quarantine`** (manter `rua`). DNS manual no Cloudflare (PLAN-071 Fase 3/4).
- **Aquecimento:** domínio com poucos dias de envio (ativo desde 08/08) → manter volume baixo/consistente; acompanhar Resend dashboard (deliverability/bounces/complaints) e `mail-tester.com` (meta ≥9/10).
- **Assunto do lead** mudou de "Confirme seu e-mail — NX Gest" → **"Confirme seu interesse no NX Gest"** (menos padrão phishing).

### Validar envio real (VPS) — `mail:test`

Procedimento para disparar um e-mail **de verdade** (Resend) para conferir render, identidade visual e entregabilidade (spam). Executável de qualquer sessão com acesso SSH ao VPS (`root@172.245.152.223`, chave local `~/.ssh/id_ed25519`).

> **Por que via VPS:** o host local roda `NODE_ENV=development` → regra dura "dev não envia" (`ConsoleMailer`). O `.env` de produção (com `RESEND_API_KEY`) só existe no VPS. O host do VPS **não tem `node`** — roda via imagem `node:20-slim` (mesmo padrão do deploy).

1. **Garantir que o VPS tem a versão nova dos arquivos** (se ainda não commitados/deployados):
   ```bash
   scp -i ~/.ssh/id_ed25519 src/shared/email/templates.ts root@172.245.152.223:/opt/nxgestao/src/shared/email/
   scp -i ~/.ssh/id_ed25519 scripts/mail-test.ts root@172.245.152.223:/opt/nxgestao/scripts/
   ```
   Depois de commitado/deployado, pular este passo (o repo do VPS já tem).

2. **Disparar o envio real** (envia os 3 templates — convite, reset, lead):
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@172.245.152.223 '
     cd /opt/nxgestao &&
     docker run --rm -v "$(pwd)":/app -w /app \
       --env-file "$(pwd)/.env" \
       node:20-slim npx --yes tsx scripts/mail-test.ts <EMAIL-DESTINO> [pt-BR|en|es]
   '
   ```
   - `<EMAIL-DESTINO>`: seu e-mail real (ex.: `rafael.cartaxo@hotmail.com`)
   - Idioma opcional (default `pt-BR`): rodar de novo com `en` / `es` para validar os 3 idiomas
   - O `--env-file` carrega `NODE_ENV=production` + `MAIL_PROVIDER=resend` + `RESEND_API_KEY` (sem ele, cai em fail-closed/console)

3. **Confirmar na caixa de entrada**: 3 e-mails (`convite`, `reset`, `lead`) com marca NX, botão azul `#3571eb`, fallback textual ("Se o botão não funcionar, copie e cole o endereço") e rodapé institucional. Se cair em **spam**, ver seção "Problemas conhecidos" e PLAN-071.

4. **Limpar** o scp manual (se o passo 1 foi usado), revertendo no VPS:
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@172.245.152.223 'cd /opt/nxgestao && git checkout -- src/shared/email/templates.ts scripts/mail-test.ts'
   ```

### Por que Cloudflare (e não o painel do registro.br)

O **registro.br não permite criar registros TXT** no painel ("Configurar endereçamento" só faz redirect + servidor de e-mail; "Alterar servidores DNS" só troca NS). Por isso o DNS de envio foi delegado ao **Cloudflare (plano Free, $0)**, que suporta TXT/MX.

### Passo a passo (reproduzir)

1. **Resend** → Domains → `nxgest.com.br` → aba **Records** → copie cada registro (Type/Name/Value).
2. **Cloudflare** (plano Free) → Add a site → `nxgest.com.br` → anote os **2 nameservers**.
3. **Registro.br** → "Alterar servidores DNS" → cole os 2 NS do Cloudflare → salvar (`+dns`). **Não** habilitar `+dnssec`.
4. Aguarde a transição (~2h) → Cloudflare fica **Active**.
5. **Cloudflare → DNS → Add record** (Proxy status = **DNS only**):
   - TXT `resend._domainkey` → `p=…` (o valor do Resend)
   - MX `send` → `feedback-smtp.sa-east-1.amazonses.com` · priority `10`
   - TXT `send` → `v=spf1 include:amazonses.com ~all`
6. **Resend** → `nxgest.com.br` → **Verify DNS Records** → verde.

### Ajustes recomendados (feitos)

- **SPF da raiz**: default do registro.br era `v=spf1 -all` → trocado para **`v=spf1 include:amazonses.com ~all`** (o `From` é `no-reply@nxgest.com.br`).
- **DMARC**: `p=reject` → **`p=none`** até confirmar envio real; depois endurecer (`quarantine` → `reject`).

### Troubleshooting (verificação vermelha)

- **Host errado** — DKIM é `resend._domainkey`, não a raiz.
- **SPF duplicado** — um SPF por nome; nunca dois no mesmo host.
- **Propagação** — NS em transição pode levar horas; re-verifique depois.
- **Proxy status** — TXT/MX devem estar **DNS only** (cinza), não Proxied.

### Inventário e confirmação operacional antes de publicar

Responsável: operador autorizado do domínio; o estado abaixo é documentação histórica, **não foi auditado no painel nesta revisão**. Registrar data, responsável e resultado sem copiar credenciais. Recuperar acesso pelo cofre autorizado e pelos canais do provedor; não guardar códigos de recuperação no repositório.

- Confirmar no registrador os NS delegados e no Cloudflare o domínio ativo, os registros A/CNAME do site e o estado do proxy.
- Confirmar modo TLS Full (strict), validade da origem e os registros de envio Resend (DKIM, SPF, MX `send`) e DMARC; conferir também MX da raiz antes de habilitar recebimento.
- Comparar painel com DNS público e verificar HTTPS/health e envio somente quando autorizado. Health HTTP isolado não comprova DNS, TLS de origem ou entrega de e-mail.

### Notas

- **`APP_URL`** — produção aponta para `https://nxgest.com.br`; staging usa `https://nxgestao.duckdns.org` (`.env.staging`). Links de convite/reset refletem o ambiente de cada stack.
- Já existem **A record** `nxgest.com.br → 172.245.152.223` (VPS, Proxied) e `www` CNAME → raiz. O registro histórico indica proxy para o site e SSL **Full (strict)**; confirmar o estado atual no painel antes de publicação.
- Modo dev **nunca envia e-mail real** (regra dura, PLAN-071) — mesmo com `RESEND_API_KEY` configurada, usa `ConsoleMailer` e loga o link no console.
- **Caixa corporativa (ponto de atenção — futuro):** o Cloudflare tem **MX nulo na raiz** (`nxgest.com.br MX → .`) = "não recebe e-mail" (proposital). Quando quiser `rafael@nxgest.com.br` (inbox/webmail): contratar provedor de caixa (Zoho Mail free / Google Workspace / M365) e **substituir o MX nulo** pelo MX real + SPF/DKIM dele. **Não conflita com o Resend** (que usa `send.nxgest.com.br`).
- **Fail-closed de e-mail:** em **produção sem `RESEND_API_KEY`** (ou com domínio não verificado) os endpoints de e-mail devolvem **503 `EMAIL_UNAVAILABLE`** (`forgot`/`reconfirmar`/convite/lead) — **nunca mentem o 200 "verde"**. Em dev, o link é logado no console (não quebra). Validar antes do go-live com: `npm run mail:test -- <email>` (usa `RESEND_API_KEY`/`MAIL_FROM_*` do ambiente).

---

## 10. Problemas conhecidos e alertas

1. **Sem snapshot do provedor** → backup cron + off-site são obrigatórios (seção 5).
2. **Provedor com reputação mista** (Trustpilot ~2,9/5; relatos de troca de IP e nulling) → plano de migração de host para o próximo mês; domínio DuckDNS independente do provedor facilita a troca.
3. **Domínio `.duckdns.org` = homologação** → desde 11/08 o `nxgestao.duckdns.org` é o **staging** (QA), roteado pelo Caddy para `staging-app:8081`; `nxgest.com.br` é produção exclusiva. E-mail (Resend) ativo no `nxgest.com.br`.
4. **Latência ~120-180ms** (VPS nos EUA, clientes no Brasil) — aceitável para MVP; melhorar na migração para datacenter BR.

---

## 11. Hardening do host (PLAN-066 · P1)

> Verificar/aplicar no VPS (AlmaLinux 8.10, root):

- **firewalld** — liberar apenas 80/443 + SSH:
  ```bash
  systemctl enable --now firewalld
  firewall-cmd --permanent --add-service=http --add-service=https
  firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=SEU_IP service name=ssh accept'
  firewall-cmd --permanent --remove-service=ssh   # SSH só do seu IP
  firewall-cmd --reload
  ```
- **fail2ban** no SSH (evita brute-force):
  ```bash
  dnf install -y fail2ban
  systemctl enable --now fail2ban
  # /etc/fail2ban/jail.local → [sshd] enabled = true, bantime = 1h, maxretry = 3
  ```
- **Confirmar** com `firewall-cmd --list-all` e `fail2ban-client status sshd`; registrar o resultado no CHECKLIST do dia.


## Contrato de configuração por ambiente

O único modelo versionado é `.env.example`, com valores locais de desenvolvimento. Nunca copie valores de desenvolvimento para produção. No ambiente operacional, configure separadamente domínio, CORS e APP_URL HTTPS, segredos JWT, senhas fortes de seed e PostgreSQL; ajuste `PG_DB`, `PG_USER` e `PG_PASSWORD` para a instalação existente. O Compose constrói `DATABASE_URL` interna a partir de `PG_*`. Configure `MAIL_PROVIDER=resend`, `RESEND_API_KEY` e remetente verificado quando desejado; `GITHUB_TOKEN` é opcional. Staging usa arquivo próprio `.env.staging`, força mailer console e gera segredos novos apenas se o arquivo não existir. `MAIL_FROM_NAME` pode conter espaços; o leitor não executa comandos do arquivo. `LOGIN_RATE_LIMIT_MAX`, `USER_RATE_LIMIT_MAX` e demais limites seguem defaults da aplicação quando não propagados. Valores do pool e `PUBLICO_RATE_LIMIT_MAX`/`LEADS_RATE_LIMIT_MAX` exigem passagem explícita pelo Compose para alterar defaults no container. Nunca compartilhe envs reais.


### Staging com artifact verificado — fluxo local em revisão

O workflow `Staging verificado` depende do CI concluído com sucesso em main/push/primeira tentativa. O runner valida política e atestações, transmite o mesmo tar por SSH com chave de host previamente fixada e chama o bootstrap pelo SHA sob o lock. O host confere o hash, carrega a imagem e usa Compose `--no-build --pull never`; verifica a imagem efetiva e health de aplicação/DB antes de produzir recibo. A política-base controlada de build fixa previamente o SHA candidato e o SHA do signer; o evento CI e a API autenticada selecionam run e artifact únicos, sem preenchimento manual de IDs por run. Hash da política e referência são fornecidos separadamente pelo ambiente do workflow; o host não precisa de Node ou GH. A chave pública em `infra/staging-known-hosts` deve corresponder à fingerprint `SHA256:9mo2a7iYwuHEHlO7SyeHFhwatAv6Hf0yY4yUDhpbPrc`; não se aceita descoberta automática da chave. Não alterar `.env.staging`: sua ausência bloqueia este fluxo.

A tag temporária do tar não pode existir antes do load; colisão falha sem sobrescrever. Falha após load pode deixá-la presente e exigir investigação/limpeza específica autorizada; não usar prune. Essa implementação e o recibo foram exercitados apenas com dublês locais; GitHub Actions, transporte, Compose e saúde reais ainda exigem validação independente. Produção/rollback permanecem NO-GO até seus gates próprios.

O controlador de staging valida a política-base com `expiresAt` UTC antes de qualquer tentativa. Sob o mesmo lock, uma seleção concluída e ainda autorizada só retorna `STAGING_RETRY` após comparar SHA, run/tentativa, artifact, digests, marker, imagem efetiva e health/DB; não executa novo load ou Compose. Estado incompleto, pendência, seleção divergente ou candidato antigo bloqueiam. Se houver `staging-app` sem estado controlado, o fluxo não presume que a entrada seja inicial: exige procedimento de recuperação próprio revisado. Falha após início pode deixar pendência e exige investigação; não removê-la automaticamente.

### jq portátil para o checkout de implantação

O host não precisa ter `jq` no PATH. Antes de habilitar a implantação, a Coordenação provisiona o binário oficial jq 1.8.2 Linux AMD64 em `$(git rev-parse --absolute-git-dir)/nxgest-tools/jq`, dentro do checkout de implantação. O arquivo e o diretório `nxgest-tools` devem pertencer ao usuário operador, não ser links simbólicos, e não permitir escrita de grupo ou outros; o arquivo precisa ser executável. O helper confere também que ambos são objetos regulares/diretório apropriados e que o SHA-256 do arquivo é `b1c22172dd303f3be49e935aa56aa48a8b7a46e0bc838b4997d3bb451495870f`, antes de usar seu caminho absoluto. Ausência, divergência ou permissões inadequadas interrompem antes do carregamento de imagem ou subida do serviço. Não há download automático, instalação global nem inclusão do binário no Git. A custódia do checkout e do operador é pressuposto; a verificação não oferece defesa contra substituição concorrente por esse mesmo usuário.

O staging legado observado sem marcador continua requerendo plano de adoção revisado: instalar o jq não autoriza recriar o serviço nem contorna o lock ou os marcadores. A verificação de retorno de rollback permanece separadamente bloqueada por seus gates pendentes e ainda precisa ter sua dependência `jq` adaptada antes de qualquer uso operacional.
