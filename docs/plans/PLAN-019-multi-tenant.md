# PLAN-019 — Multi-Tenant: Super Admin + Empresas

**Status:** Planejado

**Versão:** 1.1

**Data:** 30/07/2026

**Última atualização:** 30/07/2026

**Roadmap:** product/04-ROADMAP.md §5.8 (nova)

**Dependências:**
- PLAN-015 (Autenticação Multi-Usuário)
- PLAN-017 (Admin Panel + Níveis Permissionais)

---

## Objetivo

Transformar o sistema de single-tenant para multi-tenant, introduzindo:

1. **Papel `super_admin`** — gestor da plataforma, acessa qualquer empresa via drill-down
2. **Entidade `Empresa`** — unidade de isolamento entre clientes
3. **Coluna `empresaId`** em `usuarios` — vincula usuários à sua empresa (null = super_admin)
4. **Hardening de autenticação** — rate limiting, validação de soft-delete no middleware, feedback de erros

---

## Diagnóstico

### Multi-tenant

| Aspecto | Estado atual | O que falta |
|---------|-------------|-------------|
| Papéis de usuário | `admin` e `operator` (2 níveis) | Adicionar `super_admin` (terceiro nível) |
| Isolamento entre admins | **Inexistente** — admin vê TUDO de TODOS | Filtrar admin queries por `empresaId` |
| Conceito de empresa/cliente | **Inexistente** | Tabela `empresas` + `empresaId` na tabela `usuarios` |
| Criação de admins | Admin cria qualquer usuário | Super_admin cria empresa + admin vinculado |
| Seed super_admin | **Inexistente** | `super@nexus.com` (super_admin) + empresa "Desenvolvimento" para admin existente |
| Middleware admin | `role === "admin"` | Aceitar também `super_admin` |
| `GET /api/auth/me` | Retorna `{ id, nome, email, role }` | Adicionar `empresaId`, `empresaNome` |

### Autenticação

| Aspecto | Estado atual | O que falta |
|---------|-------------|-------------|
| Rate limiting | **Zero** — tentativas ilimitadas no login | `express-rate-limit`: 10 tentativas/IP a cada 15 min |
| `/me` soft-delete | Não filtra `deletedAt IS NULL` | Adicionar filtro no `findById` |
| auth.middleware | Só decodifica JWT — não consulta banco | Validar existência do usuário no banco (PK lookup) |
| Erro de rede no login | Sem feedback específico | Tratar `TypeError: Failed to fetch` no frontend |
| Tipos frontend | `role: "admin" \| "operator"` fixo | Incluir `"super_admin"` |

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Modelo de tenant | `empresaId` apenas na tabela `usuarios` (nullable) | Zero coluna nova nas 10 tabelas operacionais. Isolamento resolvido por JOIN: `clientes.userId → usuarios.id → usuarios.empresaId` |
| Super_admin vê tudo | `empresaId = null` → queries sem filtro | Simples, sem branch condicional complexa |
| Drill-down | Backend aceita `?empresaId=X` como query param opcional nos endpoints admin | Super_admin acessa AdminPage filtrada por empresa; admin ignora o param (usa seu próprio `empresaId`) |
| Criação de empresa | Atômica: INSERT empresa + INSERT admin na mesma transação | Consistência — sem empresa sem admin |
| `adminMiddleware` | Passa a aceitar `admin` E `super_admin` | Super_admin usa AdminPage para drill-down |
| `superAdminMiddleware` | `role === "super_admin"` | Rotas de gestão de empresas são exclusivas |
| Seed | `super@nexus.com` com senha via `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_DEFAULT_PASSWORD` | Separado do admin de desenvolvimento |
| Operadores herdam `empresaId` | Do admin que os criou | Transparente — admin não escolhe empresa |
| Rate limiting | `express-rate-limit` no login apenas | Proteção mínima; endpoints operacionais já exigem token |
| Validação no middleware | `auth.middleware` consulta banco após decodificar JWT | Bloqueia tokens de usuários removidos imediatamente |
| Regras de negócio atualizadas | BR-066, BR-069, BR-070 alteradas + BR-072 a BR-077 novas | Refletem o modelo multi-tenant |

---

## Regras de negócio (novas + alteradas)

### BR-066 (ALTERADA) — Papéis de usuário

Todo usuário do sistema possui um papel (`role`): `super_admin`, `admin` ou `operator`.

| Papel | Acesso |
|---|---|
| **super_admin** | Acesso irrestrito a todas as empresas e dados. Gerencia empresas (criar, listar). Pode fazer drill-down em qualquer empresa. |
| **admin** | Acesso a todos os dados da sua empresa. Gerencia operadores da sua empresa. |
| **operator** | Acesso restrito aos próprios dados dentro da sua empresa. |

### BR-069 (ALTERADA) — Proteção contra auto-rebaixamento

Nenhum usuário pode alterar o próprio `role`. Esta proteção se aplica a `super_admin`, `admin` e `operator`.

### BR-070 (ALTERADA) — Proteção contra auto-remoção

Nenhum usuário pode remover a si mesmo. Esta proteção se aplica a todos os papéis.

### BR-072 (NOVA) — Gestão de empresas

Apenas o `super_admin` pode criar e listar empresas. Cada empresa possui um nome e um admin vinculado criado simultaneamente. A criação é atômica: ou ambos (empresa + admin) são criados, ou nada é criado.

### BR-073 (NOVA) — Isolamento entre empresas

Os dados de cada empresa são completamente isolados. Um admin da Empresa A não pode acessar, visualizar ou modificar dados da Empresa B, nem gerenciar operadores de outra empresa. O `super_admin` é a única exceção — possui acesso irrestrito a todas as empresas via drill-down.

