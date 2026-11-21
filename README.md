# NX Gest

Plataforma modular de gestão operacional. O primeiro vertical é crédito em campo: clientes, contratos, parcelas, pagamentos, estornos e caixa, com isolamento por empresa e permissões por perfil.

![CI](https://img.shields.io/github/actions/workflow/status/RafaCartaxo/nxgest/ci.yml?branch=main&label=CI&logo=github)
![CD](https://img.shields.io/github/actions/workflow/status/RafaCartaxo/nxgest/cd.yml?branch=main&label=CD&logo=github)

## Por onde começar

| Necessidade | Referência |
|---|---|
| Situação publicada, pendências e evidências | [Status atual](docs/STATUS.md) |
| Regras e fluxos de uso | [Domínio](docs/product/01-DOMAIN.md), [regras](docs/product/02-BUSINESS-RULES.md), [fluxos de tela](docs/product/06-CASOS-DE-USO.md) e [API](docs/product/07-CASOS-DE-USO-API.md) |
| Publicação, acesso e incidentes | [Runbook de produção](docs/engineering/06-PRODUCAO.md) |
| Finalidade e uso dos scripts | [Guia dos scripts](scripts/README.md) |
| Backup e recuperação | [Limites de recuperação](docs/engineering/09-BACKUP-ROLLBACK.md) |
| Telas e componentes para evolução visual | [Mapeamento de telas](docs/engineering/05-MAPEAMENTO-TELAS.md), [componentes](docs/engineering/design/04-UI-COMPONENTS.md) e [cobertura visual](docs/engineering/design/UI-COVERAGE.md) |
| Navegação completa | [Documentação](docs/README.md) e [índice](docs/INDEX.md) |

## Stack e estrutura

Backend Node.js + TypeScript + Express + PostgreSQL 16 (pg/Drizzle). Frontend React + TypeScript + Vite + TailwindCSS, React Query e React Hook Form. O banco atual é PostgreSQL; SQLite não é dependência nem opção de execução.

```text
src/             Backend e casos de uso
frontend/        SPA React
infra/           Docker, Compose e Caddy
scripts/         Ferramentas operacionais, verificadores e testes
.github/         Workflows GitHub Actions
docs/            Contratos, guias, planos e histórico
agents/          Contratos de agentes de IA
uploads/         Anexos locais; fora do Git e da imagem
```

## Desenvolvimento local

Pré-requisitos: Node.js 24 LTS conforme [.nvmrc](.nvmrc), npm, Docker e Docker Compose para PostgreSQL. Consulte [setup por sistema operacional](docs/engineering/08-SETUP-NOVA-MAQUINA.md) para instalação e recuperação de acessos.

```bash
git clone https://github.com/RafaCartaxo/nxgest.git
cd nxgest
npm ci
cp .env.example .env
# Configure JWT_SECRET no .env antes de usar a autenticação.
npm run db:up
npm run dev
```

O backend usa `http://localhost:3000/api`; Vite informa sua URL no terminal. O PostgreSQL de desenvolvimento usa a porta 5433. O boot executa migrações e seed básico: apontar `DATABASE_URL` somente para o banco escolhido para esse ambiente.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL; default local documentado em [.env.example](.env.example) |
| `JWT_SECRET` | Obrigatório para emitir/verificar JWT em qualquer ambiente; usar valor próprio |
| `PORT` | Backend local: 3000 por padrão |
| `UPLOADS_DIR` | Local: `uploads`; produção: `/data/uploads` em volume persistente |
| `NODE_ENV` | Desenvolvimento local ou produção |
| `CORS_ORIGIN` / `MAIL_PROVIDER` | Configuração por ambiente; ver `.env.example` e runbook |

Os valores de demonstração de `.env.example` não são configuração de produção. `.env`, credenciais, uploads e backups permanecem fora do Git. Para explorar os endpoints, importar [api-collection.json](docs/api-collection.json) no Postman.

## Fluxos e validação

O fluxo principal é cliente → contrato → geração de parcelas → pagamento/estorno → reflexos no caixa e nas operações. Autenticação, empresa e capacidades delimitam o acesso. As conferências de cada fluxo estão nos casos de uso de [telas](docs/product/06-CASOS-DE-USO.md) e [API](docs/product/07-CASOS-DE-USO-API.md).

```bash
npm test
npm run test:safety
npm run test:deploy
npm run test:backup
npm run test:backup:maintenance
npm run test:corrections
npm run docs:audit
npm run audit:links
```

Alguns runners de fixtures exigem Linux, bubblewrap e namespaces; consulte [testes](docs/qa/04-TESTES.md). Smoke requer banco/processo isolados e altera dados de teste. Usar `SMOKE_DATABASE_URL` dedicada conforme esse guia; não executar contra o banco de desenvolvimento ou produção.

`docs:audit` verifica correspondência estrutural de rotas/contratos/telas; `audit:links` verifica referências. Nenhum deles substitui revisão semântica das instruções ou validação funcional.

## Publicação

```text
push/merge main → CI e build atestado → aprovação staging → Staging verificado
               → aprovação production → CD → recibo e finalização
```

PRs executam checks, mas não publicam. Staging é um workflow separado acionado pelo CI aprovado de push/main; CD é acionado pelo sucesso de `Staging verificado`. A promoção reutiliza a mesma imagem, sem rebuild. O CD manual exige `staging_run`, não uma ref arbitrária. Policies, prazos, controladores e reviewers são gates adicionais.

A cadeia real pré-clientes, o backup e a restauração isolada foram validados em 20/11/2026; consulte [STATUS.md](docs/STATUS.md) para evidências e validade das políticas. Banco e anexos foram restaurados no VPS e em outra máquina. O experimento BA10 foi arquivado fora da árvore ativa; a recuperação atual usa manutenção curta explícita.

Para compilar e servir uma instância configurada, `npm run build` e `npm start`. Esses comandos não publicam na VPS; a operação de produção segue o runbook e seus gates.

## Contribuição e estado local

Seguir [AGENTS.md](AGENTS.md), [contratos de agentes](agents/README.md) e [guia de contribuição](docs/CONTRIBUTING.md). Comparar o branch/diff local com a revisão publicada antes de declarar algo entregue. Trabalho não commitado e experimentos locais não fazem parte automaticamente da main ou da produção.
