# 08 — Setup de Nova Máquina, Portabilidade e Disaster Recovery

**Status:** Aprovado  
**Criado:** 28/08/2026  
**Projeto:** NX Gest  
**Documentos relacionados:** [`06-PRODUCAO.md`](06-PRODUCAO.md) (operação de produção), [`00-ARCHITECTURE.md`](00-ARCHITECTURE.md), [`SEGURANCA.md`](SEGURANCA.md)

---

## 1. Visão Geral e Filosofia de Portabilidade

O **NX Gest** foi arquitetado para permitir que qualquer desenvolvedor com as devidas autorizações consiga **iniciar ou retomar o trabalho em um computador suportado**, com instruções para Fedora, Ubuntu, Debian, Arch Linux, macOS ou Windows via WSL2. A duração depende da máquina e da rede; 15 minutos é uma meta, não uma medida comprovada.

Para que essa portabilidade funcione sem imprevistos nem perda de dados em caso de pane do computador, é fundamental entender a separação entre o que está no versionamento e o que reside localmente.

### 1.1 — O que está no Git vs. O que fica fora

```
┌─────────────────────────────────────────────────────────────┐
│ NO REPOSITÓRIO GIT (Público/Privado)                        │
│ ├─ Código backend (Express + TypeScript + Drizzle)          │
│ ├─ Código frontend (React + Vite + TailwindCSS)             │
│ ├─ Migrações e esquemas de banco de dados                   │
│ ├─ Scripts utilitários e de auditoria                       │
│ ├─ Suíte de testes (Vitest + smoke tests)                   │
│ └─ Documentação completa (docs/)                            │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │  Dev usa configuração própria sintética;
                               ▼  operação autorizada requer acessos externos
┌─────────────────────────────────────────────────────────────┐
│ FORA DO GIT (Vive na sua máquina / Cofre de Senhas)         │
│ ├─ Chave privada SSH (~/.ssh/id_ed25519)                     │
│ ├─ Pasta de acessos (~/.config/nxgestao/ACESSOS.md)          │
│ ├─ Senhas mestras (~/.config/nxgestao/*.txt)                │
│ ├─ Arquivos .env locais (.env com credenciais de dev/test)  │
│ └─ Backups off-site (~/.config/nxgestao/backups/)           │
└─────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **NUNCA comite arquivos `.env`, chaves privadas SSH ou credenciais de produção no Git.**  
> O `.env` de produção reside exclusivamente no servidor VPS (`/opt/nxgestao/.env`, permissão `600`).

---

## 2. Matriz de Instalação por Sistema Operacional

Antes de clonar o projeto, sua nova máquina precisa de:
* **Git** (controle de versão)
* **Node.js 20+ LTS** (recomendado via `nvm`) e **npm 9+**
* **Docker & Docker Compose** (para rodar o PostgreSQL 16 local de desenvolvimento)
* **OpenSSH Client** (para conexão com a VPS e GitHub)

Abaixo estão os comandos de instalação prontos para o seu gerenciador de pacotes:

### 2.1 — Fedora / RHEL

```bash
# Atualizar sistema e instalar utilitários base
sudo dnf update -y
sudo dnf install -y git curl openssh-clients

# Instalar Docker e Docker Compose
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Habilitar e iniciar Docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# (Faça logout e login novamente para aplicar o grupo docker)
```

### 2.2 — Ubuntu / Debian / Pop!_OS / Linux Mint

```bash
# Atualizar repositórios e instalar utilitários base
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl openssh-client ca-certificates

# Instalar Docker e Docker Compose
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# (Faça logout e login novamente para aplicar o grupo docker)
```

### 2.3 — Arch Linux / Manjaro

```bash
# Atualizar pacotes
sudo pacman -Syu --noconfirm