### BR-074 (NOVA) — Dashboard do admin por empresa

O dashboard do admin (`GET /api/admin/dashboard`) exibe KPIs agregados apenas dos operadores da sua empresa. O `super_admin` pode visualizar o dashboard de qualquer empresa via query param `?empresaId=X`, ou o agregado global quando omitido.

### BR-075 (NOVA) — Herança de empresa pelo operador

Ao criar um operador, o `empresaId` é herdado automaticamente do admin que realiza a criação. O admin não pode criar operadores em outra empresa.

### BR-076 (NOVA) — Super_admin não pode ser criado por admin

Apenas o seed inicial pode criar usuários com `role = 'super_admin'`. O endpoint `POST /api/admin/operadores` aceita apenas `role = 'admin' | 'operator'`.

### BR-077 (NOVA) — Proteção contra brute force no login

O endpoint `POST /api/auth/login` possui limite de 10 tentativas por IP a cada 15 minutos. Excedido o limite, retorna erro 429.

---

## Entidades envolvidas

### Nova entidade: Empresa

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID v4 | PK |
| `nome` | TEXT | Nome da empresa/cliente |
| `createdAt` | TEXT (ISO 8601) | Data de criação |

### Alterada: Usuario

| Campo | Tipo | Alteração |
|---|---|---|
| `empresaId` | TEXT (nullable) | Novo campo — FK → `empresas.id`. `null` = super_admin |

**Nota importante:** Nenhuma coluna `empresaId` é adicionada às tabelas operacionais (clientes, contratos, pagamentos, etc.). O isolamento entre empresas é derivado via JOIN: `tabela.userId → usuarios.id → usuarios.empresaId`.

---

## Casos de uso

| UC | Nome | Ator | Descrição |
|----|------|------|-----------|
| UC01 | CriarEmpresa | super_admin | Cria empresa + admin vinculado. Valida email único. Transação atômica. |
| UC02 | ListarEmpresas | super_admin | Lista todas empresas com stats (totalOperadores, totalClientes, contratosAtivos) |
| UC03 | CriarOperador (modificado) | admin, super_admin | Herda `empresaId` do criador automaticamente. Não aceita role `super_admin`. |
| UC04 | ListarOperadores (modificado) | admin, super_admin | Filtrado por `empresaId`; super_admin pode filtrar por `?empresaId=X` ou ver todos |
| UC05 | Dashboard (modificado) | admin, super_admin | KPIs filtrados por `empresaId`; super_admin pode filtrar por `?empresaId=X` ou ver agregado global |
| UC06 | Login (modificado) | todos | JWT payload inclui `empresaId` |
| UC07 | Me (modificado) | todos | Response inclui `empresaId` e `empresaNome`; filtra soft-delete |

---

## Fases de implementação

```
Fase A (Hardening auth) → Fase B (DB + seed) → Fase C (Backend: empresaId + middlewares)
    → Fase D (Backend: módulo empresa) → Fase E (Admin queries isoladas)
        → Fase F (Frontend) → Fase G (Registro público — futuro)
```

---

### Fase A — Hardening de Autenticação

**Arquivos:** 6 alterados

#### A.1 — Rate limiting no login

**Nova dependência:** `express-rate-limit` adicionado ao `package.json`

```typescript
// src/modules/auth/presentation/routes/auth.routes.ts — adicionar ao router
import rateLimit from "express-rate-limit"

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post("/login", loginLimiter, controller.login)
```

#### A.2 — `/me` filtra soft-delete

```typescript
// src/modules/auth/infrastructure/repositories/auth.repository.impl.ts — findById()
// Adicionar isNull(usuarios.deletedAt) na condição WHERE
async findById(id: string): Promise<Usuario | null> {
  const rows = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.id, id), isNull(usuarios.deletedAt)))
  const row = rows[0]
  if (!row) return null
  return { ...row, role: row.role as "admin" | "operator" }
}
```

#### A.3 — auth.middleware valida usuário no banco

O middleware passa a ser `async` e consulta o banco após decodificar o JWT.
Para evitar dependência circular, importa `db` e `usuarios` diretamente de `database.js`.

```typescript
// src/shared/middleware/auth.middleware.ts
import { db, usuarios } from "../../database.js"
import { eq, isNull } from "drizzle-orm"

export async function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
    return
  }

  try {
    const token = header.slice(7)
    const payload = verifyToken(token)

    // Valida existência do usuário no banco (bloqueia soft-deleted)
    const [usuario] = await db.select().from(usuarios).where(
      and(eq(usuarios.id, payload.userId), isNull(usuarios.deletedAt))
    ).limit(1)
    if (!usuario) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Usuário não encontrado ou removido." })
      return
    }

    req.userId = payload.userId
    req.userRole = payload.role
    // req.empresaId será adicionado na Fase C

    next()
  } catch {
    res.status(401).json({ code: "TOKEN_EXPIRED", message: "Token inválido ou expirado." })
  }
}
```

> **Coordenação com Fase C:** Este mesmo arquivo será alterado novamente na Fase C para injetar `req.empresaId` do JWT. A Fase C deve partir deste código já async.

#### A.4 — Erro de rede no login

```typescript
// frontend/src/modules/auth/pages/LoginPage.tsx — catch do handleSubmit
catch (err) {
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    setError("Erro de conexão. Verifique sua internet.")
    return
  }
  // ... tratamento existente para ApiError
}
```

#### A.5 — Arquivos alterados na Fase A

