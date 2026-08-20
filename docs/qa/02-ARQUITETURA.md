# 02 — Arquitetura

**Status:** Ativo · **Fonte:** `docs/engineering/00-ARCHITECTURE.md` · `docs/foundation/ADR-001..006` · `docs/decisions/ADR-INDEX.md`

---

## Decisões arquiteturais (resumo)

O sistema combina **cinco** estilos para equilibrar simplicidade e evolução:

| Estilo | O que significa aqui |
|---|---|
| Modular Monolith | Um deploy, organizado por **módulos de negócio** |
| DDD Lite | Foco no domínio; entidades, value objects, regras de negócio |
| Clean Layers | Presentation → Application → Domain + Ports · Infrastructure |
| Use Case Driven | Cada operação de negócio é um **Use Case** (responsabilidade única) |
| Ports & Adapters | Application depende de contratos (Ports); Infrastructure implementa |

> **ADRs** (`docs/decisions/ADR-INDEX.md`): arquitetura base (ADR-001), frontend (ADR-002), auth (ADR-003), infra/deploy (ADR-004), governança de UI (ADR-005), module manifest (ADR-006).

---

## Módulos

Cada módulo é responsável exclusivamente pelo seu contexto:

`admin` · `anexo` · `auth` · `caixa` · `cliente` · `contrato` · `gasto` · `health` · `leads` · `operacoes` · `pagamento`

Estrutura de cada módulo (Clean Architecture):

```text
src/modules/<modulo>/
  domain/            ← entidades, value objects, regras
  application/
    use-cases/       ← um Use Case por operação
    ports/           ← contratos (repositórios, serviços externos)
  infrastructure/
    repositories/    ← implementações (SQL/Drizzle)
    queries/         ← queries dedicadas (ex.: financeiro)
  presentation/
    controllers/     ← Express controllers
    routes/          ← roteamento + middlewares
```

---

## Camadas e fluxo

```text
HTTP Request
    ↓
Presentation  (controllers, DTOs, validação superficial — SEM regra de negócio)
    ↓
Application   (Use Cases — coordena a operação, usa Domain e Ports)
   ├── Domain        (regras de negócio — independente de tudo)
   └── Ports         (contratos — abstrações de persistência/serviços)
            ↓
Infrastructure (repositórios, banco, APIs externas, arquivos — SEM regra de negócio)
```

**Regras de ouro:**

- Presentation **não** contém regra de negócio.
- Application depende **apenas** do Domain e de **Ports**.
- Infrastructure **implementa** os Ports — sem regra de negócio.
- Domain não depende de nenhuma outra camada.
- Cada Use Case = **uma** operação de negócio.

---

## Frontend

Mesmo princípio: organizado por **contextos de negócio**, responsável apenas por UI/navegação/estado/comunicação com a API — **sem** regras de negócio (ficam no backend).

```text
frontend/src/
  modules/<modulo>/  pages · components · schemas (zod) · hooks · services · types
  shared/            components · feedback · theme · utils · auth · api
  App.tsx            rotas
```

> Fonte: `docs/engineering/03-FRONTEND.md` · `docs/foundation/ADR-002-Arquitetura-Front.md`

---

## Banco de dados

- **PostgreSQL 16** via **Drizzle ORM (`pg-core`)** + SQL cru em queries específicas.
- IDs: **UUID v4** (nada de sequencial dependente de regra).
- **Isolamento multi-tenant**: `usuarios.empresaId` + JOIN — tabelas operacionais não têm `empresaId`.
- Entidades operacionais têm `userId` (isolamento por operador); Parcela/PagamentoParcela acessadas via JOIN com a tabela pai.
- **Auditoria**: movimentações financeiras, caixa, módulos/capacidades (BR-105), estornos.
- Soft-delete (`deletedAt`) em usuários; regras de exclusão (bloqueio com contratos/pagamentos).

> Fonte: `docs/engineering/01-DATABASE.md` · PLAN-019 (multi-tenant)

---

## Mapa de referência

| Tema | Onde ver |
|---|---|
| Arquitetura oficial | `docs/engineering/00-ARCHITECTURE.md` |
| Backend | `docs/engineering/04-BACKEND.md` |
| Frontend | `docs/engineering/03-FRONTEND.md` |
| Banco | `docs/engineering/01-DATABASE.md` |
| API | `docs/engineering/02-API.md` |
| Decisões | `docs/decisions/ADR-INDEX.md` |
