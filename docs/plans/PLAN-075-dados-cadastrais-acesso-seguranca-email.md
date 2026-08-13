# PLAN-075 — Cadastro, perfil, convites e segurança de usuários

**Status:** ⏳ Planejado (versão canônica aprovada — P-1 a P-10 resolvidos; notas de implementação 13/08)  
**Versão:** 1.0  
**Início:** 13/08/2026

> **Canônico:** esta é a versão validada por Rafael (externa, Downloads, 13/08). As **Notas de implementação** ao final cruzam cada decisão com o código do repositório (`nxgest`), fecham os gaps encontrados e incorporam pontos da doc do Auth0 (invite members). Companheiro: [[PLAN-072-identidade-visual-autosservico.md|PLAN-072]].

---

# Objetivo

Estruturar o ciclo completo de vida dos usuários do sistema, separando claramente:

- **Dados pessoais:** informações sobre a pessoa;
- **Conta e acesso:** informações utilizadas para autenticação;
- **Permissões:** informações administrativas que determinam o que o usuário pode fazer;
- **Segurança:** senha, troca de e-mail e mecanismos de verificação;
- **Convite:** mecanismo utilizado para criar e ativar o acesso de uma nova pessoa.

O sistema deve tratar o **e-mail como identidade única de acesso**, garantindo validação de posse em fluxos de troca de endereço e evitando duplicidade tanto no e-mail atual quanto em e-mails pendentes.

O cadastro de um novo usuário deve ocorrer por **convite**. O administrador não define a senha de outra pessoa nem ativa manualmente uma conta convidada.

---

# Princípios

## P1 — Usuário, convite e credencial são conceitos diferentes

A existência de um usuário no banco não significa que sua conta esteja ativa.

O ciclo é:

```text
CONVITE
   ↓
USUÁRIO CONVIDADO
   ↓
ACEITA CONVITE
   ↓
DEFINE PRÓPRIA SENHA
   ↓
USUÁRIO ATIVO
```

O convite possui seu próprio ciclo de vida e pode expirar, ser revogado ou ser substituído por um novo convite.

---

## P2 — O administrador define o contexto administrativo

Quem possui permissão para convidar um usuário pode definir:

- nome inicial;
- telefone inicial;
- e-mail;
- foto inicial, quando aplicável;
- role/perfil;
- responsável/superior (`chefe_id`);
- empresa/contexto ao qual o usuário pertence.

Essas informações administrativas não devem ser confundidas com as credenciais do usuário.

---

## P3 — O usuário controla seus próprios dados pessoais

O usuário ativo pode alterar:

- nome;
- telefone;
- foto;
- senha;
- e-mail, mediante fluxo específico de segurança.

O usuário não pode alterar por conta própria:

- role;
- responsável/superior;
- empresa;
- status administrativo da conta.

---

## P4 — O usuário cria sua própria credencial

O administrador **não informa nem define a senha de outro usuário**.

Ao aceitar o convite, o usuário deve:

1. confirmar a posse do endereço de e-mail através do convite;
2. definir sua própria senha;
3. concluir a ativação da conta.

---

# Modelo conceitual do usuário

As informações do usuário devem ser organizadas em quatro grupos.

## 1. Dados pessoais

Informações que representam a pessoa:

- Nome;
- Telefone;
- Foto.

## 2. Conta e acesso

Informações relacionadas à conta:

- E-mail;
- Status da conta;
- Data de criação;
- Estado de verificação do e-mail.

## 3. Permissões

Informações administrativas:

- Role/perfil;
- Responsável/superior (`chefe_id`);
- Empresa;
- Escopo de atuação.

## 4. Segurança

Informações e ações relacionadas à proteção da conta:

- Senha;
- Alteração de senha;
- Alteração de e-mail;
- Verificação de novo e-mail.

---

# Ciclo de vida do usuário

## Estados

A conta deve distinguir claramente os estados:

```text
CONVIDADO
   │
   │ convite aceito + senha definida
   ↓
ATIVO
   │
   ├── SUSPENSO
   │
   └── REMOVIDO
```

Apenas o fluxo de ativação pelo próprio usuário pode transformar:

```text
CONVIDADO → ATIVO
```

O administrador não deve ativar uma conta convidada definindo uma senha manualmente.

---

# Convite de usuário

## Criação

O administrador acessa:

> **Usuários → Convidar usuário**

O formulário deve ser dividido em:

### Dados pessoais

- Nome;
- Telefone;
- Foto opcional.

### Acesso

- E-mail.

### Permissões

- Role/perfil;
- Responsável/superior.

O formulário não possui campo de senha.

A ação principal deve ser:

> **Enviar convite**

---

# Fluxo de convite

```text
Administrador
      ↓
Preenche dados do usuário
      ↓
Sistema valida e-mail
      ↓
Cria usuário com status CONVIDADO
      ↓
Cria convite
      ↓
Envia e-mail
      ↓
Usuário acessa o link
      ↓
Sistema valida convite
      ↓
Usuário define senha
      ↓
Usuário é ATIVADO
```

O convite possui validade de **7 dias**.

---

