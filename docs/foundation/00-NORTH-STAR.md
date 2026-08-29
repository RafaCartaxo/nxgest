# NORTH STAR

**Status:** Aprovado

**Versão:** 1.1

**Última atualização:** 28/08/2026

---

# Objetivo

Construir uma **plataforma modular de gestão operacional** que seja simples de utilizar, fácil de manter e preparada para evoluir continuamente, priorizando sempre a experiência do usuário e a consistência dos dados.

---

# Missão

**Nível 0 — Plataforma (NX Gest):** permitir que qualquer negócio operacional seja plugado por **módulos** (whitelabel multi-tenant) — o primeiro vertical é o crédito em campo; outros segmentos entram sem reescrever a base (ADR-007).

**Nível 1 — Vertical "Crédito em campo":** permitir que um operador realize toda a rotina de cobrança em campo com o menor número possível de interações, mantendo controle total sobre clientes, contratos, pagamentos e caixa.

---

# Visão

Ser uma **plataforma** confiável, intuitiva e de baixa complexidade operacional, capaz de crescer junto com novos segmentos sem exigir reestruturações frequentes.

---

# Valores

- Simplicidade acima de complexidade.
- Legibilidade acima de soluções "inteligentes".
- Manutenibilidade acima de otimizações prematuras.
- Consistência dos dados acima de conveniência.
- Evolução contínua acima de grandes reescritas.

---

# Princípios

## Simplicidade

Sempre que existirem duas soluções tecnicamente corretas, será escolhida a mais simples.

---

## Clareza

O sistema deve ser facilmente compreendido tanto pelo usuário quanto pelo desenvolvedor.

---

## Mínima interação

O operador deve realizar qualquer tarefa utilizando o menor número possível de ações.

---

## Consistência

Toda informação deve possuir apenas uma fonte oficial.

Não devem existir regras duplicadas ou contraditórias.

---

## Evolução

A arquitetura deve permitir crescimento sem necessidade de reescrever funcionalidades existentes.

---

## Responsabilidade Única

Cada módulo deve possuir apenas uma responsabilidade principal.

---

# Prioridades Técnicas

As decisões do projeto seguirão sempre esta ordem:

1. Funcionalidade
2. Legibilidade
3. Manutenibilidade
4. Escalabilidade
5. Performance

Performance somente será otimizada quando houver necessidade comprovada.

---

# Experiência do Usuário

A interface deve auxiliar o operador.

Nunca exigir que ele memorize fluxos.

As informações mais importantes devem estar visíveis.

A navegação deve ser objetiva.

O sistema deve reduzir esforço operacional.

---

# O que este sistema é

## Nível 0 — Plataforma (NX Gest)

- Uma **plataforma modular de gestão operacional** (whitelabel multi-tenant), escopada por **capacidades**, não por domínio.
- Um **hub** que conecta o negócio (hoje, crédito em campo) a clientes, contratos e caixa — e cresce com novos segmentos (ADR-007).

## Nível 1 — Vertical "Crédito em campo"

- Um sistema de gestão de cobranças em campo.
- Um sistema de acompanhamento de contratos.
- Um sistema de controle operacional.
- Um sistema de apoio à tomada de decisão diária.

### Regra de fronteira

Toda demanda mapeia para um **módulo existente** ou justifica um **módulo novo** no Module Manifest. O que não mapeia é item de `BACKLOG.md`. Critérios de admissão de vertical: ver **ADR-007**.

---

# O que este sistema não é

## Nível 0 — Plataforma

- ERP
- Sistema contábil
- Sistema financeiro completo
- Marketplace
- CRM completo
- **Finanças pessoais / evolução pessoal** (B2C sem empresa — fora da Visão; custo de tenancy declarado no ADR-007)

## Nível 1 — Vertical "Crédito em campo"

O vertical herda os "não é" da plataforma e o escopo do domínio (`01-DOMAIN.md` / `02-BUSINESS-RULES.md`) — sem "não é" próprio adicional.

Novas funcionalidades deverão respeitar este escopo.

---

# Desenvolvimento

Toda implementação deverá respeitar:

- Arquitetura definida.
- Regras de negócio documentadas.
- ADRs existentes.
- Documentação oficial.

Nenhuma implementação deve criar exceções arquiteturais sem aprovação.

---

# Regra de Ouro

O operador deve gastar seu tempo cobrando clientes, e não aprendendo a utilizar o sistema.

Toda decisão deve contribuir para tornar o sistema mais simples, previsível e confiável.