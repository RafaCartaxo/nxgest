# PLAN-089 — Cliente: CEP e localização aproximada

**Status:** Implementado; QA histórico MEL-0001 aprovado; validação integrada atual pendente
**Origem:** MEL-0001 — Cliente CEP
**Objetivo:** consultar CEP nos endereços pessoal e comercial, preencher os dados disponíveis e, quando possível, oferecer localização aproximada sem confundi-la com GPS manual.

## Regras que não podem mudar

- CEP é opcional; salvar sem CEP continua permitido.
- Número e complemento nunca são sobrescritos pela consulta.
- GPS capturado manualmente é exato, tem prioridade e não é substituído pelo CEP.
- Localização derivada do CEP é aproximada e deve ser identificada como tal.
- Alterar CEP ou texto relevante invalida apenas a localização aproximada daquele bloco; alterar só o número preserva as coordenadas conforme a regra atual.
- Navegação segue comércio → endereço pessoal e, dentro do bloco, GPS manual → CEP aproximado → texto.
- Consulta inválida, inexistente ou indisponível permite corrigir ou salvar sem CEP, sem apagar os demais dados manuais.

## Sequência de implementação

### 1. Contrato e persistência

- Adicionar `cep` e `comercio_cep` no banco com migração não destrutiva.
- Propagar `cep` em `Address`, entidade, schemas de create/update, casos de uso e repositório.
- Expor os campos como `endereco.cep` e `enderecoComercio.cep` na API.
- Definir e persistir a origem das coordenadas (`gps` ou `cep_aproximado`) sem misturar os blocos.

### 2. Serviços de consulta

- Criar adapter de CEP com normalização para oito dígitos, timeout e mensagens classificadas (inválido, não encontrado, indisponível).
- Executar consulta somente com oito dígitos, com debounce e proteção contra resposta obsoleta.
- Manter geocoding como etapa separada e substituível; falha de geocoding não impede salvar o endereço.

### 3. Formulário

- Incluir CEP mascarado `00000-000` nos dois blocos.
- Preencher apenas logradouro, bairro, cidade e UF retornados.
- Preservar número, complemento e texto manual não retornado.
- Evoluir o estado do `GpsControl` para exibir `GPS` e `CEP aprox.` separadamente, inclusive ao editar um cliente.
- Ao alterar/limpar CEP, invalidar somente a localização aproximada derivada daquele CEP; GPS manual permanece.
- Implementar a confirmação “Corrigir”/“Salvar sem CEP” para falhas de consulta.

### 4. Navegação e regressão

- Ajustar o alvo navegável para considerar a origem, mantendo a prioridade existente.
- Garantir que o botão não apareça sem alvo utilizável.
- Preservar captura manual, invalidação por edição de texto e foco/teclado do formulário.

### 5. Verificação e documentação

- Testes unitários para máscara, adapter, debounce, resposta obsoleta, origem e prioridade.
- Testes de formulário/API para os CTs da MEL-0001.
- Atualizar `docs/engineering/02-API.md`, casos de uso e coleção/smoke quando aplicável.
- Executar `npm test`, `npm run build`, `npm run docs:audit`, `npm run audit:ui` e `npm run audit:styles`.

## Critérios de saída DEV

- API e banco aceitam, retornam e persistem os dois CEPs.
- Todos os CTs da MEL-0001 estão executáveis e a origem da localização é visível corretamente.
- Nenhuma regra vigente de GPS, navegação ou salvamento sem endereço/CEP foi alterada.
- Gates do repositório verdes e documentação sincronizada.

## Dependências e riscos

- Definir provedor de CEP e estratégia de geocoding antes do código de integração.
- Respeitar CSP, limites e política do provedor externo; se necessário, usar gateway backend.
- Não permitir que respostas tardias de uma consulta sobrescrevam o CEP atualmente digitado.

**Referências:** MEL-0001 — Cliente CEP (registro de QA no Operating Vault, arquivo `05 Arquivo/Nxgest/Melhorias/MEL-0001/QA/MEL-0001 Cliente CEP/04 - Validação dev.md`), `frontend/src/modules/cliente/components/ClienteForm.tsx`, `frontend/src/shared/geo/hooks.ts`, `frontend/src/shared/geo/alvo.ts`.
