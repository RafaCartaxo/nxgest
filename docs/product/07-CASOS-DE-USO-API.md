# CASOS DE USO E CENÁRIOS DE TESTE — API

**Status:** Em uso

**Versão:** 1.1

**Data:** 03/08/2026

**Regras relacionadas:** `02-BUSINESS-RULES.md`

**Contrato completo (request/response JSON):** `engineering/02-API.md`

> **Validação executada (03/08/2026):** 104 cenários executados via `scripts/smoke-api.mjs` — todos PASS contra instância isolada, incluindo as variações V1–V8 (pagamento que atravessa parcelas, quitar→Finalizado, estorno reverte, 2 contratos, ajuste absoluto, cross-tenant, super admin, token inválido), o **PLAN-030** (`GET /api/admin/equipe`, coerência Σ operadores = totais), o **PLAN-031** (módulos/whitelabel — MOD-091..096) e o **PLAN-032** (hierarquia/sócio — SC-001..006, subárvore). Corrigidos no PLAN-029: `dataPromessa` obrigatória para promessa e senha mín. 6 no backend admin.

---

## Objetivo

Base de **casos de uso e cenários de teste no nível de API**: para cada endpoint, o que se espera (status + shape) e **conferências de coerência** — o que um retorno deve refletir em outro endpoint/tela/KPI. Complementa a `06-CASOS-DE-USO.md` (fluxos de tela).

Esta base alimenta diretamente a **collection Postman** (`api-collection.json`): cada `API-UC` tem um request correspondente e cada `API-CT` é um cenário executável (happy path, validação, permissão, coerência).

## Convenções

- **API-UC-###** — caso de uso por endpoint: `Auth` (quem pode chamar), `Request`, `Response` (resumo), `Coerência` (checks), `Regras`, `Postman` (pasta > request).
- **API-CT-###** — cenário de teste em Dado/Quando/Então.
- **Status de autenticação:** todo endpoint, exceto os marcados como **público**, exige `Authorization: Bearer <token>` (401 sem token).
- Status codes: 200/201 ok · 400 validação básica · 401 não autenticado · 403 proibido (perfil) · 404 não encontrado · 409 conflito (duplicado/estado) · 422 validação de regra · 429 rate limit.

## Como executar (smoke)

Os cenários desta base são executados por `scripts/smoke-api.mjs` (`npm run smoke:api`) contra uma **instância isolada** (não usar o dev/3001):

```bash
# 1) instância isolada (tabelas criadas no boot, seed aplicado depois)
rm -f /tmp/nxgestao-smoke.db*
DB_PATH=/tmp/nxgestao-smoke.db PORT=3002 npx tsx src/main.ts &   # cria tabelas
# parar, então:
DB_PATH=/tmp/nxgestao-smoke.db node scripts/seed-demo.mjs        # seed (senha teste123!)
# subir de novo com limite de login ampliado (o smoke faz ~12 logins):
DB_PATH=/tmp/nxgestao-smoke.db PORT=3002 LOGIN_RATE_LIMIT_MAX=1000 npx tsx src/main.ts &

# 2) rodar
node scripts/smoke-api.mjs --baseUrl http://localhost:3002       # ou npm run smoke:api
```

Cenários **manuais** (V9 — empty states) não são cobertos pelo smoke; validar com um operador sem dados.

---

## Índice por endpoint

| # | Endpoint | UC | CTs |
|---|----------|----|-----|
| 1 | `GET /api/health` | API-UC-001 | 001 |
| 2 | `POST /api/auth/login` | API-UC-002 | 002-004 |
| 3 | `GET /api/auth/me` | API-UC-003 | 005-006, 087 |
| 4 | `POST /api/clientes` | API-UC-004 | 007-009 |
| 5 | `GET /api/clientes` | API-UC-005 | 010 |
| 6 | `GET /api/clientes/:id` | API-UC-006 | 011-012, 103-104 |
| 7 | `PATCH /api/clientes/:id` | API-UC-007 | 013-014 |
| 8 | `DELETE /api/clientes/:id` | API-UC-008 | 015-016 |
| 9 | `POST /api/contratos` | API-UC-009 | 017-019 |
| 10 | `GET /api/contratos` | API-UC-010 | 020, 105 |
| 11 | `GET /api/contratos/:id` | API-UC-011 | 021-022 |
| 12 | `PATCH /api/contratos/:id` | API-UC-012 | 023-024 |
| 13 | `DELETE /api/contratos/:id` | API-UC-013 | 025-026 |
| 14 | `POST /api/pagamentos` | API-UC-014 | 027-028, 080-082 |
| 15 | `POST /api/pagamentos/preview` | API-UC-015 | 029-030 |
| 16 | `GET /api/pagamentos/contrato/:contratoId` | API-UC-016 | 031 |
| 17 | `POST /api/pagamentos/:id/estornar` | API-UC-017 | 032-034 |
| 18 | `GET /api/operacoes/cobrancas` | API-UC-018 | 035, 083 |
| 19 | `GET /api/operacoes/pagamentos-hoje` | API-UC-019 | 036 |
| 20 | `GET /api/operacoes/parcelas-hoje` | API-UC-020 | 037 |
| 21 | `GET /api/operacoes/parcelas-semana` | API-UC-021 | 038 |
| 22 | `GET /api/operacoes/historico-atrasos` | API-UC-022 | 039 |
| 23 | `POST /api/operacoes/visitas` | API-UC-023 | 040-041, 078 |
| 24 | `GET /api/caixa` | API-UC-024 | 042-043 |
| 25 | `POST /api/caixa/ajuste` | API-UC-025 | 044-046, 084-086 |
| 26 | `GET /api/caixa/movimentacoes` | API-UC-026 | 047 |
| 27 | `GET /api/caixa/auditoria` | API-UC-027 | 048 |
| 28 | `POST /api/caixa/liquidar` | API-UC-028 | 049-050 |
| 29 | `POST /api/gastos` | API-UC-029 | 051-052 |
| 30 | `GET /api/gastos` | API-UC-030 | 053 |
| 31 | `DELETE /api/gastos/:id` | API-UC-031 | 054-055 |
| 32 | `GET /api/admin/operadores` | API-UC-032 | 056-057 |
| 33 | `GET /api/admin/operadores/:id` | API-UC-033 | 058-059 |
| 34 | `POST /api/admin/operadores` | API-UC-034 | 060-062, 079 |
| 35 | `PATCH /api/admin/operadores/:id` | API-UC-035 | 063-064 |
| 36 | `DELETE /api/admin/operadores/:id` | API-UC-036 | 065-066 |
| 37 | `GET /api/admin/dashboard` | API-UC-037 | 067-068 |
| 38 | `GET /api/admin/equipe` | API-UC-042 | 088-090 |
| 38 | `GET /api/admin/empresas` | API-UC-038 | 069-070 |
| 39 | `GET /api/admin/empresas/:id` | API-UC-039 | 071-072 |
| 40 | `POST /api/admin/empresas` | API-UC-040 | 073-074 |
| 41 | `PATCH /api/auth/senha` | API-UC-041 | 075-077 |
| 42 | `PATCH /api/auth/foto` | API-UC-042 | 088 |
| 43 | `POST /api/clientes/:id/anexos` | API-UC-043 | 089-092 |
| 44 | `GET /api/clientes/:id/anexos` | API-UC-044 | 089 |
| 45 | `GET /api/clientes/:id/anexos/:anexoId/file` | API-UC-045 | 093 |
| 46 | `DELETE /api/clientes/:id/anexos/:anexoId` | API-UC-046 | 094 |
| 43 | `PATCH /api/admin/empresas/:id/modulos` | API-UC-043 | 091-096 |
| 47 | `PATCH /api/admin/empresas/:id` | API-UC-047 | 095 |

---

# HEALTH

## API-UC-001 — Health check

**Endpoint:** `GET /api/health` · **Auth:** público

**Response 200:** `{ status: "ok", db: "connected" }`

**Coerência:**
- [ ] `db: "connected"` implica que a API consegue consultar o banco (login funcionará)?

**Regras:** — · **Postman:** `Health > Health check`

### API-CT-001 — Health ok
**Dado** o serviço no ar e o banco acessível → **Quando** `GET /api/health` → **Então** 200 com `status: "ok"`.

---

# AUTH

## API-UC-002 — Login

**Endpoint:** `POST /api/auth/login` · **Auth:** público (rate limit 10/15min)

**Request:** `{ email, senha }`

**Response 200:** `{ token, usuario: { id, nome, email, role, empresaId, empresaNome } }`

**Coerência:**
- [ ] O token decodifica com `{ userId, role, empresaId }` iguais ao `usuario` retornado?
- [ ] `role` roteia o login (BR-081): operator→`/`, admin→`/admin`, super_admin→`/admin/empresas`?
- [ ] Usuário soft-deleted não consegue logar (BR-071)?

**Regras:** BR-055, BR-058, BR-077, BR-081 · **Postman:** `Auth > Login`

### API-CT-002 — Login válido
**Dado** usuário ativo com senha correta → **Quando** `POST /api/auth/login` → **Então** 200 com `token` (JWT de 7 dias) e `usuario.role` correto.

### API-CT-003 — Login inválido
**Dado** senha errada ou usuário inexistente → **Quando** `POST /api/auth/login` → **Então** 401 `INVALID_CREDENTIALS`, mensagem genérica (não expõe o campo), sem token.
**Dado** usuário com `deletedAt` preenchido → **Então** mesmo 401 (não revela existência).

### API-CT-004 — Rate limit
**Dado** 11+ tentativas no mesmo IP em 15min → **Quando** repito `POST /api/auth/login` → **Então** 429 `RATE_LIMIT` (BR-077).

---

## API-UC-003 — Usuário logado

**Endpoint:** `GET /api/auth/me` · **Auth:** Bearer

**Response 200:** `{ id, nome, email, role, empresaId, empresaNome }`

**Coerência:**
- [ ] `empresaId`/`empresaNome` batem com a empresa do usuário (`null` para super_admin)?

**Regras:** BR-058 · **Postman:** `Auth > Me`

### API-CT-005 — Me válido
**Dado** token válido → **Quando** `GET /api/auth/me` → **Então** 200 com os dados do usuário.

### API-CT-006 — Me sem token
**Dado** sem `Authorization` → **Quando** `GET /api/auth/me` → **Então** 401.

### API-CT-087 — Rota protegida com token inválido (401)
**Dado** token inválido/expirado em **qualquer** rota protegida (ex.: `GET /api/clientes`, `GET /api/caixa`) → **Então** 401; o front limpa o token e redireciona para `/login` (BR-058). *Cobertura genérica além do `/me`.*

---

# CLIENTES

## API-UC-004 — Criar cliente

**Endpoint:** `POST /api/clientes` · **Auth:** operador/admin/super_admin

**Request:** `{ nome, telefone, comercio, logradouro, cpf?, numero?, bairro?, complemento?, cidade?, uf? }`

**Response 201:** cliente criado (com `saldoDevedor = 0`)

