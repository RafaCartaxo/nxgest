# BACKLOG — Refinamentos do Produto

**Status:** Em andamento — Sprint 1 concluído (PLAN-026)

**Versão:** 2.0

**Objetivo**

Organizar os próximos refinamentos do sistema em pequenas entregas independentes, priorizando correções funcionais, padronização visual e evolução da experiência operacional, evitando retrabalho e mantendo a arquitetura atual.

---

# EPIC 1 — Administração

## P011 — Correção de saldo do Operador

> **Resolvido** pela cadeia PLAN-020 → PLAN-025 (ajuste via `?usuarioId=` + `resolveUsuarioAlvo` + regra exclusiva de admin). Todo ajuste agora passa a gerar auditoria (P014).

### Problema

Ao acessar um operador pela área administrativa e realizar um ajuste de saldo, o valor não está sendo persistido corretamente no operador correspondente.

O saldo alterado pelo administrador também não está refletindo corretamente na visão do operador.

### Objetivos

- Corrigir a associação do operador durante o ajuste.
- Garantir persistência correta.
- Garantir atualização imediata após salvar.
- Validar Admin → Operador → Caixa.

---

## P012 — Padronização da página Administrativa

> **Concluído** (PLAN-026): `OperadoresList` agrupa a equipe em subseções "Administradores" e "Operadores", evitando "Operadores" como rótulo genérico. Espaçamentos/badges já normalizados (PLAN-024).

### Problemas

Atualmente existem inconsistências visuais:

- badges sobrepondo o nome;
- espaçamentos excessivos;
- KPIs com padrões diferentes do restante do sistema;
- ausência do usuário atual na equipe;
- nomenclaturas inconsistentes.

### Melhorias

### Cards

- corrigir espaçamentos;
- corrigir alinhamentos;
- manter padrão visual do restante do sistema.

### KPIs

Transformar todos os KPIs em elementos clicáveis, seguindo o padrão já utilizado em outras telas.

### Equipe

Adicionar o usuário atual na lista de membros.

Exemplo:

```
Administrador
(Eu)
```

Mantendo ordenação alfabética.

### Papéis

Padronizar os conceitos utilizados.

Exemplo:

```
Equipe

Administradores

Operadores
```

Evitando utilizar "Operadores" como nome genérico para todos.

---

## P013 — Contexto do Operador

> **Fatia 1 concluída** — Estorno de Pagamento pelo Admin (PLAN-028): corrige o caso de uso "corrigir pagamentos registrados incorretamente". Admin vê os contratos do operador no `OperadorDetail` e estorna um pagamento (modal de motivo + auditoria dedicada + `?usuarioId=` em contrato/pagamento/cliente). Demais casos de uso (consultar clientes/contratos/pagamentos completos, acompanhar caixa do operador em navegação) seguem pendentes.

> **✅ Concluído** (07/08, PLAN-063): fatia restante fechada — **lista de clientes do operador** com `?usuarioId=` (`resolveUsuarioAlvo` no `GET /api/clientes`) + seção "Clientes do operador" no `OperadorDetail` + `ClienteDetail` com drill-down coerente. Caixa/ajuste/auditoria/contratos/estorno já cobertos (PLAN-020/025/027/028).

### Objetivo

Permitir que um administrador consiga acessar o contexto operacional de qualquer operador da equipe sem necessidade de trocar de login.

### Casos de uso

- consultar clientes;
- consultar contratos;
- consultar pagamentos;
- corrigir pagamentos registrados incorretamente;
- acompanhar o caixa do operador.

A implementação deve preservar toda a rastreabilidade das ações realizadas pelo administrador.

---

## P014 — Auditoria de Caixa

> **Concluído** (PLAN-026 + PLAN-027): tabela `auditoria_caixa` — operador, admin responsável, valor anterior, valor novo, motivo (obrigatório) e data. `POST /api/caixa/ajuste` exige `motivo`. Histórico **exibido** para admin (detalhe do operador) e operador (página de caixa) via `GET /api/caixa/auditoria`.

### Objetivo

Todo ajuste manual realizado pelo administrador deve gerar um registro financeiro.

Cada operação deverá armazenar:

- operador;
- administrador responsável;
- valor anterior;
- valor novo;
- motivo;
- data/hora.