# Instalar base e Docker
sudo pacman -S --noconfirm git curl openssh docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# (Faça logout e login novamente para aplicar o grupo docker)
```

### 2.4 — macOS (com Homebrew)

```bash
# Instalar Homebrew se ainda não tiver:
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar dependências
brew update
brew install git curl nvm
brew install --cask docker  # Instala o Docker Desktop para Mac
```

### 2.5 — Windows 11 (via WSL2)

1. Instale o WSL com Ubuntu: `wsl --install -d Ubuntu` no PowerShell como Administrador.
2. Instale o **Docker Desktop para Windows** e ative a integração com o WSL2 nas configurações (*Settings → Resources → WSL Integration*).
3. Abra o terminal do Ubuntu no WSL2 e siga o passo a passo da seção **2.2 (Ubuntu)** para instalar o `nvm` e o `git`.

---

## 3. Instalando o Node.js 20 (padrão em qualquer SO)

Utilize o **`nvm`** (Node Version Manager) para garantir a versão exata do Node requerida pelo projeto (Node 20):

```bash
# 1. Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 2. Recarregar o shell
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 3. Instalar e fixar Node 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Validar versões
node -v   # Deve exibir v20.x.x
npm -v    # Deve exibir 9.x.x ou 10.x.x
```

---

## 4. Setup do Projeto Local (Do Zero aos Testes)

Com as ferramentas instaladas, siga os passos abaixo para clonar e rodar o projeto localmente:

### Passo 1: Clonar o Repositório

```bash
mkdir -p ~/Desenvolvimento
cd ~/Desenvolvimento
git clone https://github.com/RafaCartaxo/nxgest.git
cd nxgest
```

### Passo 2: Instalar Dependências (Workspaces)

O projeto utiliza `npm workspaces` na raiz, gerenciando o backend e o frontend simultaneamente:

```bash
npm ci
```

### Passo 3: Configurar Variáveis de Ambiente Locais

Copie o template de desenvolvimento:

```bash
cp .env.example .env
```

> [!NOTE]
> Os valores padrão do `.env.example` já estão pré-configurados para o ambiente de desenvolvimento local (banco de dados em `localhost:5433`, porta da API `3000`, modo `ConsoleMailer` de e-mail).

### Passo 4: Subir o PostgreSQL de Desenvolvimento

O banco de desenvolvimento roda em um container Docker isolado na porta **5433**:

```bash
# Iniciar o PostgreSQL de desenvolvimento em background
npm run db:up

# Validar se o container está saudável
npm run db:ps
```

### Passo 5: Rodar os Testes e Auditorias

```bash
# Executa toda a suíte de testes unitários e de integração
npm test

# Executa auditoria de consistência da documentação
npm run docs:audit
```

### Passo 6: Iniciar o Ambiente de Desenvolvimento

```bash
npm run dev
```

Este comando sobe simultaneamente:
* **Backend API**: `http://localhost:3000/api` (com recarregamento automático via `tsx watch`)
* **Frontend SPA**: `https://localhost:5173` (com Hot Module Replacement via Vite)

---

## 5. Gestão de Segredos & Continuidade de Acessos

O fluxo de desenvolvimento local usa `.env.example` e não requer credenciais de VPS, Cloudflare ou Resend. Somente uma pessoa autorizada a operar ambientes reais precisa restabelecer os acessos necessários, que **não ficam no Git**.

### 5.1 — Estrutura da pasta `~/.config/nxgestao/`

Crie a pasta de configuração na sua nova máquina:

```bash
mkdir -p ~/.config/nxgestao
chmod 700 ~/.config/nxgestao
```

Quando forem necessários para operação autorizada, os registros podem incluir arquivos com permissão `600`:
* `ACESSOS.md`: Relação de painéis, URLs, e-mails de acesso e anotações seguras.
* `vps-root-pw.txt`: Senha do usuário root da VPS (de contingência para console VNC).
* `vps-admin-pw.txt`: Senha do usuário administrador inicial (`admin@cobranca.com`).
* `thaliana-pw.txt`: Credenciais de usuários operacionais de teste/homologação.

### 5.2 — Como fazer backup e transportar seus segredos com segurança

**Estratégia Recomendada:**
1. **Cofre de Senhas Principal** (ex: *Bitwarden*, *1Password*, *KeePassXC*):
   * Mantenha o conteúdo do `ACESSOS.md` e as senhas mestras salvas em um cofre protegido por autenticação de 2 fatores (2FA).