**Coerência:**
- [ ] O cliente aparece em `GET /api/clientes` e no detalhe?
- [ ] CPF duplicado (mesmo operador) → 409 (BR-043)?
- [ ] CPF inválido (dígito verificador) → 422 (BR-036)?

**Regras:** BR-001, BR-003, BR-036, BR-037, BR-043 · **Postman:** `Clientes > Criar`

### API-CT-007 — Criar cliente válido
**Dado** payload com os obrigatórios (nome, telefone, comércio, logradouro) → **Quando** `POST /api/clientes` → **Então** 201 e `GET /api/clientes/:id` retorna o mesmo cliente.

### API-CT-008 — CPF duplicado
**Dado** CPF já cadastrado pelo mesmo operador → **Quando** `POST /api/clientes` → **Então** 409 com mensagem clara.

### API-CT-009 — CPF inválido / campos obrigatórios
**Dado** CPF com dígito verificador errado, ou sem nome/comércio → **Quando** `POST /api/clientes` → **Então** 422.

---

## API-UC-005 — Listar clientes

**Endpoint:** `GET /api/clientes` · **Auth:** Bearer

**Response 200:** lista paginada de clientes **do operador logado** (isolamento BR-056)

> **Escopo `?usuarioId=`:** **não é suportado** no list (diferente de `GET /api/contratos`, que aceita). Para listar clientes de outro operador, não há endpoint — apenas o `GET /api/clientes/:id?usuarioId=` (getById) aceita o escopo. Assimetria conhecida entre módulos.

**Coerência:**
- [ ] Só clientes do `req.userId` (operador não vê clientes de outro)?

**Regras:** BR-056 · **Postman:** `Clientes > Listar`

### API-CT-010 — Lista escopada
**Dado** dois operadores com clientes distintos → **Quando** cada um chama `GET /api/clientes` → **Então** cada um vê apenas os próprios.

---

## API-UC-006 — Detalhe do cliente

**Endpoint:** `GET /api/clientes/:id` · **Auth:** Bearer

**Response 200:** cliente com saldo devedor agregado + situação financeira (PLAN-033)

**Coerência:**
- [ ] `saldoDevedor` = Σ saldo pendente das parcelas dos contratos não deletados?
- [ ] `valorEmAtraso`/`parcelasEmAtraso`/`diasEmAtraso` coerentes com parcelas vencidas (inclui `Parcial`)? (BR-096)
- [ ] `valorVenceHoje` = Σ parcelas com vencimento hoje? (BR-096)
- [ ] `ultimoPagamento` ignora estornados e é o mais recente por `data`? (BR-097)
- [ ] `lucroPrevisto` = Σ(`valorFinal − valorBase`) dos contratos `Ativo`? (BR-098)
- [ ] Cliente de outro operador → 404 (não expõe existência)?

**Regras:** BR-056, BR-096, BR-097, BR-098 · **Postman:** `Clientes > Detalhe`

### API-CT-011 — Detalhe ok
**Dado** cliente próprio → **Quando** `GET /api/clientes/:id` → **Então** 200 com saldo coerente com os contratos.

### API-CT-012 — Detalhe de outro operador
**Dado** id de cliente de outro operador → **Quando** `GET /api/clientes/:id` → **Então** 404.

### API-CT-103 — Campos financeiros no detalhe
**Dado** cliente com parcelas vencidas + vencendo hoje + pagamentos → **Quando** `GET /api/clientes/:id` → **Então** 200 com `valorEmAtraso`, `parcelasEmAtraso`, `diasEmAtraso`, `valorVenceHoje`, `ultimoPagamento { data, valor }` e `lucroPrevisto` coerentes com as parcelas/contratos (BR-096..098).

### API-CT-104 — Parcial vencida e lucro (Finalizado fora)
**Dado** cliente com parcela `Parcial` vencida e contrato `Finalizado` → **Quando** `GET /api/clientes/:id` → **Então** a parcela `Parcial` vencida conta no atraso e o contrato `Finalizado` não entra no `lucroPrevisto`.

---

## API-UC-007 — Editar cliente

**Endpoint:** `PATCH /api/clientes/:id` · **Auth:** Bearer

**Request:** parcial `{ nome?, telefone?, comercio?, cpf?, ... }`

**Response 200:** cliente atualizado

**Coerência:**
- [ ] CPF duplicado de **outro** cliente → 409; manter o próprio CPF não acusa (BR-043)?
- [ ] Contratos/pagamentos existentes não mudam (BR-003)?

**Regras:** BR-003, BR-043 · **Postman:** `Clientes > Editar`

### API-CT-013 — Editar válido
**Dado** cliente próprio → **Quando** `PATCH /api/clientes/:id` alterando nome → **Então** 200 e o novo nome reflete no `GET :id`.

### API-CT-014 — CPF duplicado excluindo o próprio
**Dado** CPF de outro cliente do mesmo operador → **Então** 409; **Dado** o próprio CPF mantido → **Então** 200.

### API-CT-132 — Foto do cliente no PATCH (P8/PLAN-058)
- **Dado** `PATCH` com `foto: null` (+ `enderecoComercio: null`, `localizacao: null`, `localizacaoComercio: null` — cliente sem foto/GPS) → **Então** 200 (antes 422: `foto` não aceitava `null`).
- **Dado** `PATCH` com `foto: "data:image/jpeg;base64,..."` (magic bytes válidos, ≤1MB decodificados) → **Então** 200 e `GET` reflete a foto.
- **Dado** `PATCH` com foto grande válida (~150KB decodificados, 640px) → **Então** 200 (cap elevado PLAN-058).
- **Dado** `PATCH` com `data:image/svg+xml` → **Então** 422 (allowlist exclui `svg`).
- **Dado** `PATCH` com foto mascarada (base64 de texto rotulado `image/jpeg`) → **Então** 422 (magic bytes).
- **Dado** `PATCH` com foto > 1MB decodificados → **Então** 422.
- **Dado** `PATCH` com `foto: null` de um cliente com foto → **Então** 200 e `GET` devolve `foto: null` (remoção).

---

## API-UC-008 — Excluir cliente

**Endpoint:** `DELETE /api/clientes/:id` · **Auth:** Bearer

**Response 204:** soft delete

**Coerência:**
- [ ] Cliente com contrato **ativo** → bloqueado (409)?
- [ ] Cliente sem contratos → some das listas; dados não são apagados fisicamente (BR-071)?

**Regras:** BR-017, BR-071 · **Postman:** `Clientes > Excluir`

### API-CT-015 — Excluir cliente sem contratos
**Dado** cliente sem contratos → **Quando** `DELETE /api/clientes/:id` → **Então** 200 e `GET /api/clientes` não o lista mais.

### API-CT-016 — Excluir cliente com contratos
**Dado** cliente com contrato ativo → **Então** 409 (contratos ativos impedem exclusão).

---

## ANEXOS (PLAN-042)

## API-UC-043 — Enviar anexo

**Endpoint:** `POST /api/clientes/:id/anexos` · **Auth:** Bearer + escopo · **Multipart:** campo `arquivo` + opcional `tipo`

**Response 201:** `{ id, nome, tipo, mime, tamanho, createdAt }`

**Coerência:**
- [ ] Imagem JPEG/PNG/WebP pós-compressão ≤1MB → 201; >1MB → **422 `ANEXO_LIMITE`**?
- [ ] PDF ≤5MB → 201; >5MB → **413** (multer)?
- [ ] Tipo real fora da allowlist (ex.: arquivo `.exe` renomeado) → **422 `ANEXO_TIPO`**?
- [ ] Cliente de outro operador / fora da subárvore → **404**?
- [ ] Aparece no `GET /api/clientes/:id/anexos`?

**Regras:** BR-102 · **Postman:** `Clientes > Enviar anexo`

### API-CT-089 — Upload imagem válida
**Dado** operador com um cliente próprio → **Quando** `POST .../anexos` com JPEG ≤1MB → **Então** 201 e o item aparece na lista.

### API-CT-090 — Upload PDF válido
**Dado** PDF ≤5MB → **Então** 201; o `file` serve com `Content-Type: application/pdf`.

### API-CT-091 — Limites
**Dado** imagem >1MB → **Então** 422 `ANEXO_LIMITE`; **Dado** arquivo >5MB → **Então** 413.

### API-CT-092 — Tipo inválido (MIME real)
**Dado** arquivo com extensão/`content-type` falso, mas conteúdo fora da allowlist → **Então** 422 `ANEXO_TIPO`.

## API-UC-044 — Listar anexos

**Endpoint:** `GET /api/clientes/:id/anexos` · **Auth:** Bearer + escopo

**Response 200:** array de metadados (sem bytes).

## API-UC-045 — Baixar anexo

**Endpoint:** `GET /api/clientes/:id/anexos/:anexoId/file` · **Auth:** Bearer + escopo

**Response 200:** binário do arquivo (`Content-Type` do MIME real, `Content-Disposition: inline`).

### API-CT-093 — Lista e stream escopados
**Dado** `GET .../anexos` de cliente do escopo → **Então** 200 com metadados; `GET .../anexos/:id/file` → **Então** 200 binário. **Dado** anexo de cliente fora do escopo (outro operador, `?usuarioId=` de outra subárvore) → **Então** 404.

## API-UC-046 — Remover anexo

**Endpoint:** `DELETE /api/clientes/:id/anexos/:anexoId` · **Auth:** Bearer + escopo

**Response 204:** arquivo apagado de `UPLOADS_DIR` + linha removida.

### API-CT-094 — Remoção
**Dado** anexo do escopo → **Então** 204 e some da lista e do `file` (404). **Dado** anexo inexistente ou fora do escopo → **Então** 404.

---

---

## PLAN-055 — Localização (GPS) e navegação — persistência

**Regras (decisões PLAN-055):** `localizacao` (principal) e `localizacaoComercio` são `{lat, lng}` opcionais. Semântica de `PATCH`: **ausente = mantém**, **`null` = limpa** (o frontend envia `null` quando o texto do endereço é editado — fix do endereço). `enderecoComercio: null` limpa o texto. Coords sem texto são permitidas (S7 — navega por ponto).

### API-CT-100 — Criar com `localizacao` (principal) + `localizacaoComercio` (GEO-001)
**Dado** payload com `localizacao` e `localizacaoComercio` → **Quando** `POST /api/clientes` → **Então** 201 e o `GET :id` reflete ambos (GEO-002).

### API-CT-101 — PATCH texto do comércio sem `localizacaoComercio` (GEO-003)
**Dado** cliente com coords do comércio → **Quando** `PATCH /api/clientes/:id` alterando só o texto do comércio → **Então** 200 e as **coords são mantidas** (a limpeza é responsabilidade do frontend, enviando `localizacaoComercio: null`).

### API-CT-102 — PATCH `localizacaoComercio: null` zera coords do comércio (GEO-004)
**Quando** `PATCH /api/clientes/:id` com `{ localizacaoComercio: null }` → **Então** `GET :id` retorna `localizacaoComercio: null`.

