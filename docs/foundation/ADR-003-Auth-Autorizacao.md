# ADR-003 — Subsistema de Autenticação e Autorização

**Status:** Aprovado

**Versão:** 1.0

**Última atualização:** 30/07/2026

---

# Contexto

O sistema opera atualmente sem qualquer mecanismo de autenticação ou autorização — um único banco SQLite compartilhado, sem tabela de usuários, sem middleware de proteção, sem isolamento de dados.

O roadmap (Fase 5.2) e as regras de negócio BR-055 a BR-058 definem que o sistema evoluirá para suporte multi-usuário com autenticação JWT. Adicionalmente, surge a necessidade de um painel de administração com níveis permissionais (admin vs operator), conforme BR-066 a BR-071.

A introdução de um sistema de permissões com middleware de autorização e endpoints administrativos constitui uma alteração arquitetural que, conforme ADR-001 §199, requer uma nova ADR.

---

# Decisão

O sistema adotará um subsistema de autenticação e autorização composto por:

- **Módulo `auth`**: responsável por login, registro e identidade do usuário (JWT + bcrypt)
- **Módulo `admin`**: responsável por gestão de operadores e visão consolidada (acesso exclusivo admin)
- **Middleware em duas camadas**: `auth.middleware` (verifica identidade) + `admin.middleware` (verifica papel)
- **Modelo de papéis binário**: `admin` e `operator`, armazenado na coluna `role` da tabela `usuarios`

---

# Objetivos

- Isolar dados por operador (`userId` em todas as tabelas operacionais)
- Garantir que apenas admin possa gerenciar operadores
- Permitir que admin visualize dados consolidados de todos os operadores
- Manter compatibilidade com a arquitetura Clean Architecture existente
- Reaproveitar o máximo possível de código e padrões já estabelecidos

---

# Arquitetura

## Backend — Novos módulos

O backend receberá dois novos módulos, seguindo a mesma estrutura Clean Architecture dos módulos existentes:

```
src/modules/
├── auth/                          # Identidade + credenciais
│   ├── domain/
│   │   ├── usuario.entity.ts      # id, nome, email, senhaHash, role, createdAt
│   │   └── errors/auth.error.ts   # CredenciaisInvalidasError, EmailDuplicadoError
│   ├── application/
│   │   ├── ports/auth.repository.ts
│   │   └── use-cases/
│   │       ├── LoginUseCase.ts
│   │       └── RegistrarUseCase.ts
│   ├── infrastructure/
│   │   └── repositories/auth.repository.impl.ts
│   └── presentation/
│       ├── controllers/auth.controller.ts
│       └── routes/auth.routes.ts
│
├── admin/                         # Gestão de operadores (admin-only)
│   ├── domain/
│   │   └── errors/admin.error.ts  # OperadorNaoEncontradoError, NaoPodeAutoModificarError
│   ├── application/
│   │   ├── ports/admin.repository.ts
│   │   └── use-cases/
│   │       ├── ListOperadores/
│   │       ├── CriarOperador/
│   │       ├── EditarOperador/
│   │       └── RemoverOperador/
│   ├── infrastructure/
│   │   └── repositories/admin.repository.impl.ts
│   └── presentation/
│       ├── controllers/admin.controller.ts
│       └── routes/admin.routes.ts
│
└── shared/                        # Código compartilhado (já existe: utils/, validators/)
    ├── middleware/
    │   ├── auth.middleware.ts      # Extrai JWT, injeta req.userId + req.userRole
    │   └── admin.middleware.ts     # Verifica req.userRole === 'admin'
    ├── types/
    │   └── express.d.ts            # Augmentação do Express.Request (userId, userRole)
    └── utils/
        └── jwt.ts                  # sign() + verify()
```

## Middleware pipeline

```
Requisição
  │
  ├── /api/auth/*        → público (sem middleware)
  │
  ├── /api/admin/*       → auth.middleware → admin.middleware → controller
  │
  └── /api/* (demais)    → auth.middleware → controller
```

## Frontend — Novos módulos

```
frontend/src/modules/
├── auth/
│   ├── pages/LoginPage.tsx
│   └── services/auth.service.ts
│
├── admin/
│   ├── pages/AdminPage.tsx
│   ├── components/
│   │   ├── OperadoresList.tsx
│   │   └── OperadorForm.tsx
│   └── services/admin.service.ts
│
└── shared/
    └── auth/
        ├── AuthContext.tsx         # Provider: user, token, login, logout
        └── ProtectedRoute.tsx      # Sem token → /login
```