# Estados do convite

O convite deve possuir ciclo próprio:

```text
PENDENTE
   │
   ├── aceito → CONCLUÍDO
   ├── expirado → EXPIRADO
   └── revogado → REVOGADO
```

Ao reenviar um convite:

1. o convite anterior deve ser invalidado;
2. um novo convite deve ser criado;
3. um novo token deve ser enviado;
4. somente o novo link deve permanecer válido.

Nunca devem existir dois convites válidos simultaneamente para o mesmo usuário.

---

# Dados registrados no convite

O domínio deve permitir identificar:

- usuário convidado;
- e-mail para o qual o convite foi enviado;
- usuário que realizou o convite;
- data de criação;
- data de expiração;
- status;
- token.

Essas informações permitem auditoria e controle adequado do ciclo do convite.

---

# Permissões para convidar

A capacidade de convidar usuários deve respeitar o escopo administrativo existente.

## Super/Admin

Pode convidar usuários dentro do escopo permitido pela estrutura administrativa.

## Sócio

Pode convidar usuários apenas dentro da própria subárvore administrativa.

## Operador

Não pode convidar outros usuários.

---

# Permissões de roles

Quem convida não pode atribuir qualquer role arbitrariamente.

O sistema deve validar quais roles podem ser atribuídas pelo role do usuário que está realizando o convite.

Exemplo conceitual:

```text
SUPER
 └── roles permitidas pelo sistema

SÓCIO
 └── roles subordinadas permitidas

OPERADOR
 └── nenhuma
```

A regra deve ser aplicada tanto na criação quanto na edição de usuários.

---

# Perfil do próprio usuário

A página **Meu Perfil** deve ser organizada em:

## Dados pessoais

### Nome

Editável.

### Telefone

Editável e opcional.

### Foto

Editável.

---

## Conta e acesso

### E-mail

Exibido como somente leitura.

Exemplo:

```text
rafael@email.com
✓ E-mail verificado
```

Quando existir uma troca pendente:

```text
rafael@email.com
⚠ Verificação de novo e-mail pendente
```

O novo endereço nunca deve ser exibido desnecessariamente para terceiros.

### Status

Somente leitura.

Exemplos:

- Ativo;
- Suspenso.

### Perfil

Somente leitura.

### Empresa

Somente leitura.

---

# Segurança

## Alteração de senha

O usuário pode alterar sua própria senha através do fluxo existente.

A senha nunca deve ser exibida nem recuperável.

Quando aplicável, a alteração deve exigir a senha atual e respeitar as políticas existentes de segurança.

---

# Alteração de e-mail

A alteração do e-mail não deve ser realizada diretamente no formulário de perfil.

O usuário deve utilizar uma ação específica:

> **Trocar e-mail**

Fluxo:

```text
Usuário informa novo e-mail
        ↓
Informa senha atual
        ↓
Sistema valida senha
        ↓
Sistema verifica duplicidade
        ↓
Grava email_pendente
        ↓
Envia link de verificação
        ↓
Usuário confirma novo endereço
        ↓
email_pendente → email
```

O e-mail atual continua sendo utilizado para login enquanto a troca não for confirmada.

---

# Regras da troca de e-mail

## Senha atual obrigatória

O usuário deve informar a senha atual para iniciar a troca.

## Verificação obrigatória

O novo endereço só passa a ser o e-mail efetivo após confirmação através do link enviado.

## Validade

O token de verificação possui validade de **24 horas**.

## Novo pedido

Se o usuário solicitar outra troca enquanto existir uma pendência:

1. o token anterior deve ser invalidado;
2. o `email_pendente` anterior deve ser substituído;
3. um novo token deve ser criado;
4. somente o último link permanece válido.

## Cancelamento

O usuário deve poder cancelar uma troca de e-mail pendente.

Ao cancelar:

```text
email_pendente = NULL
token = invalidado
```

O e-mail atual permanece inalterado.

## Expiração

Quando o token expirar:

- o e-mail atual continua válido;
- a conta continua funcionando normalmente;
- o novo e-mail não é aplicado;
- a pendência pode ser substituída por uma nova solicitação.

---

# Unicidade de e-mail

O e-mail deve ser único globalmente.

A validação deve considerar:

```text
email atual
+
email_pendente
```

Exemplo:

```text
Usuário A
email = a@email.com
email_pendente = b@email.com
```

Se o Usuário B tentar utilizar:

```text
b@email.com
```

o sistema deve retornar:

```text
409 EMAIL_DUPLICATED
```

Não deve enviar convite, criar pendência ou realizar qualquer alteração.

A validação deve ocorrer antes da escrita no banco.

O `UNIQUE constraint` continua sendo uma proteção adicional, mas não deve ser utilizado como mecanismo principal de tratamento da regra de negócio.

---

# Troca de e-mail realizada por administrador

O comportamento depende do estado atual da conta.

## Usuário convidado

Se o administrador alterar o e-mail de um usuário ainda convidado:

```text
e-mail antigo
      ↓
invalida convite antigo
      ↓
atualiza e-mail
      ↓
gera novo convite
      ↓
envia para novo endereço
```