Nenhuma alteração manual deverá ocorrer sem histórico.

---

# EPIC 2 — Clientes

## P015 — Indicadores Financeiros do Cliente

> **Concluído** (PLAN-033): além do `saldoDevedor`, o detalhe do cliente exibe **lucro previsto** (`lucroPrevisto` = Σ(`valorFinal − valorBase`) dos contratos Ativos — BR-098), junto da situação de atraso (BR-096/097). Fonte: `GET /api/clientes/:id`.

### Situação atual

Hoje o cliente apresenta:

- saldo devedor.

### Melhoria

Adicionar também:

- lucro previsto dos contratos.

O valor deverá ser calculado a partir dos contratos vinculados ao cliente.

---

## P016 — Padronização dos Endereços

> **Concluído** (PLAN-055/056 + decisão 07/08): captura GPS nos 2 endereços (`GpsControl` 3 estados, comércio + principal) · editar texto descarta coords (recapturar) · detalhe exibe os 2 endereços. **Decisão registrada:** navegação é **QuickAction única** (alvo comércio→principal), não 2 botões "Navegar" por endereço.

### Problema

Durante a edição do cliente a captura automática e a edição manual acabam conflitando.

Além disso muitos campos aparecem sem necessidade.

### Proposta

Durante o cadastro:

```
Capturar localização
```

Após salvar:

```
Endereço residencial

Rua...
Cidade...

[Navegar]

----------------------

Endereço da cobrança

Rua...
Cidade...

[Navegar]
```

### Objetivos

- simplificar edição;
- preservar geolocalização existente;
- reduzir erros de endereço;
- manter integração com navegação.

---

# EPIC 3 — Cobrança

## P017 — Mensagens Inteligentes do WhatsApp

### Situação atual

A mensagem considera apenas o valor total devido.

### Melhoria

Utilizar as informações reais do cliente.

Exemplo:

```
Olá João.

Identificamos:

• 3 parcelas em atraso

Contrato Casa
R$ 120

Contrato Loja
R$ 90

Contrato Moto
R$ 140

Total pendente:
R$ 350
```

### Objetivos

- mensagem mais clara;
- facilitar negociação;
- reduzir dúvidas do cliente.

---

## P018 — Padronização dos Modais

> **Concluído** (PLAN-026): componente `Modal` base configurável (Escape/backdrop/overflow/`role=dialog`), modais refatorados preservando a semântica de fechamento de cada tela.

### Problema

Alguns modais não fecham corretamente ao cancelar.

### Objetivo

Todos os modais devem possuir comportamento consistente.

Cancelar deverá sempre:

- fechar o modal;
- cancelar a operação;
- limpar estados temporários quando necessário.

Também revisar os demais fluxos para evitar inconsistências semelhantes.

---

## P021 — Pagamento a mais que o total do contrato (observação de produto)

> ⚠️ **Mudança drástica — apenas registro, sem implementação.** Não entrou no PLAN-029 nem nos CTs de API como comportamento atual.

### Observação

Hoje `POST /api/pagamentos` **rejeita** valor acima do saldo devedor do contrato (422 — BR-016: "O valor aplicado a um contrato nunca poderá exceder seu saldo devedor").

**Ideia registrada:** permitir **pagamento a mais que o total do contrato** — ex.: contrato com total de R$ 520, o operador recebe R$ 530 → R$ 10 de excedente — e exibir esse **"bônus"/excedente na transação do operador**.

**Condição:** o excedente só faz sentido **após tudo pago** ("só depois de tudo pago") — com o contrato quitado, o valor recebido acima do total vira o "bônus" visível na transação.

**Impactos a avaliar (quando entrar em escopo):** caixa (o que entra de excedente?), movimentação financeira, KPI "recebido hoje", BR-016 (revogar/ajustar), auditabilidade, e se o excedente é devolvido ou fica como crédito do cliente.

---

# EPIC 4 — Operação

> **Observação:** O conceito de Status Financeiro × Status Operacional já foi implementado e não faz parte deste backlog.

Este epic contempla apenas refinamentos da experiência operacional.

---

## P019 — Refinamentos Operacionais

Itens de melhoria identificados durante os testes da operação diária.

