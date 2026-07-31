# PLAN-017 — Admin Panel + Níveis Permissionais

**Status:** Concluído

**Versão:** 1.1

**Início:** 30/07/2026

**Última atualização:** 30/07/2026

**Roadmap:** product/04-ROADMAP.md §5.2

**Dependências:** PLAN-015 (Autenticação Multi-Usuário) — fases A, B, C, D

---

## Objetivo

Estender o subsistema de autenticação (PLAN-015) com:

1. Diferenciação de papéis (`admin` / `operator`) na tabela `usuarios` e no payload JWT
2. Middleware de autorização por papel (`admin.middleware.ts`)
3. Módulo de gestão de operadores (backend + frontend)
4. Painel de administração com visão consolidada de todos os operadores

---

## Diagnóstico

| Aspecto | Estado após PLAN-015 | O que falta |
|---------|---------------------|-------------|
| Papéis de usuário | Coluna `role` na tabela `usuarios` | Middleware que verifica `role` |
| Middleware de autorização | Apenas `auth.middleware` | `admin.middleware` para rotas `/api/admin/*` |
| Gestão de operadores | Apenas `POST /api/auth/register` | CRUD completo: listar, editar, remover |
| Painel admin | Nenhum | AdminPage, OperadoresList, OperadorForm |
| Visão consolidada | Nenhuma | `GET /api/admin/dashboard` |
| Reuso de componentes | — | 100% viável — todos os componentes shared existentes suprem a AdminPage |

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Modelo de papéis | `role` TEXT com CHECK constraint | Simples, extensível (basta adicionar valor ao CHECK) |
| Admin vê todos os dados | Endpoint dedicado `/api/admin/dashboard` + queries sem filtro `userId` | Não contamina os endpoints operacionais com lógica condicional |
| Remoção de operador | Soft-delete (`deletedAt`) | Mantém integridade referencial; dados históricos preservados |
| Middleware separado | `admin.middleware.ts` independente | Responsabilidade única; composto com `auth.middleware` |
| Admin default | `admin@cobranca.com` com `role = 'admin'` | Já previsto no PLAN-015 |
| Registro de operadores | Movido para `/api/admin/operadores` | Separação clara: auth = identidade; admin = gestão |
| JWT payload | Incluir `role` além de `userId` | Evita query extra no banco a cada requisição |

---

## Fases de implementação

```
PLAN-015 (base)
  Fase A (DB + role) → Fase B (Auth Backend + role no JWT)
    → Fase C (Queries userId) → Fase D (Frontend Auth)
      → Fase E (Admin Backend) ← NOVO
        → Fase F (Admin Frontend) ← NOVO
```

As fases A-D pertencem ao PLAN-015. As fases E-F são novas.

---

## Fase E — Backend: Módulo Admin

**Arquivos:** 9 novos + 1 alterado

### E.1 — Novos arquivos

| Arquivo | Função |
|---------|--------|
| `src/modules/admin/domain/errors/admin.error.ts` | `OperadorNaoEncontradoError`, `NaoPodeAutoModificarError`, `EmailDuplicadoError` |
| `src/modules/admin/application/ports/admin.repository.ts` | `IAdminRepository`: `findAll`, `findById`, `create`, `update`, `softDelete`, `getDashboardStats` |
| `src/modules/admin/application/use-cases/ListOperadores/ListOperadoresUseCase.ts` | Listar todos operadores com stats (totalClientes, contratosAtivos) |
| `src/modules/admin/application/use-cases/CriarOperador/CriarOperadorUseCase.ts` + `Input.ts` | Criar operador com validação de email duplicado |
| `src/modules/admin/application/use-cases/EditarOperador/EditarOperadorUseCase.ts` + `Input.ts` | Editar nome, email, role; validação de não-auto-rebaixar |
| `src/modules/admin/application/use-cases/RemoverOperador/RemoverOperadorUseCase.ts` | Soft-delete; validação de não-auto-remover |
| `src/modules/admin/infrastructure/repositories/admin.repository.impl.ts` | Implementação Drizzle |
| `src/modules/admin/presentation/controllers/admin.controller.ts` | Handlers para os 5 endpoints |
| `src/modules/admin/presentation/routes/admin.routes.ts` | Router com `auth.middleware` + `admin.middleware` |

### E.2 — Novo arquivo shared

| Arquivo | Função |
|---------|--------|
| `src/shared/middleware/admin.middleware.ts` | Verifica `req.userRole === 'admin'`, retorna 403 caso contrário |

