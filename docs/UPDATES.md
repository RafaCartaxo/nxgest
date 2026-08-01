# Atualizações

Registro resumido das alterações recentes — melhorias e correções, para acompanhamento. Detalhes completos nos PLANs linkados.

## 01/08/2026 — PLAN-023 · Ajustes pós-validação

**Corrigido**
- **Tela em branco na Rota de Cobrança** ao visitar o último cliente pendente — o índice de navegação usava `items.length` (não encolhe ao visitar) em vez de `sortedItems.length` (só pendentes). Adicionado fallback visual de carregamento no lugar do render vazio.
- **Parcela que vence hoje sem destaque** — agora tem estilo próprio "Vence Hoje" (precedência: vencida > vence hoje > pendente) e contador separado no resumo.

**Melhorado**
- **Filtro "Todos" dos atendidos** passa a incluir os pagamentos do dia, deduplicados (cliente que pagou não aparece duas vezes).
- **Lista de atrasados** ganhou resumo (clientes distintos + valor total) e **histórico de 30 dias** — snapshot diário automático a cada abertura das cobranças, com endpoint `GET /api/operacoes/historico-atrasos` e BR-086.

Referência: [PLAN-023](plans/PLAN-023-ajustes-pos-validacao.md)

## 01/08/2026 — PLAN-021/022 · Painel admin

**Melhorado**
- Painel admin com contexto de empresa, KPIs por seção, Admins × Operadores, login por role e engrenagem na navbar.
- "Contratos Ativos" agora conta só `estado = 'Ativo'` (Finalizado/Cancelado excluídos) — BR-085.
- Resultado do Dia em módulo com cor verde/vermelha + tooltip de composição; header indica o nível (admin/empresa + badge); idioma movido para a engrenagem.

Referência: [PLAN-021](plans/PLAN-021-admin-contexto-kpis.md) · [PLAN-022](plans/PLAN-022-admin-kpis-ajuste.md)