### API-CT-103 — PATCH `localizacao: null` zera coords do principal (GEO-005)
**Quando** `PATCH /api/clientes/:id` com `{ localizacao: null }` → **Então** `GET :id` retorna `localizacao: null`.

### API-CT-104 — PATCH só `localizacaoComercio` nova substitui e mantém texto (GEO-006)
**Quando** `PATCH /api/clientes/:id` com `{ localizacaoComercio: {lat, lng} }` → **Então** coords substituídas e `enderecoComercio` inalterado.

### API-CT-105 — Criar com `localizacaoComercio` sem texto do comércio é permitido (GEO-007)
**Dado** payload com coords do comércio e **sem** `enderecoComercio` → **Então** 201 (navegação por ponto, S7).

---

# CONTRATOS

## API-UC-009 — Criar contrato

**Endpoint:** `POST /api/contratos` · **Auth:** Bearer

**Request:** `{ clienteId, valorBase, percentualJuros, quantidadeParcelas, dataInicio }`

> **Campo correto é `percentualJuros`** (não `juros`) — mesmo nome usado no front (`contrato.schema.ts`). Omisso → default 20.

**Response 201:** contrato com parcelas geradas

**Coerência:**
- [ ] Caixa insuficiente (`saldoAtual < valorBase`) → 422 (BR-019)?
- [ ] Parcelas pulam domingo (BR-042)?
- [ ] Gera movimentação de saída (origem Contrato) refletida no caixa?
- [ ] `valorFinal = valorBase × (1 + juros/100)` (BR-005)?

**Regras:** BR-004 a BR-007, BR-019, BR-039, BR-041, BR-042 · **Postman:** `Contratos > Criar`

### API-CT-017 — Contrato válido
**Dado** caixa suficiente → **Quando** `POST /api/contratos` → **Então** 201; `GET /api/caixa/movimentacoes` mostra saída/Contrato e `saldoAtual` caiu `valorBase`.

### API-CT-018 — Caixa insuficiente
**Dado** `valorBase` maior que o saldo → **Então** 422 e **nenhuma** movimentação criada.

### API-CT-019 — Cliente inexistente
**Dado** `clienteId` inválido → **Então** 404.

---

## API-UC-010 — Listar contratos

**Endpoint:** `GET /api/contratos` · **Auth:** Bearer

**Query:** `clienteId?`, `status?`, paginação

**Response 200:** contratos do operador com parcelas pagas/pendentes + situação de atraso

**Coerência:**
- [ ] Só contratos do operador logado (BR-056)?
- [ ] `estado` coerente (Ativo/Finalizado/Cancelado)?
- [ ] `emAtraso`/`parcelasEmAtraso`/`diasEmAtraso` coerentes com as parcelas vencidas do contrato (BR-099)?

**Regras:** BR-056, BR-099 · **Postman:** `Contratos > Listar`

### API-CT-020 — Lista escopada
**Dado** contratos de mais de um operador → **Quando** `GET /api/contratos` → **Então** retorna apenas os do `req.userId`.

### API-CT-105 — Lista de contratos retorna atraso
**Dado** contrato com parcelas vencidas (inclui `Parcial`) e `Finalizado` → **Quando** `GET /api/contratos` → **Então** 200 com `emAtraso` = Σ saldo pendente vencido, `parcelasEmAtraso` = quantidade e `diasEmAtraso` ≥ 1; contrato sem atraso → os três `0` (BR-099).

---

## API-UC-011 — Detalhe do contrato

**Endpoint:** `GET /api/contratos/:id` · **Auth:** Bearer

**Response 200:** contrato + parcelas + pagamentos

**Coerência:**
- [ ] Parcelas com estados coerentes (Pendente/Parcial/Paga) e saldos batendo com pagamentos?
- [ ] Contrato de outro operador → 404?

**Regras:** BR-008 a BR-012 · **Postman:** `Contratos > Detalhe`

### API-CT-021 — Detalhe ok
**Dado** contrato próprio → **Quando** `GET /api/contratos/:id` → **Então** 200 com parcelas coerentes.

### API-CT-022 — Detalhe de outro operador
**Dado** id de contrato de outro operador → **Então** 404.

---

## API-UC-012 — Editar contrato

**Endpoint:** `PATCH /api/contratos/:id` · **Auth:** Bearer

**Request:** parcial `{ valorBase?, juros?, quantidadeParcelas?, dataInicio? }`

**Coerência:**
- [ ] Contrato **com pagamentos** → bloqueado (BR-006/BR-008)?
- [ ] Sem pagamentos → parcelas antigas substituídas (soft delete) preservando histórico (BR-041)?

**Regras:** BR-006, BR-008, BR-041 · **Postman:** `Contratos > Editar`

### API-CT-023 — Editar sem pagamentos
**Dado** contrato sem pagamentos → **Quando** `PATCH /api/contratos/:id` → **Então** 200 e parcelas recalculadas.

### API-CT-024 — Editar com pagamentos
**Dado** contrato com pagamentos → **Então** 409 (condições financeiras imutáveis).

---

## API-UC-013 — Excluir contrato

**Endpoint:** `DELETE /api/contratos/:id` · **Auth:** Bearer

**Response 204:** soft delete + movimentação de entrada (origem Cancelamento)

**Coerência:**
- [ ] Contrato **com pagamentos** → bloqueado (BR-029)?
- [ ] Sem pagamentos → parcelas soft-deletadas e **entrada** de `valorBase` no caixa (BR-019)?

**Regras:** BR-019, BR-029 · **Postman:** `Contratos > Excluir`

### API-CT-025 — Excluir sem pagamentos
**Dado** contrato sem pagamentos → **Então** 200; `GET /api/caixa/movimentacoes` mostra entrada/Cancelamento e saldo aumentou.

### API-CT-026 — Excluir com pagamentos
**Dado** contrato com pagamentos → **Então** 409.

---

# PAGAMENTOS

## API-UC-014 — Registrar pagamento

**Endpoint:** `POST /api/pagamentos` · **Auth:** Bearer

**Request:** `{ contratoId, valor }`

**Response 201:** pagamento + distribuição por parcelas

**Coerência:**
- [ ] Distribuição das parcelas mais antigas para as mais recentes (BR-044)?
- [ ] Valor > saldo devedor → 422 (BR-016)?
- [ ] Parcela quitada → `Paga`; parcial → `Parcial` (BR-010/BR-012)?
- [ ] Gera movimentação de entrada (origem Pagamento) + KPI "recebido hoje"?

**Regras:** BR-013 a BR-016, BR-020, BR-044, BR-045, BR-047 · **Postman:** `Pagamentos > Registrar`

### API-CT-027 — Pagamento válido
**Dado** contrato com saldo → **Quando** `POST /api/pagamentos` → **Então** 201; parcela mais antiga quitada primeiro e movimentação de entrada refletida.

### API-CT-028 — Pagamento excede saldo
**Dado** valor maior que o saldo devedor → **Então** 422 e nenhuma movimentação criada.

### API-CT-080 — Pagamento atravessa parcelas (BR-045)
**Dado** contrato 4×150 (saldo 600) → **Quando** `POST /api/pagamentos` com `valor: 200` → **Então** 201; parcela 1 fica `Paga` e o excedente (50) aplica na parcela 2 (`Parcial`), preservando a ordem crescente (BR-044). *Excedente dentro do total do contrato — comportamento normal, permitido.*

### API-CT-081 — Quitar o contrato (BR-046)
**Dado** contrato com saldo restante X → **Quando** `POST /api/pagamentos` com `valor = X` → **Então** 201; `GET /api/contratos/:id` retorna `estado: "Finalizado"` e as parcelas todas `Paga` (com `dataQuitacao`).

### API-CT-082 — Estorno reverte contrato Finalizado → Ativo
**Dado** contrato quitado (CT-081) → **Quando** admin estorna o pagamento final → **Então** 201 e `GET /api/contratos/:id` volta a `estado: "Ativo"` (BR-029/046).

> **Nota P021 (pagamento a mais do TOTAL):** hoje bloqueado (422, BR-016). Ideia de "bônus" registrada no backlog — ver `plans/BACKLOG.md` P021. NÃO é comportamento atual.

---

## API-UC-015 — Preview de pagamento

**Endpoint:** `POST /api/pagamentos/preview` · **Auth:** Bearer

**Request:** `{ contratoId, valor }` — **não persiste nada**

**Response 200:** distribuição simulada

**Coerência:**
- [ ] Retorno igual ao que o `POST /api/pagamentos` real aplicaria?
- [ ] Nenhuma escrita no banco (movimentação/parcela) após o preview?

**Regras:** BR-044 · **Postman:** `Pagamentos > Preview`

### API-CT-029 — Preview coerente com o real
**Dado** contrato com saldo → **Quando** `POST /api/pagamentos/preview` → **Então** 200 com a mesma distribuição que o registro real produz.

### API-CT-030 — Preview não persiste
**Dado** preview executado → **Então** `GET /api/caixa/movimentacoes` não mostra movimentação nova e saldo inalterado.

---

## API-UC-016 — Pagamentos do contrato

**Endpoint:** `GET /api/pagamentos/contrato/:contratoId` · **Auth:** Bearer

**Response 200:** lista de pagamentos do contrato

**Coerência:**
- [ ] Só pagamentos do contrato solicitado, do operador logado?
- [ ] Pagamento estornado aparece marcado (`estornadoEm`)?

**Regras:** BR-029, BR-056 · **Postman:** `Pagamentos > Por contrato`

### API-CT-031 — Lista do contrato
**Dado** contrato com 2 pagamentos (um estornado) → **Então** 200 com os 2, o estornado com o selo/flag.
**Dado** pagamento estornado → **Então** a listagem retorna `estornadoEm` preenchido + `estornoMotivo` (coerência pós-estorno — fix 03/08, `findByContratoId`).

---

## API-UC-017 — Estornar pagamento

**Endpoint:** `POST /api/pagamentos/:id/estornar` · **Auth:** admin/super_admin apenas

**Request:** `{ motivo }` · **Query:** `usuarioId?`

**Response 201:** estorno aplicado

**Coerência:**
- [ ] Parcelas revertidas (estado/saldo/dataQuitacao); contrato `Finalizado` volta a `Ativo`?
- [ ] Movimentação reversa (saída/Cancelamento) criada **e visível** com motivo?
- [ ] Pagamento original NÃO é deletado (BR-029), marcado estornado?
- [ ] Operador chamando → 403? Duplo estorno → 409?

**Regras:** BR-029, BR-044 · **Postman:** `Pagamentos > Estornar`

### API-CT-032 — Estorno válido
**Dado** admin com pagamento do operador → **Então** 201; parcelas revertidas, movimentação reversa visível, pagamento marcado estornado.

### API-CT-033 — Operador proibido
**Dado** token de operator → **Então** 403.

### API-CT-034 — Duplo estorno
**Dado** pagamento já estornado → **Então** 409 `PAGAMENTO_JA_ESTORNADO`.

