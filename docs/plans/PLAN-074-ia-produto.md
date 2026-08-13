# PLAN-074 — IA no Produto (plano mestre)

**Status:** ⏳ Planejado — F1 detalhada em **PLAN-075** · F2-F5 como fases deste plano

**Versão:** 1.0

**Início:** 12/08/2026

**Origem:** backlog **P029 — IA no produto** · decisão de provider 12/08 (Gemini Flash-Lite, free tier)

**Execução:** módulo `ai` novo (compartilhado por todas as fases) + um use-case/endpoint por fase. Fora deste chat, no padrão do projeto.

---

## Visão

**IA como assistente do operador e do admin — nunca no caminho crítico da operação financeira.** Cobrança é rastreável/auditável (BRs); a IA **sugere/gera**, não executa transações. O operador confirma antes. Isso preserva a rastreabilidade (critério de sucesso do produto).

## Princípios transversais

1. **Não-bloqueante:** IA é assíncrona/opcional — botão "gerar sugestão" com loading + **fallback** ao comportamento atual (template/heurística). Operador em campo com rede ruim nunca fica preso.
2. **Multi-tenant/privacidade:** prompt montado **só com dados do escopo resolvido** (`resolveUsuarioAlvo`/empresa); sem PII desnecessária; nada vaza entre empresas.
3. **Rastreabilidade:** toda sugestão de IA é gerada e (se decidido) registrada; nunca executada direto.
4. **Modularização:** módulo `ai` com port + providers + use-case por funcionalidade — padrão Clean Architecture do repo (como mailer/anexos).
5. **Provider com port** (`IGeradorIA` + `ConsoleProvider`/`FailingProvider`/`GeminiProvider`): trocar de provedor = trocar 1 implementação.

## Provider — Gemini Flash-Lite

- **Free tier** (~1.000 RPD) cobre dev/teste e uso pequeno/médio; **produção estável → ativar billing** (~US$1-2/mês).
- Chave `GEMINI_API_KEY` no `.env` do VPS (nunca no repo) · `AI_PROVIDER` seleciona console/fail/gemini.
- Decisão: custo × velocidade × OCR × PT-BR para o perfil (cobrança popular, operador em campo, margem apertada).

## Arquitetura compartilhada

```
src/modules/ai/
├── application/ports/ai.provider.ts        ← IGeradorIA
├── application/use-cases/<Funcionalidade>/  ← um por fase
├── infrastructure/providers/{console,failing,gemini}.provider.ts
└── presentation/routes/ai.routes.ts         ← endpoints por fase
```

Env: `AI_PROVIDER` + `GEMINI_API_KEY` em `.env*` + compose prod/staging.

---

# Fases

## F1 — WhatsApp inteligente (P017) ✅ detalhada

**Entrega:** endpoint `POST /api/ai/whatsapp/sugerir` — mensagem de cobrança personalizada (situação/parcelas/atraso/total) com fallback ao template atual. Comprovante **fora da IA** (só consolida a duplicação de `montarTextoComprovante`).

**Plano:** `PLAN-075-ia-whatsapp.md`

## F2 — Resumo do dia do operador

**Entrega:** gera, ao fechar o dia, um resumo contextual ("Você visitou 12 clientes, 8 pagaram, 3 prometeram pra sexta, 2 não encontrados — sugestão de follow-up"). Botão no painel/rota; fallback = contadores já existentes.

**Dependência:** infra da F1 (provider/port).

## F3 — Priorização de rota

**Entrega:** sugestão de ordem de visita por probabilidade de receber (histórico de pagamento, valor em atraso, dias). **Heurística primeiro** (regras determinísticas — previsível/auditável), IA refina depois. Fallback = ordenação atual (distância/atrasado).

**Dependência:** F1; métricas de histórico já existentes (RotaPage/backend).

## F4 — OCR de anexos (comprovante)

**Entrega:** extrai endereço do comprovante de residência (foto/PDF) para pré-preencher o cadastro. Conecta com a **futura melhoria de miniatura de PDF/imagem** nos anexos (registrada como melhoria futura).

**Dependência:** F1 (infra) + melhoria de anexos (thumb). **Alta complexidade** (multimodal).

## F5 — FAQ/assistente interno do operador

**Entrega:** respostas ancoradas nas BRs/docs (ex.: "como registro uma promessa? o que faço se o cliente não tiver o dinheiro?"). RAG leve sobre as docs; fallback = links para as docs.

**Dependência:** F1; conteúdo das docs já é fonte única (BRs, FLUXOS).

---

# Ordem de execução e gate

- **F1 primeiro** (caso de maior valor + destrava a infra). Ao concluir: validar provider real no free tier, `npm test`, smoke, deploy, uso real.
- F2-F5 abrem conforme prioridade do produto; cada uma detalha em PLAN próprio (padrão `PLAN-075`).

# Critérios de aceite (todas as fases)

- IA não executa transação (só gera/sugere) · fallback ao comportamento atual sempre presente.
- Escopo multi-tenant respeitado (403/404 nas gates) · prompt sem PII desnecessária.
- `tsc` · build · audits · `npm test` · `docs:audit` · smoke 250/250 mantido.
- Chave `GEMINI_API_KEY` só no `.env` do VPS.

# Fora de escopo

- Pagamento pelo WhatsApp / WhatsApp Business API oficial (a F1 só gera o texto; abertura segue `wa.me`).
- Chatbot voltado ao cliente final (a IA assiste o operador/admin).
- Modelo local no VPS (1 CPU/2GB — inviável; provider externo).