### E.3 — Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/main.ts` | Montar `adminRoutes` em `/api/admin` com `authMiddleware` + `adminMiddleware` |

### E.4 — Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/admin/operadores` | Admin | Listar todos operadores. Response: `[{ id, nome, email, role, totalClientes, contratosAtivos, createdAt }]` |
| `POST` | `/api/admin/operadores` | Admin | Criar operador. Body: `{ nome, email, senha, role }` → 201 |
| `PATCH` | `/api/admin/operadores/:id` | Admin | Editar operador. Body parcial: `{ nome?, email?, role?, senha? }` |
| `DELETE` | `/api/admin/operadores/:id` | Admin | Soft-delete. Validações: não pode ser o próprio admin |
| `GET` | `/api/admin/dashboard` | Admin | KPIs consolidados: totalOperadores, totalClientes, totalContratosAtivos, recebidoHoje, resultadoDoDia |

### E.5 — Regras de negócio implementadas

| BR | Regra | Onde |
|----|-------|-----|
| BR-066 | Admin acessa todos os dados; operator apenas os próprios | `admin.middleware` + queries sem `userId` em `/api/admin/*` |
| BR-067 | Apenas admin gerencia operadores | `admin.middleware` nas rotas `/api/admin/*` |
| BR-068 | Admin vê dashboard consolidado | `GET /api/admin/dashboard` |
| BR-069 | Admin não pode rebaixar o próprio `role` | `EditarOperadorUseCase` |
| BR-070 | Admin não pode remover a si mesmo | `RemoverOperadorUseCase` |
| BR-071 | Dados do operador removido permanecem | Soft-delete (`deletedAt`), sem cascade |

---

## Fase F — Frontend: Admin Panel

**Arquivos:** 4 novos + 3 alterados

### F.1 — Novos arquivos

| Arquivo | Função |
|---------|--------|
| `frontend/src/modules/admin/services/admin.service.ts` | `listOperadores()`, `createOperador()`, `updateOperador()`, `deleteOperador()`, `getDashboard()` |
| `frontend/src/modules/admin/pages/AdminPage.tsx` | Página principal: KPIs consolidados + lista de operadores |
| `frontend/src/modules/admin/components/OperadoresList.tsx` | Lista de cards de operador com ações (editar, remover) |
| `frontend/src/modules/admin/components/OperadorForm.tsx` | Modal de criação/edição (react-hook-form + zod) |

### F.2 — Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/App.tsx` | Rota `/admin` protegida (auth + role check) |
| `frontend/src/shared/components/Navbar.tsx` | Link "Admin" condicional (ícone Shield, visível se `role === 'admin'`) |
| `frontend/src/i18n/locales/pt-BR.json` | ~22 novas chaves (`auth.*` + `admin.*`) |

### F.3 — Estrutura da AdminPage

Seguindo o template "Dashboard" do UI-PATTERNS.md:

```
AdminPage
├── KpiCard × 4 (KPIs consolidados)
│   ├── Total de Operadores (blue)
│   ├── Total de Clientes (green)
│   ├── Contratos Ativos (yellow)
│   └── Resultado do Dia (gray)
│
├── SectionHeader ("Operadores" + botão "Novo Operador")
│
├── SearchBar (busca por nome/email)
│
├── EstadoTela (loading/empty/error)
│   └── OperadoresList
│       └── Card.Root (variant="list-item") × N
│           ├── Card.Header: nome + StatusBadge (role)
│           ├── Card.Body: email, stats (clientes, contratos)
│           └── Card.Actions: editar (Button.ghost), remover (Button.danger)
│
└── OperadorForm (Modal)
    ├── Campos: nome, email, senha, role (select admin/operator)
    └── Botão: Salvar
```

### F.4 — Componentes reaproveitados (zero código novo de UI)

| Componente | Uso na AdminPage |
|-----------|-----------------|
| `KpiCard` | 4 KPIs consolidados |
| `Card.Root` + `Card.Header` + `Card.Body` + `Card.Actions` | Cards de operador |
| `StatusBadge` | Badge do role (admin = info, operator = neutral) |
| `SearchBar` | Busca de operadores |
| `SectionHeader` | Título + botão "Novo Operador" |
| `EstadoTela` | Loading/empty/error states |
| `ConfirmModal` | Confirmação ao remover operador |
| `FeedbackOverlay` | Feedback de ações (via `useFeedback().run()`) |
| `Button` / `ButtonLink` | Ações |
| `react-hook-form` + `zod` | Validação do OperadorForm |