---

# OPERAÇÕES

## API-UC-018 — Cobranças do dia

**Endpoint:** `GET /api/operacoes/cobrancas` · **Auth:** Bearer

**Response 200:** `{ indicadores, cobrancas[] }`

**Coerência:**
- [ ] Cada item traz `resultadoOperacional` (PENDENTE/VISITADO/NAO_ENCONTRADO/PROMESSA) — a API **retorna todos**; o **front filtra PENDENTE** para a rota/fila (BR-053)?
- [ ] `situacao` correta (atrasado/venceHoje)?
- [ ] Indicadores batem com a lista (aReceberHoje = Σ pendentes do dia)?

**Regras:** BR-048 a BR-053, BR-086 · **Postman:** `Operações > Cobranças`

### API-CT-035 — Cobranças do dia
**Dado** pendentes + atendidos no dia → **Quando** `GET /api/operacoes/cobrancas` → **Então** 200 com todos, cada um marcado com `resultadoOperacional`; o cliente visitado hoje aparece como `VISITADO` (a exclusão da fila é responsabilidade do front).

### API-CT-083 — Cliente com 2 contratos → 2 linhas (UC-035 em nível API)
**Dado** cliente com 2 contratos pendentes → **Quando** `GET /api/operacoes/cobrancas` → **Então** 2 linhas para o mesmo `clienteId` (uma por contrato), cada uma com seu `totalPendente`/`situacao`.

> **Cenários manuais (V9 — empty states):** `cobrancas` e `pagamentos-hoje` vazios só são validáveis com um operador sem dados/atendimentos (UC-020/021). Testar via operador recém-criado ou em HML. Não cobertos pelo smoke automatizado (o seed sempre tem dados).

---

## API-UC-019 — Pagamentos do dia

**Endpoint:** `GET /api/operacoes/pagamentos-hoje` · **Auth:** Bearer

**Query:** `dataInicio?`, `dataFim?` (período)

**Response 200:** lista de pagamentos do período

**Coerência:**
- [ ] KPI "recebido hoje" do dashboard = Σ da lista com `data` = hoje?

**Regras:** BR-025 · **Postman:** `Operações > Pagamentos hoje`

### API-CT-036 — Pagamentos do dia
**Dado** pagamentos de hoje e de ontem → **Então** 200 e, sem filtro, retorna apenas os de hoje.

---

## API-UC-020 — Parcelas que vencem hoje

**Endpoint:** `GET /api/operacoes/parcelas-hoje` · **Auth:** Bearer

**Response 200:** clientes/contratos com parcelas vencendo hoje e saldo pendente

**Coerência:**
- [ ] Parcelas com `dataVencimento = hoje` e `saldoPendente > 0` apenas?
- [ ] Alimenta o KPI "a receber hoje" do caixa?

**Regras:** BR-024 · **Postman:** `Operações > Parcelas hoje`

### API-CT-037 — Parcelas de hoje
**Dado** parcelas vencendo hoje, amanhã e já pagas → **Então** 200 com só as de hoje e pendentes.

---

## API-UC-021 — Parcelas da semana (a vencer)

**Endpoint:** `GET /api/operacoes/parcelas-semana` · **Auth:** Bearer

**Response 200:** parcelas vencendo nos próximos 7 dias (**excluindo hoje**)

**Coerência:**
- [ ] **Nenhuma** parcela de hoje aparece (pertence a `parcelas-hoje`/`cobrancas` — UC-038)?
- [ ] Parcela futura (≤ hoje+7) aparece?
- [ ] **Consistência verificada (03/08):** a janela é a mesma do indicador `aVencer` de `GET /api/operacoes/cobrancas` (`dataVencimento > hoje AND ≤ hoje+7`, `saldoPendente > 0`) — o KPI e o modal desta lista batem (C5).

**Regras:** BR-018 a BR-027 · **Postman:** `Operações > Parcelas semana`

### API-CT-038 — Janela de 7 dias exclui hoje
**Dado** parcelas vencendo hoje, hoje+3 e hoje+9 → **Então** 200 apenas com a de hoje+3.

---

## API-UC-022 — Histórico de atrasos

**Endpoint:** `GET /api/operacoes/historico-atrasos` · **Auth:** Bearer

**Query:** `dias?` (padrão 30)

**Response 200:** snapshots diários de atraso

**Coerência:**
- [ ] Só dias em que o operador abriu as cobranças (BR-086 — sem job agendado)?
- [ ] Contagens `DISTINCT` de clientes/contratos?

**Regras:** BR-086 · **Postman:** `Operações > Histórico atrasos`

### API-CT-039 — Histórico de atrasos
**Dado** operador que abriu cobranças ontem e anteontem → **Então** 200 com esses dias; dia não aberto não gera linha.

---

## API-UC-023 — Registrar visita

**Endpoint:** `POST /api/operacoes/visitas` · **Auth:** Bearer

**Request:** `{ clienteId, contratoId, tipo (visitado|nao_localizado|promessa), dataPromessa? }`

> **Enum do request é `nao_localizado`** (não `nao_encontrado`). **Assimetria conhecida:** o `GET /api/operacoes/cobrancas` retorna o mesmo estado como `NAO_ENCONTRADO` (mapeado em `operacoes.repository.impl.ts`). O front envia `nao_localizado` e lê `NAO_ENCONTRADO`.

**Response 201:** visita registrada

**Coerência:**
- [ ] Cliente aparece com `resultadoOperacional` atualizado na lista de cobranças (o front filtra PENDENTE — BR-053)?
- [ ] Nenhum dado financeiro muda (BR-050)?
- [ ] `tipo` inválido → 422?
- [ ] `dataPromessa` **obrigatória** quando `tipo = promessa` → 422 se ausente (PLAN-029)?

**Regras:** BR-048 a BR-051 · **Postman:** `Operações > Visita`

### API-CT-040 — Visita válida
**Dado** cliente pendente → **Então** 201; `GET /api/operacoes/cobrancas` marca `resultadoOperacional` (ex.: `VISITADO`); saldo devedor inalterado.

### API-CT-041 — Tipo inválido
**Dado** `tipo` fora do conjunto → **Então** 422.

### API-CT-078 — Promessa sem dataPromessa
**Dado** `tipo = "promessa"` sem `dataPromessa` → **Então** 422 `VALIDATION_ERROR` (regra implementada no PLAN-029).

---

# CAIXA

## API-UC-024 — Status do caixa

**Endpoint:** `GET /api/caixa` · **Auth:** Bearer · **Query:** `dataInicio?`, `dataFim?`, `usuarioId?`

**Response 200:** `{ caixaBase, saldoAtual, aReceberHoje, recebidoHoje, recebidoSemana, vendasSemana, gastosSemana, resultadoSemana, ultimaLiquidacao, caixaUltimaLiquidacao }`

**Coerência:**
- [ ] `saldoAtual = caixaBase + Σ entradas − Σ saídas` (BR-018, BR-023)?
- [ ] `recebidoSemana − gastosSemana = resultadoSemana`?
- [ ] Operador ignora `?usuarioId=`; admin valida empresa; alvo inexistente → 404?

**Regras:** BR-018 a BR-023, BR-080 · **Postman:** `Caixa > Status`

### API-CT-042 — Status coerente
**Dado** contrato criado + pagamento + gasto → **Então** 200 com `saldoAtual` batendo com a soma das movimentações.

### API-CT-043 — Alvo inexistente
**Dado** admin com `?usuarioId=` de outra empresa → **Então** 404 `OPERATOR_NOT_FOUND`.

---

## API-UC-025 — Ajustar caixa base

**Endpoint:** `POST /api/caixa/ajuste` · **Auth:** admin/super_admin apenas

**Request:** `{ valor, motivo }` · **Query:** `usuarioId?`

**Response 201:** `{ caixaBase }`

**Coerência:**
- [ ] `valor` é o **novo valor absoluto** (não delta) — 5000 sobre 2000 → 5000?
- [ ] Gera registro em `auditoria_caixa` (anterior/novo/motivo/admin) — BR-088?
- [ ] `motivo` obrigatório (422 sem)?
- [ ] Operador → 403 (BR-079)?

**Regras:** BR-078, BR-079, BR-088 · **Postman:** `Caixa > Ajuste`

### API-CT-044 — Ajuste válido
**Dado** admin → **Então** 201; `GET /api/caixa` mostra a nova base e `GET /api/caixa/auditoria` registra o ajuste com motivo.

### API-CT-045 — Operador proibido
**Dado** token de operator (com ou sem `?usuarioId=`) → **Então** 403.

### API-CT-046 — Sem motivo
**Dado** `motivo` vazio → **Então** 422 e auditoria **não** é gerada.

### API-CT-084 — Ajuste é valor absoluto (não delta)
**Dado** caixa base 5000 → **Quando** ajusta para 3000 → **Então** 201 e `GET /api/caixa` retorna `caixaBase: 3000` (não 8000).

### API-CT-085 — Cross-tenant: admin de outra empresa (404)
**Dado** admin da empresa A com `?usuarioId=` de operador da empresa B → **Então** 404 `OPERATOR_NOT_FOUND` (ajuste/estorno/auditoria/movimentações não cruzam empresas — BR-073).

### API-CT-086 — Super admin ajusta caixa de qualquer empresa (BR-078/080)
**Dado** super admin com `?usuarioId=` de operador de outra empresa (e `?empresaId=` se preciso) → **Então** 201 e auditoria registra o super admin como responsável.

---

## API-UC-026 — Movimentações

**Endpoint:** `GET /api/caixa/movimentacoes` · **Auth:** Bearer

**Query:** `dataInicio?`, `dataFim?`, `origem?`, `usuarioId?`, `page?`, `limit?`

**Response 200:** `{ data[], pagination }`

**Coerência:**
- [ ] Toda ação de escrita reflete aqui: Contrato (saída), Pagamento (entrada), Gasto (saída), Cancelamento (entrada), Ajuste?
- [ ] Filtro `origem` funciona?

**Regras:** BR-022, BR-032, BR-035 · **Postman:** `Caixa > Movimentações`

### API-CT-047 — Movimentações completas
**Dado** contrato, pagamento, gasto e estorno → **Então** 200 com todas as movimentações e origens corretas.

---

## API-UC-027 — Auditoria de ajustes

**Endpoint:** `GET /api/caixa/auditoria` · **Auth:** Bearer

**Query:** `page?`, `limit?`, `usuarioId?`

**Response 200:** `{ data[], pagination }` com `adminNome`

**Coerência:**
- [ ] Operador vê só o próprio histórico (ignora `?usuarioId=`)?
- [ ] Registros têm `valorAnterior`, `valorNovo`, `motivo`, `adminNome`, data?

**Regras:** BR-088 · **Postman:** `Caixa > Auditoria`

### API-CT-048 — Auditoria escopada
**Dado** ajustes em 2 operadores → **Quando** operador consulta → **Então** vê apenas os próprios; admin via `?usuarioId=` vê os do operador-alvo.

