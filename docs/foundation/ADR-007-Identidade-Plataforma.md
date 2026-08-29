# ADR-007 — Identidade de plataforma: 3 níveis conceituais, 2 de prosa, 1 fonte executável

**Status:** Aprovado

**Versão:** 1.0

**Data:** 28/08/2026

**Relacionados:** PLAN-086 · `docs/foundation/00-NORTH-STAR.md` · `ADR-006` · `docs/product/{00-PROJECT,03-PRD,04-ROADMAP,08-UC-MODULOS}.md` · `src/modules/admin/domain/modules.ts`

---

# Contexto

A documentação de fundação (datada de 27/06/2026) descreve o NX Gest como "sistema de gestão de **cobranças** em campo", mas o produto já andou: o roadmap (§5.10 F4) prevê "um app, vários negócios", o ADR-006 fala do "verdadeiro whitelabel (vários negócios plugáveis)", e a **tela de login em produção** já diz "Gestão centralizada para o seu negócio" e "um hub que conecta… e cresce com novos segmentos". A doc de fundação ficou para trás, criando **duas verdades oficiais** que um leitor novo não consegue reconciliar.

O diagnóstico: a doc está **atrasada, não errada de origem**. O que falta é nomear e travar a camada de plataforma, sem antecipar o F4 (`tipo_negocio`).

# Decisão

O NX Gest é uma **plataforma modular de gestão operacional**, com três níveis conceituais — **2 de prosa, 1 fonte executável**:

| Nível | O que é | Fonte |
|---|---|---|
| **0 — Plataforma (NX Gest)** | Whitelabel modular multi-tenant; escopo por **capacidades**, não por domínio | Prosa (NORTH-STAR/ADR-007) |
| **1 — Vertical ("Crédito em campo")** | Primeiro negócio; herda o escopo de domínio e as BR-001..106 | Prosa (NORTH-STAR) + BRs |
| **2 — Módulo** | Já existe; **não é prosa** — fonte é o **Module Manifest** (`src/modules/admin/domain/modules.ts` + espelho frontend) | Executável (`audit:modules`) |

O nível 1 é **enumerável** (não é positioning vago): `{clientes, contratos, cobrancas, rota, atendidos}` como vertical de crédito em campo, com `caixa`/`gastos` genéricos e `central`/`auth`/`admin` como plataforma — verificável por máquina. Os dois níveis já existem no código; este ADR lhes dá nome.

### Tabela canônica de nomes

| Eixo | Valor canônico | Observações |
|---|---|---|
| Marca | **NX Gest** | "Nexus Gestão" aparece 6×, sempre glosa histórica — leitura oficial aqui |
| Artigo | **"o NX Gest"** (masculino) | 11 ocorrências vs 2 femininas |
| Slug | `nxgest` | `nxgestao` = infra (PLAN-084:23-25), não renomear |
| Design system | Nexus (tokens OKLCH) | — |
| Domínio conceitual | vertical "Crédito em campo" | conceito de doc |
| Conceito de código | `tipo_negocio` (roadmap F4) | conceito de código; "vertical" = rótulo de doc |
| Infra legada | `/opt/nxgestao`, volumes, rede Docker, DuckDNS | proibido renomear (PLAN-084) |

### Critérios de admissão de vertical (falsificáveis um a um)

Uma vertical só entra se atender **todos**:

1. Cabe no Module Manifest com tudo declarado (módulos, superfícies, dados, widgets, capacidades).
2. Preserva o isolamento `empresaId`/`userId`.
3. Rastreabilidade de toda movimentação com valor.
4. UCs/CTs em `06`/`07` + linha em `08-UC-MODULOS.md`.
5. Não exige novo motor de persistência nem novo mecanismo de autorização.
6. Entrega os 3 idiomas (pt-BR/en/es).

### Regra de fronteira

Toda demanda mapeia para **módulo existente** ou **justifica módulo novo** no manifest. O que não mapeia é item de `BACKLOG.md` — protege contra creep dentro do vertical (que a lista de "não é" não cobre).

### Camada `tipo_negocio`: adiada = não antecipar o F4

Os 7 módulos **não formam partição por negócio** — `clientes`, `caixa` (`dependsOn: []`) e `gastos` são genéricos; etiquetá-los como "crédito em campo" seria errado em 3 de 7, e o `audit:modules` passaria a defender uma taxonomia falsa. A camada `tipo_negocio` **receberá um BR numerado no momento em que for escrita** — sem pré-reserva (a reserva de BR-107 foi o erro corrigido em 25/08).

Gatilhos para reabrir o F4 (**A, B ou C disparam sozinhos**):

- **A — Semântico:** dois negócios precisam do mesmo conceito com regra incompatível (colisão de `id`/`labelKey`/`dados`).
- **B — Configuração:** `DEFAULT_MODULOS` deixa de ter resposta única (tenant com default disjunto de outro).
- **C — UX/escala:** `ALL_MODULES` passa de 12 entradas (hoje 7; o `insights` do PLAN-080 leva a 8).
- **D — Contexto** (necessário, insuficiente): 2º negócio com tenant comprometido **e** ≥3 módulos próprios não reaproveitáveis. Sozinho, D só autoriza módulos novos.

### Escopos futuros não comprometidos

"Finanças pessoais" / "evolução pessoal" **ficam fora da Visão**: o isolamento pendura em `usuarios.empresaId` (BR-105/106) e finanças pessoais é B2C sem empresa. Escrever na Visão canônica criaria compromisso que a arquitetura não honra hoje. Entraria como vertical futura **somente** com ADR próprio sobre tenancy de pessoa física (custo declarado) + item de `BACKLOG.md`.

### Nenhuma BR nova

(1) "a plataforma é modular" não governa entidade nem request. (2) O checklist SKILL-009 §4.4 ("toda BR tem ao menos um UC/CT") não seria satisfeito — BR sem CT é dívida permanente. (3) BR-034 não se aplica: não há código de negócio novo.

# Consequências

**Benefícios**
- Fim da contradição interna: um leitor do NORTH-STAR chega à **mesma conclusão** de quem lê o ADR-006 + roadmap + tela de login (teste de pronto do PLAN-086).
- A regra de fronteira dá à doc uma defesa concreta para recusar feature fora de módulo.
- As travas (critérios de admissão + fronteira + domicílio único de BR) impedem o drift de voltar.

**Trade-offs / riscos**
- Plataforma exige disciplina na triagem de demanda (toda feature precisa mapear para módulo).
- Adiar `tipo_negocio` pode parecer falta de ambição — compensado pelos gatilhos A/B/C/D explícitos.

# Referências

- `plans/PLAN-086-identidade-plataforma.md` (o plano deste ADR) · `00-NORTH-STAR.md` · `ADR-006` · `08-UC-MODULOS.md`
- `src/modules/admin/domain/modules.ts` · `frontend/src/shared/modules/modules.ts` · `AGENTS.md`