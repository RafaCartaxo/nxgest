# CHECKLIST — Planos de identidade visual (PLAN-041/042) + briefings Lovable

**Data:** 05/08/2026

**Status:** Planejamento (documentação criada; implementação pendente)

## Entregáveis

- [x] `docs/plans/PLAN-041-avatar-foto.md` — Avatar com foto (usuário/operador/cliente): componente `Avatar`, `processarImagem` (data URL ≤200px), `usuarios.foto`/`clientes.foto`, `PATCH /api/auth/foto`, mapa de superfícies, nota do `CobrancaCard` (fora de escopo)
- [x] `docs/plans/PLAN-042-anexos-cliente.md` — Anexos do cliente: tabela `anexos`, `/data/uploads`, `multer` + limites (imagem ≤1MB / PDF ≤5MB / 413 global), endpoints escopados, **backup inclui uploads**
- [x] `docs/plans/Lovable-Avatar-NXGestao.md` — briefing (padrão do `Lovable-Admin-NXGestao.md`)
- [x] `docs/plans/Lovable-Anexos-NXGestao.md` — briefing
- [x] `docs/plans/README.md` — PLAN-038/039/040/041/042 no registro (status: 038 Concluído · 039 Em andamento · 040/041/042 Planejado)
- [x] `docs/UPDATES.md` — entrada de registro

## Coerência (verificar quando implementar)

- [ ] DS v2: seção **Avatar** + nota de Anexos
- [ ] `05-MAPEAMENTO-TELAS.md`: foto na Sidebar/ClienteCard/ClienteDetail + seção Anexos no §5
- [ ] `02-API.md` + `07-CASOS-DE-USO-API.md`: `PATCH /api/auth/foto`, `foto` em operadores/clientes, endpoints de anexos (limites 413/422, escopo cross-tenant)
- [ ] `06-CASOS-DE-USO.md`: UC de foto + UC do operador anexando comprovante
- [ ] `02-BUSINESS-RULES.md`: BR-101 (foto) e BR-102 (anexos)
- [ ] `npm run build` · `npm run audit:styles` · `npm run docs:audit` ao implementar

## Pendências operacionais (PLAN-042)

- [ ] `multer` no `package.json` · `Dockerfile` cria `/data/uploads`
- [ ] **Backup**: `/opt/scripts/backup-nxgestao.sh` + `deploy.sh` incluem `/data/uploads` · `06-PRODUCAO.md`