---

## API-UC-028 — Liquidar semana

**Endpoint:** `POST /api/caixa/liquidar` · **Auth:** Bearer

**Response 201:** `{ id, dataInicio, dataFim, totalRecebido, totalGasto, resultado, caixaBase }`

**Coerência:**
- [ ] Não altera caixa base nem movimentações (BR-027)?
- [ ] Re-liquidação da mesma semana → 409?

**Regras:** BR-027 · **Postman:** `Caixa > Liquidar`

### API-CT-049 — Liquidação válida
**Dado** operador → **Então** 201 com registro; `GET /api/caixa` mostra `ultimaLiquidacao` atualizada.

### API-CT-050 — Re-liquidação
**Dado** semana já liquidada → **Então** 409 `SEMANA_JA_LIQUIDADA`.

---

# GASTOS

## API-UC-029 — Registrar gasto

**Endpoint:** `POST /api/gastos` · **Auth:** Bearer

**Request:** `{ valor, categoria, data, observacao? }`

**Response 201:** gasto criado

**Coerência:**
- [ ] Gera movimentação de saída (origem Gasto, categoria) e reduz saldo/lucro (BR-021/BR-028)?
- [ ] KPI "gastos hoje/semana" reflete?

**Regras:** BR-021, BR-028 · **Postman:** `Gastos > Registrar`

### API-CT-051 — Gasto válido
**Dado** payload válido → **Então** 201; `GET /api/caixa/movimentacoes` mostra saída/Gasto e `saldoAtual` caiu.

### API-CT-052 — Campos obrigatórios
**Dado** sem `valor` ou sem `categoria` → **Então** 422.

---

## API-UC-030 — Listar gastos

**Endpoint:** `GET /api/gastos` · **Auth:** Bearer

**Query:** `dataInicio?`, `dataFim?`, `page?`, `limit?`

**Response 200:** `{ data[], totalPeriodo, pagination }`

> **`totalPeriodo`**: soma dos gastos do período **independente da paginação** — é o valor que alimenta o KPI "gastos hoje" do dashboard (`limit=1` só para pegar o total). Conferido com o front (`OperacoesDashboard.tsx`).

**Coerência:**
- [ ] Só gastos do operador logado?
- [ ] Filtro de data respeitado?
- [ ] `totalPeriodo` = Σ valores do período (não só da página)?

**Regras:** BR-056 · **Postman:** `Gastos > Listar`

### API-CT-053 — Lista escopada
**Dado** gastos de 2 operadores → **Então** 200 com apenas os do `req.userId`.

---

## API-UC-031 — Excluir gasto

**Endpoint:** `DELETE /api/gastos/:id` · **Auth:** Bearer

**Response 204:** soft delete

**Coerência:**
- [ ] Gasto some da lista?
- [ ] Movimentação original **permanece** (BR-032)? — comportamento atual não credita o caixa (decisão registrada, ver UC-051 da `06`).

**Regras:** BR-032 · **Postman:** `Gastos > Excluir`

### API-CT-054 — Excluir gasto
**Dado** gasto próprio → **Então** 200; `GET /api/gastos` não o lista mais.

### API-CT-055 — Gasto inexistente
**Dado** id inválido → **Então** 404.

---

# ADMIN — OPERADORES

## API-UC-032 — Listar operadores

**Endpoint:** `GET /api/admin/operadores` · **Auth:** admin/super_admin

**Response 200:** operadores da empresa (com stats)

**Coerência:**
- [ ] Operador comum → 403 (BR-067)?
- [ ] Admin vê apenas a própria empresa (BR-073/BR-075)?

**Regras:** BR-067, BR-073 · **Postman:** `Admin > Operadores`

### API-CT-056 — Lista de operadores
**Dado** admin → **Então** 200 com stats (totalClientes, contratosAtivos).

### API-CT-057 — Operador proibido
**Dado** token de operator → **Então** 403.

---

## API-UC-033 — Detalhe do operador

**Endpoint:** `GET /api/admin/operadores/:id` · **Auth:** admin/super_admin

**Response 200:** operador com stats

**Coerência:**
- [ ] Operador de outra empresa (admin) → 404?

**Regras:** BR-067, BR-073 · **Postman:** `Admin > Operador detalhe`

### API-CT-058 — Detalhe ok
**Dado** admin com id de operador da própria empresa → **Então** 200.

### API-CT-059 — Outra empresa
**Dado** admin com id de operador de outra empresa → **Então** 404.

---

## API-UC-034 — Criar operador

**Endpoint:** `POST /api/admin/operadores` · **Auth:** admin/super_admin

**Request:** `{ nome, email, senha, role (admin|operator) }`

**Response 201:** operador criado (empresa herdada — BR-075)

**Coerência:**
- [ ] `role = super_admin` é recusado (BR-076)?
- [ ] E-mail duplicado → 409? Senha < 6 → 422?

**Regras:** BR-057, BR-067, BR-075, BR-076 · **Postman:** `Admin > Criar operador`

### API-CT-060 — Criar válido
**Dado** payload válido → **Então** 201; login do novo operador funciona com a senha informada.

### API-CT-061 — E-mail duplicado
**Dado** e-mail já usado → **Então** 409.

### API-CT-062 — Role inválido / senha curta
**Dado** `role: "super_admin"` ou senha < 6 → **Então** 400 `VALIDATION_ERROR`.

### API-CT-079 — Senha curta ao criar/editar operador
**Dado** `senha` com menos de 6 caracteres em `POST` ou `PATCH /api/admin/operadores` → **Então** 400 (validação no backend, PLAN-029 — não depende só do front).

---

## API-UC-035 — Editar operador

**Endpoint:** `PATCH /api/admin/operadores/:id` · **Auth:** admin/super_admin

**Request:** parcial `{ nome?, email?, role?, senha? }`

**Coerência:**
- [ ] Não permite auto-rebaixar (BR-069)?
- [ ] Não permite alterar `super_admin`?

**Regras:** BR-069, BR-070 · **Postman:** `Admin > Editar operador`

### API-CT-063 — Editar válido
**Dado** admin → **Então** 200; senha nova passada passa a valer no login.

### API-CT-064 — Auto-rebaixar bloqueado
**Dado** admin tentando rebaixar o próprio role → **Então** 403 FORBIDDEN (BR-069).

---

## API-UC-036 — Remover operador

**Endpoint:** `DELETE /api/admin/operadores/:id` · **Auth:** admin/super_admin

**Response 204:** soft delete

**Coerência:**
- [ ] Não permite auto-remover (BR-070)?
- [ ] Dados operacionais preservados; login bloqueado (BR-071)?

**Regras:** BR-070, BR-071 · **Postman:** `Admin > Remover operador`

### API-CT-065 — Remover outro operador
**Dado** admin removendo outro operador → **Então** 200; login do removido falha, dados preservados.

### API-CT-066 — Auto-remover bloqueado
**Dado** admin removendo a si mesmo → **Então** 403 FORBIDDEN (BR-070).

---

## API-UC-037 — Dashboard admin

**Endpoint:** `GET /api/admin/dashboard` · **Auth:** admin/super_admin

**Query:** `empresaId?`

**Response 200:** `{ totalAdmins, totalSocios, totalOperadores, totalClientes, contratosAtivos, recebidoHoje, resultadoDoDia }`

**Coerência:**
- [ ] Admin self → KPIs de Operação escopados ao próprio usuário (BR-087)?
- [ ] `contratosAtivos` conta só `estado = 'Ativo'` (BR-085)?
- [ ] `totalAdmins`/`totalOperadores` por empresa (BR-082)?

**Regras:** BR-082, BR-085, BR-087 · **Postman:** `Admin > Dashboard`

### API-CT-067 — Dashboard admin self
**Dado** admin sem `empresaId` → **Então** 200; `totalClientes` = clientes do próprio admin (bate com `GET /api/clientes`).

### API-CT-068 — Dashboard empresa
**Dado** super admin com `empresaId` → **Então** 200 com agregado da empresa; `contratosAtivos` sem Finalizado/Cancelado.

---

## API-UC-042 — Equipe com contribuição por operador (PLAN-030)

**Endpoint:** `GET /api/admin/equipe` · **Auth:** admin/super_admin

**Query:** `empresaId?` (super admin obrigatório; admin usa a própria empresa)

**Response 200:** `{ operadores: [{id, nome, email, role, totalClientes, contratosAtivos, recebidoHoje}], totais: {totalClientes, contratosAtivos, recebidoHoje} }`

**Coerência:**
- [ ] **Soma dos operadores = totais** (Σ `totalClientes` = `totais.totalClientes`, etc.)?
- [ ] Totais batem com o agregado da empresa (`GET /api/admin/dashboard?empresaId=`)?
- [ ] Inclui admins E operadores (não apenas operators)?
- [ ] `recebidoHoje` = soma dos pagamentos do dia do usuário (reflete `GET /caixa?usuarioId=`)?
- [ ] Operator → 403? Super admin sem `empresaId` → 400?

**Regras:** BR-091 · **Postman:** `Admin > Equipe`

### API-CT-088 — Shape e coerência (Σ operadores = totais = dashboard)
**Dado** admin da empresa → **Então** 200; `Σ operadores.totalClientes = totais.totalClientes`; `totais` batem com `GET /admin/dashboard?empresaId=` (mesma empresa).

### API-CT-089 — Escopo
**Dado** operator → **Então** 403. **Dado** super admin sem `empresaId` → **Então** 400 `VALIDATION_ERROR`.

### API-CT-090 — Contribuição por operador
**Dado** operador da empresa com pagamentos hoje → **Então** `recebidoHoje` do operador = Σ pagamentos do dia dele (confere com `GET /caixa?usuarioId=`); a linha do operador abre o `OperadorDetail` no front (navegação preserva `?empresaId=`).

---

# ADMIN — EMPRESAS (super admin)

## API-UC-038 — Listar empresas

**Endpoint:** `GET /api/admin/empresas` · **Auth:** super_admin

**Response 200:** empresas com stats + `adminNome`/`adminEmail`

**Coerência:**
- [ ] Admin (não super) → 403?

**Regras:** BR-072, BR-083 · **Postman:** `Empresas > Listar`

### API-CT-069 — Lista de empresas
**Dado** super admin → **Então** 200 com stats coerentes (totalUsuarios = admin+operators).

### API-CT-070 — Acesso negado
**Dado** token de admin (não super) → **Então** 403.

---

## API-UC-039 — Detalhe da empresa

**Endpoint:** `GET /api/admin/empresas/:id` · **Auth:** super_admin

**Response 200:** empresa com totais

**Coerência:**
- [ ] Empresa inexistente → 404?
- [ ] `contratosAtivos` por estado `Ativo` (BR-085)?

**Regras:** BR-072, BR-085 · **Postman:** `Empresas > Detalhe`

### API-CT-071 — Detalhe ok
**Dado** empresa existente → **Então** 200.

