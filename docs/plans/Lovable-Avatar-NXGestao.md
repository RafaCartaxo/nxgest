# NX Gest — Avatar com foto (usuário/operador/cliente) — briefing para IA

## 1. Contexto do produto

**NX Gest** ("Nexus Gestão") — plataforma de gestão multi-negócio (whitelabel).
Frontend **React + Tailwind v3**, mobile-first, identidade 100% por **CSS variables**.
Identidade "Nexus" (PLAN-038) implementada: tokens OKLCH, fonte Sora (títulos) + Inter,
sidebar lateral (`AppLayout`), `PageHeader`, `KpiCard`, `Card rounded-xl`, `Modal` base,
**`Field`** (forms/inputs — PLAN-039) e painel admin em identidade (PLAN-040).

**DS v2** (`docs/engineering/design/02-DESIGN-SYSTEM.md`) é a referência visual oficial.

## 2. Escopo — avatar com foto

Hoje existe **apenas** a "bola de iniciais" do usuário logado na sidebar (`AppLayout`,
`size-9 rounded-full bg-primary-light` com as iniciais do nome). Operadores não têm avatar
em lista/modal/detalhe; cliente tem iniciais no `ClienteCard` (sem foto).

Queremos um componente **`Avatar`** reutilizável que mostre a **foto** quando existir e
caia para as **iniciais** quando não — para **usuário/operador/admin** (self-service + admin
define) e **cliente** (o operador identifica o cliente pelo rosto).

## 3. Estado atual (base — não partir do zero)

- Avatar de iniciais: `shared/layout/AppLayout.tsx` (rodapé do usuário).
- `ClienteCard` já tem iniciais (`iniciais(nome)` + `rounded-full bg-primary-light`).
- **Não existe** coluna `foto` no banco, nem infra de upload.
- Superfícies sem avatar hoje: `OperadoresList`, `EquipeModal`, `ContribuicaoModal`, `OperadorDetail`.

## 4. O que quero (prioridade)

1. **Componente `Avatar`** (`shared/components/Avatar/Avatar.tsx`):
   - Props: `foto?: string | null`, `nome: string`, `size?: "sm" | "md" | "lg" | "xl"`, `className?`.
   - Sem `foto` → bola de iniciais (cores de fundo derivadas do nome, tokens `bg-primary-light text-primary-text`).
   - Com `foto` → `<img>` circular (`object-cover rounded-full`).
   - **Só tokens** (nunca cor fixa da paleta — o `npm run audit:styles` falha se houver).
2. **Util `processarImagem`** (`shared/utils/processarImagem.ts`):
   - Recebe `File` → `createImageBitmap`/`Image` + `canvas` → **resize ≤ 200px** + `toBlob("image/jpeg", 0.7)` (ou WebP) → **data URL**.
   - Rejeita arquivo ≥ ~500KB de entrada (retorna erro).
   - Usada por todos os campos de foto (avatar e cliente).
3. **Backend (mínimo):**
   - Colunas `usuarios.foto` e `clientes.foto` (TEXT null; migração idempotente no boot).
   - `login`/`me`/`GET /admin/operadores`/`GET /clientes(:id)` devolvem `foto`.
   - `PATCH /api/auth/foto` (data URL; própria foto; 422 se inválida/≥500KB).
   - `PATCH /api/admin/operadores/:id` e `POST`/`PATCH /api/clientes` aceitam `foto` (data URL opcional).
4. **Aplicar nas superfícies:**
   - **Sidebar** (usuário logado) — trocar a bola atual por `Avatar`.
   - **Perfil** ("Meus dados") — seção **foto**: upload (via `processarImagem`) / prévia / remover / salvar (`PATCH /api/auth/foto`).
   - **OperadoresList**, **EquipeModal**, **ContribuicaoModal**, **OperadorDetail** — `Avatar` por operador.
   - **OperadorForm** (admin) — campo foto (upload/remover).
   - **ClienteNovo/ClienteEdit** — campo foto (upload/remover).
   - **ClienteCard** — trocar iniciais por `Avatar`.
   - **ClienteDetail** — `Avatar` maior (e botão de ver foto).
5. **Observação (NÃO implementar agora):** foto no `CobrancaCard` fica como variante futura (com/sem). Hoje o operador vê a foto abrindo o perfil do cliente (já tem acesso). Documentar a observação no código/DS, não bloquear.

## 5. Padrões a seguir (obrigatórios)

- **Avatar**: componente compartilhado; NUNCA repetir a bola de iniciais inline.
- **Imagem**: sempre via `processarImagem` (resize ≤200px + JPEG/WebP q0.7 → data URL) — nunca guardar arquivo cru.
- **Input**: componente `Field` (forms já migrados).
- **Cores**: SEMPRE tokens (`bg-primary-light`, `text-primary-text`, `bg-card`...) — `npm run audit:styles` falha com cor fixa.
- **i18n**: rótulos em pt-BR, en, es (ex.: `perfil.foto`, `perfil.adicionarFoto`, `perfil.removerFoto`, `perfil.fotoLimite`).
- **Backend**: endpoints seguem o padrão dos controllers (try/catch + codes de erro); escopo por papel (admin/sócio/super_admin) como nos operadores.

## 6. Entregáveis

- [ ] `Avatar.tsx` (foto | iniciais, sizes sm/md/lg/xl)
- [ ] `processarImagem.ts` (resize ≤200px + compressão → data URL; limite de entrada)
- [ ] Colunas `usuarios.foto`/`clientes.foto` + migração idempotente
- [ ] `PATCH /api/auth/foto` + `foto` em login/me/operadores/clientes + aceita em PATCH operadores/POST-PATCH clientes
- [ ] Perfil com upload/remover foto; OperadorForm com foto; ClienteNovo/Edit com foto
- [ ] Aplicar `Avatar` em: Sidebar, OperadoresList, EquipeModal, ContribuicaoModal, OperadorDetail, ClienteCard, ClienteDetail
- [ ] i18n (pt/en/es) completo
- [ ] `npm run build` ✅ · `npm run audit:styles` ✅ · `npm run docs:audit` ✅

## 7. Restrições técnicas

- React + Tailwind **v3** (`frontend/tailwind.config.js`); mobile-first.
- Identidade por CSS variables (`frontend/src/index.css`).
- **Não adicionar libs de imagem/UI** — usar canvas nativo + componentes existentes.
- Foto **normalizada** (data URL ≤ ~20KB) — nunca armazenar original.
- Preservar lógica atual (auth, escopos por papel, BRs).

## 8. Referência

- Plano: `docs/plans/PLAN-041-avatar-foto.md`
- Protótipo/referência visual: identidade "Nexus" (`PLAN-038`) e DS v2.
