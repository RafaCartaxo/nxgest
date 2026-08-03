# PLAN-029 — Senha e Perfil do Usuário

**Status:** Concluído

**Versão:** 1.0

**Início:** 03/08/2026

**Última atualização:** 03/08/2026

**Roadmap:** product/04-ROADMAP.md §5.9

---

## Objetivo

Completar o ciclo de autenticação adiado no PLAN-015 ("tela de perfil virá depois"): o usuário passa a **ver** e **gerenciar** a própria senha.

---

## Escopo

| # | Entrega | Detalhe |
|---|---------|---------|
| 1 | Mostrar/ocultar senha no login | Toggle Eye/EyeOff no campo senha (UC-041) |
| 2 | Trocar a própria senha | `PATCH /api/auth/senha` — senha atual + nova (BR-089/090, UC-042) |
| 3 | Página Perfil ("Meus dados") p/ todos os perfis | Dados + troca de senha; acesso pela engrenagem do Navbar e pela aba "Meus dados" do admin |

**Fora de escopo:** "esqueci minha senha" → backlog **P020** (sem infraestrutura de e-mail).

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Status para senha atual incorreta | **422** `INVALID_CURRENT_PASSWORD` (não 401) | O `client.ts` do front remove o token em qualquer 401 — 422 evita deslogar o usuário ao errar a senha atual |
| Token após a troca | Permanece **válido** (BR-090) | Sem tabela de revogação nesta versão; próximo login usa o novo hash |
| Local da troca | Página `/perfil` para todos os perfis | Decisão do produto — operator/admin/super_admin têm a mesma seção |
| Hash | bcrypt (já usado no projeto) | Consistência com o login |

---

## Implementação

### Backend

| Arquivo | Mudança |
|---------|---------|
| `src/modules/auth/domain/errors/auth.error.ts` | Novo `SenhaAtualIncorretaError` |
| `src/modules/auth/application/ports/auth.repository.ts` | Novo método `updateSenha(id, senhaHash)` |
| `src/modules/auth/infrastructure/repositories/auth.repository.impl.ts` | Implementação `updateSenha` |
| `src/modules/auth/application/use-cases/AlterarSenha/AlterarSenhaUseCase.ts` | Novo — valida senha atual (bcrypt.compare), gera hash da nova, persiste |
| `src/modules/auth/presentation/controllers/auth.controller.ts` | Novo handler `alterarSenha` (validações 400/422) |
| `src/modules/auth/presentation/routes/auth.routes.ts` | `PATCH /senha` (authMiddleware) |

### Frontend

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/modules/auth/services/auth.service.ts` | Nova função `alterarSenha` |
| `frontend/src/modules/auth/pages/LoginPage.tsx` | Toggle mostrar/ocultar senha (Eye/EyeOff) |
| `frontend/src/modules/auth/pages/PerfilPage.tsx` | Novo — dados do usuário + formulário de troca de senha |
| `frontend/src/App.tsx` | Rota `/perfil` (protegida) |
| `frontend/src/shared/components/Navbar.tsx` | Link "Meus dados" na engrenagem (todos os perfis) |
| `frontend/src/modules/admin/pages/AdminPage.tsx` | Botão para `/perfil` na aba "Meus dados" |
| i18n (pt-BR, en, es) | Chaves `auth.mostrarSenha/ocultarSenha`, `perfil.*`, `errors.INVALID_CURRENT_PASSWORD` |

---

## Novas regras de negócio

| BR | Descrição |
|----|-----------|
| BR-089 | Usuário altera a própria senha informando a atual + nova (mín. 6 caracteres); atual incorreta → 422; hash bcrypt |
| BR-090 | Após a troca, o token JWT atual permanece válido |

---

## API

`PATCH /api/auth/senha` — ver `engineering/02-API.md` e `product/07-CASOS-DE-USO-API.md` (API-UC-041, CT-075..077).

---

## Documentação atualizada (matriz SKILL-009)

- `engineering/02-API.md` — endpoint `PATCH /api/auth/senha`
- `product/07-CASOS-DE-USO-API.md` — API-UC-041 + API-CT-075..077
- `api-collection.json` — request `Auth > Alterar senha` (regenerada)
- `product/06-CASOS-DE-USO.md` — UC-041/042 marcados implementados
- `engineering/05-MAPEAMENTO-TELAS.md` — tela Perfil (§18) + toggle no login (§11)
- `product/02-BUSINESS-RULES.md` — BR-089/090
- `product/04-ROADMAP.md` — §5.9
- `docs/UPDATES.md` — entrada do PLAN-029

---

## Ajustes pós-validação (smoke — 03/08/2026)

Executados **78 cenários** (`scripts/smoke-api.mjs`) contra instância isolada — todos PASS. Dois ajustes adicionais de segurança/consistência:

| Ajuste | Onde | Motivo |
|--------|------|--------|
| `dataPromessa` **obrigatória** quando `tipo=promessa` | `operacoes.controller.ts` (422) | Regra já documentada na `02-API`; o front (`RotaPage`) sempre envia — sem quebra |
| **Senha mín. 6** no `POST/PATCH /api/admin/operadores` | `admin.controller.ts` (400) | Não dependia só do front; aceitava senha curta via API |
| `LOGIN_RATE_LIMIT_MAX` (env, default 10) | `auth.routes.ts` | Permite elevar o limite em teste/smoke sem mudar o default |

A base `07-CASOS-DE-USO-API.md` ganhou os CTs 078 (promessa sem data → 422) e 079 (senha curta admin → 400), e a collection foi regenerada.

---

## Referências

- `product/04-ROADMAP.md` §5.9
- `plans/BACKLOG.md` P020 (esqueci minha senha — fora de escopo)
- `product/02-BUSINESS-RULES.md` BR-089, BR-090
- `foundation/ADR-003-Auth-Autorizacao.md`
