# PROJECT

**Status:** Aprovado

**Versão:** 1.2

**Última atualização:** 28/08/2026

---

# Objetivo

Desenvolver uma **plataforma modular de gestão operacional** (NX Gest) cujo primeiro vertical é o **crédito em campo**: permitir controlar clientes, contratos, parcelas, pagamentos, gastos e caixa de forma simples, rápida e confiável — com a arquitetura pronta para plugar novos segmentos por módulos (ADR-007).

A plataforma deve centralizar a operação diária, reduzindo controles paralelos e fornecendo informações consistentes para acompanhamento financeiro e tomada de decisão.

---

# Visão do Produto

O produto foi concebido como **plataforma whitelabel multi-tenant**. O primeiro vertical atende operações de crediário com cobranças recorrentes, nas quais o operador realiza visitas presenciais aos clientes para registrar pagamentos, acompanhar contratos e controlar o fluxo financeiro da operação.

A plataforma prioriza velocidade, simplicidade e rastreabilidade, permitindo que todas as movimentações financeiras possam ser consultadas e auditadas a qualquer momento.

---

# Público-Alvo

A plataforma destina-se a empresas que operam negócios de gestão operacional em campo; o vertical atual atende operadores responsáveis pela gestão de clientes e cobranças em campo.

Inicialmente, o projeto será utilizado por uma empresa com poucos usuários, porém sua arquitetura deverá permitir evolução futura para múltiplas empresas e segmentos sem necessidade de reestruturação significativa.

---

# Escopo

O escopo de **módulos** é a **fonte executável**: o **Module Manifest** (`src/modules/admin/domain/modules.ts` + espelho frontend, validado por `npm run audit:modules`) — ver `08-UC-MODULOS.md` e ADR-007.

O primeiro vertical ("Crédito em campo") contempla: clientes, contratos, parcelas, pagamentos, caixa e gastos — com cobranças/rota/atendidos e os módulos de plataforma (central, auth, admin).

Cada módulo deverá atuar de forma integrada, preservando a separação de responsabilidades definida pela arquitetura do projeto.

---

# Funcionalidades Principais

O sistema deverá permitir:

* Cadastro e manutenção de clientes;
* Cadastro e gerenciamento de contratos;
* Cálculo automático de juros;
* Geração automática de parcelas;
* Registro de pagamentos integrais e parciais;
* Controle automático do saldo devedor;
* Controle operacional do Caixa Base;
* Registro e categorização de gastos;
* Consolidação automática de indicadores financeiros;
* Visualização de clientes em mapa;
* Consulta completa do histórico financeiro da operação.

---

# Princípios do Produto

O desenvolvimento do sistema deverá respeitar os seguintes princípios:

* Simplicidade operacional;
* Mínima interação do usuário;
* Consistência das informações;
* Rastreabilidade completa das movimentações;
* Evolução incremental;
* Facilidade de manutenção.

---

# Fora do Escopo

## Nível 0 — Plataforma

Não fazem parte do objetivo desta plataforma:

* ERP;
* Sistema contábil;
* Emissão de notas fiscais;
* Controle de estoque;
* Gestão financeira empresarial;
* CRM completo;
* Gestão bancária;
* Finanças pessoais / evolução pessoal (B2C — fora da Visão; ADR-007).

## Nível 1 — Vertical "Crédito em campo"

O vertical herda os limites da plataforma e o escopo do domínio (`01-DOMAIN.md` / `02-BUSINESS-RULES.md`).

---

# Premissas

* O sistema deverá operar inicialmente em ambiente local.
* Toda regra de negócio será implementada no backend.
* O frontend será responsável apenas pela apresentação e interação com o usuário.
* Toda movimentação financeira deverá possuir rastreabilidade.
* A documentação oficial será a fonte única de verdade para decisões de negócio e arquitetura.

---

# Critérios de Sucesso

O projeto será considerado bem-sucedido quando permitir que toda a rotina operacional de cobrança seja executada exclusivamente através do sistema, sem dependência de controles externos.

Além disso, o sistema deverá garantir que qualquer indicador financeiro apresentado possa ser rastreado até sua origem.

---

# Referências

* NORTH-STAR.md
* DOMAIN.md
* BUSINESS-RULES.md
* ARCHITECTURE.md
* CONVENTIONS.md
* UX.md
* ADR-001
* ADR-002