Não deve existir `email_pendente` nesse caso.

O novo convite é o mecanismo de comprovação da posse do endereço.

---

## Usuário ativo

Se o administrador alterar o e-mail de um usuário ativo:

```text
e-mail atual
      ↓
email_pendente
      ↓
envia verificação
      ↓
usuário confirma
      ↓
novo e-mail passa a ser efetivo
```

O administrador não pode definir a senha do usuário nem ativar/reconfigurar a conta através dessa edição.

---

# Regra importante: administrador não define senha

O formulário administrativo não deve aceitar senha para criação de usuário.

Consequentemente, o cenário:

> "administrador cria usuário convidado e define senha na mesma edição"

deixa de existir.

Isso elimina a ambiguidade entre:

```text
CONVIDADO
```

e

```text
ATIVO
```

A única forma de ativar a conta é o próprio usuário concluir o convite.

---

# Edição administrativa de usuário

O administrador pode editar:

### Dados pessoais

- Nome;
- Telefone;
- Foto.

### Permissões

- Role;
- Responsável/superior.

### Acesso

- E-mail, respeitando as regras de troca descritas acima.

### Controle da conta

- Reenviar convite;
- Revogar convite;
- Suspender usuário;
- Remover usuário, conforme regras existentes.

Não pode:

- definir senha do usuário;
- ativar manualmente usuário convidado.

---

# Revogação de convite

O administrador deve poder revogar um convite pendente.

Após a revogação:

```text
convite → REVOGADO
```

O link deixa de funcionar.

O usuário continua registrado como `CONVIDADO`, porém sem convite válido.

O administrador poderá enviar um novo convite posteriormente.

---

# Reenvio de convite

O reenvio deve:

1. invalidar o convite atual;
2. gerar novo token;
3. atualizar a validade;
4. enviar novo e-mail.

O convite anterior nunca permanece válido.

---

# E-mail de convite

O convite deve informar:

- nome da pessoa convidada;
- nome da empresa;
- quem realizou o convite, quando apropriado;
- instrução para ativação;
- validade do convite;
- botão/link de ativação.

A mensagem deve deixar claro que:

> O usuário deverá criar sua própria senha durante a ativação.

---

# Modelo de dados

## usuarios

Adicionar:

```sql
ALTER TABLE "usuarios"
ADD COLUMN IF NOT EXISTS "telefone" TEXT;

ALTER TABLE "usuarios"
ADD COLUMN IF NOT EXISTS "email_pendente" TEXT;
```

Campos conceituais:

```text
id
nome
email
email_pendente
senha_hash
telefone
foto
role
empresa_id
chefe_id
created_at
deleted_at
```

O status de convidado deve continuar sendo determinado pelo modelo de autenticação existente, evitando criar uma segunda fonte de verdade sem necessidade.

Se o projeto já possuir um mecanismo formal de status, utilizá-lo como fonte oficial.

---

# Token de verificação de e-mail

Adicionar novo tipo:

```text
email
```

Validade:

```text
24 horas
```

O serviço deve permitir invalidação por tipo, seguindo o padrão já utilizado nos convites.

---

# Endpoints

## Perfil

```text
PATCH /me
```

Atualiza:

- nome;
- telefone.

Foto permanece no endpoint existente.

---

## Troca de e-mail

```text
POST /me/email
```

Inicia a troca.

Entrada:

```text
novoEmail
senhaAtual
```

Resultado:

```text
email_pendente = novoEmail
```

e envio do token.

---

## Verificação

```text
POST /me/email/verificar
```

Valida o token e promove:

```text
email_pendente → email
```

---

## Cancelamento

Adicionar:

```text
DELETE /me/email
```

ou equivalente conforme o padrão REST já utilizado no projeto.

Responsabilidade:

- cancelar pendência;
- invalidar token;
- manter e-mail atual.

---

# Frontend — Meu Perfil

Organizar a página em:

## Dados pessoais

- Foto;
- Nome;
- Telefone.

## Conta

- E-mail;
- Status;
- Perfil;
- Empresa.

## Segurança

- Alterar senha;
- Trocar e-mail.

O e-mail atual deve permanecer visualmente separado das informações pessoais para deixar claro que existe um fluxo de segurança próprio.

---

# Frontend — Convidar usuário

O formulário deve possuir:

## Dados pessoais

- Nome;
- Telefone;
- Foto opcional.

## Acesso

- E-mail.

## Permissões

- Perfil;
- Responsável.

### Ação

```text
Enviar convite
```

Não exibir campo de senha.

Exibir uma explicação curta:

> O usuário receberá um convite por e-mail e criará sua própria senha durante a ativação.

---

# Frontend — Usuário convidado

A listagem deve indicar claramente:

```text
Nome
E-mail
Perfil
Responsável
Status: Convite pendente
```

Ações:

- Visualizar;
- Editar;
- Reenviar convite;
- Revogar convite.

Quando o convite estiver expirado:

```text
Status: Convite expirado
```

com ação:

> Reenviar convite

---

# Frontend — Usuário ativo

A listagem deve indicar:

