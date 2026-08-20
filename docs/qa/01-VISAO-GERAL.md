# 01 — Visão Geral

**Status:** Ativo · **Fonte:** `docs/product/00-PROJECT.md` · `docs/product/01-DOMAIN.md` · `docs/README.md`

---

## O que é

O **NX Gest** é um sistema de **gestão de cobranças em campo**: operadores visitam clientes, negociam contratos, recebem parcelas e controlam o caixa. É uma aplicação **multi-tenant** (várias empresas no mesmo deploy), com isolamento de dados por empresa.

| Item | Valor |
|---|---|
| Produto | Gestão de cobranças em campo |
| Modelo | Multi-tenant (empresas → usuários → dados operacionais) |
| Perfis | `super_admin` · `admin` · `socio` · `operator` |
| Público | Operadores em campo + admins das empresas + super admin do sistema |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + TypeScript + Express · **PostgreSQL** (pg) + Drizzle ORM · Zod |
| Frontend | React + TypeScript + Vite + TailwindCSS + React Query + React Hook Form · i18n (pt/en/es) |
| Autenticação | JWT (jsonwebtoken) + bcryptjs + express-rate-limit |
| Testes | Vitest + Testing Library (RTL/jsdom) + `scripts/smoke-api.mjs` |
| Infra | Docker Compose · Caddy (proxy/HTTPS) · VPS AlmaLinux · GitHub Actions (CI/CD) |
| Repo | **npm workspaces** (`frontend/`) — node_modules única com React hoisted |

> **Detalhe (workspaces):** o repo tem backend na raiz + frontend em `frontend/`, unificados via npm workspaces. Isso evita dupla cópia de React (que quebrava os testes de UI) e simplifica o build.

---

## Ambientes

| Ambiente | URL | Dados | Deploy |
|---|---|---|---|
| Desenvolvimento | `http://localhost:3000` (API) + Vite (HMR) | PostgreSQL local `localhost:5433` | `npm run dev` |
| **Homologação (staging)** | `https://nxgestao.duckdns.org` | PostgreSQL isolado + **seed fake** (`teste123!`) | **Automático** no merge à main |
| **Produção** | `https://nxgest.com.br` | PostgreSQL do volume prod (dados reais) | Automático via CD (gate: staging saudável) + manual (`workflow_dispatch`) |

---

## Como rodar localmente

```bash
npm install          # workspaces: instala backend + frontend
npm run dev          # backend (:3000) + frontend (Vite HMR)
npm run build        # tsc (backend) + vite build (frontend)
npm test             # vitest (unit + UI)
npm run smoke:api    # smoke API (requer instância isolada — ver 04-TESTES.md)
```

Pré-requisitos: Node.js 20+ · npm 9+.

---

## Documentos relacionados

- `docs/product/00-PROJECT.md` — visão, escopo, funcionalidades
- `docs/product/01-DOMAIN.md` — entidades, responsabilidades, relacionamentos
- `docs/product/04-ROADMAP.md` — fases e roadmap
- `docs/STATUS.md` — situação atual
