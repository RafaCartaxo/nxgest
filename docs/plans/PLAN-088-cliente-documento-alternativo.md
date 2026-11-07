# PLAN-088 — Cliente: documento alternativo

**Status:** Implementado; QA histórico MEL-0002 aprovado; validação integrada atual pendente
**Origem:** MEL-0002 do vault
**Escopo:** permitir registrar `documento` (RG ou outro identificador) abaixo do CPF no cadastro de cliente.

## Objetivo

Adicionar o campo opcional `documento` à criação e edição de clientes, preservando integralmente as regras atuais do CPF.

## Regras

- CPF e Documento podem ficar vazios ao mesmo tempo.
- CPF informado continua sujeito à validação e deduplicação atuais.
- Documento é texto livre, sem máscara, sem validação de RG e sem unicidade.
- Limite de 20 caracteres.
- Espaços nas extremidades são removidos; valor vazio é persistido como `null`.

## Implementação prevista

1. Criar migração não destrutiva para `clientes.documento`.
2. Propagar o campo na entidade, casos de uso, portas/repositórios e controllers.
3. Atualizar contratos/documentação da API.
4. Adicionar o campo abaixo de CPF nos formulários de criação e edição.
5. Pré-preencher, alterar e remover o valor na edição.
6. Atualizar traduções nos idiomas suportados.
7. Atualizar testes automatizados e executar os gates do repositório.

## Fora de escopo

- validação de formato de RG;
- busca, filtro ou deduplicação por Documento;
- busca, filtro ou exibição em cards/listas;
- alteração das regras de CPF, CEP ou endereço.

## Verificação

Os CTs da MEL-0002 são a fonte única de aceite: CT-001 a CT-008. Validar API, persistência, formulários e regressão de clientes existentes.

**Referência:** MEL-0002 — Cliente Documento (registro de QA no Operating Vault, arquivo `05 Arquivo/Nxgest/Melhorias/MEL-0002/QA/MEL-0002 Cliente Documento/04 - Validação dev.md`)