```text
Nome
E-mail
Perfil
Responsável
Status: Ativo
```

Quando houver alteração de e-mail pendente:

```text
⚠ Verificação de e-mail pendente
```

---

# Conversão de lead

Ao converter um lead, os dados declarados devem ser preservados.

Mapeamento:

```text
lead.nomeResponsavel
    → usuarios.nome

lead.telefone
    → usuarios.telefone
    → empresas.telefone_contato

lead.email
    → usuarios.email
    → empresas.email_contato

lead.origem
    → empresas.origem
```

O usuário administrativo criado durante a conversão deve seguir o mesmo modelo de convite.

A conversão não deve criar uma senha automaticamente.

---

# empresas

Adicionar:

```sql
ALTER TABLE "empresas"
ADD COLUMN IF NOT EXISTS "origem" TEXT;

ALTER TABLE "empresas"
ADD COLUMN IF NOT EXISTS "email_contato" TEXT;

ALTER TABLE "empresas"
ADD COLUMN IF NOT EXISTS "telefone_contato" TEXT;
```

Essas colunas devem utilizar o mesmo mecanismo de migração idempotente existente no projeto.

---

# Segurança

As seguintes regras são obrigatórias:

- E-mail atual é único globalmente.
- E-mail pendente também participa da regra de unicidade.
- Nenhuma escrita de e-mail deve depender exclusivamente do erro do banco.
- Duplicidade deve retornar `409 EMAIL_DUPLICATED`.
- Troca de e-mail de conta ativa exige senha atual.
- Novo e-mail exige verificação.
- E-mail antigo permanece válido até a confirmação.
- Convites antigos devem ser invalidados quando um novo convite é emitido.
- Tokens expirados não podem ser utilizados.
- Respostas públicas não devem revelar se determinado e-mail pertence a uma conta.
- Administrador não define senha de terceiros.
- Administrador não ativa manualmente conta convidada.

---

# Casos de teste

## Perfil

- CT-01 Usuário altera nome.
- CT-02 Usuário altera telefone.
- CT-03 Usuário altera foto.
- CT-04 Usuário visualiza role, empresa e status como somente leitura.
- CT-05 Usuário não consegue alterar role.
- CT-06 Usuário não consegue alterar responsável.
- CT-07 Usuário não consegue alterar empresa.

---

## Convite

- CT-08 Administrador convida usuário sem senha.
- CT-09 Usuário criado recebe status `CONVIDADO`.
- CT-10 Convite possui validade de 7 dias.
- CT-11 Usuário aceita convite e define própria senha.
- CT-12 Conta passa de `CONVIDADO` para `ATIVO`.
- CT-13 Administrador não consegue definir senha do convidado.
- CT-14 Administrador não consegue ativar manualmente o convidado.
- CT-15 Convite expirado não pode ser utilizado.
- CT-16 Reenvio invalida convite anterior.
- CT-17 Revogação invalida convite.
- CT-18 Usuário convidado sem convite válido pode receber novo convite.

---

## Permissões

- CT-19 Operador não pode convidar usuário.
- CT-20 Sócio só pode convidar dentro do próprio escopo.
- CT-21 Sócio não consegue atribuir role fora das permitidas.
- CT-22 Usuário não consegue alterar seu próprio role.
- CT-23 Usuário não consegue alterar seu próprio responsável.
- CT-24 Usuário não consegue alterar sua própria empresa.

---

## E-mail

- CT-25 Criar usuário com e-mail existente → `409 EMAIL_DUPLICATED`.
- CT-26 Editar usuário para e-mail existente → `409 EMAIL_DUPLICATED`.
- CT-27 E-mail pendente também bloqueia utilização por outra conta.
- CT-28 Usuário ativo solicita troca com senha incorreta → falha.
- CT-29 Usuário ativo solicita troca para e-mail existente → `409`.
- CT-30 Novo e-mail fica pendente até confirmação.
- CT-31 Login continua utilizando e-mail antigo enquanto pendente.
- CT-32 Token válido confirma novo e-mail.
- CT-33 Token expirado não altera e-mail.
- CT-34 Nova solicitação invalida token anterior.
- CT-35 Usuário cancela troca pendente.
- CT-36 Troca para o próprio e-mail atual não gera alteração desnecessária.
- CT-37 Admin troca e-mail de usuário convidado → novo convite.
- CT-38 Admin troca e-mail de usuário ativo → verificação do novo endereço.
- CT-39 Admin não define senha durante troca de e-mail.

---

## Seed da conversão

- CT-40 Conversão de lead preserva nome.
- CT-41 Conversão preserva telefone.
- CT-42 Telefone alimenta usuário e empresa.
- CT-43 E-mail alimenta usuário e empresa.
- CT-44 Origem é preservada.
- CT-45 Lead sem telefone não quebra conversão.
- CT-46 E-mail já utilizado bloqueia conversão.

---

# Fases

## F1 — Modelo de usuário e dados

- [ ] Revisar modelo de usuário/convidado/ativo.
- [ ] Adicionar `telefone`.
- [ ] Adicionar `email_pendente`.
- [ ] Adicionar campos de contato/origem da empresa.
- [ ] Garantir migração idempotente.
- [ ] Padronizar deduplicação de e-mail.