### API-CT-072 — Empresa inexistente
**Dado** id inválido → **Então** 404.

---

## API-UC-040 — Criar empresa

**Endpoint:** `POST /api/admin/empresas` · **Auth:** super_admin

**Request:** `{ nome, documento?, nomeFantasia?, ativa?, adminNome, adminEmail, adminSenha }`

**Response 201:** `{ empresa, admin }` — transação atômica (BR-072)

**Coerência:**
- [ ] Empresa **e** admin criados juntos (ou nada)?
- [ ] Login do admin inicial funciona?
- [ ] E-mail duplicado → 409?
- [ ] Cadastro **sem** `documento`/`nomeFantasia`/`ativa` → 201 (campos opcionais, não bloqueiam)?

**Regras:** BR-072, BR-076 · **Postman:** `Empresas > Criar`

### API-CT-073 — Criar empresa
**Dado** payload válido → **Então** 201 com empresa + admin; login do admin inicial funciona.

### API-CT-074 — E-mail duplicado
**Dado** `adminEmail` já usado → **Então** 409 e **nenhuma** empresa criada (atômico).

### API-CT-095 — Atualizar dados da empresa
**Endpoint:** `PATCH /api/admin/empresas/:id` · **Auth:** super_admin

**Request:** parcial `{ nome?, documento?, nomeFantasia?, ativa? }`

- **Dado** `PATCH` com `nomeFantasia`, `documento` e `ativa: false` → **Então** 200 reflete no `GET /:id` e no card (Ativa/Inativa).
- **Dado** `PATCH` com body vazio ou só campos opcionais → **Então** 200 (nenhuma mudança forçada).
- **Dado** empresa inexistente → **Então** 404.

### API-CT-133 — Documento da empresa: CPF ou CNPJ (P11)
- **Dado** `POST /admin/empresas` com **CPF válido** (`39053344705`) → **Então** 201 e `documento` persistido em dígitos.
- **Dado** `POST` com **CNPJ válido** (`11222333000181`) → **Então** 201 e `documento` em dígitos.
- **Dado** `POST`/`PATCH` com documento **inválido** (check-digit errado, ex.: `11222333000182` ou dígitos repetidos) → **Então** 422.
- **Dado** `PATCH` com `documento: null` → **Então** 200 e `documento` zerado.
- **Dado** `POST` **sem** `documento` → **Então** 201 (opcional — não impede cadastro).

---

# ADMIN — EMPRESAS · MÓDULOS (PLAN-031, whitelabel)

## API-UC-043 — Ativar/desativar módulos da empresa

**Endpoint:** `PATCH /api/admin/empresas/:id/modulos` · **Auth:** super_admin

**Request:** `{ modulos: string[] }` — ids: `clientes, contratos, caixa, gastos, rota, cobrancas, atendidos`

**Response 200:** empresa atualizada (com `modulos`)

**Coerência (ponta a ponta):**
- [ ] `GET /api/admin/empresas/:id` reflete a mudança?
- [ ] O próximo `login`/`me` de usuários da empresa reflete os novos `modulos`?
- [ ] Módulo com dependência violada → **422**?
- [ ] Admin (não super) → **403**?

**Regras:** BR-092, BR-093 · **Postman:** `Empresas > Módulos`

### API-CT-091 — Válido + coerência
**Dado** super admin → **Quando** `PATCH` com `["clientes","contratos","caixa"]` → **Então** 200; `GET /admin/empresas/:id` reflete; `login`/`me` de usuário da empresa retorna os mesmos módulos.

### API-CT-092 — Dependência gastos ⇒ caixa
**Dado** `modulos: ["gastos"]` sem `caixa` → **Então** 422 e nada muda.

### API-CT-093 — Módulo inexistente
**Dado** `modulos: ["nao_existe"]` → **Então** 422.

### API-CT-094 — Só central (array vazio)
**Dado** `modulos: []` → **Então** 200 (apenas o módulo `central`, sempre ativo).

### API-CT-095 — Permissão
**Dado** token de admin (não super) → **Então** 403. **Dado** id inexistente → **Então** 404.

### API-CT-096 — login/me com modulos
**Dado** usuário de empresa com módulos → **Então** `usuario.modulos` == modulos da empresa (default: todos). Super admin → `null`/todos.

---

# WHITELABEL — ENFORCEMENT NO BACKEND (PLAN-036, P024)

## API-UC-043 — Modulos com enforcement (403 por módulo)

**Dado** uma empresa com módulo desativado (ex.: sem `caixa`) e um usuário da empresa → **Então** as rotas do módulo devolvem **403 `MODULE_DISABLED`** (não é só gating de UI).

### API-CT-106 — Módulo off bloqueia a API
**Dado** empresa com `modulos` sem `caixa` → **Então** `GET /api/caixa` → **403** `{ code: "MODULE_DISABLED" }`. Vale para `clientes`, `contratos`, `caixa`, `gastos`, `pagamentos` (= `contratos`) e, em `/operacoes`: `POST /visitas` (= `rota`), `GET /historico-atrasos` (= `cobrancas`).

### API-CT-107 — Módulo ativo libera a API
**Dado** empresa com `caixa` ativo → **Então** `GET /api/caixa` → **200**.

### API-CT-108 — `modulos` ausente = todos ativos (fallback)
**Dado** empresa sem `modulos` definido (token antigo / legado) → **Então** todas as rotas → **200** (BR-093).

### API-CT-109 — Super admin: empresa-alvo via `?empresaId=`
**Dado** super admin **sem** `?empresaId=` → **Então** rotas → **200** (gestão global, sem empresa-alvo). **Dado** super admin com `?empresaId=` de empresa com módulo off → **Então** rota do módulo → **403**.

### API-CT-110 — Endpoints compartilhados (limite do v1)
**Dado** módulo `cobrancas` off → **Então** `GET /operacoes/cobrancas` continua **200** (compartilhado com Central/Rota/Atendidos — ver PLAN-036, fora de escopo do gating). `GET /operacoes/pagamentos-hoje|parcelas-hoje|parcelas-semana` idem.

### API-CT-111 — Sócio respeita os módulos da empresa
**Dado** sócio de empresa com `caixa` off → **Então** `GET /api/caixa` → **403** `MODULE_DISABLED` (sócio não é tratado como super admin; usa o `empresaId` do token).

### API-CT-112 — Empresa "só central" (`modulos: []`) → 403 em todas as rotas operacionais
**Dado** empresa com `modulos: []` → **Então** `GET /api/clientes`, `GET /api/contratos`, `GET /api/caixa`, `GET /api/gastos`, `GET /api/pagamentos` → **403**. Apenas `central` (dashboard) e `/auth`/`/admin` seguem 200.

### API-CT-113 — Mudança de módulos vale imediatamente no backend
**Dado** usuário logado (token X) de empresa com `caixa` ativo → **Então** `GET /api/caixa` → **200**. **E** super admin remove `caixa` via PATCH → **Então** **mesmo token X** → `GET /api/caixa` → **403** (sem novo login/`/me` — o middleware lê `empresas.modulos` por request; contraste com o gating de UI, que reflete no próximo `/me` — UC-060).

### API-CT-114 — Operator/admin não contornam com `?empresaId=`
**Dado** operator/admin de empresa A (com `caixa` off) → **Então** `GET /api/caixa?empresaId=<B>` (empresa B com `caixa` on) → **403** (o middleware usa o `empresaId` do token; `?empresaId=` só é respeitado para super admin).

### API-CT-115 — Pagamentos gated por contratos
**Dado** empresa válida com `caixa` on e `contratos` off (`["clientes","caixa"]`) → **Então** `GET /api/pagamentos/contrato/:id` → **403** (mount de `/pagamentos` = `contratos`); `GET /api/caixa` → **200**.

### API-CT-116 — Super admin com `?empresaId=` inexistente → 404
**Dado** super admin com `?empresaId=<uuid-invalido>` → **Então** rota gated → **404** `EMPRESA_NOT_FOUND`.

### API-CT-117 — Contratos requer clientes (coerência de combos, PLAN-037)
**Dado** `PATCH /modulos` com `modulos: ["contratos"]` → **Então** **422** "O módulo \"contratos\" requer: clientes." **Dado** `["clientes","contratos"]` → **Então** **200**.

### API-CT-118 — Dependência transitiva rota ⇒ cobrancas (grafo refinado, PLAN-045)
**Dado** `PATCH /modulos` com `modulos: ["rota"]` → **Então** **422** "O módulo \"rota\" requer: cobrancas, contratos, clientes." (transitivo — `rota ⇒ cobrancas ⇒ contratos ⇒ clientes`). **Dado** `["clientes","contratos","cobrancas","rota"]` → **Então** **200**.

### API-CT-119 — Dependência atendidos ⇒ cobrancas (grafo refinado, PLAN-045)
**Dado** `PATCH /modulos` com `modulos: ["atendidos"]` → **Então** **422** "O módulo \"atendidos\" requer: cobrancas, contratos, clientes." (transitivo). **Dado** `["clientes","contratos","cobrancas","atendidos"]` → **Então** **200**.

---

# CAPACIDADES — RECURSOS FINOS (modularização fina)

## API-UC-CAP — Ativar/desativar capacidades da empresa

**Endpoint:** `PATCH /api/admin/empresas/:id/capacidades` · **Auth:** super_admin

**Request:** `{ capacidades: string[] | null }` — ids: `cliente:whatsapp`, `cliente:ligar`,
`cliente:navegar`, `cliente:anexos`, `rota:whatsapp`, `rota:ligar`, `rota:navegar`,
`pagamento:comprovante_whatsapp`.

**Regras:** BR-095 · **Postman:** `Empresas > Capacidades`

### CAP-CT-101 — Válido + coerência
**Dado** super admin → **Quando** PATCH com `["cliente:whatsapp","cliente:anexos"]` → **Então** 200; `GET /admin/empresas/:id` reflete; `login`/`me` da empresa retorna as mesmas capacidades.

### CAP-CT-102 — Capacidade com módulo dono desativado
**Dado** empresa sem o módulo `rota` → **Quando** PATCH com `["rota:whatsapp"]` → **Então** **422**.

### CAP-CT-103 — Capacidade inexistente
**Dado** PATCH com `["nao:existe"]` → **Então** **422**.

### CAP-CT-104 — Array vazio = nenhuma capacidade
**Dado** PATCH com `[]` → **Então** **200**; `me` reflete `[]` (nenhuma capacidade).

### CAP-CT-105 — Permissão
**Dado** token de admin (não super) → **Então** **403**.

### CAP-CT-106 — Não vaza entre tenants
**Dado** empresa A com capacidades definidas → **Então** `me`/`login` de usuário da empresa B retorna `capacidades: null`.

### CAP-CT-107 — `null` limpa override
**Dado** PATCH com `capacidades: null` → **Então** **200**; `GET /:id` → `capacidades: null` (todas ativas).