2. **Cópia Criptografada Pessoal (GPG/AES-256)**:
   * Para transportar sua pasta `~/.config/nxgestao/` e suas chaves SSH para um novo computador com segurança:
   ```bash
   # Na máquina antiga: caminhos relativos ao home de origem. Guarde o arquivo
   # cifrado em local privado e transfira-o por canal seguro; não o versione.
   ( set -euo pipefail; umask 077; tar -C "$HOME" -czf - .config/nxgestao .ssh | gpg -c --armor --cipher-algo AES256 -o nxgest-segredos.gpg )

   # Na máquina nova: falha se já houver conteúdo nesses destinos.
   (
     set -euo pipefail
     umask 077
     mkdir -p "$HOME/.config"
     test ! -e "$HOME/.config/nxgestao" && test ! -e "$HOME/.ssh" || { echo "Destinos existentes: revisar e mesclar manualmente" >&2; exit 1; }
     restore_dir=$(mktemp -d "$HOME/.nxgest-restauracao.XXXXXXXX")
     chmod 700 "$restore_dir"
     gpg -d nxgest-segredos.gpg | tar -xzf - -C "$restore_dir"
     find "$restore_dir/.config/nxgestao" "$restore_dir/.ssh" -type d -exec chmod 700 {} +
     find "$restore_dir/.config/nxgestao" "$restore_dir/.ssh" -type f -exec chmod 600 {} +
     mv -n "$restore_dir/.config/nxgestao" "$HOME/.config/"
     mv -n "$restore_dir/.ssh" "$HOME/"
     rmdir "$restore_dir/.config" "$restore_dir"
   )
   ```

   A extração ocorre sob diretório temporário privado (`700`) e `umask 077`; permissões são ajustadas antes da movimentação. Em caso de falha, o diretório temporário privado pode permanecer para inspeção e limpeza segura. Use apenas arquivos cifrados de origem confiável e confira colisões antes de mesclar manualmente.

---

## 6. Acesso e Operação da VPS a Partir de Nova Máquina

A VPS de produção (`172.245.152.223`) está configurada com `PasswordAuthentication no`, aceitando **apenas chaves SSH autorizadas**.

### 6.1 — Se você restaurou sua chave `id_ed25519` antiga
Basta testar o acesso direto:
```bash
ssh root@172.245.152.223
```

### 6.2 — Se você gerou uma chave SSH nova (ou perdeu a antiga)

1. **Gere a nova chave na sua nova máquina:**
   ```bash
   ssh-keygen -t ed25519 -C "seu-email@dominio.com"
   # Exiba a chave pública para copiar:
   cat ~/.ssh/id_ed25519.pub
   ```

2. **Como autorizar a nova chave no VPS:**
   * **Cenário A (Ainda tem acesso de outro computador):**
     ```bash
     ssh-copy-id -i ~/.ssh/id_ed25519.pub root@172.245.152.223
     ```
   * **Cenário B (Perdeu a máquina antiga / Acesso de emergência):**
     1. Acesse o painel da hospedagem em `vpshostingservice.co` com seu login (`rafael.cartaxo@hotmail.com`).
     2. Abra o **Web Console / VNC**.
     3. Faça login como `root` usando a senha de root (registrada no seu cofre de senhas).
     4. Edite o arquivo de chaves autorizadas:
        ```bash
        nano /root/.ssh/authorized_keys
        ```
     5. Cole a nova linha da chave pública `ssh-ed25519 ...` ao final do arquivo, salve (`Ctrl+O`, `Enter`) e saia (`Ctrl+X`).
     6. Pronto! O acesso via terminal da sua nova máquina estará liberado imediatamente.

### 6.3 — Configuração do Atalho SSH (`~/.ssh/config`)

Adicione o bloco abaixo ao arquivo `~/.ssh/config` na sua máquina:

```ssh
Host nxgest-vps
    HostName 172.245.152.223
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
```

Agora você pode conectar no servidor digitando apenas:
```bash
ssh nxgest-vps
```

---

## 7. Backups Off-Site e Plano de Recuperação de Desastres (DRP)

> [!WARNING]
> O provedor da VPS **não realiza snapshots automáticos**. A proteção contra perda total do servidor depende dos backups em `/opt/backups/` e da sua cópia off-site periódica.

### 7.1 — Cópia do conjunto de backup

O formato associado é um diretório por ID. `scripts/pull-backup.sh <id> <destino-existente> <usuario@host> <chave>` copia o conjunto completo, verifica hashes e publica sem sobrescrever. A implementação foi exercitada somente com transporte dublado; origem, conectividade e recuperação reais continuam pendentes de autorização e validação. Falha ou ausência de conjunto não são sucesso. Os padrões legados `pg-*.dump` e `uploads-*.tar.gz` não comprovam cópia do conjunto atual. Consulte `09-BACKUP-ROLLBACK.md` antes de qualquer operação autorizada.