Novos refinamentos deverão ser adicionados aqui conforme evolução do produto.

---

# EPIC 5 — Autenticação e Perfil

## P020 — Perfil do usuário: troca de senha e recuperação

> ✅ **Implementado (07/08, PLAN-065):** fluxo de conta completo — **convite por e-mail** (admin cria usuário com nome+email, sem senha → link de ativação → usuário define a própria senha) + **esqueci a senha** (token por e-mail, 30min, single-use) + **infra de e-mail** (**Resend**; env `MAIL_*`; templates pt/en/es). Pré-requisito de produção: domínio real `nxgest.com.br` + DNS (SPF/DKIM/DMARC) — sem bloquear dev.

### Situação atual

O usuário **não** pode gerenciar a própria senha:
- o campo de senha do login **não** permite mostrar/ocultar o que foi digitado;
- **não existe** troca de senha pelo próprio usuário (o admin redefine via `PATCH /api/admin/operadores/:id`);
- **não existe** fluxo de "esqueci minha senha".

### Proposta (fatia 1 — PLAN-029)

- Mostrar/ocultar senha no login (UC-041);
- Troca de senha pelo próprio usuário via `PATCH /api/auth/senha` (senha atual + nova, mín. 6 caracteres) — BR-089/BR-090 (UC-042);
- Seção "Meus dados" para todos os perfis (admin funde com a aba existente no painel).

### Fora de escopo (fatia 2 — pendente)

- ~~**"Esqueci minha senha"**~~ → **entregue no PLAN-065** (token por e-mail + `POST /auth/forgot` + `POST /auth/reset`).

---

# EPIC 6 — Testes e validação

## P022 — Testes de UI das telas alteradas

> **✅ Saiu de "adiado" (07/08):** virou o **PLAN-067-testes.md** — estratégia integrada (unit use-cases + shared/segurança + lógica front + UI crítica + smoke + CI). A rodada 1 destrava o escopo original (LoginPage/PerfilPage/AdminPage/ContribuicaoModal/EquipeModal/Navbar) + críticos novos (RotaPage/PagamentoModal/UserMenu/BottomTabBar/leads).

### Escopo (quando entrar)

Vitest + React Testing Library (jsdom) para as telas alteradas em PLAN-029/030:
- LoginPage — toggle mostrar/ocultar senha (UC-041);
- PerfilPage — validações + sucesso/422 da troca de senha (UC-042);
- AdminPage — KPIs com totais da equipe (mock `getEquipe`) e click → `ContribuicaoModal` (UC-053);
- ContribuicaoModal / EquipeModal — total, ordenação, navegação ao operador com `?empresaId=` (UC-024/053);
- Navbar — links Administração/Empresas por role (UC-054).

Hoje `npm test` roda **78 testes verdes** (vitest unit + UI RTL) e o CI valida no push; backend/API coberto por `scripts/smoke-api.mjs` (250 cenários).

## P023 — Validação manual de fim de fluxo e empty states

> **T2 — manual (pendente).** Conferência visual no navegador (notebook + celular na rede local):
- Fim de fluxo: UC-018..022 (rota concluída, dashboard vazio, atendidos vazio, cliente quitado) e UC-031 (voltar do contrato do operador);
- Empty states da API (V9): `cobrancas`/`pagamentos-hoje` vazios — com operador sem dados;
- UX do admin (PLAN-030): modais, navegação e navbar em tela pequena (celular).

---

## P024 — Whitelabel: enforcement de módulos no backend (hardening)

> **Concluído** (PLAN-036). O v1 de módulos era gating de UI; agora módulo desativado devolve **403 `MODULE_DISABLED`** no backend: `requireModule` no mount de `clientes`, `contratos`, `caixa`, `gastos`, `pagamentos` (=contratos) e por endpoint em `/operacoes` (`POST /visitas`=rota, `GET /historico-atrasos`=cobrancas). Super admin sem `?empresaId=` não é bloqueado; com `?empresaId=` respeita a empresa-alvo. Limite do v1: endpoints compartilhados com a Central (`GET /operacoes/cobrancas`, `pagamentos-hoje`, `parcelas-hoje`, `parcelas-semana`) seguem abertos (PLAN-036).

