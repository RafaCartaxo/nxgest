# API

**Status:** Em construção — módulos Cliente, Contrato, Pagamento, Operações, Caixa e Gasto documentados; módulos Auth e Admin documentados; módulo Multi-Tenant (Empresas) implementado (PLAN-019); drill-down Admin → Operador implementado (PLAN-020)

**Versão:** 1.3

**Última atualização:** 31/07/2026

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
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z"
}
```

---

# PATCH /api/clientes/{id}

Atualiza parcialmente um cliente.

Todos os campos são opcionais.

Somente os campos enviados deverão ser alterados.

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

---

# Módulo Operações

## Endpoints

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| GET | `/api/operacoes/cobrancas` | Listar cobranças do dia |
| GET | `/api/operacoes/pagamentos-hoje` | Listar pagamentos do dia |
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
        "clientesParaCobrar": 8
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
        ]
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
| POST | `/api/caixa/liquidar` | Fechar semana |

> **Escopo por usuário (PLAN-020):** `GET /api/caixa`, `POST /api/caixa/ajuste` e `GET /api/caixa/movimentacoes` aceitam o query parameter `usuarioId`, que aponta o caixa-alvo:
> - **operator:** ignora `usuarioId` — opera sempre sobre o caixa próprio (`req.userId`).
> - **admin:** valida que `usuarioId` pertence à própria empresa (via `empresaId` do token); inexistente/outra empresa → `404 OPERATOR_NOT_FOUND`.
> - **super_admin:** valida apenas a existência do usuário; pode apontar caixa de qualquer empresa.
> - `POST /api/caixa/ajuste` com `role = operator` → `403 FORBIDDEN` (BR-079).
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

Ajusta o Caixa Total para um novo valor (BR-018). O ajuste **não** gera movimentação financeira — a base é o registro (PLAN-020, correção de dobra no saldo/lucro).

## Request

```json
{
    "valor": 22000.00
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
| VALIDATION_ERROR | 422 |

---

# GET /api/auth/me

Retorna os dados do operador autenticado.

**Auth:** Sim (Bearer token)

## Response 200

```json
{
    "id": "a1b2c3d4-...",
    "nome": "Admin",
    "email": "admin@cobranca.com",
    "role": "admin",
    "empresaId": null,
    "empresaNome": null
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
| POST | `/api/admin/empresas` | Super Admin | Criar nova empresa com admin |

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
        "createdAt": "2026-07-31T10:00:00.000Z",
        "totalOperadores": 3
    }
]
```

## Possíveis Erros

| Código | HTTP |
|---------|------|
| FORBIDDEN | 403 |

---

# POST /api/admin/empresas

Cria uma nova empresa e o administrador inicial vinculado a ela (transação atômica).

**Auth:** Super Admin (`role = 'super_admin'`)

## Request

```json
{
    "nome": "Empresa Exemplo",
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

## Response 201

```json
{
    "empresa": {
        "id": "a1b2c3d4-...",
        "nome": "Empresa Exemplo",
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
| VALIDATION_ERROR | 422 |

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
| DELETE | `/api/admin/operadores/:id` | Admin / Super Admin | Remover operador (soft-delete) |
| GET | `/api/admin/dashboard` | Admin / Super Admin | KPIs consolidados (filtrados por empresa) |

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
| BR-079 | Operador não pode ajustar o Caixa Base próprio (403) |
| BR-080 | Admin visualiza os KPIs do caixa de um operador (`GET /api/caixa?usuarioId=`), validado dentro da empresa |