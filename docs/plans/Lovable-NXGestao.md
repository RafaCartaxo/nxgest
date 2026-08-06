# NX Gestão — Redesign de Identidade Visual (briefing para IA)

> [!warning] **SUPERSEDED — breve desatualizado**
> Este briefing é a **primeira versão** da identidade (pré-redesign "Nexus" e anterior à referência de UI viva).
> **Fonte viva:** `docs/plans/Lovable-Admin-NXGestao.md` (identidade do admin) e o repo de referência
> **`RafaCartaxo/site-personality-plus`** (`src/components/nx/` — kit/ui/cobranca/ModulosModal) + a documentação
> de engenharia (`docs/engineering/design/02-DESIGN-SYSTEM.md`, `04-UI-COMPONENTS.md`, `05-TOKEN.md`).
> Mantido apenas como histórico — não usar como referência de implementação.

## 1. O produto

**NX Gestão** ("Nexus Gestão") é uma plataforma de **gestão multi-negócio (whitelabel)**.
Hoje atende **cobrança em campo** (microcrédito/financeira popular): o operador coleta
pagamentos na rua, pelo celular. Amanhã pode atender **outros segmentos** (associados,
mensalidades, pedidos, etc.). Por isso a identidade precisa ser **agnóstica a vertical**.

**Perfis de usuário:**
- **Operador de campo** — celular, uso rápido e em pé (mobile-first é obrigatório).
- **Admin / Sócio** — back-office no desktop, painel administrativo.
- **Super admin** — multi-empresa (whitelabel), gerencia empresas e módulos.

## 2. Conceito de marca

- **"NX" = Nexus** — a **central que conecta vários negócios** num só lugar.
- **Logo:** um **cérebro formado por links/neurônios conectados** — uma rede de nós
  orbitando um **hub central** (o Nexus). Comunica "central" e "conexão" (ideia de
  "2 cérebros unificados" / um hub que agrega tudo). Opcional: o "N" nasce da malha.
- **Tagline:** "Gestão centralizada para o seu negócio".
- O logo deve funcionar **pequeno** (navbar/sidebar, favicon) e **grande** (tela de login),
  herdando a cor do tema (usar `currentColor` / variável CSS).

## 3. Identidade atual (base para evoluir, NÃO partir do zero)

**Linguagem:** limpa, moderna, discreta; muito espaço em branco; bordas leves; cores
**apenas para comunicar estados**; valores financeiros sempre em destaque. Mobile-first,
React + TailwindCSS.

**Cores (tokens light, tema "azul"):**
- Primária `#2563EB` · hover `#1D4ED8` · light `#DBEAFE` · text `#1E40AF`
- Sucesso `#16A34A` · Aviso `#CA8A04` · Erro `#DC2626` · Info `#2563EB` · Secundária `#6B7280`
- Superfícies `#FFFFFF` / `#F9FAFB` / hover `#F3F4F6`
- Textos `#1F2937` / `#6B7280` / `#9CA3AF` · Bordas `#D1D5DB` / `#E5E7EB`
- **Dark mode** completo (primária `#3B82F6`, superfície `#111827`)

**Gradientes:**
- Fundo da página: `linear-gradient(160deg,#EFF6FF,#F5F3FF,#FFFBEB)` (azul→violeta→âmbar suave); dark `#0B1120→#111827→#1E1B4B`
- Destaque (botão/banner): `linear-gradient(135deg,#2563EB,#7C3AED)`
- Texto em gradiente: `linear-gradient(135deg,#2563EB,#DB2777)`

**5 temas de usuário** (trocam primária + gradientes, com light/dark):
default (azul) · aurora (violeta/rosa) · ocean (ciano/teal) · grape (violeta/magenta) · sunset (laranja/rosa).
**O usuário continua podendo trocar de tema.**

**Tipografia:** Inter. Escala: título página 28/SemiBold · seção 22 · card 18 ·
**valor financeiro 24/Bold** · corpo 16 · auxiliar 14 · legenda/badge 12. Inputs ≥ 16px.

**Espaçamento/borda:** múltiplos de 8 (4/8/16/24/32/40/48); raio padrão **12px**;
sombras discretas (preferir borda leve).

**Componentes:** Card (list/detail) · KpiCard (azul/verde/amarelo/cinza/erro/info) ·
StatusBadge · Button/ButtonLink · Modal base · SearchBar · EstadoTela (loading/erro/vazio) ·
QuickActions · CobrancaCard (dot vermelho=atrasado / azul=vence hoje) ·
ParcelaList (verde=Paga, azul=Parcial/Vence hoje, amarelo=Pendente, vermelho=Vencida).

**Telas principais:** Login · Central de Operações (KPIs) · Cobranças do dia · Rota ·
Clientes · Contratos · Caixa · Painel Admin · Empresas (super admin, whitelabel).
Layout atual: navbar de **topo** (abas horizontais) + conteúdo `max-w-2xl`.

## 4. O que quero que você proponha

1. **Logo/ícone "Nexus"** (SVG): cérebro em rede neural com hub central; versões
   **sm** (sidebar/navbar + favicon) e **lg** (login); herda cor do tema.
2. **Paleta de marca** (light + dark) que **mantenha os estados semânticos** legíveis
   (verde=ok, âmbar=parcial, vermelho=erro/atraso, azul=info) e **dialogue com os 5 temas**.
3. **Tipografia:** manter Inter ou propor um par (títulos × corpo) coeso.
4. **Estilo de componentes** com personalidade de marca — cards, KPIs, badges, botões,
   inputs — sem perder leitura rápida no celular.
5. **Login/landing redesenhado**: logo grande + "NX Gestão" + tagline + card de acesso.
6. **Navbar lateral (sidebar)**:
   - **Desktop:** painel fixo à esquerda — **logo no topo**, navegação vertical
     (Central, Clientes, Contratos, Caixa; + Admin/Empresas por papel),
     **rodapé com usuário + configurações** (tema, idioma, perfil, sair).
     Conteúdo à direita (pode manter `max-w-2xl`).
   - **Celular:** **drawer hamburger** (slide-in) + barra fina de topo com hamburger + logo.
7. **Tokens como CSS variables** (`--color-*`, `--gradient-*`) + classes Tailwind,
   compatíveis com: dark mode, 5 temas de usuário e **marca por empresa (whitelabel)** —
   a cor primária do tenant deve ser a base quando o usuário usa o tema "default".

## 5. Restrições técnicas

- React + TailwindCSS, identidade **100% dirigida por CSS variables** (sem hardcode de cor).
- Mobile-first; princípios: clareza, rapidez, simplicidade, cores só para estado.
- Sem depender de imagens externas (logo como SVG inline / componente).
- Entregar: especificação visual + tokens + direção de componentes (e o SVG do logo).

## 6. Entregáveis esperados

- [ ] SVG do logo Nexus (sm/lg + favicon)
- [ ] Paleta light/dark com estados semânticos
- [ ] Especificação tipográfica
- [ ] Estilo de componentes (cards, KPIs, badges, botões, inputs)
- [ ] Layout da página de login/landing
- [ ] Layout da sidebar (desktop fixa + mobile drawer)
- [ ] Tokens CSS (`--color-*`, `--gradient-*`) prontos para integrar