### CAP-CT-108 — Dono off persiste inerte
**Dado** capacidade `rota:whatsapp` definida → **Quando** módulo `rota` é desativado → **Então** a capacidade permanece na lista (inerte); reativando `rota`, volta a valer.

### CAP-CT-109 — Duplicatas normalizadas
**Dado** PATCH com `["cliente:whatsapp","cliente:whatsapp"]` → **Então** **200**; `GET /:id` retorna uma única ocorrência.

### CAP-CT-110 — Enforcement de anexos
**Dado** empresa com `cliente:anexos` off → **Então** `GET|POST /api/clientes/:id/anexos` → **403** `CAPABILITY_DISABLED`.

---

# GUARD DE DESATIVAÇÃO — DADOS EM ABERTO (BR-105)

## API-UC-IMP — Impacto e bloqueio ao desativar módulos

**Endpoint:** `GET /api/admin/empresas/:id/impacto` (query `modulos=<JSON>`; prévia sem persistir — BR-105). O bloqueio (409) acontece no `PATCH /modulos` (API-UC-043).

**Regras:** BR-096 · **Postman:** `Empresas > Módulos` (impacto no response)

### IMP-CT-1 — Prévia retorna impacto sem persistir
**Dado** empresa com cliente + contrato (3 parcelas em aberto) → **Quando** `GET /impacto?modulos=[sem clientes]` → **Então** 200, `bloqueado: true`, item `clientes` contagem 1 e item `contratos` contagem 3.

### IMP-CT-2 — Conjunto igual → desligados vazio
**Dado** `GET /impacto?modulos=<modulos atuais>` → **Então** 200, `desligados: []`.

### MOD-G-CT-1 — Desativar clientes com dados → 409
**Dado** empresa com cliente + contrato em aberto → **Quando** `PATCH /modulos` sem `clientes` (cascata desliga contratos/cobrancas/rota/atendidos) → **Então** **409** `MODULE_HAS_ACTIVE_DATA` + `impacto` com contagens (DOC-1: clientes=1, contratos parcelas em aberto=3).

### MOD-G-CT-2 — Sem dados → 200
**Dado** empresa sem dados → **Então** `PATCH /modulos` → **200**, `impacto.bloqueado: false`.

### MOD-G-CT-3 — force sobrepõe + auditoria
**Dado** `force: true` + `motivo` → **Então** **200** ecoando `impacto`; a mudança é gravada em `auditoria_modulos`.

### MOD-G-CT-4 — Caixa aberto → 409 (sem force)
**Dado** empresa com `caixa_base != 0` → **Quando** desativa `caixa` → **Então** **409**.

### MOD-G-CT-5 — Reativar preserva dados
**Dado** módulo desativado com force → **Quando** reativado → **Então** **200**; clientes/contratos seguem íntegros e os endpoints voltam a 200.

### MOD-G-CT-6 — Idempotência
**Dado** `PATCH /modulos` com o mesmo conjunto atual → **Então** **200** sem guard (`desligados: []`).

### MOD-G-CT-7 — Caixa nunca força
**Dado** caixa aberto + `force: true` → **Então** **409** (caixa não é forcável).

### MOD-G-CT-8 — Só cadastros (sem contrato) → 200 com confirmação
**Dado** empresa com clientes mas sem contratos → **Então** `PATCH` desativando `clientes` → **200**, item `clientes` contagem > 0 e `bloqueia: false`.

### MOD-G-CT-9 — Cascata evidenciada no impacto
**Dado** cliente com contrato → **Então** 409 e o `impacto` lista `contratos` como bloqueante (cascata).

### MOD-G-CT-10 — Remover tudo com dados → 409
**Dado** `PATCH /modulos` com `[]` numa empresa com dados → **Então** **409**.

### MOD-G-CT-11 — Admin (não super) em force → 403
**Dado** token de admin → **Quando** `PATCH` com `force: true` → **Então** **403**.

---

# SUSPENSÃO DE EMPRESA — BR-106

**Regras:** BR-106 · **Smoke:** `SUSP-1..4`

### SUSP-CT-1 — Empresa inativa bloqueia login
**Dado** empresa com `ativa: false` → **Então** `POST /auth/login` de usuário da empresa → **403** `EMPRESA_INATIVA`.

### SUSP-CT-2 — Token antigo bloqueado em rotas
**Dado** usuário logado antes da suspensão → **Então** `GET /api/clientes` (token antigo) → **403** `EMPRESA_INATIVA` (efeito imediato).

### SUSP-CT-3 — Reativação restaura acesso
**Dado** `PATCH /admin/empresas/:id` com `ativa: true` → **Então** login → **200**.

### SUSP-CT-4 — Super admin intacto + auditoria
**Dado** empresa suspensa → **Então** `GET /auth/me` do super admin → **200**; `auditoria_modulos` registra `tipo:"empresa"` (antes/depois do `ativa`).

---

# REBAIXAMENTO — MATRIZ E REASSIGN (PLAN-061)

**Regras:** BR-103 (evoluída) · **Smoke:** `SUP-1..6`, `ORF-1..3`, `REAS-1`, `POS-1`, TR-123/127

### SUP-CT-1 — Super rebaixa admin→operator (sem subordinado) → 200
**Dado** admin sem subordinados → **Quando** super `PATCH` `{role:"operator"}` → **Então** **200**.

### SUP-CT-2 — Super rebaixa admin→operator com subordinado → 422 + contagem
**Dado** admin com subordinado → **Então** **422** `OPERATOR_HAS_SUBORDINATES` + `subordinados: N` (regressão do bug do super admin).

### SUP-CT-3 — admin→socio: subordinado sócio → 422; sem sócio → 200
**Dado** admin com subordinado **sócio** → **422**. **Dado** admin sem subordinado sócio → **200**.

### SUP-CT-4 — socio→operator com subordinado → 422; após reassign → 200
**Dado** sócio com subordinado → **422**; **Quando** o subordinado é reatribuído → **200**.

### SUP-CT-5 — Super promove (operator→socio · operator→admin · socio→admin) → 200
**Dado** super → **Então** as três promoções → **200**.

### SUP-CT-6 — Super rebaixa admin de outra empresa (`?empresaId=`) → 200
**Dado** super com `?empresaId=` de outra empresa → **Então** rebaixa → **200**.

### ORF-CT-1 — admin→socio com subordinado SÓCIO → 422
### ORF-CT-2 — admin→operator com subordinado SÓCIO → 422
### ORF-CT-3 — admin→socio com subordinados só operator → **200** (operator pode ter chefe sócio)

### REAS-CT-1 — Reassign atômico no mesmo PATCH
**Dado** `PATCH /operadores/:id` com `{role:"operator", reatribuirParaChefeId:<adminId>}` → **Então** **200**; o subordinado fica com `chefeId` = novo admin (transação).

### POS-CT-1 — Novo chefe vê o subordinado reatribuído
**Dado** reassign → **Então** `GET /admin/equipe` do novo chefe inclui o subordinado.

---

# PERSISTÊNCIA DESATIVAÇÃO/ATIVAÇÃO — full cycle (PLAN-061)

**Regras:** BR-104/105/106 · **Smoke:** `PERS-1..5`

> Garante que a alteração é **de fato feita e respeitada** (GET/:id + `/me` + enforcement), não apenas um "sucesso".

### PERS-CT-1 — Force desativa e reflete em todos os níveis
**Dado** force desativa `clientes` → **Então** `GET /admin/empresas/:id` **sem clientes** · `/me` sem clientes · `GET /api/clientes` → **403** `MODULE_DISABLED`.

### PERS-CT-2 — Reativação reflete e libera
**Dado** reativa `clientes` → **Então** `GET/:id` com clientes · `/me` com clientes · `GET /api/clientes` → **200**.

### PERS-CT-3 — Capacidade off reflete + enforcement
**Dado** desativa `cliente:anexos` → **Então** `GET/:id` + `/me` sem anexos · `GET /clientes/:id/anexos` → **403** `CAPABILITY_DISABLED`.

### PERS-CT-4 — Capacidade reativada (null) volta
**Dado** `capacidades: null` → **Então** `/me` com `capacidades: null` · anexos → **200**.

### PERS-CT-5 — Idempotência real
**Dado** repetir o mesmo PATCH → **Então** `GET/:id` inalterado (não muda sem necessidade).

---

# CONTEXTO DO OPERADOR — LISTA DE CLIENTES (P13, PLAN-063)

**Regras:** escopo hierárquico (`resolveUsuarioAlvo`) · **Smoke:** `P13-1..5`

### P13-CT-1 — Admin lista clientes do operador
**Dado** admin com `GET /api/clientes?usuarioId=<operador>` → **Então** **200** retornando só os clientes do operador.

### P13-CT-2 — Sócio fora da subárvore → 404
**Dado** sócio com `?usuarioId=` de operador fora da subárvore → **Então** **404** `OPERATOR_NOT_FOUND`.

### P13-CT-3 — Operator ignora override
**Dado** operator com `?usuarioId=<outro>` → **Então** **200** vendo só os próprios (ignora o override).

### P13-CT-4 — Admin sem `?usuarioId=` preservado
**Dado** admin sem override → **Então** **200** com os próprios clientes (comportamento atual).

### P13-CT-5 — Super admin com `?empresaId=`
**Dado** super com `?empresaId=` → **Então** **200** respeitando a empresa-alvo.

---

# FLUXO DE CONTA (PLAN-065) — convite/ativação + forgot/reset

**Smoke:** `AC-13..20`, `ES-02..11`, `SE-01/04`, `SM-1/2`

**Endpoint:** `POST /api/auth/ativar` — público
**Endpoint:** `POST /api/auth/forgot` — público (resposta genérica 200, rate limit por e-mail+IP)
**Endpoint:** `POST /api/auth/reset` — público
**Endpoint:** `PATCH /api/admin/operadores/:id/reenviar-convite` — admin/super

### AC-CT-13 — Login de convidado → 403 ACCOUNT_PENDING
**Dado** conta sem senha (convidada) → **Então** `POST /auth/login` → **403** `ACCOUNT_PENDING`.

### AC-CT-15 — Criar operador sem senha → convidado + convite
**Dado** `POST /admin/operadores` sem `senha` → **Então** **201** com `status: "convidado"` + token de convite gerado.

### AC-CT-05 — Ativar com token válido → login funciona
**Dado** `POST /auth/ativar` com token válido + senha ≥6 → **Então** **200**; login com a nova senha → **200** (`status: "ativo"`).

### AC-CT-08 — Token já usado → 400 TOKEN_INVALID
**Dado** ativar 2× com o mesmo token → **Então** 2ª → **400**.

### AC-CT-20 — Empresa sem adminSenha → admin convidado
**Dado** `POST /admin/empresas` sem `adminSenha` → **Então** **201**; login do admin → **403** `ACCOUNT_PENDING`.

### ES-CT-02/03 — Forgot genérico
**Dado** e-mail existente OU inexistente → **Então** **200** sempre (não vaza).

### ES-CT-05 — Reset com token válido → login nova senha
**Dado** `POST /auth/reset` com token válido → **Então** **200**; login com a nova senha → **200**.