### 7.2 — Recuperação legada (não validada para o conjunto atual)

> Os comandos abaixo descrevem o formato legado e não constituem procedimento validado para o conjunto atual nem autorização operacional.

Se a VPS original for destruída e você precisar subir uma nova máquina do zero:

1. **Instale Docker e Docker Compose** no novo VPS.
2. **Clone o repositório** em `/opt/nxgestao`.
3. **Crie o arquivo `/opt/nxgestao/.env`** com as credenciais de produção e o `JWT_SECRET`.
4. **Inicie os containers:**
   ```bash
   cd /opt/nxgestao
   docker compose --project-directory . -f infra/docker-compose.prod.yml up -d postgres
   ```
5. **Restaure o dump do PostgreSQL:**
   ```bash
   # Envie o dump para o novo servidor:
   scp ~/.config/nxgestao/backups/pg-ULTIMO.dump root@NOVO_IP:/tmp/restore.dump

   # No novo servidor (use os valores de PG_USER/PG_DB do .env de produção):
   #   source /opt/nxgestao/.env && docker exec -i nxgest-postgres pg_restore -U "$PG_USER" -d "$PG_DB" --clean --if-exists /tmp/restore.dump
   docker exec -i nxgest-postgres pg_restore -U nxgest -d nxgest --clean --if-exists /tmp/restore.dump
   ```
6. **Restaure os uploads:**
   ```bash
   docker cp ~/.config/nxgestao/backups/uploads-ULTIMO.tar.gz nxgestao-app-1:/data/
   docker exec nxgestao-app-1 tar -xzf /data/uploads-ULTIMO.tar.gz -C /data/
   ```
7. **Inicie a aplicação completa:**
   ```bash
   docker compose --project-directory . -f infra/docker-compose.prod.yml up -d
   ```
8. **Atualize o IP no Cloudflare** para apontar para o novo IP do servidor.

---

## 8. Mapa de Contas e Painéis Externos

| Serviço | Finalidade | Conta / Acesso | URL |
|---|---|---|---|
| **VPS Hosting** | Servidor de produção e homologação (AlmaLinux) | `rafael.cartaxo@hotmail.com` | `https://vpshostingservice.co` |
| **Cloudflare** | Gerenciamento de DNS, SSL e proxy de `nxgest.com.br` | Conta Cloudflare | `https://dash.cloudflare.com` |
| **Resend** | Envio de e-mails transacionais (`no-reply@nxgest.com.br`) | Conta Resend | `https://resend.com` |
| **DuckDNS** | DNS dinâmico do ambiente de Staging (`nxgestao.duckdns.org`) | Login Google OAuth | `https://www.duckdns.org` |
| **GitHub** | Repositório de código e pipelines CI/CD | `RafaCartaxo/nxgest` | `https://github.com/RafaCartaxo/nxgest` |
| **Registro.br** | Registro oficial do domínio `nxgest.com.br` | ID no Registro.br | `https://registro.br` |

---

## 9. Checklist rápido: nova máquina

Ao configurar um novo computador ou após formatar o sistema:

- [ ] **1. Ferramentas base instaladas**: Git, OpenSSH, Docker e Docker Compose ativos.
- [ ] **2. Node 20 LTS ativo**: `nvm use 20` (Node ≥20.x, npm ≥9.x).
- [ ] **3. Repositório clonado**: `git clone https://github.com/RafaCartaxo/nxgest.git`.
- [ ] **4. Dependências instaladas**: `npm ci` concluído sem erros.
- [ ] **5. Arquivo `.env` de desenvolvimento**: `cp .env.example .env`.
- [ ] **6. PostgreSQL local rodando**: `npm run db:up` na porta 5433.
- [ ] **7. Testes validados**: `npm test` passou com 100% de sucesso.
- [ ] **8. Operação autorizada apenas**: acesso SSH adequado configurado se houver necessidade de operar a VPS.
- [ ] **9. Operação autorizada apenas**: credenciais necessárias recuperadas com permissões apropriadas; não são pré-requisito para desenvolvimento.
- [ ] **10. App rodando localmente**: `npm run dev` abre a aplicação em `https://localhost:5173`.