## F2 — Convites

- [ ] Remover conceito de senha no cadastro administrativo.
- [ ] Padronizar criação como `CONVIDADO`.
- [ ] Implementar ciclo de vida do convite.
- [ ] Implementar revogação.
- [ ] Garantir invalidação no reenvio.
- [ ] Garantir ativação somente pelo próprio usuário.

## F3 — Autosserviço

- [ ] Permitir alteração de nome.
- [ ] Permitir alteração de telefone.
- [ ] Manter alteração de foto.
- [ ] Organizar página de perfil.
- [ ] Separar dados pessoais, conta e segurança.

## F4 — Troca de e-mail

- [ ] Implementar `email_pendente`.
- [ ] Implementar token de e-mail.
- [ ] Implementar solicitação de troca.
- [ ] Exigir senha atual.
- [ ] Implementar confirmação.
- [ ] Implementar cancelamento.
- [ ] Implementar troca administrativa para convidados.
- [ ] Implementar troca administrativa para usuários ativos.

## F5 — Permissões

- [ ] Definir roles permitidas por role do criador.
- [ ] Aplicar escopo existente (`resolveScope`).
- [ ] Garantir que operador não possa convidar.
- [ ] Garantir que usuário não possa alterar suas próprias permissões.

## F6 — UX e e-mails

- [ ] Reorganizar formulários.
- [ ] Criar estado visual de convidado.
- [ ] Criar estado visual de convite expirado.
- [ ] Criar estado visual de verificação de e-mail pendente.
- [ ] Atualizar template de convite.
- [ ] Criar template de verificação de novo e-mail.
- [ ] Revisar pt-BR/en/es.

## F7 — Conversão de lead

- [ ] Preservar telefone.
- [ ] Preservar e-mail de contato da empresa.
- [ ] Preservar telefone de contato da empresa.
- [ ] Preservar origem.
- [ ] Criar usuário seguindo o fluxo de convite.
- [ ] Garantir deduplicação.

---

# Critérios de aceitação

O plano será considerado concluído quando:

- Todo novo usuário administrativo for criado através de convite.
- Usuário convidado não possuir senha definida pelo administrador.
- Apenas o próprio usuário puder definir sua senha durante a ativação.
- Convites possuírem ciclo de vida próprio.
- Convites antigos forem invalidados ao reenviar.
- Convites puderem ser revogados.
- Usuário puder alterar nome, telefone e foto.
- Role, empresa e responsável forem somente leitura para o próprio usuário.
- Alteração de senha possuir fluxo próprio.
- Alteração de e-mail exigir senha atual e confirmação do novo endereço.
- E-mail antigo continuar funcionando até a confirmação.
- E-mail pendente participar da regra de unicidade.
- Nenhum fluxo de e-mail duplicado resultar em erro 500.
- Administrador puder alterar o e-mail de convidado através de novo convite.
- Administrador puder iniciar alteração de e-mail de usuário ativo, mas não definir sua senha.
- Sócios respeitarem o escopo administrativo existente.
- Roles atribuíveis respeitarem a hierarquia de permissões.
- Conversão de lead preservar os dados de contato e origem.
- Perfil, convite e administração apresentarem claramente responsabilidades diferentes.
- Testes automatizados cobrirem os fluxos principais e os casos de segurança.

---

# Pontos deliberadamente fora do escopo

Não fazem parte deste plano:

- SSO;
- 2FA;
- gerenciamento de sessões/dispositivos;
- login social;
- alteração de usuário entre empresas;
- campanhas de e-mail;
- recuperação avançada de conta;
- auditoria completa de ações administrativas.

Esses recursos podem ser tratados em planos específicos posteriormente.

---

# Decisões finais de produto

### P-01 — Origem da empresa

**Decisão:** incluir `empresas.origem`.

Motivo: preservar a origem declarada no lead e permitir análise posterior de aquisição/conversão.

### P-02 — Verificação de novo e-mail

**Decisão:** obrigatória.

Motivo: e-mail é identidade de acesso e a aplicação deve comprovar a posse do novo endereço.

### P-03 — Cancelamento de troca de e-mail

**Decisão:** permitido pelo próprio usuário.

Motivo: o usuário deve poder desistir de uma alteração pendente sem depender de administrador.

### P-04 — Senha no cadastro administrativo

**Decisão:** não existe.

Motivo: o administrador define o contexto administrativo; o usuário define sua própria credencial.

### P-05 — Ativação manual pelo administrador

**Decisão:** não existe.

Motivo: a ativação representa a conclusão do processo pelo proprietário do e-mail.

### P-06 — E-mail de usuário convidado alterado pelo administrador

**Decisão:** invalida o convite anterior e envia novo convite ao novo endereço.

### P-07 — E-mail de usuário ativo alterado pelo administrador

**Decisão:** utiliza `email_pendente` e exige confirmação do novo endereço pelo usuário.

### P-08 — Permissões

