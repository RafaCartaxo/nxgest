# STATUS — consolidação operacional

**Conferência:** 20/11/2026. Os runs abaixo identificam a validação da infraestrutura. Para a revisão atualmente publicada, consultar o [último CD concluído](https://github.com/RafaCartaxo/nxgest/actions/workflows/cd.yml); promoções posteriores seguem o mesmo fluxo.

## Ambiente e publicação

| Item | Estado / evidência |
|---|---|
| Produção | https://nxgest.com.br |
| Homologação | https://nxgestao.duckdns.org |
| Stack | Node 24.22.3 / PostgreSQL 16 / Express / React-Vite / Caddy / Resend |
| Revisão da conferência de infraestrutura | `13404ab1c21fe8adc291320ff103b2a3e1f4b1ac` |
| CI | [44838945789 — success](https://github.com/RafaCartaxo/nxgest/actions/runs/44838945789) |
| Staging | [44839389817 — success](https://github.com/RafaCartaxo/nxgest/actions/runs/44839389817) |
| CD e finalização | [44839684929 — success](https://github.com/RafaCartaxo/nxgest/actions/runs/44839684929) |
| Conferência externa | Health/DB conectados e quatro assets públicos idênticos aos containers, nos dois ambientes |
| Controlador fixado nos dois ambientes | `13404ab1c21fe8adc291320ff103b2a3e1f4b1ac` |
| Policies | Válidas até **18/02/2027 23:59:59 UTC** |
| Aprovações | Environments staging e production preservados; modo pré-clientes |

O gatilho é **push/merge main → CI → Staging verificado → CD**. Staging e produção mantêm aprovação por environment. PR e CI manual não publicam. O build é único; a mesma imagem atestada é promovida. A renovação de policies tem transição explícita e preserva o journal anterior. Ver [runbook](engineering/06-PRODUCAO.md).

## Backup e recuperação conferidos

- Conjunto de referência: `20261120T235320Z-1032473-28155`, banco e anexos associados; aplicação retomada em **6 segundos**.
- Restore real no VPS: **20 tabelas e 9 anexos**, sem divergências ou arquivos órfãos; recursos temporários removidos.
- Cópia externa privada: dump, uploads, metadados, checksums e imagens exatas da aplicação/PostgreSQL. Restore da mesma cópia passou em outra máquina com Docker 29.6.2; VPS usa Docker 26.1.3.
- Cron instalado: **02h e 14h UTC**, `/etc/cron.d/nxgest-backup`; log privado. Novos conjuntos são locais ao VPS; a cópia externa periódica ainda é responsabilidade operacional.
- Imagens importadas com outro identificador só são aceitas quando a configuração exportada corresponde ao hash original. Não editar metadados do bundle para contornar a verificação.

Procedimento atual: [backup e recuperação](engineering/09-BACKUP-ROLLBACK.md). Não há restauração automática do banco pelo CD.

## Instalação, e-mail e fluxos

Instalação limpa (`npm ci`), build backend/frontend e Docker foram validados com Node24. O [setup de outra máquina](engineering/08-SETUP-NOVA-MAQUINA.md) usa PostgreSQL, sem SQLite/Redis, e distingue desenvolvimento de reconstrução do VPS.

Resend aceitou o envio pelo runtime Node24 ao destinatário simulado oficial (`delivered@resend.dev`), HTTP200. Isso valida integração de envio, sem afirmar entrega em caixa humana. Timeout e indisponibilidade retornam erro sanitizado.

A validação local do fechamento registrou **218 testes unitários/UI em 47 arquivos** e **286/286 cenários de API**, incluindo recusa de leitura/exclusão de anexo sob cliente diferente. Os testes reproduziram essa falha antes da correção. Auditorias cruzam 74 rotas API e 29 rotas/telas frontend; tipos, build, UI, estilos, módulos, docs e links passaram. Não foi repetida uma regressão visual manual de todas as telas.

## Organização e próxima evolução

Todo WIP anterior foi preservado com hashes fora da árvore ativa antes da consolidação. BA10 e migrador SQLite foram retirados do produto atual. Scripts de segurança, deploy e recuperação ainda usados permanecem; registros operacionais referenciados pelo controlador não são resíduos.

[Telas](engineering/05-MAPEAMENTO-TELAS.md), [fluxos de uso](product/06-CASOS-DE-USO.md), [API](product/07-CASOS-DE-USO-API.md), [componentes](engineering/design/04-UI-COMPONENTS.md) e [cobertura visual](engineering/design/UI-COVERAGE.md) foram preservados para a repaginação. [Atualizações](UPDATES.md) e [checklist](engineering/tasks/2026-11-20/CHECKLIST.md) registram a consolidação; o [snapshot antigo](arquivo/STATUS-2026-08-28.md) é histórico.

## Inventário visual e backup periódico — revisão21/11

O inventário agora é derivado do código e distingue29 rotas concretas,28 arquivos de página, shell autenticado e ContaSuspensaScreen. Há118 arquivos com JSX,135 declarações com JSX e1.872 ocorrências; não são135 telas nem aprovação visual. O comando docs:visual reconcilia os artefatos e o gate documental detecta alterações não regeneradas. [Inventário completo](engineering/design/UI-INVENTORY.md).

O job real das02hUTC criou o conjunto20261121T020001Z-1098303-1910 e seu restore foi conferido (20 tabelas,9 anexos, sem divergências). O ensaio semanal usa backup-verify-latest.sh; os detalhes de implantação e limites estão no [runbook de backup](engineering/09-BACKUP-ROLLBACK.md). Off-site periódico e alertas externos ainda exigem destino/canal definidos.