| Arquivo | Mudança |
|---------|---------|
| `package.json` | Adicionar `express-rate-limit` |
| `src/modules/auth/presentation/routes/auth.routes.ts` | Rate limiter no POST /login |
| `src/modules/auth/infrastructure/repositories/auth.repository.impl.ts` | `findById` filtra soft-delete |
| `src/shared/middleware/auth.middleware.ts` | Async + valida existência no banco |
| `frontend/src/modules/auth/pages/LoginPage.tsx` | Feedback erro de rede |
| `frontend/src/api/client.ts` | Tratamento de `Failed to fetch` no `apiRequest` |

#### Checklist Fase A

- [ ] `express-rate-limit` instalado (`npm i express-rate-limit`)
- [ ] `POST /api/auth/login` limitado a 10 tentativas/15min por IP
- [ ] `findById` filtra `deletedAt IS NULL`
- [ ] `auth.middleware` async — valida existência do usuário no banco (importa `db` + `usuarios` direto)
- [ ] LoginPage mostra feedback amigável em erro de rede
- [ ] `api/client.ts` trata `Failed to fetch` globalmente
- [ ] `tsc --noEmit` passa no backend e frontend

---

### Fase B — Banco de Dados + Seed

**Arquivos:** 1 alterado (`src/database.ts`) + 1 alterado (`.env.example`)

#### B.1 — Schema Drizzle

```typescript
export const empresas = sqliteTable("empresas", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  createdAt: text("createdAt").notNull(),
})

// usuarios ganha:
empresaId: text("empresaId"),
```

#### B.2 — Raw SQL em createTables()

```sql
CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### B.3 — Migração: coluna empresaId

```typescript
try {
  sqlite.exec("ALTER TABLE usuarios ADD COLUMN empresaId TEXT")
} catch {
  // coluna ja existe
}
```

#### B.4 — Seed

```typescript
// Super admin
const superEmail = process.env.SUPER_ADMIN_EMAIL ?? "super@nexus.com"
const superPassword = process.env.SUPER_ADMIN_DEFAULT_PASSWORD ?? "super123"