**Decisão:** quem convida só pode atribuir roles permitidas pelo próprio nível administrativo e pelo escopo existente.

### P-09 — Telefone

**Decisão:** opcional.

### P-10 — Status

**Decisão:** convite e conta possuem estados independentes. O convite controla o processo de ativação; a conta controla o estado do usuário.

---

# Resultado esperado

Ao final do plano, o comportamento deve ser conceitualmente simples:

```text
                    ADMINISTRADOR
                          │
                          │ convida
                          ↓
                    ┌───────────┐
                    │ CONVIDADO │
                    └─────┬─────┘
                          │
                 aceita convite
                          │
                 cria própria senha
                          │
                          ↓
                    ┌───────────┐
                    │   ATIVO   │
                    └─────┬─────┘
                          │
             ┌────────────┼────────────┐
             ↓            ↓            ↓
         Perfil       Segurança    Permissões
             │            │            │
       nome/telefone    senha        role
       foto             e-mail       responsável
                                      empresa
```

**Regra central:**

> O administrador define **quem é o usuário dentro do sistema e o que ele pode fazer**.  
> O usuário define **seus dados pessoais e suas credenciais de acesso**.  
> O convite é o mecanismo que conecta essas duas partes com segurança.

---

# Notas de implementação (13/08 — cruzamento com o repositório)

Seção adicionada ao plano canônico após conferência com o código real (`nxgest`) e a doc do Auth0 (organizations/invite-members). Fecha os gaps que o plano conceitual não detalhava e registra decisões travadas.

## N1 — Decisões travadas (P-1 a P-10 + extras)

| # | Decisão | Registro |
|---|---|---|
| N1.1 | **Tabela dedicada `convites`** com ciclo de vida próprio (PENDENTE/CONCLUIDO/EXPIRADO/REVOGADO) | Hoje o convite é só uma linha em `auth_tokens` (sem status, sem `email_alvo`, sem `criado_por`) — ver N2 |
| N1.2 | **`role_alvo` no convite = apenas informativo** (auditoria; nunca autoritativo — a role efetiva é sempre `usuarios.role`) | preenchido no envio, sem efeito na ativação |
| N1.3 | **Matriz de roles mantida como hoje**: `ROLES_ADMIN = [admin, socio, operator]`; **admin pode criar admin**; sócio cria só operator; super nunca atribuível | `admin.controller.ts:18,112,207` |
| N1.4 | **SUSPENSO incluído na v1** — novo para usuário (hoje só existe suspensão de **empresa**, `empresa.ativa=0`/BR-106) | ver N3 |
| N1.5 | **P-04/P-05**: admin nunca define senha nem ativa manualmente | remove campo senha do `OperadorForm` e o `bcrypt.hash` de `create/update`; ver N4 |
| N1.6 | **Dedup de e-mail**: valida `email` **e** `email_pendente` de terceiros, `409 EMAIL_DUPLICATED` antes de gravar — nunca depender do unique constraint (hoje o gap deixa o `update` estourar 500) | `admin.repository.impl.ts:111-159` |
| N1.7 | **Binding `email_alvo` na ativação** (Auth0): `/ativar` só ativa se `usuario.email == convite.email_alvo` | reforço de segurança do fluxo de convite |
| N1.8 | **"E-mail verificado" é estado derivado** (Auth0): verificado = conta ativa (ativou via convite) + sem `email_pendente`. **Sem coluna nova** — o "✓ verificado" da UI é computado | simplifica o modelo |
| N1.9 | **Idioma estilo Auth0**: `convites.idioma` alimenta o **e-mail**; a **página de aceitação** localiza pelo browser (`Accept-Language`/i18n). Não "adivinha" idioma no envio | responde P-4 do rascunho |
| N1.10 | **Lazy-expire + limpeza**: convite expirado marcado `EXPIRADO` na validação; rotina de limpeza opcional (Auth0 deleta expirados) | mantém `convites` enxuta; `OperadorRow` expõe status para listagem |

## N2 — Modelo de dados (migração)

Mesmo mecanismo idempotente do projeto (PLAN-070/072 — `CREATE` + `ALTER ... ADD COLUMN IF NOT EXISTS`):

```sql
-- usuarios (dados + suspensão)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "telefone" TEXT;            -- P-09, opcional
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "email_pendente" TEXT;      -- troca de e-mail
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "suspenso_em" TIMESTAMPTZ;  -- N1.4

-- empresas (seed de contato/origem — colunas também usadas pelo PLAN-072; ordem 072×075 indiferente)
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "origem" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "email_contato" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "telefone_contato" TEXT;

-- convites (entidade com ciclo de vida próprio)
CREATE TABLE IF NOT EXISTS "convites" (
  "id" TEXT PRIMARY KEY,
  "usuario_id" TEXT NOT NULL REFERENCES "usuarios"("id"),
  "email_alvo" TEXT NOT NULL,                  -- e-mail para o qual o convite foi enviado (N1.7)
  "criado_por" TEXT REFERENCES "usuarios"("id"), -- quem convidou (auditoria)
  "role_alvo" TEXT,                             -- INFORMATIVO apenas (N1.2)
  "idioma" TEXT NOT NULL DEFAULT 'pt-BR',       -- idioma do e-mail (N1.9)
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',    -- PENDENTE|CONCLUIDO|EXPIRADO|REVOGADO
  "token_hash" TEXT NOT NULL,                   -- SHA-256 (padrão de hash do projeto)
  "criado_em" TIMESTAMPTZ NOT NULL,
  "expira_em" TIMESTAMPTZ NOT NULL,             -- P-10, 7 dias
  "usado_em" TIMESTAMPTZ,
  "revogado_em" TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_convites_token" ON "convites"("token_hash");
CREATE INDEX IF NOT EXISTS "idx_convites_usuario_status" ON "convites"("usuario_id","status");
CREATE INDEX IF NOT EXISTS "idx_convites_expirados" ON "convites"("status","expira_em");
```

