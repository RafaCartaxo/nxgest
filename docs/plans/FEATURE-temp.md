> **Status: Concluído (implementado no `PagamentoModal`).** Prévia em tempo real da distribuição do pagamento entre as parcelas (quitação/parcial/saldo excedente) antes de confirmar — `pagamento.preview`, `parcelaParcial`, `saldoExcedente`, `infoPrevia`. Sem mudança de regra de negócio.

História de Usuário

Como operador, quero visualizar em tempo real como o valor informado será distribuído entre as parcelas antes de confirmar o pagamento, para evitar erros e ter segurança sobre o resultado da operação.

Objetivo

Ao digitar o valor do pagamento, o sistema deverá exibir uma prévia da distribuição, utilizando exatamente as mesmas regras de negócio do backend.

A confirmação do pagamento não deverá alterar o comportamento atual, apenas tornar o resultado previsível para o operador.

Requisitos
1. Atualização em tempo real

Sempre que o campo Valor Recebido for alterado, a prévia deverá ser recalculada automaticamente.

A atualização deverá ocorrer sem necessidade de confirmar o pagamento.

2. Resumo da operação

Abaixo do campo de valor deverá existir uma seção denominada:

Prévia do Pagamento

Exemplo:

Pagamento: R$ 180,00

────────────────────

✓ Parcela 01 será quitada.

◐ Parcela 02 ficará com saldo restante de R$ 20,00.

Outro exemplo:

Pagamento: R$ 320,00

────────────────────

✓ Parcela 01 será quitada.

✓ Parcela 02 será quitada.

✓ Parcela 03 será quitada.

Saldo excedente: R$ 20,00

Caso o valor seja insuficiente:

Pagamento: R$ 40,00

────────────────────

◐ Parcela 01 ficará com saldo restante de R$ 60,00.
3. Consistência

A prévia deverá utilizar exatamente a mesma lógica utilizada pelo backend para registrar pagamentos.

Não será permitido duplicar regras de distribuição no frontend.

Caso exista um endpoint específico de prévia, ele deverá ser utilizado.

Caso ainda não exista, ele poderá ser criado reutilizando a lógica do Caso de Uso de pagamento.

4. Feedback visual

Cada parcela deverá possuir um indicador visual.

✓ Quitada

◐ Parcial

○ Não afetada

Não será necessário utilizar animações.

A interface deverá permanecer limpa e discreta.

5. Performance

A atualização deverá ocorrer praticamente em tempo real durante a digitação.

Não deverá haver atrasos perceptíveis para o operador.

6. Não alterar comportamento existente

Esta melhoria possui caráter exclusivamente visual.

Nenhuma regra de negócio deverá ser modificada.

Nenhum cálculo financeiro deverá ser alterado.

O fluxo atual de confirmação do pagamento deverá permanecer exatamente igual.

Critérios de Aceitação
Ao alterar o valor do pagamento, a prévia é atualizada automaticamente.
O operador consegue identificar quais parcelas serão quitadas.
O operador consegue identificar quando uma parcela ficará parcial.
O operador consegue visualizar eventual saldo excedente.
A distribuição apresentada corresponde exatamente ao resultado obtido após confirmar o pagamento.
Nenhuma regra financeira existente é alterada.
Observação de UX

A seção Prévia do Pagamento deve ser tratada como um apoio à decisão, e não como o foco principal da tela.

Ela deve permanecer visualmente discreta, porém suficientemente clara para que o operador compreenda o resultado antes de confirmar a operação.

Observação:
No estado inicial (antes de digitar qualquer valor), não mostrar a prévia.

Em vez disso, exibir apenas uma mensagem sutil:

Informe um valor para visualizar como o pagamento será distribuído.

Assim evitamos poluir a interface. A prévia só aparece quando realmente faz sentido, mantendo a tela limpa e guiando o operador de forma natural. Esse tipo de detalhe faz muita diferença na sensação de qualidade do sistema, sem aumentar a complexidade da implementação.