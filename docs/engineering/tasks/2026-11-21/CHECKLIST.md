# CHECKLIST — Inventário visual, branches e backup

- [x] Gerar inventário de rotas, componentes locais/compartilhados, consumidores, DOM/JSX, ícones, props, estados, CSS, temas, traduções e assets a partir do código.
- [x] Reconciliar MAPEAMENTO, UI-COVERAGE, catálogo de componentes, roadmap e índices; distinguir inventário estático de validação visual.
- [x] Integrar detector de divergências no gate documental; fornecer comando de regeneração.
- [x] Arquivar patches de propostas dispensadas e WIP de ícones/Qase; excluir branches integradas/dispensadas e fechar PRs correspondentes sem atualizar dependências.
- [x] Conferir execução real do cron e restaurar o backup agendado; automatizar ensaio periódico, documentar RPO, cópia externa e retenção.
- [x] Validar tipos, build e auditorias; publicar mudanças pelo CI/CD; registrar evidências e limites.

Autorização: usuário dispensou trabalhos antigos, inclusive ícones, autorizou exclusão dos dados de teste e pediu reconciliação de inconsistências. Não é necessário zerar dados para inventariar a interface ou verificar o backup. Destino de off-site periódico e canal de alertas não foram fornecidos.

## Evidências e limites

O backup agendado20261121T020001Z-1098303-1910 foi restaurado com20 tabelas/9 anexos e cleanup completo. Oito testes do parser e11 testes de backup/manutenção passaram; tipos/build e auditorias passaram. Remotas antigas e seis propostas Dependabot foram removidas após bundle/patches; WIP ícones/Qase arquivado e removido. Os dois worktrees legados em /tmp e a branch vinculada foram removidos após autorização explícita e nova conferência dos arquivos/bundles privados. Restou somente main local e remotamente ao fim da entrega anterior. Não foram zerados dados, pois isso não traz benefício ao inventário ou à prova de recuperação.

## Complemento — proteção operacional do backup

- [x] Criar recibo atômico de restauração e monitor somente leitura para backup atrasado (>14h), restore ausente/vencido (>9 dias) e cópia externa configurada sem prova.
- [x] Preparar cópia Restic criptografada de dump, anexos, imagens exatas e configuração; baixar o snapshot completo e conferir hashes antes de emitir recibo.
- [x] Preparar retenção local de 30 dias, protegendo os dois conjuntos mais novos, o último restore e todo conjunto sem recibo externo; nenhuma exclusão sem off-site saudável.
- [x] Versionar instalação dos cron jobs e rotação privada de logs; adicionar workflow externo com chave SSH restrita a leitura.
- [x] Remover procedimento legado de recuperação do guia de nova máquina e apontar o procedimento associado atual.
- [ ] Ativar destino externo: requer conta/bucket privado e credenciais; nenhum serviço pago foi contratado nem RPO externo prometido.

Validação local adicional: 24 testes de backup, incluindo roundtrip real Restic 0.20.0 com repositório local cifrado usado como dublê do transporte remoto. Esse teste não comprova acesso a um bucket externo. O CI provisiona o binário Restic 0.20.0 com SHA256 fixado e executa também esses dois testes. Localmente, habilitar NXGEST_TEST_RESTIC_BIN para executá-los; não há dependência npm nova.

Revisão adicional: falhas de credenciais/preflight são registradas antes de qualquer parada da aplicação. O teste dedicado comprova o marcador de erro e ausência de docker stop nessa situação.

O instalador operacional aceita o checkout detached mantido pelo CD e continua exigindo o SHA exato aprovado, lock livre e ausência de deploy ativo/pendente. Conferência realizada diretamente na VPS antes da instalação.

## Delegação do condutor — mapa operacional e estados

- [x] Partir de STATUS e registrar fontes/configurações/donos em [10-MAPA-OPERACIONAL](../../10-MAPA-OPERACIONAL.md), sem inferir responsável humano.
- [x] Formalizar B2-01 com gatilho e aceite, como pendência não bloqueante; registrar DNS-01/OWN-01 e ALERT-01 separadamente.
- [x] Corrigir caminho legado de backup no contrato ops, índices, claim de off-site concluído no backlog e valores/paletas desatualizados de tokens.
- [x] Verificar transporte Resend pelo mailer compilado: HTTP200,2026-11-21T18:36:29.188Z, sink oficial; nenhum destinatário humano ou alerta automático declarado como validado.
- [x] Cobrir29 rotas × oito eixos na [matriz](../../design/UI-STATES.md), com referências descritivas, evidências AST,12 superfícies condicionais e lacunas explícitas.
- [x] Reconciliar UC-080 duplicado: endereço/GPS→UC-089; registrar UC-090/091 para telas de verificação de e-mail e DevBoard existentes.
- [x] Validar11 testes do inventário e auditorias docs/links. Conferências visuais/funcionais por viewport não foram executadas.
- [ ] ALERT-01: destinatário/canal oficial e ponto de emissão independente ainda indefinidos; cron MAILTO=root sem sendmail não prova entrega. Não criar automação nem alterar configuração de produção fora do CD para contornar.

As lacunas UI-01 (cliente em falha de carga), UI-02 (submit sem disabled), UI-03 (sem404 interna), NAV-01 (Insights sem menu) e a validação visual estão descritas na matriz. Elas não foram corrigidas como comportamento nesta revisão documental. Dono da execução: NX Gest–Solucionador, por delegação do condutor nesta conversa; isso não designa donos permanentes dos serviços.