- **Invariante "nunca dois convites válidos":** transacional (revalidar/invalidar o atual antes de criar novo — mesmo padrão do `invalidarPorTipo`) + `unique(token_hash)`.
- **Backfill:** `auth_tokens` (`tipo='convite'`, `usado_em IS NULL`, `expira_em > now`) → `convites` como `PENDENTE` (sem `criado_por`/`email_alvo` históricos → `email_alvo = usuarios.email`, `criado_por = NULL`).
- Token continua no `auth_tokens`? **Não para convite** — o `token_hash` vive no próprio `convites` (atomicidade e auditoria coesas). `auth_tokens` permanece para `lead`/`reset`/`email`.

**Backend por arquivo:**

| Arquivo | Mudança |
|---|---|
| `src/database.ts` | Colunas/DDL acima (CREATE + ALTER) |
| `src/modules/admin/domain/admin.types.ts` (ou entidades) | `OperadorRow`/`Usuario` ganham `telefone`, `emailPendente`, `suspensoEm`, `conviteStatus` |
| `src/modules/admin/application/use-cases/CriarOperador/CriarOperadorUseCase.ts` | remove `senhaHash` (sempre convidado — P-04); aceita `telefone` |
| `src/modules/admin/application/use-cases/EditarOperador/EditarOperadorUseCase.ts` | aceita `telefone`; dedup de e-mail no repositório |
| `src/modules/admin/infrastructure/repositories/admin.repository.impl.ts` | `create/update` sem senha; dedup `email`+`email_pendente` (409); `update` suporta `emailPendente`/`suspensoEm`; `findByEmail` para listagem não retorna `suspensoEm` sensível |
| `src/modules/admin/presentation/controllers/admin.controller.ts` | cria/edita sem senha; troca de e-mail por estado (convidado→novo convite; ativo→`email_pendente`); ações "Suspender/Reativar", "Revogar convite"; `reenviar-convite` passa a usar `ConviteRepository`; `resolveEmpresaId` + `req.userId` para `criado_por` |
| `src/modules/leads/application/use-cases/ConverterLead/ConverterLeadUseCase.ts` | cria admin no modelo convite (sem senha); seed `telefone`/`email_contato`/`origem` |
| `src/modules/admin/infrastructure/repositories/empresa.repository.impl.ts` | `create` aceita `origem`/`emailContato`/`telefoneContato` |
| `src/modules/auth/domain/auth-token.service.ts` `+` entity | novo tipo `email: 24h` p/ verificação de troca |
| `src/modules/auth/presentation/routes/auth.routes.ts` | `PATCH /me` (nome/telefone), `POST /me/email`, `POST /me/email/verificar`, `DELETE /me/email` (todos com senha atual onde aplicável) |
| `src/modules/auth/presentation/controllers/auth.controller.ts` | `me` devolve `telefone` + flags computadas; use cases `TrocarEmail`/`VerificarEmail`/`CancelarTrocaEmail` |
| `src/modules/auth/application/use-cases/Login/LoginUseCase.ts` | bloqueio por `suspensoEm` → `403 CONTA_SUSPENSA`; `status` computado |
| `src/shared/email/templates.ts` | `conviteTemplate(empresaNome?, convidadoPor?)`; `verificarEmailTemplate` |

**Frontend por arquivo:**

| Arquivo | Mudança |
|---|---|
| `frontend/src/modules/admin/components/OperadorForm.tsx` | remove campo **senha**; divide em Dados pessoais (nome/telefone/foto opcional) / Acesso (e-mail) / Permissões (role, chefe); CTA "Enviar convite" |
| `frontend/src/modules/auth/pages/PerfilPage.tsx` | 3 seções: Dados pessoais (editável), Conta (e-mail/status/perfil/empresa — leitura), Segurança (senha + trocar e-mail); selo "✓ verificado" derivado / "⚠ pendente" |
| `frontend/src/modules/admin/pages/OperadorDetail.tsx` | telefone, status convite (pendente/expirado/revogado), ações: reenviar, revogar, suspender/reativar |
| `frontend/src/modules/admin/components/OperadoresList.tsx` | coluna telefone; badges convidado/convite expirado/verificação pendente |
| `frontend/src/modules/auth/pages/AtivarPage.tsx` | valida `email_alvo` bind; trata `EXPIRADO`/`REVOGADO`; idioma via browser (N1.9) |
| `frontend/src/modules/leads/pages/QueroConhecerPage.tsx` | only copy/hints (D8 hierarquia) |
| `frontend/src/i18n/locales/` | pt-BR/en/es p/ fluxo de convite/troca/suspensão |

