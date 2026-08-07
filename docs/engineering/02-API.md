# API

**Status:** Em construção — módulos Cliente, Contrato, Pagamento, Operações, Caixa, Gasto, Auth e Admin documentados; Multi-Tenant (Empresas, PLAN-019) + drill-down Admin → Operador (PLAN-020) implementados; **fluxo de conta (PLAN-065: convite/ativação + forgot/reset + Resend)** e **Leads comerciais (PLAN-064)** documentados

**Versão:** 1.4

**Última atualização:** 07/08/2026

---

# Objetivo

Definir os contratos oficiais da API do sistema, estabelecendo endpoints, formatos de requisição e resposta, padrões de validação, códigos HTTP e estrutura dos recursos expostos.

Este documento representa a fonte oficial dos contratos públicos da API.

---

# Princípios

A API deverá seguir os seguintes princípios:

- Toda requisição e resposta utilizarão JSON.
- Todos os horários utilizarão UTC no formato ISO 8601.
- Todos os identificadores utilizarão UUID v4.
- A API será stateless.
- Endpoints serão versionados através do prefixo `/api`.
- Erros seguirão uma estrutura padronizada.
- A autenticação será adicionada futuramente sem quebrar contratos existentes.

---

# Convenções

## Objetos Compartilhados

Objetos reutilizados entre diferentes endpoints deverão manter a mesma estrutura.

Exemplos:

- Address
- Location
- Pagination
- Error

---

## Datas

Datas deverão utilizar o formato ISO 8601 em UTC.

Exemplo:

```text
2026-06-27T10:00:00.000Z
```

---

## Valores Monetários

Valores monetários deverão ser representados como números.

Exemplo:

```json
{
    "valor": 250.50
}
```

Nunca deverão ser enviados como texto formatado.

---

## Coordenadas

Localizações deverão utilizar latitude e longitude.

Exemplo:

```json
{
    "lat": -23.5505,
    "lng": -46.6333
}
```

---

## Paginação

Endpoints paginados deverão retornar:

```json
{
    "data": [],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 120,
        "pages": 6
    }
}
```

---

## Ordenação

Sempre que suportado, utilizar:

```text
?sort=nome&order=asc
```

---

## Filtros

Filtros deverão utilizar Query Parameters.

Exemplo:

```text
GET /api/clientes?nome=joao
```

---

# Códigos HTTP

| Código | Significado |
|---------|-------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

---

# Estrutura de Erro

Toda resposta de erro deverá seguir o padrão:

```json
{
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos.",
    "details": [
        {
            "field": "telefone",
            "message": "Telefone inválido."
        }
    ]
}
```

O campo `details` poderá ser omitido quando não houver informações adicionais.

---

# Módulo Cliente

## Endpoints

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| POST | `/api/clientes` | Criar cliente |
| GET | `/api/clientes` | Listar clientes |
| GET | `/api/clientes/{id}` | Obter cliente |
| PATCH | `/api/clientes/{id}` | Atualizar cliente parcialmente |
| DELETE | `/api/clientes/{id}` | Excluir cliente |

---

# POST /api/clientes

Cria um novo cliente.

## Request

```json
{
    "nome": "João Silva",
    "cpf": "12345678900",
    "comercio": "Padaria do João",
    "telefone": "11999999999",
    "endereco": {
        "logradouro": "Rua A",
        "numero": "123",
        "complemento": "Ap 42",
        "bairro": "Centro",
        "cidade": "São Paulo",
        "estado": "SP"
    },
    "localizacao": {
        "lat": -23.5505,
        "lng": -46.6333
    }
}
```

---

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| nome | Sim | 3 a 100 caracteres |
| cpf | Não | 11 dígitos (validado se informado) |
| comercio | Sim | 1 a 100 caracteres |
| telefone | Sim | 10 a 11 dígitos |
| endereco | Sim | Objeto Address |
| endereco.logradouro | Sim | 3 a 150 caracteres |
| endereco.numero | Não | Texto livre |
| endereco.complemento | Não | Texto livre |
| endereco.bairro | Não | Texto livre |
| endereco.cidade | Não | 2 a 100 caracteres |
| endereco.estado | Não | 2 caracteres |
| localizacao | Não | Objeto Location |
| localizacao.lat | Condicional | Número |
| localizacao.lng | Condicional | Número |

---

## Response 201

```json
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nome": "João Silva",
    "cpf": "12345678900",
    "comercio": "Padaria do João",
    "telefone": "11999999999",
    "endereco": {
        "logradouro": "Rua A",
        "numero": "123",
        "complemento": "Ap 42",
        "bairro": "Centro",
        "cidade": "São Paulo",
        "estado": "SP"
    },
    "localizacao": {
        "lat": -23.5505,
        "lng": -46.6333
    },
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z"
}
```

---

# GET /api/clientes

Lista clientes.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|---------|-----------|
| nome | string | Não | — | Busca parcial |
| page | number | Não | 1 | Página |
| limit | number | Não | 20 | Quantidade por página |
| sort | string | Não | nome | Campo para ordenação |
| order | string | Não | asc | asc ou desc |

---

## Response 200

```json
{
    "data": [
        {
            "...": "Cliente"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "pages": 1
    }
}
```

---

# GET /api/clientes/{id}

Obtém um cliente.

## Response 200

```json
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nome": "João Silva",
    "cpf": "12345678900",
    "comercio": "Padaria do João",
    "telefone": "11999999999",
    "endereco": {
        "...": "Address"
    },
    "localizacao": {
        "...": "Location"
    },
    "totalContratos": 2,
    "saldoDevedor": 500,
    "valorEmAtraso": 300,
    "parcelasEmAtraso": 3,
    "diasEmAtraso": 9,
    "valorVenceHoje": 100,
    "ultimoPagamento": {
        "data": "2026-07-24",
        "valor": 100
    },
    "lucroPrevisto": 410,
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z"
}
```

> **Campos financeiros (PLAN-033 / BR-096..098):** `valorEmAtraso`, `parcelasEmAtraso` e `diasEmAtraso` descrevem parcelas vencidas (inclui `Parcial` com vencimento passado); `valorVenceHoje` = parcelas com vencimento hoje; `ultimoPagamento` = pagamento mais recente **não estornado** (ordenação `data DESC, createdAt DESC`); `lucroPrevisto` = Σ(`valorFinal − valorBase`) dos contratos **Ativos**. Quando não há dado, `ultimoPagamento` é `null` e os demais são `0`.

---

# PATCH /api/clientes/{id}

Atualiza parcialmente um cliente.

Todos os campos são opcionais.

Somente os campos enviados deverão ser alterados.

> **`foto` (P8/PLAN-058):** data URL de imagem normalizada — `data:image/(jpeg|png|webp|gif);base64,...`, **≤1MB decodificados**, com **magic bytes** validados no servidor (conteúdo mascarado ou `svg` → **422**). `null` **remove** a foto (a coluna é zerada).

## Response 200

Mesma estrutura do endpoint `GET /api/clientes/{id}`.

---

# DELETE /api/clientes/{id}

Remove um cliente.

## Response

```text
204 No Content
```

---

## Possíveis Erros

| Código | HTTP |
|---------|------|
| CLIENT_NOT_FOUND | 404 |
| CLIENT_HAS_ACTIVE_CONTRACTS | 409 |
| CPF_DUPLICATED | 409 |
| VALIDATION_ERROR | 422 |

---

# Anexos do cliente (PLAN-042)

Anexos (comprovante de residência, foto/PDF) escopados ao cliente. Acesso segue a mesma regra do restante do módulo (`resolveUsuarioAlvo`): operador → clientes próprios; admin/sócio → `?usuarioId=` dentro da empresa/subárvore; super admin → `?empresaId=`.

## Endpoints

| Método | Endpoint | Auth | Descrição |
|---------|----------|------|-----------|
| POST | `/api/clientes/:id/anexos` | Bearer + escopo | Upload multipart (campo `arquivo`, opcional `tipo`) |
| GET | `/api/clientes/:id/anexos` | Bearer + escopo | Listar metadados (sem bytes) |
| GET | `/api/clientes/:id/anexos/:anexoId/file` | Bearer + escopo | Stream do arquivo |
| DELETE | `/api/clientes/:id/anexos/:anexoId` | Bearer + escopo | Remover anexo (arquivo + linha) |

---

# POST /api/clientes/{id}/anexos