### SE-CT-01 — Token armazenado com hash
**Dado** token gerado → **Então** no banco `auth_tokens.hash` é SHA-256 (64 hex), nunca o token em texto.

---

# AUTH — SENHA (PLAN-029)

## API-UC-041 — Alterar a própria senha

**Endpoint:** `PATCH /api/auth/senha` · **Auth:** Bearer (qualquer perfil)

**Request:** `{ senhaAtual, novaSenha }`

**Response 200:** `{ ok: true }`

**Coerência:**
- [ ] Após a troca, o **login antigo falha** e o **novo funciona**?
- [ ] O token atual continua válido (BR-090) — a sessão não é encerrada?
- [ ] Senha atual incorreta → **422** `INVALID_CURRENT_PASSWORD` (não desloga o cliente)?
- [ ] `novaSenha` < 6 ou igual à atual → 422?

**Regras:** BR-089, BR-090 · **Postman:** `Auth > Alterar senha`

### API-CT-075 — Troca válida
**Dado** usuário autenticado com senha atual correta → **Quando** `PATCH /api/auth/senha` → **Então** 200 `{ok:true}`; login com a nova senha funciona e com a antiga falha; token atual segue válido.

### API-CT-076 — Senha atual incorreta
**Dado** `senhaAtual` errada → **Então** 422 `INVALID_CURRENT_PASSWORD` e a senha **não** muda (login antigo continua valendo).

### API-CT-077 — Nova senha inválida
**Dado** `novaSenha` com menos de 6 caracteres, ou igual à atual → **Então** 422 e nada é alterado.

### API-CT-088 — Foto própria (atualizar/remover) — PLAN-041
**Endpoint:** `PATCH /api/auth/foto` · **Auth:** Bearer (qualquer perfil)

**Request:** `{ foto: "data:image/jpeg;base64,..." }` (ou `null` para remover)

**Response 200:** `{ ok: true, foto: <dataURL|null> }`

- **Dado** `foto` data URL JPEG válida ≤500KB → **Então** 200 e `GET /api/auth/me` reflete o novo `foto`.
- **Dado** `foto: null` → **Então** 200 e `me` devolve `foto: null`.
- **Dado** string que não começa com `data:image/` → **Então** 422 `FOTO_TIPO`.
- **Dado** data URL >500KB decodificados → **Então** 422 `FOTO_LIMITE`.

**Regras:** BR-101 · **Postman:** `Auth > Alterar foto`

---

# ADMIN — HIERARQUIA DE PAPÉIS (PLAN-032)

### API-CT-098 — Criar sócio (admin)
**Dado** admin → **Quando** `POST /api/admin/operadores` com `role: "socio"` → **Então** 201 com `chefeId` = admin. `login`/`me` do sócio retornam `role: "socio"` + `chefeId`.

### API-CT-099 — Sócio cria operador do grupo
**Dado** sócio → **Quando** `POST /api/admin/operadores` com `role: "operator"` → **Então** 201 com `chefeId` = o sócio. **Dado** `role: "admin"`/`"socio"` → **Então** 403.

### API-CT-100 — Escopo da equipe por nível
**Dado** sócio → `GET /api/admin/equipe` retorna **apenas a subárvore** (ele + operadores com `chefeId` = ele), não a empresa toda. Admin → empresa inteira. Operator → 403.

### API-CT-101 — Acesso fora da subárvore
**Dado** sócio consultando `GET /api/admin/operadores/:id` ou `?usuarioId=` de operador fora da subárvore → **Então** 404.

### API-CT-102 — Chefe inválido
**Dado** `chefeId` de outra empresa, auto-chefe ou ciclo → **Então** 422. Chefe de `socio` que não é `admin` → 422.

---

# ADMIN — TRANSIÇÕES DE PAPEL (WS7)

Matriz de transições via `PATCH /api/admin/operadores/:id` (papel-alvo). Ator sócio **não promove** (mesma regra do create); rebaixar com subordinados é **bloqueado** (chefe órfão).

| Transição | Ator admin/super | Ator sócio | Observação |
|---|---|---|---|
| operator → sócio | 200 | 403 | chefe de sócio deve ser admin |
| operator → admin | 200 | 403 | chefe vira `null` (higiene) |
| sócio → admin | 200 | n/a | escopo vira a empresa toda |
| sócio → operator | 200 (ou 422 se tiver subordinados) | n/a | token antigo → 403 |
| admin → sócio | 200 (422 se tiver subordinado sócio) | n/a | — |
| admin → operator | 200 (422 se tiver subordinados) | n/a | token antigo → 403 |
| → super_admin (alvo) | 403 | 403 | `NaoPodeAlterarSuperAdminError` |
| role = super_admin (body) | 400 | 400 | fora de `ROLES_ADMIN` |
| trocar o próprio papel | 403 | 403 | `NaoPodeAutoModificarError` |

### API-CT-120 — Promover operator→sócio (admin)
**Dado** admin → **Quando** `PATCH .../operadores/:id` com `role: "socio"` (chefe = admin) → **Então** 200; login do promovido reflete `socio`.

### API-CT-121 — Promover operator→admin (admin)
**Dado** admin promovendo operator → **Então** 200 com `chefeId: null`; o **mesmo token antigo** passa a acessar `/admin/equipe` (role resolvida do banco).

### API-CT-122 — Promover sócio→admin (admin)
**Dado** admin promovendo sócio → **Então** 200; a equipe do promovido passa a ser a **empresa inteira** (mesmo token antigo).

### API-CT-123 — Rebaixar sócio→operator
**Dado** sócio **com subordinado** → **Então** 422 (chefe órfão). Após reatribuir o subordinado, rebaixa → 200; token antigo → 403 em `/admin/equipe`.

### API-CT-124 — Rebaixar admin→sócio
**Dado** admin → **Então** 200 com chefe = admin (ou null); login reflete `socio`.

### API-CT-125 — Rebaixar admin→operator
**Dado** admin → **Então** 200; token antigo → 403 em `/admin/equipe`.

### API-CT-126 — Sócio não promove (PATCH)
**Dado** sócio → `PATCH` de operador da subárvore com `role: "admin"` ou `"socio"` → **Então** 403; mantendo `"operator"` → 200; alterar o próprio papel → 403.

### API-CT-127 — Chefe órfão bloqueia rebaixamento
**Dado** admin/sócio **com subordinados ativos** → rebaixar para `operator` → **Então** 422. Após reatribuir/rebaixar os subordinados → 200. (Subordinados `deletedAt` não contam.)

### API-CT-128 — Chefe de sócio deve ser admin
**Dado** operador com chefe **sócio** promovido a sócio **sem trocar o chefe** → **Então** 422.

### API-CT-129 — Super admin como alvo
**Dado** `PATCH` de um usuário `super_admin` → **Então** 403.

### API-CT-130 — role super_admin no body
**Dado** `PATCH` com `role: "super_admin"` → **Então** 400.

### API-CT-131 — Cross-tenant no PATCH
**Dado** admin tentando mudar o papel de operador de **outra empresa** → **Então** 404.

---

# Referências

- `engineering/02-API.md` — contrato completo (request/response JSON, validações, erros)
- `06-CASOS-DE-USO.md` — casos de uso por fluxo de tela (UC-001..072)
- `02-BUSINESS-RULES.md` — regras de negócio numeradas (BR)
- `api-collection.json` — collection Postman executável (espelho desta base)
- `skills/SKILL-009-documentation-sync.md` — matriz de propagação (mudou endpoint → atualize este doc + collection + 02-API)

---

# AQUISIÇÃO COMERCIAL (PLAN-064) — Leads

**Smoke:** `LD-01..03`, `LD-05..13`, `LD-15`

**Endpoint:** `POST /api/leads` — público (rate limit 10/15min)
**Endpoint:** `POST /api/leads/confirmar` — público
**Endpoint:** `POST /api/leads/reconfirmar` — público (resposta genérica, rate limit e-mail+IP)
**Endpoint:** `GET /api/admin/leads` — super admin (filtro `?status=`)
**Endpoint:** `POST /api/admin/leads/:id/onboarding` — super admin
**Endpoint:** `POST /api/admin/leads/:id/converter` — super admin
**Endpoint:** `POST /api/admin/leads/:id/descartar` — super admin

### LD-CT-01 — Criar lead público → NOVO + e-mail de confirmação
**Dado** `POST /api/leads` (nome/empresa/email válidos) → **Então** **201** com `status: "NOVO"` + token `lead` (24h, single-use) criado.

### LD-CT-02 — Dedup por e-mail
**Dado** segundo `POST /api/leads` com o mesmo e-mail → **Então** **200** `{ ok, jaExistia: true }` — não cria lead duplicado.

### LD-CT-03 — Validação pública
**Dado** requisição sem e-mail ou com e-mail inválido / nome ou empresa < 2 → **Então** **422**.

### LD-CT-05 — Não cria empresa/usuário
**Dado** `POST /api/leads` → **Então** nenhuma empresa/usuário é criado (isolamento comercial × operacional).

### LD-CT-06 — Confirmar token → EMAIL_CONFIRMADO
**Dado** `POST /api/leads/confirmar` com token válido → **Então** **200** `status: "EMAIL_CONFIRMADO"`.

### LD-CT-07 — Token expirado → reenviar
**Dado** token expirado → **Então** **400** `TOKEN_EXPIRED`; `POST /api/leads/reconfirmar` gera novo token (invalida o anterior).

### LD-CT-08 — Token usado (single-use)
**Dado** `POST /api/leads/confirmar` com token já consumido → **Então** **400** `TOKEN_INVALID`.

### LD-CT-09 — Painel super: listar + filtrar
**Dado** `GET /api/admin/leads` (super) → **Então** **200** lista; `?status=X` filtra.

### LD-CT-10 — Iniciar onboarding
**Dado** `POST /api/admin/leads/:id/onboarding` (super) → **Então** **200** `EM_ONBOARDING`; convertido/descartado → **422**.

### LD-CT-11 — Converter → empresa + convite + auditoria
**Dado** lead confirmado + `POST /api/admin/leads/:id/converter` (super) → **Então** **200**: empresa criada, admin convidado (login → 403 ACCOUNT_PENDING), `status: "CONVERTIDO"` + `convertidoPor/Em/EmpresaId` (auditoria). E-mail já usuário → **409** EMAIL_DUPLICATED.

### LD-CT-12 — Descartar → DESCARTADO + LGPD
**Dado** `POST /api/admin/leads/:id/descartar` com motivo (super) → **Então** **200** `DESCARTADO` com dados pessoais anonimizados. Sem motivo → **422**.

### LD-CT-13 — Não-super bloqueado
**Dado** admin/sócio em `/api/admin/leads` → **Então** **403**.

### LD-CT-15 — E-mail já usuário
**Dado** `POST /api/leads` com e-mail de usuário existente → **Então** **409** `LEAD_EMAIL_JA_USUARIO` — sem duplicado.