## N3 — SUSPENSO (usuário, v1)

- **Coluna:** `usuarios.suspenso_em TIMESTAMPTZ NULL` — usuário suspenso quando não-nula (mesmo padrão de `deletedAt`).
- **Login:** `LoginUseCase` valida credenciais → depois `suspensoEm` → `403 CONTA_SUSPENSA` (mensagem clara após credencial correta; não confundir com credencial inválida — não vaza em público).
- **Ações admin:** suspender/reativar em `OperadorDetail` (admin/super; sócio só na subárvore via `resolveScope`).
- **Aplicável a usuários ativos.** Convidado suspenso não faz sentido (não loga) — se necessário, remover antes.
- **UI:** badge "Suspenso" na listagem; `PerfilPage` mostra status "Suspenso" leitura.

## N4 — P-04/P-05 no código (admin nunca define senha)

- `OperadorForm`: campo senha removido — placar substituído por "O usuário receberá um convite por e-mail e criará sua própria senha durante a ativação".
- `admin.controller create/update`: removido `bcrypt.hash` e validação de senha; `senhaHash` sempre `null` → todo cadastro nasce `convidado`.
- `update` não aceita mais `senhaHash` (sem ativação manual e sem o cenário "convidado+senha na mesma edição" — ambiguidade eliminada).
- `CriarEmpresaInput`/`CriarEmpresaUseCase`/`empresa.repository.create`: extrai `adminSenhaHash` do fluxo de conversão (mantém só como valor fixo `null` ou remove o campo — decisão de limpeza na execução).
- `EsquecerSenha`/`reset` permanecem como recuperação self-service (não é definição de senha por admin).

## N5 — Troca de e-mail (endpoints + regras)

- `POST /me/email` `{ novoEmail, senhaAtual }` → valida senha, dedup (`email` + `email_pendente`), grava `email_pendente`, emite token `email` 24h e envia link.
- `POST /me/email/verificar` `{ token }` → valida token `email`, `email_pendente → email`, limpa pendente, invalida token.
- `DELETE /me/email` `{ senhaAtual }` → **senha atual obrigatória** (consistência, P-03 + segurança); cancela pendência e invalida token; e-mail atual intacto.
- **Re-solicitar** com pendência viva: invalida token anterior + sobrescreve `email_pendente` (só o último link vale).
- **Troca por admin:** convidado → invalida convite + novo convite ao novo endereço (sem `email_pendente`); ativo → `email_pendente` + verificação pelo dono. Com P-04/05, não existe caminho "convidado que vira ativo por senha do admin".
- **Sessão:** JWT carrega `{ userId, role, empresaId }` — troca de e-mail NÃO derruba sessão (registrado; desejado).

## N6 — Deltas Auth0 incorporados

1. **Binding `email_alvo`:** `/ativar` valida `usuario.email == convite.email_alvo` antes de aplicar (N1.7).
2. **E-mail verificado derivado:** sem coluna nova (N1.8).
3. **Idioma:** `convites.idioma` → template do e-mail; página de aceitação por `Accept-Language` (N1.9).
4. **Lazy-expire + limpeza:** check de `expira_em` transacional + marcação `EXPIRADO`; rotina opcional de limpeza (job/cron leve, fora do request se possível).
5. **`role_alvo` informativo** (N1.2) — apenas registro "convidado como X"; a role efetiva é lida de `usuarios.role` na ativação.

## N7 — Casos de teste (quando implementado)

Cobre N1–N6; além dos CTs do plano canônico (CT-01 a CT-46):

- CT-B1 Ativação com token cujo `email_alvo != usuarios.email` → rejeitada (N1.7).
- CT-B2 Convite REVOGADO não ativa conta.
- CT-B3 Usuário suspenso → login `403 CONTA_SUSPENSA` mesmo com credenciais corretas (N3).
- CT-B4 Reativar usuário suspenso → login volta a funcionar.
- CT-B5 Admin cria admin (permitido — N1.3) → sem erro.
- CT-B6 Admin não consegue premiar `super_admin` (regra atual).
- CT-B7 Cancelar troca de e-mail sem senha atual → falha.
- CT-B8 Reenviar convite de convidado com email trocado → só o novo convite vale (link antigo morre).
- CT-B9 `convites.role_alvo` preenchido mas sem efeito na ativação (N1.2).
- CT-B10 Conversão de lead cria admin com `role_alvo`/`idioma` do lead e segue fluxo de convite.

## N8 — Fora do escopo (reafirma D10)

SSO/2FA/sessões, login social, reassign de empresa, campanhas, recuperação avançada, alteração de `role`/`chefe`/`empresa` pelo próprio usuário, e **auditoria completa** de ações administrativas (crawl do `convites.criado_por` atende convites; demais ações seguem padrão atual).