**Limites/observações conhecidas (code review 05/08/2026):**
- **Enforcement parcial de `cobrancas`/`atendidos`:** o dado principal (`GET /operacoes/cobrancas`, que também alimenta Atendidos) é **compartilhado** e permanece **aberto**; 403 real só em `POST /visitas` (rota) e `GET /historico-atrasos` (cobrancas). Atendidos é **apenas gating de UI** — não há endpoint próprio pra 403. O limite v1 cobre isso, mas o "403 por módulo" não se aplica ao dado de cobranças/atendidos.
- **Super admin com `?usuarioId=` sem `?empresaId=`:** o `requireModule` resolve a empresa-alvo só por `?empresaId=` (ou o `empresaId` do token); sem ele, o super admin **ignora o gating** (by design — acesso global). Documentado: o gating por empresa só vale quando `?empresaId=` é informado.
- **Painel admin (BR-091):** corrigido 05/08 — o dashboard de admin self agregava só o próprio (regressão PLAN-032); agora soma a equipe (ver `admin.controller.ts`).

---

## P025 — Central se adapta aos módulos off (frontend)

> **Concluído** (PLAN-037). A Central compõe só widgets dos módulos ativos: KPIs financeiros gated por `contratos`, "Pendentes do Dia"/clientes pendentes por `cobrancas`, skip de fetches de módulos off e estado vazio coerente. Junto, o grafo de dependências ganhou `contratos ⇒ clientes` e validação **transitiva** de combos órfãos (combos incoerentes → 422). Princípio que sustenta o multi-negócio: dado de módulo off nunca aparece.

---

# EPIC 7 — Aquisição / Onboarding Comercial

## P026 — Onboarding Comercial (Leads)

> ✅ **Implementado (07/08, PLAN-064):** `PLAN-064-onboarding-comercial-leads.md` — `/quero-conhecer` (lead + confirmação de e-mail) + painel super `/admin/leads` (onboarding, converter — reusa `createEmpresa` + convite — e descartar/LGPD).

- Separar o **fluxo comercial** (aquisição de empresas) do **fluxo operacional** (que permanece intacto).
- Empresa **nunca nasce automaticamente**: todo interessado vira **Lead** (NOVO → EMAIL_CONFIRMADO → EM_ONBOARDING → CONVERTIDO/DESCARTADO).
- Página pública `/quero-conhecer` (dedup por e-mail, rate limit, confirmação de e-mail) + painel super `/admin/leads` (onboarding, converter — reusa `createEmpresa` + convite, descartar).
- **Fora de escopo:** assinaturas, trial automático, sandbox, CRM, pagamento.

---

# EPIC 8 — Segurança / Hardening

## P027 — Hardening de segurança (P0/P1/P2)

> **Em execução (08/08):** `PLAN-066-hardening-seguranca.md` — **P0+P1 implementados** (trust proxy + `CF-Connecting-IP` · helmet/CSP · CORS fail-closed · HSTS · rate limit por usuário · deps/drizzle · backup cripto · firewall). Postura: `docs/engineering/SEGURANCA.md`. **P2 pendente.**

- **P0 ✅:** `trust proxy` + `CF-Connecting-IP` (rate limit real atrás do Caddy/Cloudflare) · `helmet`/CSP/HSTS + headers no Caddy · CORS fail-closed.
- **P1 ✅:** `npm audit` + `drizzle-orm` 0.45.2 · firewall/fail2ban no VPS (doc) · rate limit global/por usuário · backup off-site criptografado · timeouts no Caddy.
- **P2 ⏳:** JWT mais curto/revogação · Cloudflare WAF (URL já migrada) · 2FA admin · senha mín. 8.
- **CTs:** ~22 novos (T/A/I/D/P) + regressão referenciando os existentes no `07`.

---

# EPIC 9 — Performance

## P028 — Índices por `userId` + reescrita da query de cobranças do dia

> **Feito (11/08):** índices por `userId` no `database.ts` (`createTables`, `CREATE INDEX IF NOT EXISTS` — idempotentes, criam no boot): `clientes(userId,deletedAt)` · `contratos(userId,deletedAt)` · `parcelas(contratoId,dataVencimento,saldoPendente)` · `pagamentos(userId,data)` · `historico_operacional(userId,createdAt)` · `gastos(userId,data)` · `movimentacoesFinanceiras(userId,data)` · `fechamentos_semanais(userId,dataInicio)`.

