# Agentes do NX Gest

Índice dos contratos de agentes de IA do NX Gest. Esta pasta é a **fonte canônica** — independente de plataforma (não depende de OpenCode, Claude Code, Codex ou qualquer outra ferramenta). O contrato global do projeto é [`AGENTS.md`](../AGENTS.md), na raiz; cada agente abaixo documenta apenas o seu próprio escopo.

## Contratos

| Agente | Papel |
|---|---|
| [`docs-sync.md`](./docs-sync.md) | Audita e sincroniza a documentação do projeto com o código |
| [`ops-runner.md`](./ops-runner.md) | Operações de produção (deploy, backup, health check, logs) |
| [`product-planner.md`](./product-planner.md) | Planejamento de features e planos de implementação |
| [`qa-reviewer.md`](./qa-reviewer.md) | Revisão de qualidade, código e casos de teste |

## Como usar

- Qualquer agente de IA (humano orquestrando ou ferramenta) pode ler estes arquivos diretamente — são Markdown puro, sem metadados específicos de plataforma.
- Adaptadores específicos de uma plataforma (ex.: um agente registrado no OpenCode, no Claude Code ou em outra ferramenta) ficam **fora deste repositório** ou em integrações separadas; eles devem apontar para o contrato aqui e nunca duplicar as regras.
- Cada contrato segue a mesma estrutura: Identidade, Responsabilidade, Entradas, Saídas, Limites, Regras de segurança, Protocolo de comunicação, Critérios de conclusão.
- Nenhum contrato aqui duplica o conteúdo de `AGENTS.md` (contexto geral do projeto, produção, comandos) — todos remetem a ele.

## Regras gerais

- `AGENTS.md`, na raiz, é o contrato global; todos os agentes herdam suas regras de segurança.
- Nenhum agente versiona ou expõe segredos (`.env`, tokens, credenciais).
- Mudanças nos contratos seguem o mesmo processo QA/DEV do restante do projeto.
