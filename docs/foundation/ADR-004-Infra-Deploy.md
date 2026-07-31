# ADR-004 — Infraestrutura de Deploy (VPS + Caddy + DuckDNS)

**Status:** Aprovado

**Versão:** 1.0

**Data:** 31/07/2026

**Substitui:** plano Fly.io (descartado em 30/07/2026)

---

# Contexto

O NX Gestão precisava sair do ambiente local (`localhost:3000`) e ficar acessível pela internet para o primeiro cliente, com HTTPS e persistência confiável. Duas abordagens foram consideradas:

- **Fly.io:** deploy por aplicação, trial limitado (2h runtime ou 7 dias) e custo ~$4,27/mês **por cliente**. Como a visão de longo prazo é multi-tenant (PLAN-019 — vários clientes em um único deploy), o custo multiplicaria a cada cliente.
- **VPS próprio:** um único servidor ($2/mês) hospeda todos os clientes (multi-tenant), custo marginal ~$0 por cliente.

O objetivo era **zero custo inicial** e arquitetura preparada para o PLAN-019.

---

# Decisão

Implantar o NX Gestão em um **VPS dedicado** com:

- **Provedor:** VPS Hosting Service (`vpshostingservice.co`) — plano de ~$2/mês, escolhido pelo custo; contratado em 31/07/2026.
- **Containerização:** Docker Compose (`docker-compose.prod.yml`) com 2 serviços: `app` (Node 20 + Express, porta 8080) e `caddy` (proxy reverso, portas 80/443).
- **Proxy reverso + HTTPS:** **Caddy**, que emite e renova certificados **Let's Encrypt automaticamente** — zero configuração de certbot.
- **Persistência:** SQLite em **volume Docker** (`nxgestao_nxgestao_data` → `/data/gestao.db`), sobrevive a deploys.
- **Domínio:** subdomínio grátis **DuckDNS** (`nxgestao.duckdns.org`) apontando A record para o IP do VPS — provisório para o MVP.
- **OS do VPS:** AlmaLinux 8.10 (RHEL) — Docker instalado via repositório oficial (`get.docker.com` não suporta AlmaLinux).
- **Backup:** cron próprio (2x/dia) copiando o banco do volume para `/opt/backups` (o provedor não oferece snapshot).
- **Segurança:** acesso root somente por chave SSH; senha root trocada; `JWT_SECRET` e senhas fora do repositório.

Alternativas de domínio grátis avaliadas e rejeitadas:

| Opção | Motivo da rejeição |
|-------|--------------------|
| No-IP | Exige confirmação a cada 30 dias (domínio morre se esquecer) |
| FreeDNS (afraid.org) | Mantido por voluntários, risco de desaparecer |
| EU.org | Aprovação manual demorada (dias/semanas) |
| sslip.io / nip.io | Let's Encrypt não emite certificados (bloqueado por abuso) |

---

# Consequências

**Benefícios**

- Custo fixo (~$2/mês) hospedando todos os clientes — habilita o PLAN-019 (multi-tenant) sem reestruturar infra.
- HTTPS automático (Let's Encrypt via Caddy), mesmo padrão do Fly.io.
- Deploy repetível: `git pull` + `./scripts/deploy.sh`.
- Domínio DuckDNS independente do provedor — facilita migração de host sem mexer no app.

**Trade-offs / riscos**

- **Provedor com reputação mista** (Trustpilot ~2,9/5; relatos de troca de IP e "nulling" em alegações de abuso). Mitigação: backups próprios 2x/dia + plano de migração de host (próximo mês).
- **Sem snapshot/backup do provedor** — a proteção de dados é responsabilidade própria (backup cron + cópia off-site manual).
- **Domínio `.duckdns.org` é provisório** — deve ser substituído por `.com.br` registrado (decisão futura, prevista na migração de host).
- **Latência ~120-180ms** (VPS em Buffalo, NY/EUA; clientes no Brasil) — aceitável para o MVP; melhorar migrando para datacenter no Brasil.
- Custo do VPS depende de promoção/renovação; revisar na migração de host.

**Ações futuras registradas**

- Registrar domínio `.com.br` e migrar o host (próximo mês).
- Revisar plano de backup off-site automático (hoje é manual por `scp`).

---

# Referências

- `plans/PLAN-018-deploy.md` — execução completa do deploy
- `engineering/06-PRODUCAO.md` — runbook de operação
- `plans/PLAN-019-multi-tenant.md` — evolução multi-tenant (usa este mesmo VPS)
