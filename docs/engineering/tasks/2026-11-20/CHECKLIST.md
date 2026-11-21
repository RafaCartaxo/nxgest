# CHECKLIST — Consolidação operacional

**Data:** 20/11/2026. Evidências de infraestrutura no [STATUS](../../../STATUS.md); a versão publicada segue o [último CD concluído](https://github.com/RafaCartaxo/nxgest/actions/workflows/cd.yml).

- [x] Preservar todo WIP anterior em snapshot com hashes e retirar BA10 experimental da árvore ativa.
- [x] Remover migrador/dependências SQLite; alinhar Node24 LTS em instalação, CI e Docker.
- [x] Revisar README, setup, runbook, modelo físico PostgreSQL, QA e índices; preservar telas/fluxos/componentes.
- [x] Corrigir f_unaccent para restauração com search_path vazio, com gate no CI.
- [x] Tratar SIGTERM/SIGINT e conferir encerramento da imagem sem kill forçado.
- [x] Renovar policies até18/02/2027 e permitir somente transição explicitamente aprovada, sem reescrever journal anterior.
- [x] Comprovar CI44838945789→staging44839389817→CD44839684929; runtime24.22.3 e assets públicos conferidos.
- [x] Criar backup real com pausa6s e restaurar20 tabelas/9 anexos no VPS, sem divergências; limpar recursos do ensaio.
- [x] Instalar cron02h/14hUTC com log privado; preservar procedimento anterior em arquivo operacional.
- [x] Copiar banco/anexos e imagens da aplicação/PostgreSQL para fora do VPS; restaurar o conjunto em Docker29 e verificar hash de configuração das imagens importadas.
- [x] Validar Resend pelo mailer compilado Node24 com destinatário simulado; nenhuma caixa humana usada.
- [x] Reproduzir e corrigir acesso/exclusão de anexo por cliente divergente;218 testes unitários/UI e286 cenários API passaram.
- [x] Preparar fechamento com testes de portabilidade de restore e documentação atualizada; a promoção desta revisão é conferida pelo workflow CD.

O snapshot antigo do trabalho BA10 e os protocolos anteriores permanecem arquivados. A estratégia ativa usa manutenção curta explícita; não depende de seus handlers experimentais. Checks de documentação verificam74 rotas API e29 rotas/telas frontend; não equivalem a regressão visual manual completa.