Envia um anexo do cliente. **Multipart/form-data**, campo `arquivo` (obrigatório) + opcional `tipo` (`comprovante-residencia` | `documento` | `outro`, default `outro`).

**Limites:** imagem (JPEG/PNG/WebP) ≤ **1MB** (422 `ANEXO_LIMITE`); PDF ≤ **5MB** (413 — guarda global do `multer` também em 5MB); tipo fora da allowlist → 422 `ANEXO_TIPO`. O servidor valida o **MIME real** (magic bytes), não o `content-type` do cliente.

## Response 201

```json
{
    "id": "b7c2...",
    "nome": "conta-energia.jpg",
    "tipo": "comprovante-residencia",
    "mime": "image/jpeg",
    "tamanho": 186400,
    "createdAt": "2026-08-06T12:00:00.000Z"
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| ANEXO_VAZIO | 400 |
| ANEXO_TIPO | 422 |
| ANEXO_LIMITE | 413/422 |
| CLIENT_NOT_FOUND | 404 |

---

# GET /api/clientes/{id}/anexos

Lista os metadados dos anexos do cliente (sem os bytes).

## Response 200

```json
[
    {
        "id": "b7c2...",
        "nome": "conta-energia.jpg",
        "tipo": "comprovante-residencia",
        "mime": "image/jpeg",
        "tamanho": 186400,
        "createdAt": "2026-08-06T12:00:00.000Z"
    }
]
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| CLIENT_NOT_FOUND | 404 |

---

# GET /api/clientes/{id}/anexos/{anexoId}/file

Serve o arquivo (stream). Autenticado e escopado — nunca estático público. `Content-Disposition: inline`.

## Response 200

Binário do arquivo (`Content-Type` do MIME real).

## Possíveis Erros

| Código | HTTP |
|---------|------|
| CLIENT_NOT_FOUND | 404 |
| ANEXO_NOT_FOUND | 404 |

---

# DELETE /api/clientes/{id}/anexos/{anexoId}

Remove o anexo (apaga o arquivo de `UPLOADS_DIR` + a linha em `anexos`).

## Response

