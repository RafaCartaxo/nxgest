# ROTA — Regressão + CTs (PLAN-062)

**Data:** 07/08/2026

**Status:** Pronto para execução (regressão em DEV após a implementação do PLAN-062)

> Suíte de regressão da tela Rota do dia (`/rota`). Cobre o comportamento atual (anti-regressão) e as mudanças planejadas (progresso Lovable, card de ações, "Parada X de Y", modais 3→2, extras). `CobrancaCard` intocado.
>
> Formato: Dado / Quando / Então. Marcar ✅/❌ após validar em DEV.

## Grupo A — Estados da página

- **ROT-CT-01** Carregar com pendências — Dado rota com N pendentes | Quando abre `/rota` | Então carrossel mostra as paradas e contador **"Parada 1 de N"**.
- **ROT-CT-02** Erro de API — Dado falha no `listarCobrancasDoDia` | Quando carrega | Então `EstadoTela` de erro + "Tentar novamente" refaz o fetch.
- **ROT-CT-03** Rota vazia — Dado sem cobranças e sem pagamentos | Quando abre | Então "Nenhuma cobrança pendente".
- **ROT-CT-04** Tudo atendido — Dado todos com resultado/pagamento | Quando abre | Então `SuccessState` "✓ Todos os X clientes" + "Ver resumo" → `/atendidos`.
- **ROT-CT-05** GPS ativo — Dado geolocalização ok | Quando abre | Então ordena por distância + badge **"GPS ativo"**.
- **ROT-CT-06** GPS inativo — Dado sem permissão/coordenadas | Quando abre | Então banner "ordem padrão" + badge **"GPS inativo"**.
- **ROT-CT-07** Foco inicial — Dado `rotaIndice`/`focusKey` (da Central "Ver na Rota") | Quando abre | Então posiciona na parada certa.

## Grupo B — Botões de ação da parada (linha 1)

- **ROT-CT-08** Navegar com alvo — Dado `rota:navegar` ativa + alvo navegável | Quando clica | Então abre `buildMapsUrl` do alvo.
- **ROT-CT-09** Navegar sem alvo — Dado item sem coords e sem endereço | Quando renderiza | Então botão **desabilitado**.
- **ROT-CT-10** Navegar off — Dado capacidade `rota:navegar` off | Quando renderiza | Então botão **oculto**.
- **ROT-CT-11** WhatsApp — Dado `rota:whatsapp` ativa | Quando clica | Então `wa.me/55{telefone}` com template (nome + valor interpolados).
- **ROT-CT-12** WhatsApp off — Dado capacidade off | Quando renderiza | Então oculto.
- **ROT-CT-13** Ligar — Dado `rota:ligar` ativa | Quando clica | Então `tel:+55{telefone}`.
- **ROT-CT-14** Ligar off — Dado capacidade off | Quando renderiza | Então oculto.
- **ROT-CT-15** Abrir contrato + voltar — Dado parada na posição K | Quando clica "Abrir contrato" e volta | Então navega `/contratos/:id` e **retorna à MESMA parada** (`rotaIndice` preservado).
- **ROT-CT-16** Parada única — Dado 1 pendente | Quando abre | Então "Parada 1 de 1", prev/next desabilitados.

## Grupo C — Registrar pagamento (gatilho + dados gerados)