### Problema

O isolamento multi-tenant filtra `userId = ?` em toda consulta, mas nenhuma tabela operacional tinha índice nessa coluna → **table scan** em clientes/contratos/cobranças/caixa/gastos conforme os dados crescem (demora sistêmica). A query de cobranças do dia (`listarCobrancasDoDia`) agrava com **~4 subqueries correlacionadas por linha** (saldoTotal · proximaParcela · proximoNumeroParcela · diasEmAtraso) + resultado operacional aninhado.

### Pendências (follow-up)

- [ ] **Reescrever `listarCobrancasDoDia`** com joins/agregação (eliminar subqueries correlacionadas por linha) — roadmap 5.10.
- [ ] Medir/validar ganho real de performance após os índices (dev + prod).

---

# EPIC 10 — IA no Produto

## P029 — IA no produto (WhatsApp inteligente · resumo · rota · OCR · FAQ)

> **Planejado (12/08):** `PLAN-073-ia-produto.md` (plano mestre, F1-F5) + `PLAN-074-ia-whatsapp.md` (F1 detalhada). Provider: **Gemini Flash-Lite** (free tier p/ dev/teste; produção → billing ~US$1-2/mês). Módulo `ai` com port `IGeradorIA` + providers (console/fail/gemini) — padrão do mailer. **IA só gera/sugere — nunca executa transação.**

### Fases

| Fase | Entrega | Plano |
|---|---|---|
| F1 | WhatsApp inteligente (P017) — mensagem personalizada com contexto (situação/parcelas/atraso/total) + fallback ao template | PLAN-074 |
| F2 | Resumo do dia do operador (visitas/pagamentos/promessas/follow-up) | PLAN-073 |
| F3 | Priorização de rota (heurística primeiro; IA refina) | PLAN-073 |
| F4 | OCR de anexos (extrair endereço do comprovante) — conecta com a futura miniatura de PDF/imagem | PLAN-073 |
| F5 | FAQ/assistente interno do operador (ancorado nas BRs/docs) | PLAN-073 |

### Principais decisões

- **Não-bloqueante:** IA é opcional; fallback ao comportamento atual (template/heurística) sempre presente.
- **Multi-tenant/privacidade:** prompt montado só com dados do escopo resolvido; sem PII desnecessária.
- **Rastreabilidade:** sugestão nunca executada direto; operador confirma.
- **Port + fail-closed:** `FailingProvider` nunca mente sucesso (igual mailer).

---

# Prioridade sugerida

## Sprint 1 — Concluído (PLAN-026)

- P011 — Correção de saldo do operador (resolvido em PLAN-020→025; regressão)
- P018 — Padronização dos modais ✅
- P012 — Padronização da página Administrativa ✅
- P014 — Auditoria de Caixa ✅

---

## Sprint 2

- P014 — Auditoria de Caixa (concluído)
- P013 — Contexto do Operador

---

## Sprint 3

- P015 — Indicadores Financeiros do Cliente
- P016 — Padronização dos Endereços

---

## Sprint 4

- P017 — Mensagens Inteligentes do WhatsApp
- P019 — Refinamentos Operacionais

---

## Sprint 5 (proposta)

- P020 — Perfil do usuário: troca de senha (PLAN-029) — fatia 1
- P013 — Contexto do Operador (restante)

---

> **Sem sprint (observação de produto):** P021 — pagamento a mais que o total do contrato ("bônus" na transação do operador). Mudança drástica; aguardar decisão.
>
> **Pendências registradas (EPIC 6):** P022 — Testes de UI (adiado) · P023 — Validação manual fim de fluxo/empty states.

---

# Observações

Este backlog reúne apenas melhorias identificadas após a implementação das funcionalidades principais.

Cada item deverá evoluir posteriormente para um **PLAN** próprio, contendo:

- objetivo;
- escopo;
- critérios de aceite;
- ordem de implementação;
- checklist;
- impacto arquitetural.

Dessa forma o backlog permanece enxuto, enquanto cada entrega pode ser planejada de forma independente e incremental.