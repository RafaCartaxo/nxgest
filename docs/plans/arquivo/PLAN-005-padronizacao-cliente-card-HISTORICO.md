# PLAN-005 — Padronização da Apresentação de Cliente

> **ARQUIVADO (histórico).** Duplicata da versão canônica `docs/plans/PLAN-005-cliente-card.md` (cliente-card + componente compartilhado), que foi a implementada (Concluído). Este arquivo é mantido como registro da proposta original ("Padronização da Apresentação de Cliente", status Planejado) — não é referência ativa.

**Status:** Planejado (arquivado)

---

# Objetivo

Padronizar a apresentação das informações cadastrais do Cliente utilizando os componentes do Design System já existentes.

Esta implementação elimina duplicação de markup, melhora a consistência visual e mantém a separação de responsabilidades entre layout e conteúdo.

Nenhuma regra de negócio será alterada.

---

# Motivação

Atualmente existem diferentes implementações exibindo informações cadastrais do Cliente.

Embora visualmente semelhantes, elas repetem estrutura HTML, estilos e formatação de dados.

Além disso, parte da interface utiliza corretamente o componente `Card`, enquanto outras ainda utilizam markup inline.

A proposta desta implementação é reutilizar o `Card` existente e extrair apenas os conteúdos específicos do Cliente.

---

# Escopo

## Inclui

- Padronizar a apresentação das informações cadastrais do Cliente;
- Eliminar markup duplicado;
- Padronizar o uso de `Card.Root`;
- Criar componentes específicos para exibição resumida e detalhada do Cliente;
- Padronizar o card de Contratos da tela de Cliente.

---

## Não inclui

- Informações financeiras;
- Parcelas;
- Situação operacional;
- Dashboard;
- Central de Operações;
- Rota de Cobrança;
- ContratoList.

Esses módulos pertencem a outros contextos do sistema.

---

# Diagnóstico

## Módulo Cliente

| Arquivo | Situação |
|----------|----------|
| ClienteList.tsx | Exibe dados resumidos do cliente |
| ClienteInfo.tsx | Exibe dados completos do cliente |
| SaldoInfo.tsx | Exibe informações financeiras |
| ClienteDetail.tsx | Possui card de contratos utilizando markup inline |

---

## Outros módulos

Os seguintes módulos exibem apenas o nome do cliente dentro de outro contexto de negócio.

Eles não deverão utilizar os componentes desta implementação.

- ContratoList
- CobrancaList
- RotaPage

---

# Arquitetura

A implementação seguirá composição.

O componente `Card` continuará sendo o responsável pelo layout.

Os novos componentes serão responsáveis apenas pelo conteúdo.

```
Card.Root
│
├── ClienteSummary
└── ClienteDetails
```

Não será criado um novo componente `ClienteCard`, evitando duplicação de responsabilidades.

---

# Organização

```
modules/

cliente/

components/

ClienteSummary.tsx

ClienteDetails.tsx

helpers/

formatClienteEndereco.ts

index.ts
```

---

# Componentes

## ClienteSummary

Responsável pela visualização resumida.

Conteúdo:

- Nome
- Comércio
- Telefone
- Cidade

Utilização:

- ClienteList

Exemplo:

```tsx
<Card.Root variant="list-item" as="link" to={...}>
    <ClienteSummary cliente={cliente} />
</Card.Root>
```

---

## ClienteDetails

Responsável pela visualização detalhada.

Conteúdo:

- Comércio
- CPF
- Telefone
- Endereço

Utilização:

- ClienteDetail

Exemplo:

```tsx
<Card.Root variant="detail">
    <Card.Header>
        <Card.Title>
            Dados do Cliente
        </Card.Title>
    </Card.Header>

    <Card.Body>
        <ClienteDetails cliente={cliente} />
    </Card.Body>
</Card.Root>
```

---

# Helpers

Funções relacionadas exclusivamente à apresentação do Cliente deverão permanecer dentro do módulo.

Exemplo:

```
helpers/

formatClienteEndereco.ts
```

Não deverão existir helpers específicos do Cliente em `shared`, salvo quando reutilizados por múltiplos módulos.

---

# Plano de Implementação

## Etapa 1

Criar:

- ClienteSummary.tsx
- ClienteDetails.tsx
- helper formatClienteEndereco.ts

Nenhum consumidor será alterado nesta etapa.

---

## Etapa 2

Atualizar ClienteList.

Antes:

Markup inline.

Depois:

```tsx
<Card.Root variant="list-item" as="link" to={...}>
    <ClienteSummary cliente={cliente} />
</Card.Root>
```

---

## Etapa 3

Atualizar ClienteDetail.

Substituir `ClienteInfo` por:

```tsx
<Card.Root variant="detail">
    <Card.Header>
        <Card.Title>
            Dados do Cliente
        </Card.Title>
    </Card.Header>

    <Card.Body>
        <ClienteDetails cliente={cliente} />
    </Card.Body>
</Card.Root>
```

Caso `ClienteInfo` deixe de possuir responsabilidade própria, ele deverá ser removido.

---

## Etapa 4

Atualizar o card de Contratos.

Substituir o markup inline por:

```tsx
<Card.Root variant="detail">
```

Mantendo exatamente o mesmo conteúdo e comportamento.

---

## Etapa 5

Remover imports não utilizados.

---

## Etapa 6

Executar validações.

- TypeScript
- Build
- Revisão visual

---

# Critérios de Conclusão

A implementação será considerada concluída quando:

- não existir markup duplicado para apresentação do Cliente;
- ClienteSummary representar exclusivamente a visualização resumida;
- ClienteDetails representar exclusivamente a visualização detalhada;
- todos os cards utilizarem `Card.Root`;
- ClienteInfo for removido caso se torne apenas um wrapper;
- nenhuma informação financeira fizer parte desses componentes.

---

# Benefícios

- redução de duplicação;
- padronização visual;
- componentes menores;
- responsabilidades bem definidas;
- maior facilidade de manutenção;
- reutilização do Design System existente.

---

# Restrições

Esta implementação não deverá:

- alterar regras de negócio;
- alterar APIs;
- alterar entidades;
- alterar comportamento financeiro;
- alterar módulos operacionais.

Seu objetivo é exclusivamente padronizar a camada de apresentação.


----


Esse plano deixa de ser "ClienteCard" e passa a ser uma iniciativa maior de padronização.

Depois dele, vocês podem seguir exatamente a mesma filosofia para:

ContratoSummary
ParcelaSummary
PagamentoSummary
GastoSummary