- **ROT-CT-17** Abrir modal — Dado parada com saldo | Quando clica **"Registrar pagamento"** | Então abre modal de pagamento (1º passo: valor + preview).
- **ROT-CT-18** Valor sugerido — Dado `proximaParcela > 0` | Quando abre | Então valor = próxima parcela; saldo restante exibido.
- **ROT-CT-19** Preview debounced — Dado digitação de valor | Quando para de digitar (~300ms) | Então preview mostra parcelas quitadas/parciais/saldo excedente corretos.
- **ROT-CT-20** Confirmar + comprovante no MESMO modal — Dado valor válido | Quando confirma | Então `createPagamento` ok → modal **fica aberto no passo comprovante** (canvas + Compartilhar/WhatsApp) — **total 2 modais**.
- **ROT-CT-21** Comprovante gerado — Então canvas 320×440, PNG `comprovante.png` com: Cliente, Valor pago (`R$ x,xx`), Parcelas, Saldo devedor, Data; texto do WhatsApp correto.
- **ROT-CT-22** Compartilhar — Dado suporte a `navigator.share` com arquivo | Quando clica | Então compartilha o PNG; fallback texto.
- **ROT-CT-23** WhatsApp comprovante — Dado `pagamento:comprovante_whatsapp` ativa | Quando clica | Então `waUrl` com texto; capacidade off → botão oculto.
- **ROT-CT-24** Valor 0 — Quando confirma com 0 | Então erro "valor deve ser positivo"; modal permanece.
- **ROT-CT-25** Valor excedente — Quando valor > saldo devedor | Então erro "não pode exceder"; modal permanece.
- **ROT-CT-26** Erro de API — Dado falha no `createPagamento` | Quando confirma | Então mensagem de erro; nada registrado; modal permanece.
- **ROT-CT-27** Enviando — Quando processa | Então botões desabilitados + spinner "Processando…" (sem duplo submit).
- **ROT-CT-28** Cancelar — Quando fecha sem confirmar | Então nada registrado.
- **ROT-CT-29** Pós-pagamento — Dado pagamento quita a parada | Quando fecha o modal | Então feedback sucesso + refetch + parada sai da rota + `eventBus`.
- **ROT-CT-30** Modais da rota = exatamente **2** (Pagamento c/ comprovante integrado + Promessa) — verificação estrutural.

## Grupo D — Promessa / Visitado / Não encontrado

- **ROT-CT-31** Promessa — Dado botão "Promessa" | Quando confirma data (default hoje) | Então `registrarVisita(promessa)` + feedback + refetch.
- **ROT-CT-32** Cancelar promessa — Quando cancela | Então nada registrado.
- **ROT-CT-33** Visitado — Quando clica | Então `registrarVisita(visitado)` + feedback + refetch.
- **ROT-CT-34** Não encontrado — Quando clica | Então `registrarVisita(nao_localizado)` + feedback + refetch.
- **ROT-CT-35** Botões ocultos — Dado resultado já registrado na parada | Quando renderiza | Então oculta o respectivo botão (visitado/nao encontrado/promessa).
- **ROT-CT-36** Erro de visita — Dado falha no registro | Quando confirma | Então feedback erro; `operando` desfeito; item permanece na rota.
- **ROT-CT-37** Concorrência — Dado qualquer ação em andamento | Quando tenta outra ação | Então todos os botões desabilitados (`operando`).

## Grupo E — Progresso da rota (novo layout)

- **ROT-CT-38** Contadores — Então Pagos = clientes únicos com pagamento hoje; Promessas/Visitados/Pendentes coerentes.
- **ROT-CT-39** % e aria — Então `% = round(completos/total)`, `role="progressbar"` + `aria-valuenow/min/max`.
- **ROT-CT-40** Consistência pós-ação — Dado marcar/pagar/visitar | Quando refetch | Então progresso atualiza sem duplicar contagens.

## Grupo F — Variações / gating

- **ROT-CT-41** Módulo rota off — Quando acessa `/rota` | Então `RequireModule` bloqueia e aba some da tab bar.
- **ROT-CT-42** Combo de capacidades — Dado `navegar` off, `whatsapp/ligar` on | Então só os ativos aparecem.
- **ROT-CT-43** Card regressão — Dado item atrasado vs vence hoje | Então `CobrancaCard` tone danger/info **inalterado** (mesma disposição de informações).
- **ROT-CT-44** Muitas paradas — Dado 20 pendentes | Quando navega | Então contador acompanha, sem estourar, swipe/setas ok.

## Grupo G — Extras

- **ROT-CT-45** Alça no Modal — mobile mostra alça `h-1.5 w-10` no topo; `sm+` sem alça.
- **ROT-CT-46** `<html lang>` — trocar PT/EN/ES | Então `documentElement.lang = pt-BR/en/es`.
- **ROT-CT-47** FAB clientes — `/clientes` (mobile) | Então FAB "Novo cliente" → `/clientes/novo`; desktop → oculto.
- **ROT-CT-48** FAB contratos — `/contratos` (mobile) | Então FAB "Novo contrato" → `/contratos/novo`.
- **ROT-CT-49** FAB desmonta — saindo da lista | Então FAB não aparece em outras rotas.
- **ROT-CT-50** FAB módulo off — lista inacessível | Então FAB inexistente.

---

## Registro de execução (DEV)

| CT | Resultado | Observação |
|---|---|---|
| ROT-CT-01 | ☐ | |
| ROT-CT-02 | ☐ | |
| ... | ☐ | |
