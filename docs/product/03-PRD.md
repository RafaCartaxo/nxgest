# PRD

**Status:** Aprovado

**Versão:** 1.1

**Última atualização:** 28/08/2026

---

# Objetivo

**Plataforma modular de gestão operacional (NX Gest)** cujo primeiro vertical é o **crédito em campo** — operações de crediário com cobranças recorrentes, permitindo controle completo de clientes, contratos, parcelas, pagamentos, gastos e caixa (escopo de módulos = Module Manifest — ADR-007).

---

# Público-Alvo

Operadores autenticados responsáveis pela gestão de clientes e cobranças em campo, com uso predominante em dispositivo móvel. O sistema suporta múltiplos operadores com isolamento de dados e um perfil de administrador para gestão centralizada.

---

# Funcionalidades

- Cadastro e manutenção de clientes
- Gerenciamento de contratos com cálculo automático de juros
- Geração automática de parcelas
- Registro de pagamentos integrais e parciais
- Controle de caixa e gastos
- Dashboard com indicadores financeiros
- Visualização de clientes em mapa
- Autenticação multi-usuário com JWT
- Painel de administração com gestão de operadores

---

# Critérios de Sucesso

- Operador consegue executar toda a rotina diária exclusivamente pelo sistema
- Qualquer indicador financeiro pode ser rastreado até sua origem
- Registro de pagamento em até 10 segundos

---

# Referências

- NORTH-STAR.md
- PROJECT.md
- BUSINESS-RULES.md
- 04-ROADMAP.md