```text
204 No Content
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| CLIENT_NOT_FOUND | 404 |
| ANEXO_NOT_FOUND | 404 |

---

# Módulo Contrato

## Endpoints

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| POST | `/api/contratos` | Criar contrato |
| GET | `/api/contratos` | Listar contratos |
| GET | `/api/contratos/{id}` | Obter contrato com parcelas |
| PATCH | `/api/contratos/{id}` | Atualizar contrato parcialmente |
| DELETE | `/api/contratos/{id}` | Excluir contrato |

---

# POST /api/contratos

Cria um novo contrato com geração automática de parcelas e débito do Caixa Base.

## Request

```json
{
    "clienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "valorBase": 500.00,
    "percentualJuros": 20,
    "quantidadeParcelas": 10,
    "dataInicio": "2026-06-28"
}
```

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| clienteId | Sim | UUID v4 |
| valorBase | Sim | Positivo |
| percentualJuros | Sim | Mínimo 0, padrão 20 |
| quantidadeParcelas | Sim | Inteiro positivo |
| dataInicio | Sim | Formato AAAA-MM-DD |

## Response 201

```json
{
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "clienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "valorBase": 500.00,
    "percentualJuros": 20,
    "valorFinal": 600.00,
    "quantidadeParcelas": 10,
    "dataInicio": "2026-06-28",
    "dataFinal": "2026-07-08",
    "estado": "Ativo",
    "parcelas": [
        {
            "id": "...",
            "numero": 1,
            "valorPrevisto": 60.00,
            "saldoPendente": 60.00,
            "estado": "Pendente",
            "dataVencimento": "2026-06-29"
        }
    ],
    "createdAt": "2026-06-28T10:00:00.000Z",
    "updatedAt": "2026-06-28T10:00:00.000Z"
}
```

---

# GET /api/contratos

Lista contratos com paginação.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|---------|-----------|
| clienteId | string | Não | — | Filtro por cliente |
| page | number | Não | 1 | Página |
| limit | number | Não | 20 | Quantidade por página |
| sort | string | Não | createdAt | Campo para ordenação |
| order | string | Não | desc | asc ou desc |

## Response 200

```json
{
    "data": [
        {
            "id": "b2c3d4e5-...",
            "clienteId": "a1b2c3d4-...",
            "valorBase": 500.00,
            "percentualJuros": 20,
            "valorFinal": 600.00,
            "quantidadeParcelas": 10,
            "dataInicio": "2026-06-28",
            "dataFinal": "2026-07-08",
            "estado": "Ativo",
            "saldoPendente": 600.00,
            "parcelasPagas": 0,
            "emAtraso": 240.00,
            "parcelasEmAtraso": 4,
            "diasEmAtraso": 6,
            "createdAt": "2026-06-28T10:00:00.000Z",
            "updatedAt": "2026-06-28T10:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "pages": 1
    }
}
```

> **Situação de atraso por contrato (PLAN-034 / BR-099):** `emAtraso` = Σ `saldoPendente` de parcelas com `dataVencimento < hoje`; `parcelasEmAtraso` = quantidade dessas parcelas; `diasEmAtraso` = dias desde o vencimento mais antigo em aberto (0 se nenhuma). Parcelas `Parcial` vencidas contam. Quando não há atraso, os três são `0`.

---

# GET /api/contratos/{id}

Obtém um contrato com sua lista de parcelas.

## Response 200

```json
{
    "id": "b2c3d4e5-...",
    "clienteId": "a1b2c3d4-...",
    "valorBase": 500.00,
    "percentualJuros": 20,
    "valorFinal": 600.00,
    "quantidadeParcelas": 10,
    "dataInicio": "2026-06-28",
    "dataFinal": "2026-07-08",
    "estado": "Ativo",
    "parcelas": [
        {
            "id": "...",
            "numero": 1,
            "valorPrevisto": 60.00,
            "valorPago": 0,
            "saldoPendente": 60.00,
            "estado": "Pendente",
            "dataVencimento": "2026-06-29",
            "dataQuitacao": null
        }
    ],
    "createdAt": "2026-06-28T10:00:00.000Z",
    "updatedAt": "2026-06-28T10:00:00.000Z"
}
```

---

# PATCH /api/contratos/{id}

Atualiza parcialmente um contrato.

Permitido apenas quando não há pagamentos registrados no contrato.

## Possíveis Erros

| Código | HTTP |
|---------|------|
| CONTRACT_NOT_FOUND | 404 |
| CONTRACT_HAS_PAYMENTS | 409 |
| INSUFFICIENT_BALANCE | 422 |
| VALIDATION_ERROR | 422 |

---

# DELETE /api/contratos/{id}

Remove um contrato (soft delete).

Permitido apenas quando não há pagamentos registrados.

## Response

```text
204 No Content
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| CONTRACT_NOT_FOUND | 404 |
| CONTRACT_HAS_PAYMENTS | 409 |

---

---

# Módulo Pagamento

## Endpoints

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| POST | `/api/pagamentos` | Registrar pagamento |
| POST | `/api/pagamentos/preview` | Visualizar distribuição do valor antes de confirmar |
| GET | `/api/pagamentos/contrato/{contratoId}` | Listar pagamentos de um contrato |
| POST | `/api/pagamentos/{id}/estornar` | Estornar pagamento (somente admin/super_admin) — PLAN-028 |

---

# Módulo Operações

## Endpoints

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| GET | `/api/operacoes/cobrancas` | Listar cobranças do dia |
| GET | `/api/operacoes/pagamentos-hoje` | Listar pagamentos do dia |
| GET | `/api/operacoes/parcelas-hoje` | Listar parcelas que vencem hoje (agrupadas por cliente/contrato) |
| GET | `/api/operacoes/parcelas-semana` | Listar parcelas que vencem nos próximos 7 dias (excluindo hoje) |
| GET | `/api/operacoes/historico-atrasos` | Listar histórico diário de atrasos (snapshots) |
| POST | `/api/operacoes/visitas` | Registrar visita operacional do dia |

---

# GET /api/operacoes/cobrancas

Lista todas as cobranças previstas para o dia atual, com indicadores financeiros.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|---------|-----------|
| sort | string | Não | — | `distancia` para ordenar por distância |
| lat | number | Não | — | Latitude do operador (necessária com `sort=distancia`) |
| lng | number | Não | — | Longitude do operador (necessária com `sort=distancia`) |

## Response 200

```json
{
    "indicadores": {
        "aReceberHoje": 1250.00,
        "recebidoHoje": 480.00,
        "clientesParaCobrar": 8,
        "atrasado": 340.00,
        "aVencer": 890.00
    },
    "cobrancas": [
        {
            "clienteId": "...",
            "clienteNome": "João Silva",
            "clienteTelefone": "11999999999",
            "clienteLat": -23.5505,
            "clienteLng": -46.6333,
            "clienteLogradouro": "Rua A",
            "clienteNumero": "123",
            "clienteBairro": "Centro",
            "clienteCidade": "São Paulo",
            "clienteEstado": "SP",
            "contratoId": "...",
            "totalPendente": 180.00,
            "quantidadeParcelas": 3,
            "situacao": "atrasado",
            "visitadoEm": null
        }
    ]
}
```

## Comportamento

- `situacao`: `"atrasado"` quando alguma parcela venceu antes de hoje; `"venceHoje"` quando todas as parcelas vencem hoje ou depois
- `visitadoEm`: data da última visita do dia, ou `null` se ainda não foi visitado
- Quando `sort=distancia` combinado com `lat` e `lng`, os resultados são ordenados pela distância do operador (Haversine)
- Clientes visitados no dia são ordenados após os não visitados, independentemente da distância

---

# GET /api/operacoes/pagamentos-hoje

Lista todos os pagamentos registrados na data atual.

## Response 200

```json
[
    {
        "pagamentoId": "...",
        "valor": 120.00,
        "clienteId": "...",
        "clienteNome": "João Silva",
        "contratoId": "...",
        "data": "2026-07-02",
        "createdAt": "2026-07-02T10:30:00.000Z"
    }
]
```

---

# GET /api/operacoes/parcelas-hoje

Lista as parcelas que vencem **hoje** e ainda têm saldo pendente, agrupadas por cliente/contrato.

## Response 200

```json
[
    {
        "clienteId": "...",
        "clienteNome": "João Silva",
        "contratoId": "...",
        "parcelas": [
            { "numero": 1, "valorPrevisto": 120.00, "saldoPendente": 120.00 }
        ]
    }
]
```

## Comportamento

- Filtro: `dataVencimento = hoje`, `saldoPendente > 0`, tudo sem `deletedAt`
- Agrupado por `clienteId` + `contratoId` (um cliente com 2 contratos aparece 2x)
- Alimenta o modal "Parcelas hoje" (KPI "a receber hoje") do `/caixa`

---

# GET /api/operacoes/parcelas-semana

Lista as parcelas que vencem nos próximos **7 dias** (excluindo hoje) com saldo pendente, agrupadas por cliente/contrato.

## Response 200

```json
[
    {
        "clienteId": "...",
        "clienteNome": "João Silva",
        "contratoId": "...",
        "parcelas": [
            { "numero": 2, "valorPrevisto": 120.00, "saldoPendente": 120.00 }
        ]
    }
]
```

## Comportamento

- Filtro: `dataVencimento > hoje AND dataVencimento <= hoje+7`, `saldoPendente > 0`, sem `deletedAt`
- **Exclui hoje** — parcelas que vencem hoje pertencem a `parcelas-hoje`/`cobrancas` (UC-038)

---

# GET /api/operacoes/historico-atrasos

Lista o histórico diário de atrasos (snapshots) do operador logado.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|---------|-----------|
| dias | number | Não | 30 | Quantos dias de histórico retornar (mais recentes primeiro) |

## Response 200

```json
[
    {
        "data": "2026-07-30",
        "clientesAtrasados": 8,
        "contratosAtrasados": 11,
        "valorAtrasado": 1240.50
    }
]
```

## Comportamento

- Um snapshot é registrado automaticamente (upsert por `userId` + `data`) a cada chamada de `GET /api/operacoes/cobrancas` — **não há job agendado**
- Apenas parcelas com `dataVencimento` anterior à data atual **e** saldo pendente > 0 contam
- `clientesAtrasados` e `contratosAtrasados` são contagens distintas (`DISTINCT`)
- Dias sem chamada de `cobrancas` não geram snapshot (ausência de linha)

---

# POST /api/operacoes/visitas

Registra uma visita operacional do dia para um cliente/contrato específico.

## Request

```json
{
    "clienteId": "a1b2c3d4-...",
    "contratoId": "b2c3d4e5-...",
    "tipo": "visitado",
    "dataPromessa": null
}
```

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| clienteId | Sim | UUID v4 |
| contratoId | Sim | UUID v4 |
| tipo | Sim | `"visitado"`, `"nao_localizado"` ou `"promessa"` |
| dataPromessa | Não | Obrigatório quando `tipo = "promessa"`, formato AAAA-MM-DD |

## Response 201

```json
{
    "id": "d4e5f6a7-...",
    "clienteId": "a1b2c3d4-...",
    "contratoId": "b2c3d4e5-...",
    "tipo": "visitado",
    "dataPromessa": null,
    "createdAt": "2026-07-02T10:30:00.000Z"
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| VALIDATION_ERROR | 422 |
| CLIENTE_NOT_FOUND | 404 |
| CONTRATO_NOT_FOUND | 404 |

---

# POST /api/pagamentos/preview

Calcula antecipadamente como o valor informado seria distribuído entre as parcelas pendentes do contrato, utilizando exatamente a mesma lógica do registro de pagamento.

Não persiste nenhum dado.

## Request

```json
{
    "contratoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "valor": 180.00
}
```

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| contratoId | Sim | UUID v4 |
| valor | Sim | Positivo |

## Comportamento

- O valor é distribuído entre as parcelas pendentes em ordem crescente de número (BR-044)
- Parcelas totalmente quitadas recebem `estadoPrevisto: "Paga"`
- Parcelas parcialmente quitadas recebem `estadoPrevisto: "Parcial"`
- O saldo excedente (valor que ultrapassa o saldo devedor) é retornado em `saldoExcedente`

## Response 200

```json
{
    "valorInformado": 180.00,
    "saldoDevedor": 532.01,
    "parcelas": [
        {
            "numero": 6,
            "valorPrevisto": 36.00,
            "saldoPendenteAtual": 28.01,
            "valorAplicado": 28.01,
            "saldoRestante": 0,
            "estadoPrevisto": "Paga"
        },
        {
            "numero": 11,
            "valorPrevisto": 36.00,
            "saldoPendenteAtual": 36.00,
            "valorAplicado": 7.99,
            "saldoRestante": 28.01,
            "estadoPrevisto": "Parcial"
        }
    ],
    "saldoExcedente": 0,
    "todasPagas": false
}
```

---

# POST /api/pagamentos

Registra um pagamento, distribui o valor entre as parcelas pendentes (ordem crescente), atualiza o Caixa Base e gera Movimentação Financeira.

## Request

```json
{
    "contratoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "valor": 60.00
}
```

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| contratoId | Sim | UUID v4 |
| valor | Sim | Positivo, não pode exceder saldo devedor |

## Comportamento

- O valor é distribuído entre as parcelas pendentes em ordem crescente de número (BR-044)
- Se o valor exceder o saldo pendente da parcela atual, o excedente é aplicado à próxima parcela (BR-045)
- Parcelas totalmente quitadas recebem estado **Paga** e `dataQuitacao`
- Parcelas parcialmente quitadas recebem estado **Parcial**
- Se todas as parcelas atingirem estado **Paga**, o contrato é alterado para **Finalizado** (BR-046)
- O valor recebido é creditado no Caixa Base (BR-020)
- Uma Movimentação Financeira é registrada com origem `"Pagamento"`

## Response 201

```json
{
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "contratoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "valor": 60.00,
    "data": "2026-07-01",
    "createdAt": "2026-07-01T10:00:00.000Z"
}
```

---

# GET /api/pagamentos/contrato/{contratoId}

Lista todos os pagamentos de um contrato com os detalhes de distribuição entre parcelas.

## Response 200

```json
[
    {
        "id": "c3d4e5f6-...",
        "contratoId": "a1b2c3d4-...",
        "valor": 60.00,
        "data": "2026-07-01",
        "createdAt": "2026-07-01T10:00:00.000Z",
        "parcelas": [
            {
                "id": "...",
                "pagamentoId": "c3d4e5f6-...",
                "parcelaId": "d4e5f6a7-...",
                "valor": 60.00
            }
        ],
        "estornadoEm": null,
        "estornadoPor": null,
        "estornoMotivo": null
    }
]
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| CONTRACT_NOT_FOUND | 404 |
| INSUFFICIENT_BALANCE | 422 |
| VALIDATION_ERROR | 422 |

---

# POST /api/pagamentos/{id}/estornar

Estorna **por completo** um pagamento registrado (PLAN-028). Reverte cada parcela (volta `valorPago`/`saldoPendente`/`estado`/`dataQuitacao`), cria movimentação reversa (`saida`, origem `Cancelamento`), marca o pagamento como estornado e grava em `auditoria_estornos`. O contrato volta a `Ativo` se estava `Finalizado` por causa do pagamento. **O pagamento nunca é deletado** (BR-029).

**Escopo:** restrito a `admin`/`super_admin` (`403` para operator). `?usuarioId=` aponta o dono do pagamento (operador): admin valida dentro da própria empresa; super_admin qualquer.

## Request

```json
{
    "motivo": "Pagamento registrado por engano"
}
```

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| usuarioId | string | Não | Dono do pagamento (escopo acima) |

## Validações

| Campo | Obrigatório | Regra |
|--------|------------|--------|
| motivo | Sim | Texto não vazio, até 200 caracteres |

## Response 201

```json
{
    "id": "c3d4e5f6-...",
    "data": "2026-08-02",
    "createdAt": "2026-08-02T16:35:36.414Z"
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FORBIDDEN | 403 |
| OPERATOR_NOT_FOUND | 404 |
| PAGAMENTO_NOT_FOUND | 404 |
| PAGAMENTO_JA_ESTORNADO | 409 |
| VALIDATION_ERROR | 422 |

---

# Referências

- PROJECT.md
- DOMAIN.md
- BUSINESS-RULES.md
- ARCHITECTURE.md
- BACKEND.md

---

# Módulo Caixa

## Endpoints

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| GET | `/api/caixa` | Status completo do caixa |
| POST | `/api/caixa/ajuste` | Ajustar Caixa Total |
| GET | `/api/caixa/movimentacoes` | Listar movimentações financeiras |
| GET | `/api/caixa/auditoria` | Listar histórico de ajustes do Caixa Base (PLAN-027) |
| POST | `/api/caixa/liquidar` | Fechar semana |

> **Escopo por usuário (PLAN-020):** `GET /api/caixa`, `POST /api/caixa/ajuste` e `GET /api/caixa/movimentacoes` aceitam o query parameter `usuarioId`, que aponta o caixa-alvo:
> - **operator:** ignora `usuarioId` — opera sempre sobre o caixa próprio (`req.userId`).
> - **admin:** valida que `usuarioId` pertence à própria empresa (via `empresaId` do token); inexistente/outra empresa → `404 OPERATOR_NOT_FOUND`.
> - **super_admin:** valida apenas a existência do usuário; pode apontar caixa de qualquer empresa.
> - `POST /api/caixa/ajuste` é **restrito a admin/super_admin** (403 para `operator`) — o ajuste do Caixa Base é exclusivo de administradores (BR-079); `?usuarioId=` é sempre ignorado para operator (segurança preservada).
> - `POST /api/caixa/liquidar` opera sempre sobre o caixa próprio (`req.userId`).

---

# GET /api/caixa

Retorna o status completo do caixa: base, saldo, indicadores do dia e da semana, e dados do último fechamento.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| dataInicio | string | Não | Início do período (junto com dataFim) |
| dataFim | string | Não | Fim do período (junto com dataInicio) |
| usuarioId | string | Não | Caixa-alvo (ver escopo acima) |

## Response 200

```json
{
    "caixaBase": 20000.00,
    "saldoAtual": 19320.00,
    "aReceberHoje": 1250.00,
    "recebidoHoje": 480.00,
    "recebidoSemana": 480.00,
    "vendasSemana": 3000.00,
    "gastosSemana": 180.00,
    "resultadoSemana": 300.00,
    "ultimaLiquidacao": "2026-07-06",
    "caixaUltimaLiquidacao": 19500.00
}
```

## Comportamento

- `caixaBase`: valor base do caixa (BR-018)
- `saldoAtual`: caixaBase + total entradas - total saídas
- `aReceberHoje`: soma das parcelas com vencimento hoje
- `recebidoHoje`: soma dos pagamentos registrados hoje
- `recebidoSemana`: soma dos pagamentos da semana atual (segunda a domingo)
- `vendasSemana`: soma do valorBase dos contratos criados na semana
- `gastosSemana`: soma dos gastos da semana atual
- `resultadoSemana`: recebidoSemana - gastosSemana
- `ultimaLiquidacao`: data do último fechamento semanal (`null` se nunca fechou)
- `caixaUltimaLiquidacao`: snapshot do caixaBase no momento do último fechamento

## Possíveis Erros

| Código | HTTP |
|---------|------|
| OPERATOR_NOT_FOUND | 404 |
| INTERNAL_ERROR | 500 |

---

# POST /api/caixa/ajuste

Ajusta o Caixa Total para um novo valor (BR-018). O ajuste **não** gera movimentação financeira — a base é o registro (PLAN-020, correção de dobra no saldo/lucro). Todo ajuste gera um registro em **auditoria** (BR do PLAN-026): operador-alvo, admin responsável, valor anterior, valor novo, motivo e data/hora.

## Request

```json
{
    "valor": 22000.00,
    "motivo": "Reposição de troco do caixa"
}
```

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| usuarioId | string | Não | Caixa-alvo (ver escopo acima) |

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| valor | Sim | Positivo |
| motivo | Sim | Texto não vazio, até 200 caracteres |

## Response 201

```json
{
    "caixaBase": 22000.00
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FORBIDDEN | 403 |
| OPERATOR_NOT_FOUND | 404 |
| VALIDATION_ERROR | 422 |

---

# GET /api/caixa/auditoria

Lista o histórico de ajustes manuais do Caixa Base (tabela `auditoria_caixa`, BR-088) com paginação. Ordenado por `createdAt` decrescente.

**Escopo (PLAN-027):** mesmo padrão do caixa — `operator` sempre consulta o **próprio** histórico (ignora `?usuarioId=`); `admin` consulta o histórico de um operador da própria empresa via `?usuarioId=`; `super_admin` pode consultar qualquer. Rota **sem** `adminMiddleware` (operador também lê o próprio).

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| page | number | Não | Página (padrão 1) |
| limit | number | Não | Itens por página, máx 100 (padrão 20) |
| usuarioId | string | Não | Dono do histórico (ver escopo acima) |

## Response 200

```json
{
    "data": [
        {
            "id": "f6a25914-...",
            "operadorId": "ace6fe87-...",
            "adminId": "703cef97-...",
            "adminNome": "Rafael Cartaxo Borges",
            "valorAnterior": 2500.00,
            "valorNovo": 3200.00,
            "motivo": "Ajuste de demonstração",
            "data": "2026-08-02",
            "createdAt": "2026-08-02T14:58:12.314Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "pages": 1
    }
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| OPERATOR_NOT_FOUND | 404 |
| VALIDATION_ERROR | 422 |

---

# GET /api/caixa/movimentacoes

Lista movimentações financeiras com paginação e filtros.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|---------|-----------|
| dataInicio | string | Não | 7 dias atrás | Filtro inicial |
| dataFim | string | Não | hoje | Filtro final |
| origem | string | Não | — | Contrato / Pagamento / Gasto / Ajuste |
| usuarioId | string | Não | — | Caixa-alvo (ver escopo acima) |
| page | number | Não | 1 | Página |
| limit | number | Não | 20 | Itens por página |

## Response 200

```json
{
    "data": [
        {
            "id": "...",
            "tipo": "entrada",
            "valor": 60.00,
            "origem": "Pagamento",
            "origemId": "...",
            "descricao": null,
            "data": "2026-07-11",
            "createdAt": "2026-07-11T10:30:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "pages": 1
    }
}
```

---

# POST /api/caixa/liquidar

Fecha a semana atual, gerando um registro de fechamento (BR-027).

Sem body.

## Response 201

```json
{
    "id": "...",
    "dataInicio": "2026-07-06",
    "dataFim": "2026-07-12",
    "totalRecebido": 480.00,
    "totalGasto": 180.00,
    "resultado": 300.00,
    "caixaBase": 19500.00,
    "createdAt": "2026-07-11T..."
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| SEMANA_JA_LIQUIDADA | 409 |
| VALIDATION_ERROR | 422 |

---

# Módulo Gasto

## Endpoints

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| POST | `/api/gastos` | Registrar gasto |
| GET | `/api/gastos` | Listar gastos |
| DELETE | `/api/gastos/:id` | Excluir gasto (soft delete) |

---

# POST /api/gastos

Registra um gasto, debita o Caixa Base e gera movimentação financeira (BR-021, BR-028).

## Request

```json
{
    "valor": 50.00,
    "categoria": "Transporte",
    "data": "2026-07-11",
    "observacao": "Combustível"
}
```

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| valor | Sim | Positivo |
| categoria | Sim | 1 a 50 caracteres |
| data | Sim | AAAA-MM-DD |
| observacao | Não | Texto livre |

## Response 201

```json
{
    "id": "...",
    "valor": 50.00,
    "categoria": "Transporte",
    "observacao": "Combustível",
    "data": "2026-07-11",
    "createdAt": "2026-07-11T10:00:00.000Z"
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| VALIDATION_ERROR | 422 |

---

# GET /api/gastos

Lista gastos com filtro por período.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|---------|-----------|
| dataInicio | string | Não | hoje | Filtro inicial |
| dataFim | string | Não | hoje | Filtro final |
| page | number | Não | 1 | Página |
| limit | number | Não | 20 | Itens por página |

## Response 200

```json
{
    "data": [
        {
            "id": "...",
            "valor": 50.00,
            "categoria": "Transporte",
            "observacao": "Combustível",
            "data": "2026-07-11",
            "createdAt": "2026-07-11T10:00:00.000Z"
        }
    ],
    "totalPeriodo": 50.00,
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "pages": 1
    }
}
```

---

# DELETE /api/gastos/:id

Remove um gasto (soft delete). Não estorna o caixa — o histórico é preservado (BR-029).

## Response

```text
204 No Content
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| GASTO_NOT_FOUND | 404 |

---

# Módulo Auth

## Endpoints

| Método | Endpoint | Auth | Descrição |
|---------|----------|------|-----------|
| POST | `/api/auth/login` | Não | Autenticar e receber JWT |
| GET | `/api/auth/me` | Sim | Dados do operador logado |
| PATCH | `/api/auth/senha` | Sim | Alterar a própria senha (BR-089/090) — PLAN-029 |

> **Registro de operadores:** Movido para o [Módulo Admin](#módulo-admin) — `POST /api/admin/operadores`.

---

# POST /api/auth/login

Autentica um operador e retorna token JWT.

## Request

```json
{
    "email": "admin@cobranca.com",
    "senha": "********"
}
```

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| email | Sim | Email válido |
| senha | Sim | Mínimo 6 caracteres |

## Response 200

```json
{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "usuario": {
        "id": "a1b2c3d4-...",
        "nome": "Admin",
        "email": "admin@cobranca.com"
    }
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| CREDENCIAIS_INVALIDAS | 401 |
| VALIDATION_ERROR | 400 |
| EMPRESA_INATIVA | 403 (credenciais válidas, mas a empresa está suspensa — BR-106) |

> **Rate limit (BR-077):** 10 tentativas por IP a cada 15 minutos → 429. O limite pode ser sobrescrito por env `LOGIN_RATE_LIMIT_MAX` (default 10) — usado em ambientes de teste/smoke.

---

# GET /api/auth/me

Retorna os dados do operador autenticado.

**Auth:** Sim (Bearer token)

> **BR-106:** empresa suspensa → **403 `EMPRESA_INATIVA`** (o frontend encerra a sessão, como no 401).

## Response 200

```json
{
    "id": "a1b2c3d4-...",
    "nome": "Admin",
    "email": "admin@cobranca.com",
    "role": "admin",
    "empresaId": null,
    "empresaNome": null,
    "chefeId": null,
    "modulos": null,
    "foto": null
}
```

> **Nota:** `empresaId` e `empresaNome` são retornados via JOIN com a tabela `empresas`. Para `super_admin`, `empresaId` é `null` (acesso transversal); para `admin`, `empresaId` é o UUID da empresa vinculada.

## Possíveis Erros

| Código | HTTP |
|---------|------|
| TOKEN_INVALIDO | 401 |

---

# Módulo Empresas (Multi-Tenant)

Gestão de empresas. Acesso exclusivo para super administradores (`role = 'super_admin'`).

## Endpoints

| Método | Endpoint | Auth | Descrição |
|---------|----------|------|-----------|
| GET | `/api/admin/empresas` | Super Admin | Listar todas as empresas |
| GET | `/api/admin/empresas/:id` | Super Admin | Buscar empresa por id (com totais) |
| POST | `/api/admin/empresas` | Super Admin | Criar nova empresa com admin |
| PATCH | `/api/admin/empresas/:id` | Super Admin | Atualizar dados da empresa (documento/nomeFantasia/ativa/nome) |
| PATCH | `/api/admin/empresas/:id/modulos` | Super Admin | Ativar/desativar módulos da empresa (PLAN-031) |

---

# GET /api/admin/empresas

Lista todas as empresas cadastradas.

**Auth:** Super Admin (`role = 'super_admin'`)

## Response 200

```json
[
    {
        "id": "a1b2c3d4-...",
        "nome": "Desenvolvimento",
        "documento": null,
        "nomeFantasia": null,
        "ativa": true,
        "createdAt": "2026-07-31T10:00:00.000Z",
        "totalUsuarios": 3,
        "totalClientes": 12,
        "contratosAtivos": 5,
        "adminNome": "Joao Pedro da Silva",
        "adminEmail": "pedro.nx@uorak.com"
    }
]
```

> **Nota (PLAN-025):** `adminNome`/`adminEmail` trazem o primeiro admin ativo (`role = 'admin'`, `deletedAt IS NULL`) da empresa, para contextualizar quem é o administrador na lista e no painel.

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FORBIDDEN | 403 |

---

# GET /api/admin/empresas/:id

Busca uma empresa por id, com totais de usuários, clientes e contratos ativos (PLAN-021 — contexto de empresa no painel admin).

> **Nota (PLAN-022 / BR-085):** `contratosAtivos` conta apenas contratos com `estado = 'Ativo'` (não apenas não-deletados). Contratos `Finalizado` (quitação total) ou `Cancelado` não entram na contagem.

**Auth:** Super Admin (`role = 'super_admin'`)

## Response 200

```json
{
    "id": "a1b2c3d4-...",
    "nome": "Desenvolvimento",
    "createdAt": "2026-07-31T10:00:00.000Z",
    "totalUsuarios": 3,
    "totalClientes": 12,
    "contratosAtivos": 5,
    "adminNome": "Joao Pedro da Silva",
    "adminEmail": "pedro.nx@uorak.com"
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FORBIDDEN | 403 |
| EMPRESA_NAO_ENCONTRADA | 404 |

---

# POST /api/admin/empresas

Cria uma nova empresa e o administrador inicial vinculado a ela (transação atômica).

**Auth:** Super Admin (`role = 'super_admin'`)

## Request

```json
{
    "nome": "Empresa Exemplo",
    "documento": "00.000.000/0000-00",
    "nomeFantasia": "Exemplo",
    "ativa": true,
    "adminNome": "João Administrador",
    "adminEmail": "admin@empresa.com",
    "adminSenha": "senhaSegura123"
}
```

## Validações

| Campo | Obrigatório | Regra |
|---------|------------|--------|
| nome | Sim | 1 a 100 caracteres |
| adminNome | Sim | 1 a 100 caracteres |
| adminEmail | Sim | Email válido |
| adminSenha | Sim | Mínimo 6 caracteres |
| documento | Não | **CPF ou CNPJ** — validado com check-digit (11 ou 14 dígitos), armazenado em dígitos. **Opcional** (não impede cadastro) |
| nomeFantasia | Não | Nome fantasia — **opcional** (usado no card) |
| ativa | Não | Booleano, default `true` — **opcional** (situação da empresa) |

> **Decisão (WS5):** `documento`, `nomeFantasia` e `ativa` são **opcionais** de propósito — não bloqueiam o cadastro de empresa/admin inicial.

## Response 201

```json
{
    "empresa": {
        "id": "a1b2c3d4-...",
        "nome": "Empresa Exemplo",
        "documento": "00.000.000/0000-00",
        "nomeFantasia": "Exemplo",
        "ativa": true,
        "createdAt": "2026-07-31T10:00:00.000Z"
    },
    "admin": {
        "id": "b2c3d4e5-...",
        "nome": "João Administrador",
        "email": "admin@empresa.com",
        "role": "admin"
    }
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| EMAIL_DUPLICATED | 409 |
| VALIDATION_ERROR | 400 |

---

# PATCH /api/admin/empresas/{id}

Atualiza dados gerais da empresa (diferente do `/modulos`). Campos opcionais; apenas os enviados mudam.

**Auth:** Super Admin (`role = 'super_admin'`)

> **Suspensão (BR-106):** `ativa: false` **bloqueia o acesso** de todos os usuários da empresa (403 `EMPRESA_INATIVA` no login/`me` e em toda rota autenticada). A mudança de situação é registrada em `auditoria_modulos` (`tipo:"empresa"`).

## Request

```json
{
    "nome": "Empresa Exemplo Ltda",
    "documento": "11.222.333/0001-81",
    "nomeFantasia": "Exemplo",
    "ativa": false
}
```

> **`documento` (P11):** aceita **CPF ou CNPJ** (validado com check-digit); `null` remove. Armazenado em dígitos; inválido → **422**.

## Response 200

Mesma estrutura do `GET /api/admin/empresas/:id` (com `documento`, `nomeFantasia`, `ativa` e totais).

## Possíveis Erros

| Código | HTTP |
|---------|------|
| EMPRESA_NOT_FOUND | 404 |
| VALIDATION_ERROR (documento inválido) | 422 |

---

# PATCH /api/admin/empresas/{id}/modulos

Ativa/desativa **módulos da empresa** (whitelabel, PLAN-031). O tenant passa a ver apenas as superfícies (nav/rotas/entradas) dos módulos ativos — `central` é sempre ativo.

> **Enforcement no backend (PLAN-036, P024):** além do gating de UI, módulo desativado devolve **403 `MODULE_DISABLED`** nas rotas do módulo: `/api/clientes` (clientes), `/api/contratos` (contratos), `/api/caixa` (caixa), `/api/gastos` (gastos), `/api/pagamentos` (contratos), e em `/api/operacoes`: `POST /visitas` (rota) e `GET /historico-atrasos` (cobrancas). Super admin sem `?empresaId=` não é bloqueado; com `?empresaId=` respeita os módulos da empresa-alvo. Endpoints compartilhados com a Central (`GET /operacoes/cobrancas`, `pagamentos-hoje`, `parcelas-hoje`, `parcelas-semana`) permanecem abertos (limite do v1).

**Auth:** Super Admin

## Request

```json
{
    "modulos": ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"]
}
```

## Validações

- `modulos` deve ser um array de ids válidos: `clientes, contratos, caixa, gastos, rota, cobrancas, atendidos`.
- **Dependências**: `gastos` requer `caixa`; `rota`, `cobrancas` e `atendidos` requerem `contratos`. Violação → 422.
- Array vazio (`[]`) = apenas o módulo `central` (sempre ativo).
- **Guard de dados (BR-105):** desligar módulo com dado financeiro em aberto → **409** `MODULE_HAS_ACTIVE_DATA` (ver seção abaixo). `force: true` + `motivo` obrigatório (≤200) só super admin; **caixa nunca é forcável**.

## Response 200

```json
{
    "id": "a1b2c3d4-...",
    "nome": "Empresa Exemplo",
    "createdAt": "2026-07-31T10:00:00.000Z",
    "modulos": ["clientes", "contratos", "caixa"],
    "totalUsuarios": 1,
    "totalClientes": 0,
    "contratosAtivos": 0
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FORBIDDEN | 403 (não-super) |
| EMPRESA_NOT_FOUND | 404 |
| VALIDATION_ERROR | 422 (módulo inválido / dependência) |
| MODULE_HAS_ACTIVE_DATA | 409 (módulo financeiro com dado pendente, sem `force`) |

### Guard de desativação (BR-105)

Desde a modularização fina, o `PATCH /modulos` **computa o impacto** de desligar o
conjunto efetivo (inclui a cascata de dependências) e protege os dados:

- Módulos **financeiros com dado em aberto** → **409 `MODULE_HAS_ACTIVE_DATA`** com
  payload `impacto` (contagens por módulo). Para sobrepor, `force: true` + `motivo`
  (só super admin). **Caixa aberto (`caixa_base != 0`) NUNCA é forcável.**
- Cadastro/operação (`clientes`, `rota`, `atendidos`, `gastos`) → 200 ecoando o
  `impacto` (a UI mostra confirmação com contagens).
- Toda mudança é registrada em `auditoria_modulos` (quem, antes/depois, force).

## Request

```json
{
    "modulos": ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"],
    "force": false,
    "motivo": null
}
```

## Response 200

```json
{
    "id": "a1b2c3d4-...",
    "nome": "Empresa Exemplo",
    "modulos": ["clientes", "contratos", "caixa"],
    "capacidades": null,
    "totalUsuarios": 1,
    "totalClientes": 0,
    "contratosAtivos": 0,
    "impacto": {
        "desligados": [],
        "impacto": [],
        "bloqueado": false
    }
}
```

## Response 409 (bloqueio por dados)

```json
{
    "code": "MODULE_HAS_ACTIVE_DATA",
    "message": "Há dados financeiros em aberto nos módulos que seriam desativados.",
    "impacto": {
        "desligados": ["clientes", "contratos", "cobrancas", "rota", "atendidos"],
        "impacto": [
            { "modulo": "clientes", "contagem": 1, "bloqueia": false, "detalhe": "clientes cadastrados" },
            { "modulo": "contratos", "contagem": 3, "bloqueia": true, "detalhe": "1 contrato(s) ativo(s) · 3 parcela(s) em aberto" }
        ],
        "bloqueado": true
    }
}
```

---

# PATCH /api/admin/empresas/{id}/capacidades

Ativa/desativa **capacidades** (recursos finos) da empresa — granularidade abaixo
do módulo. `null` = todas ativas; `[]` = nenhuma. Capacidade exige o **módulo
dono** ativo (422 se dono desligado); com dono desligado depois, fica inerte.

Capacidades atuais: `cliente:whatsapp`, `cliente:ligar`, `cliente:navegar`,
`cliente:anexos`, `rota:whatsapp`, `rota:ligar`, `rota:navegar`,
`pagamento:comprovante_whatsapp`.

**Auth:** Super Admin

## Request

```json
{
    "capacidades": ["cliente:whatsapp", "cliente:anexos"]
}
```

Para limpar o override (voltar a todas ativas): `{ "capacidades": null }`.

## Validações

- Cada id deve existir no manifest; duplicadas são **normalizadas**.
- Capacidade com módulo dono desativado na empresa → **422**.
- `null` limpa o override (todas ativas).

## Response 200

Mesma estrutura do `GET /api/admin/empresas/:id`, com `capacidades`.

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FORBIDDEN | 403 (não-super) |
| EMPRESA_NOT_FOUND | 404 |
| VALIDATION_ERROR | 422 (id inválido / dono off) |

---

# GET /api/admin/empresas/{id}/impacto

Prévia (sem persistir) do impacto de desativar um conjunto de módulos — usada
pela UI para exibir a confirmação antes de aplicar. Resposta idêntica ao campo
`impacto` do `PATCH /modulos`.

**Auth:** Super Admin

## Request

`GET /api/admin/empresas/{id}/impacto?modulos=<JSON>` (query `modulos` = array
JSON urlencoded, ex.: `["clientes","contratos"]`).

## Validações

- `modulos` deve ser um JSON válido e um conjunto coerente (grafo de dependências)
  → 422 caso contrário.

## Response 200

```json
{
    "desligados": ["clientes", "contratos", "cobrancas", "rota", "atendidos"],
    "impacto": [
        { "modulo": "clientes", "contagem": 1, "bloqueia": false, "detalhe": "clientes cadastrados" },
        { "modulo": "contratos", "contagem": 3, "bloqueia": true, "detalhe": "1 contrato(s) ativo(s) · 3 parcela(s) em aberto" }
    ],
    "bloqueado": true
}
```

---

# Módulo Admin (Atualizado)

Gestão de operadores e dashboard consolidado. Acesso para administradores (`role = 'admin'`) e super administradores (`role = 'super_admin'`).

> **Multi-tenant:** Administradores só enxergam operadores e dados da sua própria empresa (`empresaId` do token). Super administradores podem acessar dados de todas as empresas ou filtrar por `empresaId` via query parameter.

## Endpoints

| Método | Endpoint | Auth | Descrição |
|---------|----------|------|-----------|
| GET | `/api/admin/operadores` | Admin / Super Admin | Listar operadores (filtrados por empresa) |
| GET | `/api/admin/operadores/:id` | Admin / Super Admin | Buscar operador por id (validado dentro da empresa) |
| POST | `/api/admin/operadores` | Admin / Super Admin | Criar novo operador vinculado à empresa |
| PATCH | `/api/admin/operadores/:id` | Admin / Super Admin | Editar operador (nome, email, role, senha) |

> **Rebaixamento (PLAN-061):** rebaixar um usuário com subordinados ativos responde **422 `OPERATOR_HAS_SUBORDINATES`** com `subordinados` (contagem) — mensagem específica. Para rebaixar no mesmo ato, enviar `reatribuirParaChefeId` (novo chefe, deve ser **admin** da mesma empresa) → os subordinados são movidos na transação e o demote aplicado.
> **Corpo:** `{ "role": "operator", "reatribuirParaChefeId": "<adminId>" }`.
| DELETE | `/api/admin/operadores/:id` | Admin / Super Admin | Remover operador (soft-delete) |
| GET | `/api/admin/dashboard` | Admin / Super Admin | KPIs consolidados (filtrados por empresa) |
| GET | `/api/admin/equipe` | Admin / Super Admin | Equipe com contribuição por operador + totais (PLAN-030) |

---

# GET /api/admin/equipe

Retorna a **equipe da empresa com contribuição por operador** e os totais — alimenta o drill-down dos KPIs de Operação do painel admin (BR-091). A soma dos operadores é igual ao agregado da empresa (`GET /api/admin/dashboard`).

**Auth:** Admin / Super Admin

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| empresaId | string | Super Admin: sim · Admin: ignorado | Empresa-alvo (super admin); admin usa a própria empresa do token |

## Response 200

```json
{
    "operadores": [
        {
            "id": "a1b2c3d4-...",
            "nome": "Maria Op",
            "email": "maria.nx@uorak.com",
            "role": "operator",
            "totalClientes": 30,
            "contratosAtivos": 8,
            "recebidoHoje": 480.00
        }
    ],
    "totais": {
        "totalClientes": 45,
        "contratosAtivos": 12,
        "recebidoHoje": 480.00
    }
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FORBIDDEN | 403 (operator) |
| VALIDATION_ERROR | 400 (super admin sem `empresaId`) |
| INTERNAL_ERROR | 500 |

---

# GET /api/admin/dashboard

KPIs consolidados. Comportamento por nível (PLAN-024 / BR-087):

> **Nota (PLAN-030 / BR-091):** o painel admin usa os KPIs de Operação vindos de `GET /api/admin/equipe` (total da equipe + drill-down). O `/dashboard` permanece disponível (e ainda é a fonte dos KPIs de Equipe — `totalAdmins`/`totalOperadores`).

- **Admin self** (sem `?empresaId=`): KPIs de Operação (`totalClientes`, `contratosAtivos`, `recebidoHoje`, `resultadoDoDia`) escopados aos dados do **próprio usuário logado** (`req.userId`), coincidindo com `/clientes`, `/contratos` e o caixa. KPIs de Equipe permanecem por empresa.
- **Super admin** sem `empresaId`: agregado de todas as empresas.
- **Com `?empresaId=`** (admin ou super admin): agregado da empresa informada.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| empresaId | string | Não | Filtrar por empresa (admin visualizando outra empresa precisa de `empresaId`; super admin opcional) |

## Response 200

```json
{
    "totalAdmins": 1,
    "totalSocios": 2,
    "totalOperadores": 3,
    "totalClientes": 45,
    "contratosAtivos": 12,
    "recebidoHoje": 480.00,
    "resultadoDoDia": 300.00
}
```

- `totalAdmins`: usuários com `role = 'admin'` (PLAN-021 / BR-082)
- `totalSocios`: usuários com `role = 'socio'` (roles — KPI Sócios)
- `totalOperadores`: usuários com `role = 'operator'` (PLAN-021 / BR-082)
- `contratosAtivos`: contratos com `estado = 'Ativo'` (não apenas não-deletados) — PLAN-022 / BR-085
- `resultadoDoDia`: entradas − saídas do dia (movimentações financeiras)

## Possíveis Erros

| Código | HTTP |
|---------|------|
| INTERNAL_ERROR | 500 |

## Regras de negócio

| BR | Descrição |
|----|-----------|
| BR-066 | Papéis `admin` e `operator` com níveis de acesso distintos |
| BR-067 | Apenas admin pode gerenciar operadores |
| BR-068 | Admin visualiza dashboard consolidado |
| BR-069 | Admin não pode rebaixar o próprio papel |
| BR-070 | Admin não pode remover a si mesmo |
| BR-071 | Remoção de operador é lógica (`deletedAt`), dados preservados |
| BR-072 | Super admin acessa todas as empresas; admin acessa apenas a sua |
| BR-073 | Super admin deve informar `empresaId` ao criar operador |
| BR-074 | Operador criado recebe `role = 'admin'` ou `role = 'operator'` (nunca `super_admin`) |
| BR-075 | Empresa e admin inicial são criados em transação atômica |
| BR-076 | `empresaId` do token determina o escopo de dados do operador |
| BR-077 | Dashboard de super admin sem `empresaId` retorna agregado de todas as empresas |
| BR-078 | Admin define o Caixa Base de um operador (`POST /api/caixa/ajuste?usuarioId=`) |
| BR-079 | Operador não pode ajustar o Caixa Base próprio (403). ~~Revogado pelo PLAN-021~~ — **reativado pelo PLAN-025** (regra exclusiva de admin/super_admin) |
| BR-080 | Admin visualiza os KPIs do caixa de um operador (`GET /api/caixa?usuarioId=`), validado dentro da empresa |
| BR-081 | Login roteado por perfil: `operator` → `/`, `admin` → `/admin`, `super_admin` → `/admin/empresas`; `/admin` de super_admin redireciona para `/admin/empresas` |
| BR-082 | Dashboard admin com KPIs separados: `totalAdmins` (role `admin`), `totalSocios` (role `socio`) e `totalOperadores` (role `operator`), agrupados em `Equipe` e `Operação` |
| BR-083 | Card de empresa (super admin) mostra `totalUsuarios` (admin + operator) |
| BR-084 | ~~Operador pode ajustar o próprio Caixa Base (`POST /api/caixa/ajuste` sem `usuarioId`); `usuarioId` é sempre ignorado para operator~~ — **revogado pelo PLAN-025** (volta à BR-079: operador bloqueado no ajuste) |
| BR-085 | Contratos ativos (KPIs admin/empresa) contam apenas `estado = 'Ativo'`; `Finalizado`/`Cancelado` não entram |
| BR-087 | Dashboard admin self escopado por `req.userId` nos KPIs de Operação (bate com navegação `/clientes`, `/contratos`); super admin mantém visão agregada de empresa |
| BR-088 | Todo ajuste do Caixa Base (`POST /api/caixa/ajuste`) grava registro em `auditoria_caixa` (operador, admin, valor anterior/novo, motivo, data); `motivo` é obrigatório. Histórico consultável via `GET /api/caixa/auditoria` (PLAN-027) |

---

# Módulo Health

Health check público — usado pelo runbook e pelo `ops-runner` para validar o serviço.

## Endpoints

| Método | Endpoint | Auth | Descrição |
|---------|----------|------|-----------|
| GET | `/api/health` | Não | Health check (status do serviço + conexão com o banco) |

---

# GET /api/health

## Response 200

```json
{
    "status": "ok",
    "db": "connected"
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| INTERNAL_ERROR | 500 (banco indisponível) |

---

# PATCH /api/auth/senha

Altera a **própria senha** do usuário autenticado (BR-089/BR-090). Opera sempre sobre o `req.userId` — `?usuarioId=` é ignorado.

**Auth:** Sim (Bearer)

## Request

```json
{
    "senhaAtual": "teste123!",
    "novaSenha": "novaSenha123"
}
```

## Validações

| Campo | Obrigatório | Regra |
|--------|------------|-------|
| senhaAtual | Sim | Deve corresponder à senha atual do usuário |
| novaSenha | Sim | Mínimo 6 caracteres e diferente da atual |

## Response 200

```json
{
    "ok": true
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| INVALID_CURRENT_PASSWORD | 422 |
| VALIDATION_ERROR | 400/422 |
| UNAUTHORIZED | 401 |

> **Nota (PLAN-029):** senha atual incorreta responde **422** (não 401) para não disparar o logout automático do cliente. Após a troca, o token atual permanece válido (BR-090).

---

# PATCH /api/auth/foto

Altera a **própria foto** (avatar) do usuário autenticado (PLAN-041 — BR-101 · PLAN-058: 640px + validação). Opera sempre sobre o `req.userId`. A foto é um **data URL** de imagem normalizada (≤640px, JPEG q0.8, ~80-150KB) — o servidor valida **MIME na allowlist** (`jpeg/png/webp/gif`), **magic bytes** e **≤1MB decodificados** (não confia no front).

**Auth:** Sim (Bearer)

## Request

```json
{
    "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

Para **remover** a foto, enviar `"foto": null`.

## Validações

| Campo | Obrigatório | Regra |
|--------|------------|-------|
| foto | Não | `null` (remove) ou `data:image/(jpeg\|png\|webp\|gif);base64,...` com ≤1MB decodificados e magic bytes válidos |

## Response 200

```json
{
    "ok": true,
    "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FOTO_TIPO | 422 |
| FOTO_LIMITE | 422 |
| UNAUTHORIZED | 401 |

---

# POST /api/auth/ativar

Ativação de conta **convidada** (PLAN-065): valida o token de convite (enviado por e-mail) e define a senha.

**Auth:** Público · **Rate limit:** 10/15min

## Request

```json
{ "token": "<token do e-mail>", "senha": "novaSenha123" }
```

## Response 200

```json
{ "ok": true }
```

## Possíveis Erros

| Código | HTTP |
|--------|------|
| VALIDATION_ERROR | 422 (token/senha < 6) |
| TOKEN_EXPIRED | 400 |
| TOKEN_INVALID | 400 (inválido, tipo errado ou já usado) |
| RATE_LIMIT | 429 |

---

# POST /api/auth/forgot

"Esqueci a senha" (PLAN-065). **Resposta SEMPRE 200 genérica** (não revela se o e-mail existe nem se a conta é convidada) — quando aplicável, envia e-mail com link de reset.

**Auth:** Público · **Rate limit:** 3/15min por e-mail+IP

## Request

```json
{ "email": "admin@cobranca.com" }
```

## Response 200

```json
{ "ok": true }
```

---

# POST /api/auth/reset

Redefine a senha via token de reset (PLAN-065, validade 30 min, single-use).

**Auth:** Público · **Rate limit:** 10/15min

## Request

```json
{ "token": "<token do e-mail>", "senha": "novaSenha123" }
```

## Response 200

```json
{ "ok": true }
```

## Possíveis Erros

| Código | HTTP |
|--------|------|
| VALIDATION_ERROR | 422 (token/senha < 6) |
| TOKEN_EXPIRED | 400 |
| TOKEN_INVALID | 400 (inválido ou já usado) |
| RATE_LIMIT | 429 |

---

# PATCH /api/admin/operadores/{id}/reenviar-convite

Reenvia o convite de ativação para um operador **convidado** (PLAN-065) — novo token; o anterior é invalidado. Conta já ativa → **409**.

**Auth:** Admin / Super Admin

## Response 200

```json
{ "ok": true }
```

## Possíveis Erros

| Código | HTTP |
|--------|------|
| OPERATOR_NOT_FOUND | 404 |
| VALIDATION_ERROR | 409 (conta já ativa) |
| FORBIDDEN | 403 |
---

# POST /api/leads

Cria um **lead comercial** (PLAN-064, público — página `/quero-conhecer`). Não cria empresa/usuário/tenant. Envia e-mail de confirmação (token `lead`, validade 24h).

**Auth:** Público · **Rate limit:** 10/15min

## Request

```json
{ "nomeResponsavel": "Maria Interessada", "empresa": "Comercial Exemplo", "email": "maria@exemplo.com", "telefone": "11999999999", "origem": "Site" }
```

## Response 201

```json
{ "ok": true, "lead": { "id": "...", "status": "NOVO", "origem": "Site" } }
```

## Response 200 (dedup)

E-mail já tem lead → não cria (`jaExistia: true` — mensagem amigável no front).

## Possíveis Erros

| Código | HTTP |
|--------|------|
| VALIDATION_ERROR | 422 (campos obrigatórios/mín. 2) |
| LEAD_EMAIL_JA_USUARIO | 409 (e-mail já é usuário/empresa) |
| RATE_LIMIT | 429 |

---

# POST /api/leads/confirmar

Confirma o e-mail do lead via token (PLAN-064). Single-use; validade 24h.

**Auth:** Público · **Rate limit:** 10/15min

## Request

```json
{ "token": "<token do e-mail>" }
```

## Response 200

```json
{ "ok": true, "lead": { "id": "...", "status": "EMAIL_CONFIRMADO" } }
```

## Possíveis Erros

| Código | HTTP |
|--------|------|
| VALIDATION_ERROR | 422 (sem token) |
| TOKEN_EXPIRED | 400 |
| TOKEN_INVALID | 400 (inválido ou já usado) |
| RATE_LIMIT | 429 |

---

# POST /api/leads/reconfirmar

Reenvia o e-mail de confirmação (PLAN-064, LD-07). **Resposta sempre 200 genérica** (não vaza se o lead existe).

**Auth:** Público · **Rate limit:** 3/15min por e-mail+IP

## Request

```json
{ "email": "maria@exemplo.com" }
```

## Response 200

```json
{ "ok": true }
```

---

# GET /api/admin/leads

Lista leads comerciais com filtro por status (PLAN-064).

**Auth:** Super Admin (não-super → 403)

## Query

`?status=NOVO` (opcional: `NOVO | EMAIL_CONFIRMADO | EM_ONBOARDING | CONVERTIDO | DESCARTADO`)

## Response 200

```json
[ { "id": "...", "nomeResponsavel": "...", "empresa": "...", "email": "...", "telefone": "...", "origem": "Site", "status": "NOVO", "createdAt": "..." } ]
```

---

# POST /api/admin/leads/{id}/onboarding

Marca o lead como **EM_ONBOARDING** (PLAN-064, LD-10).

**Auth:** Super Admin

## Response 200

```json
{ "id": "...", "status": "EM_ONBOARDING" }
```

## Possíveis Erros

| Código | HTTP |
|--------|------|
| LEAD_NOT_FOUND | 404 |
| LEAD_STATUS_INVALIDO | 422 (convertido/descartado) |
| FORBIDDEN | 403 |

---

# POST /api/admin/leads/{id}/converter

Converte o lead (PLAN-064, LD-11): cria **Empresa + Administrador** (convite por e-mail) e registra auditoria (quem/quando). Só com e-mail confirmado (EMAIL_CONFIRMADO/EM_ONBOARDING).

**Auth:** Super Admin

## Response 200

```json
{ "ok": true, "lead": { "id": "...", "status": "CONVERTIDO", "convertidoEmpresaId": "...", "convertidoPor": "...", "convertidoEm": "..." }, "empresaId": "..." }
```

## Possíveis Erros

| Código | HTTP |
|--------|------|
| LEAD_NOT_FOUND | 404 |
| LEAD_STATUS_INVALIDO | 422 |
| EMAIL_DUPLICATED | 409 |
| FORBIDDEN | 403 |

---

# POST /api/admin/leads/{id}/descartar

Descarta o lead (PLAN-064, LD-12): status **DESCARTADO** + **LGPD** (dados pessoais anonimizados — e-mail vira marcador `descartado-<id>@descartado.local`, nome/telefone removidos) + motivo.

**Auth:** Super Admin

## Request

```json
{ "motivo": "Fora do perfil" }
```

## Response 200

```json
{ "id": "...", "status": "DESCARTADO", "email": "descartado-...@descartado.local", "descarteMotivo": "Fora do perfil" }
```

## Possíveis Erros

| Código | HTTP |
|--------|------|
| LEAD_NOT_FOUND | 404 |
| LEAD_STATUS_INVALIDO | 422 (convertido) |
| VALIDATION_ERROR | 422 (sem motivo) |
| FORBIDDEN | 403 |