---

# Modelo de Permissões

| Ação | Operator | Admin |
|------|----------|-------|
| Login | Sim | Sim |
| CRUD nos próprios dados | Sim | Sim |
| Ver dashboard do próprio operador | Sim | Sim |
| Criar outro operador | Não | Sim |
| Listar todos operadores | Não | Sim |
| Editar dados de outro operador | Não | Sim |
| Remover operador | Não | Sim |
| Ver dashboard consolidado | Não | Sim |
| Remover a si mesmo | — | Não |
| Rebaixar o próprio role | — | Não |

---

# Banco de Dados

## Nova tabela

```sql
CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senhaHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK(role IN ('admin', 'operator')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  deletedAt TEXT
)
```

## Migração em tabelas existentes

Oito tabelas recebem a coluna `userId` para isolamento de dados:

```
clientes, contratos, pagamentos, movimentacoesFinanceiras,
caixa_config, historico_operacional, gastos, fechamentos_semanais
```

Tabelas `parcelas` e `pagamento_parcelas` não recebem `userId` — são acessadas via JOIN com a tabela pai que já terá o filtro.

## Admin default

Usuário `admin@cobranca.com` com `role = 'admin'` criado via migration. Todos os dados existentes recebem `userId = admin.id` durante o backfill.

**Ordem obrigatória da migration:**
1. `CREATE TABLE usuarios` — tabela deve existir antes de qualquer referência
2. `INSERT INTO usuarios (admin)` — admin deve existir antes do backfill
3. `ALTER TABLE ... ADD COLUMN userId` — adiciona colunas nas 8 tabelas
4. `UPDATE ... SET userId = admin.id` — backfill dos dados existentes

---

# APIs

## Módulo Auth (`/api/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/auth/login` | Não | `{ email, senha }` → `{ token, usuario }` |
| `GET` | `/api/auth/me` | Sim | Retorna usuário logado |

## Módulo Admin (`/api/admin`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/admin/operadores` | Admin | Listar todos operadores (com stats) |
| `POST` | `/api/admin/operadores` | Admin | Criar novo operador |
| `PATCH` | `/api/admin/operadores/:id` | Admin | Editar nome, email, role, resetar senha |
| `DELETE` | `/api/admin/operadores/:id` | Admin | Soft-delete operador |
| `GET` | `/api/admin/dashboard` | Admin | KPIs consolidados de todos operadores |

---

# Tecnologias

| Componente | Escolha | Motivo |
|-----------|---------|--------|
| Token | JWT (jsonwebtoken) | Stateless, compatível com PWA, sem sessão no servidor |
| Hash | bcryptjs | Seguro, sem compilação nativa (compatível com Windows) |
| Storage do token | localStorage | Simples, compatível com PWA/offline |
| Expiração | 7 dias | Balanço segurança × conveniência operacional |

## Pré-requisitos de instalação

Novos pacotes necessários antes da implementação:

```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

## Arquivo de tipos — `express.d.ts`

Antes de implementar os middlewares, criar `src/shared/types/express.d.ts` para que TypeScript reconheça as novas propriedades no objeto `Request`:

```typescript
export {}

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userRole?: "admin" | "operator"
    }
  }
}
```

O `export {}` é obrigatório com `NodeNext` (module resolution do projeto) — transforma o arquivo em módulo para que o `declare global` funcione corretamente.

---

# Consequências

## Benefícios

- Isolamento completo de dados entre operadores
- Base para funcionalidades futuras (PWA multi-instância, relatórios por operador)
- Admin panel reutiliza 100% dos componentes shared existentes (Card, KpiCard, StatusBadge, etc.)
- Módulo admin segue a mesma Clean Architecture de todos os módulos existentes
- Middleware em duas camadas permite granularidade futura (ex.: supervisor, read-only)

## Trade-offs

- ~60 queries precisam ser alteradas para incluir filtro `userId`
- Complexidade adicional de 2 novos módulos + 2 novos middlewares
- Exige disciplina para todo novo endpoint lembrar do filtro `userId`

Os benefícios superam os custos para este projeto.

---

# Referências

- ADR-001 — Arquitetura Base do Projeto
- ADR-002 — Arquitetura do Frontend
- PLAN-015 — Autenticação Multi-Usuário
- PLAN-017 — Admin Panel + Níveis Permissionais
- BUSINESS-RULES.md — BR-055 a BR-071
- DOMAIN.md