### F.5 — Schema de validação

```typescript
// admin/schemas/operador.schema.ts
const operadorSchema = z.object({
  nome: z.string().min(3, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres.").optional(),
  role: z.enum(['admin', 'operator'], { required_error: "Selecione um papel." })
})
```

---

## i18n — Novas chaves

```json
{
  "auth": {
    "title": "Entrar",
    "email": "E-mail",
    "senha": "Senha",
    "entrar": "Entrar",
    "sair": "Sair",
    "erroLogin": "E-mail ou senha inválidos.",
    "tokenExpirado": "Sessão expirada. Faça login novamente."
  },
  "admin": {
    "title": "Administração",
    "operadores": "Operadores",
    "novoOperador": "Novo Operador",
    "editarOperador": "Editar Operador",
    "nome": "Nome",
    "email": "E-mail",
    "senha": "Senha",
    "role": "Papel",
    "roleAdmin": "Administrador",
    "roleOperator": "Operador",
    "totalOperadores": "Operadores",
    "totalClientes": "Total de Clientes",
    "contratosAtivos": "Contratos Ativos",
    "resultadoDia": "Resultado do Dia",
    "removerConfirmacao": "Remover este operador? Seus dados permanecerão no sistema.",
    "removerSucesso": "Operador removido.",
    "criarSucesso": "Operador criado.",
    "editarSucesso": "Operador atualizado.",
    "erroCarregar": "Erro ao carregar dados de administração.",
    "erroAutoRemover": "Você não pode remover a si mesmo.",
    "erroAutoRebaixar": "Você não pode alterar seu próprio papel.",
    "validacao": {
      "nomeObrigatorio": "Informe o nome.",
      "emailObrigatorio": "Informe o e-mail.",
      "emailInvalido": "E-mail inválido.",
      "senhaCurta": "A senha deve ter ao menos 6 caracteres.",
      "roleObrigatorio": "Selecione um papel."
    }
  }
}
```

---

## Resumo de arquivos

| Fase | Origem | Novos | Alterados | Complexidade |
|------|--------|-------|-----------|--------------|
| PLAN-015 A-D (base) | PLAN-015 | 13 | ~46 | 🔴 Alta |
| E — Admin Backend | Novo | 9 | 1 | 🟡 Média |
| F — Admin Frontend | Novo | 4 | 3 | 🟡 Média |
| **Total** | | **26** | **~50** | |

---

## Critérios de conclusão

- [x] Coluna `role` na tabela `usuarios` com CHECK constraint
- [x] `admin.middleware.ts` funcional (200 para admin, 403 para operator)
- [x] JWT payload inclui `role`
- [x] `GET /api/admin/operadores` retorna lista com stats por operador
- [x] `POST /api/admin/operadores` cria operador com validação de email único
- [x] `PATCH /api/admin/operadores/:id` bloqueia auto-rebaixamento
- [x] `DELETE /api/admin/operadores/:id` bloqueia auto-remoção
- [x] `GET /api/admin/dashboard` retorna KPIs consolidados de todos operadores
- [x] AdminPage renderiza KPIs + lista de operadores com busca
- [x] OperadorForm cria/edita com react-hook-form + zod + FeedbackOverlay
- [x] Navbar mostra link Admin condicionalmente (ícone Shield)
- [x] LoginPage funcional (PLAN-015 Fase D)
- [x] ProtectedRoute redireciona para `/login` sem token
- [x] `tsc --noEmit` passa em todo o projeto
- [x] i18n com chaves `auth.*` e `admin.*` em pt-BR, en, es

---

## Referências

- `product/04-ROADMAP.md` §5.2
- `product/02-BUSINESS-RULES.md` — BR-055 a BR-071
- `product/01-DOMAIN.md`
- `engineering/01-DATABASE.md`
- `engineering/02-API.md`
- `engineering/04-BACKEND.md`
- `engineering/03-FRONTEND.md`
- `engineering/design/01-UX.md`
- `engineering/design/06-UI-PATTERNS.md`
- `engineering/05-MAPEAMENTO-TELAS.md`
- `foundation/ADR-001-Arquitetura.md`
- `foundation/ADR-002-Arquitetura-Front.md`
- `foundation/ADR-003-Auth-Autorizacao.md`
- `plans/PLAN-015-autenticacao.md`