if (!sqlite.prepare("SELECT id FROM usuarios WHERE email = ?").get(superEmail)) {
  const superId = randomUUID()
  sqlite.prepare(
    "INSERT OR IGNORE INTO usuarios (id, nome, email, senhaHash, role, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).run(superId, "Super Admin", superEmail, bcrypt.hashSync(superPassword, 10), "super_admin")
}

// Empresa "Desenvolvimento" + backfill do admin existente
const devEmpresaId = randomUUID()
sqlite.prepare(
  "INSERT OR IGNORE INTO empresas (id, nome, createdAt) VALUES (?, ?, datetime('now'))"
).run(devEmpresaId, "Desenvolvimento")

// Vincular admin@cobranca.com à empresa Desenvolvimento
sqlite.prepare(
  "UPDATE usuarios SET empresaId = ? WHERE email = ? AND empresaId IS NULL"
).run(devEmpresaId, "admin@cobranca.com")

// Vincular operadores órfãos ao mesmo admin/empresa
const adminRow = sqlite.prepare(
  "SELECT id, empresaId FROM usuarios WHERE email = ?"
).get("admin@cobranca.com") as { id: string; empresaId: string } | undefined

if (adminRow) {
  sqlite.prepare(
    "UPDATE usuarios SET empresaId = ? WHERE empresaId IS NULL AND id != ?"
  ).run(adminRow.empresaId, adminRow.id)
}
```

#### B.5 — .env.example (novas vars)

```env
# Super Admin (seed inicial)
SUPER_ADMIN_EMAIL=super@nexus.com
SUPER_ADMIN_DEFAULT_PASSWORD=super123
```

#### Checklist Fase B

- [ ] Tabela `empresas` criada
- [ ] Coluna `empresaId` adicionada em `usuarios`
- [ ] Schema Drizzle atualizado com `empresas` + `empresaId`
- [ ] Seed: `super@nexus.com` (super_admin, empresaId=null)
- [ ] Seed: empresa "Desenvolvimento" criada
- [ ] Seed: `admin@cobranca.com` vinculado à empresa Desenvolvimento
- [ ] `.env.example` com novas vars do super_admin
- [ ] `tsc --noEmit` passa

---

### Fase C — Backend: empresaId no ecossistema

**Arquivos:** 7 alterados + 1 novo

#### C.1 — Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/shared/types/express.d.ts` | `userRole` ganha `"super_admin"`; adiciona `empresaId?: string \| null` |
| `src/modules/auth/domain/usuario.entity.ts` | `role` ganha `"super_admin"`; adiciona `empresaId: string \| null` |
| `src/shared/utils/jwt.ts` | `JwtPayload` inclui `empresaId: string \| null`; `signToken()` inclui `empresaId` |
| `src/shared/middleware/auth.middleware.ts` | Injeta `req.empresaId` do JWT na request (já async da Fase A) |
| `src/shared/middleware/admin.middleware.ts` | Aceita `admin` **e** `super_admin` |
| `src/modules/auth/presentation/controllers/auth.controller.ts` | `me()` retorna `empresaId` e `empresaNome` via JOIN com empresas |
| `src/modules/auth/application/use-cases/Login/LoginUseCase.ts` | Passa `usuario.empresaId` para `signToken()` |

#### C.2 — Novo arquivo

| Arquivo | Função |
|---------|--------|
| `src/shared/middleware/super-admin.middleware.ts` | Verifica `role === "super_admin"`, retorna 403 caso contrário |

#### C.3 — admin.middleware (alterado)

```typescript
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== "admin" && req.userRole !== "super_admin") {
    res.status(403).json({ code: "FORBIDDEN", message: "Acesso restrito a administradores." })
    return
  }
  next()
}
```

#### C.4 — super admin middleware

```typescript
// src/shared/middleware/super-admin.middleware.ts
export function superAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== "super_admin") {
    res.status(403).json({ code: "FORBIDDEN", message: "Acesso restrito ao super administrador." })
    return
  }
  next()
}
```

#### C.5 — jwt.ts — payload enriquecido

```typescript
export interface JwtPayload {
  userId: string
  role: "super_admin" | "admin" | "operator"
  empresaId: string | null  // NOVO
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" })
}
```

#### C.6 — GET /api/auth/me — response enriquecido

```json
{
  "id": "uuid",
  "nome": "João",
  "email": "joao@comercio.com",
  "role": "admin",
  "empresaId": "uuid-empresa",
  "empresaNome": "Comércio do João"
}
```

#### Checklist Fase C

- [ ] `Request` type inclui `"super_admin"` e `empresaId`
- [ ] `Usuario` entity inclui `empresaId`
- [ ] JWT payload inclui `empresaId`
- [ ] `LoginUseCase` passa `empresaId` para `signToken()`
- [ ] `auth.middleware` injeta `req.empresaId` do JWT (parte da alteração da Fase A já async)
- [ ] `admin.middleware` aceita `admin` e `super_admin`
- [ ] `super-admin.middleware` criado (apenas `super_admin`)
- [ ] `GET /api/auth/me` retorna `empresaId` e `empresaNome` via LEFT JOIN com `empresas`
- [ ] `auth.repository.impl.ts` — type assertion de `role` atualizado para incluir `"super_admin"`
- [ ] `tsc --noEmit` passa

---

### Fase D — Backend: Módulo Empresa (super_admin)

**Arquivos:** 8 novos + 1 alterado

#### D.1 — Novos arquivos (clean architecture)

| Arquivo | Função |
|---------|--------|
| `src/modules/admin/domain/errors/empresa.error.ts` | `EmpresaNaoEncontradaError` |
| `src/modules/admin/domain/empresa.entity.ts` | Interface `Empresa` e `EmpresaComStats` |
| `src/modules/admin/application/ports/empresa.repository.ts` | `IEmpresaRepository`: `findAll` (com stats), `create` (empresa + admin, transação atômica) |
| `src/modules/admin/application/use-cases/CriarEmpresa/CriarEmpresaUseCase.ts` + `CriarEmpresaInput.ts` | Cria empresa + admin atômico |
| `src/modules/admin/application/use-cases/ListarEmpresas/ListarEmpresasUseCase.ts` | Lista empresas com stats |
| `src/modules/admin/infrastructure/repositories/empresa.repository.impl.ts` | Implementação Drizzle com transação |
| `src/modules/admin/presentation/controllers/empresa.controller.ts` | Handlers: `list` e `create` |
| `src/modules/admin/presentation/routes/empresa.routes.ts` | Router com `superAdminMiddleware` |

#### D.2 — Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/main.ts` | Montar `empresaRoutes` em `/api/admin/empresas` com `authMiddleware` + `superAdminMiddleware` |

#### D.3 — Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/admin/empresas` | super_admin | Lista todas empresas. Response: `[{ id, nome, totalOperadores, totalClientes, contratosAtivos, createdAt }]` |
| `POST` | `/api/admin/empresas` | super_admin | Cria empresa + admin. Body: `{ nome, adminNome, adminEmail, adminSenha }` → 201 |

#### D.4 — POST /api/admin/empresas — fluxo

```
1. Valida campos obrigatórios (nome, adminNome, adminEmail, adminSenha)
2. Verifica email duplicado — empresa.repository recebe IAuthRepository via constructor
   para chamar findByEmail() antes da transação
3. BEGIN TRANSACTION (sqlite.exec("BEGIN IMMEDIATE"))
4.   INSERT INTO empresas (id, nome, createdAt)
5.   INSERT INTO usuarios (id, nome, email, senhaHash, role='admin', empresaId, createdAt)
6. COMMIT
7. Em caso de erro → ROLLBACK
8. Retorna 201 { empresa: { id, nome }, admin: { id, nome, email } }
```

#### Checklist Fase D

- [ ] `CriarEmpresaUseCase` com transação atômica
- [ ] `ListarEmpresasUseCase` com stats agregados
- [ ] `empresa.routes.ts` montado com `superAdminMiddleware`
- [ ] `main.ts` com `empresaRoutes` em `/api/admin/empresas`
- [ ] Validação de email duplicado
- [ ] `tsc --noEmit` passa

---

### Fase E — Admin queries isoladas por empresaId

**Arquivos:** 5 alterados

#### E.1 — Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/modules/admin/application/ports/admin.repository.ts` | Assinaturas ganham `empresaId?: string \| null` em `findAllOperadores`, `create`, `findById`, `getDashboardStats` |
| `src/modules/admin/infrastructure/repositories/admin.repository.impl.ts` | Implementa filtro condicional: se `empresaId` definido → filtra; se null/undefined → sem filtro (super_admin) |
| `src/modules/admin/presentation/controllers/admin.controller.ts` | Drill-down: aceita `?empresaId=X` nos endpoints `list`, `dashboard`, `create`, `update`, `remove` |
| `src/modules/admin/application/use-cases/CriarOperador/CriarOperadorUseCase.ts` | Input ganha `empresaId: string \| null`; valida que role não é `super_admin` |
| `src/modules/admin/application/use-cases/ListarOperadores/ListarOperadoresUseCase.ts` | `execute()` ganha parâmetro `empresaId?: string \| null` |

#### E.2 — Admin controller (alterado)

Método auxiliar para resolver o `empresaId` correto:

```typescript
// Lógica compartilhada por todos os handlers
private resolveEmpresaId(req: Request): string | null | undefined {
  // Super_admin: usa query param do drill-down; sem param = vê tudo (null → undefined)
  if (req.userRole === "super_admin") {
    return (req.query.empresaId as string) || undefined
  }
  // Admin: sempre usa empresaId do token
  return req.empresaId
}
```

`create()` — super_admin no drill-down cria operador na empresa correta:

```typescript
create = async (req: Request, res: Response) => {
  const { nome, email, senha, role } = req.body
  const targetEmpresaId = this.resolveEmpresaId(req)

  // Super_admin sem drill-down: não pode criar operador sem especificar empresa
  if (req.userRole === "super_admin" && !targetEmpresaId) {
    res.status(400).json({ code: "VALIDATION_ERROR", message: "Informe a empresa (empresaId)." })
    return
  }

  const senhaHash = await bcrypt.hash(senha, 10)
  const operador = await this.criarUseCase.execute({
    nome, email, senhaHash, role,
    empresaId: targetEmpresaId  // null apenas se super_admin sem drill-down (bloqueado acima)
  })
  res.status(201).json(operador)
}
```

`list` e `dashboard`:

```typescript
list = async (req: Request, res: Response) => {
  const targetEmpresaId = this.resolveEmpresaId(req)
  const operadores = await this.listUseCase.execute(targetEmpresaId)
  res.json(operadores)
}

dashboard = async (req: Request, res: Response) => {
  const targetEmpresaId = this.resolveEmpresaId(req)
  const stats = await this.dashboardGetter.getDashboardStats(targetEmpresaId)
  res.json(stats)
}
```

`update` e `remove` — validam que o operador pertence à empresa do admin:

```typescript
update = async (req: Request, res: Response) => {
  const targetEmpresaId = this.resolveEmpresaId(req)
  // findById agora filtra por empresaId, retornando null se não pertence
  const operador = await this.editarUseCase.execute(req.params.id, data, userId, targetEmpresaId)
  res.json(operador)
}

remove = async (req: Request, res: Response) => {
  const targetEmpresaId = this.resolveEmpresaId(req)
  // softDelete valida empresaId antes de remover
  await this.removerUseCase.execute(req.params.id, userId, targetEmpresaId)
  res.status(204).send()
}
```

#### E.3 — CriarOperadorUseCase (alterado) + ListarOperadoresUseCase

```typescript
// CriarOperadorInput — empresaId herdado do criador
interface CriarOperadorInput {
  nome: string
  email: string
  senhaHash: string
  role: "admin" | "operator"  // super_admin NÃO aceito
  empresaId: string | null      // herdado do criador/admin
}

// ListarOperadoresUseCase.execute() ganha parâmetro opcional
async execute(empresaId?: string | null): Promise<OperadorRow[]> {
  return this.repo.findAllOperadores(empresaId)
}
```

#### E.4 — EditarOperadorUseCase + RemoverOperadorUseCase (alterados)

Ambos ganham validação de `empresaId`:

```typescript
// EditarOperadorUseCase — findById agora filtra por empresaId
async execute(id: string, data: EditData, currentUserId: string, empresaId?: string | null) {
  // findById com empresaId retorna null se operador não pertence à empresa
  const existing = await this.repo.findById(id, empresaId)
  if (!existing) throw new OperadorNaoEncontradoError()
  // ... resto igual
}

// RemoverOperadorUseCase — softDelete valida empresaId
async execute(id: string, currentUserId: string, empresaId?: string | null) {
  const existing = await this.repo.findById(id, empresaId)
  if (!existing) throw new OperadorNaoEncontradoError()
  if (id === currentUserId) throw new NaoPodeAutoModificarError("Você não pode remover a si mesmo.")
  await this.repo.softDelete(id)
}
```

#### E.5 — IAdminRepository (atualizado)

```typescript
export interface IAdminRepository {
  findAllOperadores(empresaId?: string | null): Promise<OperadorRow[]>
  findById(id: string, empresaId?: string | null): Promise<OperadorRow | null>
  findByEmail(email: string): Promise<OperadorRow | null>
  create(input: { nome: string; email: string; senhaHash: string; role: "admin" | "operator"; empresaId: string | null }): Promise<OperadorRow>
  update(id: string, data: { nome?: string; email?: string; role?: "admin" | "operator"; senhaHash?: string }, currentUserId: string): Promise<OperadorRow | null>
  softDelete(id: string, currentUserId: string): Promise<void>
  getDashboardStats(empresaId?: string | null): Promise<AdminDashboardStats>
}
```

#### E.6 — Queries de admin filtradas

```typescript
// findAllOperadores — filtro condicional por empresaId
async findAllOperadores(empresaId?: string | null): Promise<OperadorRow[]> {
  const conditions = [isNull(usuarios.deletedAt)]
  if (empresaId) {
    conditions.push(eq(usuarios.empresaId, empresaId))
  }
  // empresaId null/undefined → sem filtro → super_admin vê todos
  const rows = await db.select().from(usuarios).where(and(...conditions))
  // ... mapeamento com stats por operador
}

// findById — valida empresaId
async findById(id: string, empresaId?: string | null): Promise<OperadorRow | null> {
  const conditions = [eq(usuarios.id, id), isNull(usuarios.deletedAt)]
  if (empresaId) {
    conditions.push(eq(usuarios.empresaId, empresaId))
  }
  // ...
}

// getDashboardStats — todas queries filtradas por empresaId
async getDashboardStats(empresaId?: string | null): Promise<AdminDashboardStats> {
  const hoje = getLocalDateString(new Date())

  // Helper: filtra por empresaId via JOIN com usuarios
  const byEmpresa = empresaId ? and(eq(clientes.userId, usuarios.id), eq(usuarios.empresaId, empresaId)) : undefined

  const [totalOps, totalClientesResult, contratosResult, recebidoResult] = await Promise.all([
    // totalOperadores
    empresaId
      ? db.select({ total: count() }).from(usuarios)
          .where(and(isNull(usuarios.deletedAt), eq(usuarios.empresaId, empresaId)))
      : db.select({ total: count() }).from(usuarios).where(isNull(usuarios.deletedAt)),
    // totalClientes — JOIN usuarios para filtrar por empresaId
    empresaId
      ? db.select({ total: count() }).from(clientes)
          .innerJoin(usuarios, eq(clientes.userId, usuarios.id))
          .where(and(isNull(clientes.deletedAt), eq(usuarios.empresaId, empresaId)))
      : db.select({ total: count() }).from(clientes).where(isNull(clientes.deletedAt)),
    // contratosAtivos — JOIN usuarios
    empresaId
      ? db.select({ total: count() }).from(contratos)
          .innerJoin(usuarios, eq(contratos.userId, usuarios.id))
          .where(and(isNull(contratos.deletedAt), eq(usuarios.empresaId, empresaId)))
      : db.select({ total: count() }).from(contratos).where(isNull(contratos.deletedAt)),
    // recebidoHoje — pagamentos filtrados por userId → JOIN usuarios
    empresaId
      ? db.select({ total: sum(pagamentos.valor) }).from(pagamentos)
          .innerJoin(usuarios, eq(pagamentos.userId, usuarios.id))
          .where(and(eq(pagamentos.data, hoje), eq(usuarios.empresaId, empresaId)))
      : db.select({ total: sum(pagamentos.valor) }).from(pagamentos).where(eq(pagamentos.data, hoje)),
  ])

  // resultadoDoDia — mesmo padrão para movimentacoesFinanceiras
  const [entradas, saidas] = await Promise.all([
    empresaId
      ? db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras)
          .innerJoin(usuarios, eq(movimentacoesFinanceiras.userId, usuarios.id))
          .where(and(eq(movimentacoesFinanceiras.tipo, "entrada"), eq(movimentacoesFinanceiras.data, hoje), eq(usuarios.empresaId, empresaId)))
      : db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras)
          .where(and(eq(movimentacoesFinanceiras.tipo, "entrada"), eq(movimentacoesFinanceiras.data, hoje))),
    // ... saidas (mesmo padrão)
  ])

  return {
    totalOperadores: totalOps[0].total,
    totalClientes: totalClientesResult[0].total,
    contratosAtivos: contratosResult[0].total,
    recebidoHoje: Number(recebidoResult[0].total) || 0,
    resultadoDoDia: (Number(entradas[0].total) || 0) - (Number(saidas[0].total) || 0),
  }
}
```

#### Checklist Fase E

- [ ] `findAllOperadores(empresaId)` — filtro condicional; null = sem filtro
- [ ] `findById(id, empresaId)` — valida que operador pertence à empresa
- [ ] `create()` insere `empresaId` do criador; super_admin sem drill-down bloqueado
- [ ] `getDashboardStats(empresaId)` — todas 5 queries (ops, clientes, contratos, pagamentos, movimentacoes) filtradas por empresaId via JOIN
- [ ] Controller: `resolveEmpresaId()` aplicado em `list`, `create`, `update`, `remove`, `dashboard`
- [ ] `CriarOperadorUseCase` valida que role não é `super_admin`
- [ ] `EditarOperadorUseCase` e `RemoverOperadorUseCase` validam `empresaId` via `findById`
- [ ] Admin da Empresa A não vê/edita/remove operadores da Empresa B
- [ ] Super_admin (sem empresaId) vê todos operadores; (com `?empresaId=X`) vê só Empresa X
- [ ] `tsc --noEmit` passa

---

### Fase F — Frontend

**Arquivos:** 4 novos + 8 alterados

#### F.1 — Novos arquivos

| Arquivo | Função |
|---------|--------|
| `frontend/src/modules/admin/services/empresa.service.ts` | `listEmpresas()`, `createEmpresa()` |
| `frontend/src/modules/admin/pages/SuperAdminPage.tsx` | Índice de empresas: KPIs + lista + botão criar |
| `frontend/src/modules/admin/components/EmpresaList.tsx` | Cards de empresa com stats + botão "Acessar" |
| `frontend/src/modules/admin/components/EmpresaForm.tsx` | Modal: nome empresa + dados do admin |

#### F.2 — Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/shared/auth/AuthContext.tsx` | `AuthUser.role` ganha `"super_admin"`; adiciona `empresaId`, `empresaNome` |
| `frontend/src/modules/auth/services/auth.service.ts` | Tipos `LoginResponse` e `MeResponse` incluem `super_admin`, `empresaId`, `empresaNome` |
| `frontend/src/modules/admin/services/admin.service.ts` | Todos os métodos ganham `empresaId?: string` opcional → append `?empresaId=X` nas chamadas |
| `frontend/src/App.tsx` | Rota `/admin/empresas` e `/admin/empresas/:id` |
| `frontend/src/shared/components/Navbar.tsx` | Link "Admin" visível para `admin` e `super_admin`; link "Empresas" (ícone Building) só para `super_admin` |
| `frontend/src/i18n/locales/pt-BR.json` | ~20 novas chaves (`superAdmin.*`) |
| `frontend/src/i18n/locales/en.json` | Tradução EN das chaves `superAdmin.*` |
| `frontend/src/i18n/locales/es.json` | Tradução ES das chaves `superAdmin.*` |

#### F.3 — Fluxo do super_admin

```
SuperAdminPage (índice)                AdminPage (drill-down)
┌────────────────────────┐            ┌──────────────────────────────┐
│ 🏢 Empresas            │            │ ← Voltar    Empresa: C. João │
│                        │  clica     │                              │
│ 🏢 Comércio do João    │──"Acessar"→│ 3 Operadores  45 Clientes   │
│   3 ops · 45 clientes  │            │                              │
│          [Acessar]     │            │ 👤 Pedro (op) · 12 clientes  │
│                        │            │ 👤 Ana (op) · 18 clientes    │
│ 🏢 Loja da Maria       │            │ 👤 Carlos (op) · 15 clientes │
│   2 ops · 30 clientes  │            │                              │
│          [Acessar]     │            │ + Novo Operador              │
│                        │            └──────────────────────────────┘
│ + Nova Empresa         │
└────────────────────────┘
```

#### F.4 — Estrutura da SuperAdminPage

```
SuperAdminPage
├── KpiCard × 3 (KPIs globais)
│   ├── Total de Empresas (blue)
│   ├── Total de Usuários (green)
│   └── Total de Clientes (yellow)
│
├── SectionHeader ("Empresas" + botão "Nova Empresa")
│
├── EmpresaList
│   └── Card.Root (variant="list-item") × N
│       ├── Card.Header: nome da empresa
│       ├── Card.Body: operadores, clientes, contratos ativos
│       └── Card.Actions: botão "Acessar" → /admin/empresas/:id
│
└── EmpresaForm (Modal)
    ├── Campos: nome empresa, nome admin, email, senha
    └── Botão: Criar Empresa
```

#### F.5 — AdminPage existente (sem alteração visual)

A AdminPage atual permanece igual. A diferença é que:
- Quando acessada via `/admin` → dashboard do próprio admin (empresaId do token)
- Quando acessada via `/admin/empresas/:id` (super_admin) → todas chamadas API incluem `?empresaId=X`

#### F.6 — Componentes reaproveitados

| Componente | Uso |
|-----------|-----|
| `KpiCard` | 3 KPIs globais na SuperAdminPage |
| `Card.Root`, `Card.Header`, `Card.Body`, `Card.Actions` | Cards de empresa |
| `SectionHeader` | Título + botão |
| `FeedbackOverlay` | Feedback de criação |
| `Button`, `ButtonLink` | Ações |
| `react-hook-form` + `zod` | Validação do EmpresaForm |

#### Checklist Fase F

- [ ] `AuthUser` inclui `"super_admin"`, `empresaId`, `empresaNome`
- [ ] `LoginResponse` e `MeResponse` atualizados
- [ ] Navbar mostra "Admin" para admin e super_admin
- [ ] Navbar mostra "Empresas" (ícone Building) apenas para super_admin
- [ ] `SuperAdminPage` renderiza KPIs + lista + formulário
- [ ] Botão "Acessar" navega para `/admin/empresas/:id`
- [ ] `/admin/empresas/:id` renderiza AdminPage com filtro `empresaId` (passado via query param nas chamadas API)
- [ ] Botão "Voltar" na AdminPage em modo drill-down
- [ ] `admin.service.ts` — métodos `listOperadores`, `createOperador`, `updateOperador`, `deleteOperador`, `getDashboard` ganham `empresaId?: string` opcional
- [ ] `tsc --noEmit` passa no frontend
- [ ] i18n com chaves `superAdmin.*` em pt-BR, en, es

---

### Fase G — Registro público (futuro, pós-deploy)

**Não incluso neste plano.** Será um plano separado (PLAN-020).

Escopo previsto:
- `POST /api/auth/register` — público, cria empresa + admin
- Página `/registro` com formulário de auto-cadastro
- Validação de email único, senha forte
- Rate limiting

---

## Modelo de isolamento (resumo visual)

```
Tabela usuarios:
┌──────────┬───────────────┬─────────────┐
│ id       │ role          │ empresaId   │
├──────────┼───────────────┼─────────────┤
│ super-id │ super_admin   │ NULL        │
│ admin-A  │ admin         │ empresa-1   │
│ pedro-id │ operator      │ empresa-1   │
│ ana-id   │ operator      │ empresa-1   │
│ admin-B  │ admin         │ empresa-2   │
└──────────┴───────────────┴─────────────┘

Tabela clientes (userId → JOIN usuarios → empresaId):
┌──────────┬──────────┐         ┌──────────┬───────────┐
│ nome     │ userId   │         │ nome     │ empresa   │
├──────────┼──────────┤         ├──────────┼───────────┤
│ João     │ pedro-id │────────→│ João     │ empresa-1 │
│ Maria    │ ana-id   │────────→│ Maria    │ empresa-1 │
│ Carlos   │ admin-A  │────────→│ Carlos   │ empresa-1 │
│ José     │ outro    │────────→│ José     │ empresa-2 │
└──────────┴──────────┘         └──────────┴───────────┘

Zero coluna empresaId nas 10 tabelas operacionais.
```

| | Operador Pedro | Admin Empresa 1 | Super Admin (drill-down Emp 1) | Super Admin (global) |
|---|---|---|---|---|
| Clientes do Pedro | ✅ userId | ✅ JOIN empresa-1 | ✅ JOIN empresa-1 | ✅ tudo |
| Clientes da Ana | ❌ userId ≠ | ✅ mesma empresa | ✅ mesma empresa | ✅ |
| Clientes da Empresa 2 | ❌ | ❌ empresaId ≠ | ❌ empresaId ≠ | ✅ |

---

## i18n — Novas chaves

```json
{
  "superAdmin": {
    "title": "Empresas",
    "empresas": "Empresas",
    "novaEmpresa": "Nova Empresa",
    "criarEmpresa": "Criar Empresa",
    "nomeEmpresa": "Nome da Empresa",
    "adminNome": "Nome do Administrador",
    "adminEmail": "E-mail do Administrador",
    "adminSenha": "Senha do Administrador",
    "totalEmpresas": "Empresas",
    "totalUsuarios": "Usuários",
    "totalClientes": "Total de Clientes",
    "operadores": "operadores",
    "clientes": "clientes",
    "contratosAtivos": "contratos ativos",
    "acessar": "Acessar",
    "voltar": "Voltar",
    "criarSucesso": "Empresa criada com sucesso.",
    "erroCarregar": "Erro ao carregar empresas.",
    "erroCriar": "Erro ao criar empresa.",
    "validacao": {
      "nomeObrigatorio": "Informe o nome da empresa.",
      "adminNomeObrigatorio": "Informe o nome do administrador.",
      "adminEmailInvalido": "E-mail inválido.",
      "adminEmailObrigatorio": "Informe o e-mail do administrador.",
      "adminSenhaCurta": "A senha deve ter ao menos 6 caracteres.",
      "adminSenhaObrigatoria": "Informe a senha do administrador."
    },
    "navEmpresas": "Empresas"
  }
}
```

---

## Resumo de arquivos

| Fase | Origem | Novos | Alterados | Complexidade |
|------|--------|-------|-----------|--------------|
| A — Hardening auth | Existente | 0 | 6 | 🟢 Baixa |
| B — DB + seed | Existente | 0 | 2 | 🟡 Média |
| C — empresaId ecossistema | Existente + Novo | 1 | 7 | 🟡 Média |
| D — Backend empresa | Novo | 8 | 1 | 🟡 Média |
| E — Admin queries isoladas | Existente | 0 | 5 | 🟡 Média |
| F — Frontend | Novo + Existente | 4 | 8 | 🟡 Média |
| G — Registro público | Futuro | — | — | TBD |
| **Total** | | **13** | **29** | |

---

## Critérios de conclusão

- [ ] Rate limiting: 10 tentativas/15min no login
- [ ] `auth.middleware` valida existência do usuário no banco
- [ ] `GET /api/auth/me` filtra soft-delete e retorna `empresaId` + `empresaNome`
- [ ] Tabela `empresas` criada e populada no seed
- [ ] Coluna `empresaId` em `usuarios` com backfill
- [ ] `super@nexus.com` funcional como super_admin
- [ ] `empresaId` no JWT, no `req`, no `AuthUser`
- [ ] `adminMiddleware` aceita `admin` e `super_admin`
- [ ] `superAdminMiddleware` restringe rotas de empresa
- [ ] `POST /api/admin/empresas` cria empresa + admin atomicamente
- [ ] `GET /api/admin/empresas` lista empresas com stats + botão "Acessar"
- [ ] `GET /api/admin/operadores?empresaId=X` — filtro condicional
- [ ] Admin da Empresa A não vê/edita/remove operadores da Empresa B
- [ ] Super_admin vê tudo (sem filtro) ou drill-down (`?empresaId=X`)
- [ ] Super_admin no drill-down: cria operador na empresa correta, NÃO cria sem especificar empresa
- [ ] Operador herda `empresaId` do admin que o criou
- [ ] SuperAdminPage funcional (KPIs + lista + formulário + drill-down)
- [ ] Navbar com link "Empresas" condicional (super_admin)
- [ ] Tipos frontend aceitam `"super_admin"`, `empresaId`, `empresaNome`
- [ ] LoginPage com feedback de erro de rede
- [ ] `tsc --noEmit` passa em todo o projeto
- [ ] i18n com chaves `superAdmin.*` em pt-BR, en, es
- [ ] `admin@cobranca.com` continua funcional vinculado à empresa "Desenvolvimento"

---

## Pendências / Gaps identificados

| Gap | Descrição | Resolução |
|-----|-----------|-----------|
| CHECK constraint `role` | SQLite `CHECK(role IN ('admin','operator'))` não inclui `'super_admin'` | SQLite não suporta `ALTER COLUMN`. Remover CHECK do banco — validação fica só no Zod/use-case. |
| Empresa sem editar/remover | MVP só tem criar e listar | OK para agora. Editar nome e soft-delete da empresa vêm depois. |
| Role change não invalida token | Promoção/rebaixamento surte efeito após re-login (até 7 dias) | Aceito para MVP. O auth.middleware agora valida existência do usuário no banco — se for soft-deleted, bloqueia imediatamente. |
| Password change não invalida token | Token antigo continua válido até expirar | Aceito para MVP. Admin pode soft-delete o operador para forçar logout imediato. |
| localStorage XSS risk | Token em localStorage é vulnerável a XSS | Postergado — httpOnly cookie virá com refresh token no futuro. |
| `auth.middleware` tocado em 2 fases | Fase A: async + validate. Fase C: injetar `empresaId` | Coordenação documentada em C.1 — Fase C parte do código já async da Fase A |
| `empresaId` em tokens antigos | Usuários logados antes do deploy não terão `empresaId` no JWT | `req.empresaId` será `undefined` (tratado como null). Comportamento: sem filtro (vê tudo). Re-login resolve. |

---

## Referências

- `product/04-ROADMAP.md`
- `product/01-DOMAIN.md`
- `product/02-BUSINESS-RULES.md` — BR-055 a BR-077
- `engineering/00-ARCHITECTURE.md`
- `engineering/01-DATABASE.md`
- `engineering/02-API.md`
- `engineering/04-BACKEND.md`
- `engineering/03-FRONTEND.md`
- `engineering/design/06-UI-PATTERNS.md`
- `foundation/ADR-003-Auth-Autorizacao.md`
- `plans/PLAN-015-autenticacao.md`
- `plans/PLAN-017-admin-panel.md`
- `plans/PLAN-018-deploy.md`
