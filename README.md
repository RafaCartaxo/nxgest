# NX Gest

Sistema de gestão de cobranças em campo.

## Stack

**Backend:** Node.js + TypeScript + Express + SQLite (better-sqlite3 + Drizzle ORM)
**Frontend:** React + TypeScript + Vite + TailwindCSS + React Query + React Hook Form

## Estrutura

```
src/                          — Backend (Express API)
frontend/                     — Frontend (React SPA)
docs/                         — Documentação completa do projeto
scripts/                      — Scripts utilitários
```

## Pré-requisitos

- Node.js 18+
- npm 9+

## Instalação

```bash
git clone https://github.com/RafaCartaxo/nxgest.git
cd nxgest

# Instala dependências do backend e do frontend
npm install
cd frontend && npm install && cd ..
```

O banco de dados SQLite (`gestao.db`) é criado automaticamente na primeira execução — não requer configuração.

## Configuração

Variáveis de ambiente são opcionais no momento (os defaults bastam). Para customizar, copie o arquivo de exemplo:

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | `development` | Ambiente (`development` ou `production`) |
| `PORT` | `3000` | Porta do servidor backend |
| `DB_PATH` | `gestao.db` | Caminho do banco SQLite |

## Rodando

### Desenvolvimento

```bash
npm run dev
```

Sobe backend (porta 3000) + frontend (Vite com HMR) em um único comando. A API estará em `http://localhost:3000/api`.

### Produção

```bash
npm run build   # Compila backend (tsc) + frontend (vite build)
npm start       # Express serve API + frontend estático em :3000
```

Para explorar os endpoints, importe `docs/api-collection.json` no Postman.

## Testes

```bash
npm test
```

## Documentação

A documentação completa do projeto está em [`docs/`](docs/README.md). Consulte também o [guia de contribuição](docs/CONTRIBUTING.md).
