# PLAN-016: Endereço do Comércio + GPS

> **Status: Concluído (implementado em 11/07/2026).** Endereço pessoal × comércio, botão GPS ("Usar local atual") e navegação priorizando `localizacaoComercio` com fallback — ver `ClienteNovo`/`ClienteEdit`/`ClienteDetail` e `buildMapsUrl`.

**Versão:** 1.0  
**Data:** 11/07/2026  
**Status:** Concluído  
**Fase:** 5.6 — Polimento  
**Dependências:** Nenhuma

---

## Resumo

Separar o endereço do cliente em "Endereço Pessoal" (onde mora) e "Endereço do Comércio" (onde cobrar).  
Adicionar botão GPS para capturar localização atual e preencher automaticamente o endereço do comércio.  
O botão "Navegar" passa a usar o endereço do comércio como destino prioritário.

---

## Business Rules

| # | Regra |
|---|---|
| BR-059 | O `endereco` atual permanece como **Endereço Pessoal**. Nenhum comportamento existente é alterado. |
| BR-060 | `enderecoComercio` (logradouro, numero, bairro, cidade, estado) é **opcional**. |
| BR-061 | `localizacao` atual do cliente é **removida**. `localizacaoComercio` (lat, lng) a substitui. |
| BR-062 | Botão **Navegar** usa `enderecoComercio` + `localizacaoComercio`. Se não preenchido, faz fallback para `endereco` (pessoal). |
| BR-063 | Botão **Usar local atual** captura coordenadas GPS do dispositivo e preenche `localizacaoComercio`. |
| BR-064 | WhatsApp e Ligar **não** são afetados — continuam usando `telefone` e `telefoneComercio`. |
| BR-065 | Contratos, Pagamentos, Operações, Caixa e Gasto **não** referenciam endereço do cliente — sem impacto. |

---

## Fases de Implementação

### Fase A — Database (1 arquivo)

| Arquivo | Mudança |
|---|---|
| `src/database.ts` | +7 colunas (`comercioLogradouro`, `comercioNumero`, `comercioBairro`, `comercioCidade`, `comercioEstado`, `comercioLat`, `comercioLng`) no Drizzle schema + SQL CREATE TABLE + ALTER TABLE |

### Fase B — Backend (7 arquivos)

| # | Arquivo | Mudança |
|---|---|---|
| 1 | `src/modules/cliente/domain/cliente.entity.ts` | Tipos `EnderecoComercio`, `LocalizacaoComercio` no `Cliente` |
| 2 | `CreateClienteInput.ts` | Campos novos opcionais (Zod) |
| 3 | `UpdateClienteInput.ts` | Campos novos opcionais (Zod) |
| 4 | `CreateClienteUseCase.ts` | Mapear novos campos |
| 5 | `UpdateClienteUseCase.ts` | Mapear novos campos |
| 6 | `cliente.repository.impl.ts` | `save()`, `update()`, `rowToCliente()` — 7 novos campos |
| 7 | `cliente.repository.impl.ts` | Remover suporte a `localizacao` (lat/lng do endereço pessoal) |

### Fase C — Frontend: Tipos + Schema (2 arquivos)

| # | Arquivo | Mudança |
|---|---|---|
| 1 | `frontend/src/modules/cliente/services/cliente.service.ts` | Tipo `Cliente`: `enderecoComercio?`, `localizacaoComercio?` |
| 2 | `frontend/src/modules/cliente/schemas/cliente.schema.ts` | Campos novos opcionais (Zod) |

### Fase D — Frontend: Formulários (2 arquivos)

| # | Arquivo | Mudança |
|---|---|---|
| 1 | `frontend/src/modules/cliente/pages/ClienteNovo.tsx` | Seção "Endereço do Comércio" + botão GPS |
| 2 | `frontend/src/modules/cliente/pages/ClienteEdit.tsx` | Mesmo + `form.reset()` com dados existentes |

### Fase E — Frontend: Visualização + Navegação (2 arquivos)

| # | Arquivo | Mudança |
|---|---|---|
| 1 | `frontend/src/modules/cliente/components/ClienteCard.tsx` | Mostrar endereço comércio (detail) |
| 2 | `frontend/src/modules/cliente/pages/ClienteDetail.tsx` | Botão Navegar usar coordenadas comércio + fallback |

### Fase F — i18n (3 arquivos)

| # | Arquivo | Mudança |
|---|---|---|
| 1 | `frontend/src/i18n/locales/pt-BR.json` | Labels: `enderecoComercio`, `usarLocalAtual`, `enderecoPessoal` |
| 2 | `frontend/src/i18n/locales/es.json` | Mesmo |
| 3 | `frontend/src/i18n/locales/en.json` | Mesmo |

---

## Checklist de Implementação

### Fase A — Database
- [ ] Drizzle schema: +7 colunas em `clientes`
- [ ] SQL CREATE TABLE: +7 colunas
- [ ] ALTER TABLE migration

### Fase B — Backend
- [ ] `cliente.entity.ts`: `EnderecoComercio`, `LocalizacaoComercio`, remover `localizacao` antigo
- [ ] `CreateClienteInput.ts`: campos novos opcionais
- [ ] `UpdateClienteInput.ts`: campos novos opcionais
- [ ] `CreateClienteUseCase.ts`: mapear novos campos
- [ ] `UpdateClienteUseCase.ts`: mapear novos campos
- [ ] `cliente.repository.impl.ts`: `save()`, `update()`, `rowToCliente()` atualizados

### Fase C — Frontend: Tipos + Schema
- [ ] `cliente.service.ts`: Tipo `Cliente` atualizado
- [ ] `cliente.schema.ts`: Schema atualizado

### Fase D — Frontend: Formulários
- [ ] `ClienteNovo.tsx`: Seção "Endereço do Comércio" + botão GPS + defaultValues
- [ ] `ClienteEdit.tsx`: Seção "Endereço do Comércio" + botão GPS + form.reset()

### Fase E — Frontend: Visualização
- [ ] `ClienteCard.tsx`: Mostrar endereço comércio no detail
- [ ] `ClienteDetail.tsx`: Navegar usar `localizacaoComercio` com fallback

### Fase F — i18n
- [ ] `pt-BR.json`: Labels novos
- [ ] `es.json`: Labels novos
- [ ] `en.json`: Labels novos

### Verificação
- [ ] TypeScript frontend (`npx tsc --noEmit`)
- [ ] TypeScript backend (`npx tsc --noEmit`)
- [ ] Teste manual: criar cliente com endereço comércio
- [ ] Teste manual: editar cliente com endereço comércio
- [ ] Teste manual: botão GPS no form
- [ ] Teste manual: botão Navegar usa endereço comércio
- [ ] Teste manual: clientes existentes (sem endereço comércio) — Navegar faz fallback

---

## Layout do Formulário

```
┌──────────────────────────────────────┐
│ Dados Pessoais                       │
│ ─────────────────────────────────── │
│ Nome                                 │
│ Tel. Cobrança                        │
│ CPF                                  │
│                                      │
│ Endereço Pessoal                     │
│ ─────────────────────────────────── │
│ Logradouro, Número, Bairro...       │
│                                      │
│ Dados do Comércio                    │
│ ─────────────────────────────────── │
│ Comércio                             │
│ Tel. Comércio                        │
│                                      │
│ Endereço do Comércio                 │
│ ─────────────────────────────────── │
│ Logradouro do Comércio              │
│ Número do Comércio                   │
│ Bairro do Comércio                   │
│ Cidade do Comércio                   │
│ Estado do Comércio                   │
│ [📍 Usar local atual]               │
└──────────────────────────────────────┘
```

### Comportamento do GPS

O botão "📍 Usar local atual" usa `navigator.geolocation.getCurrentPosition()`:

1. Se o dispositivo **não suporta** geolocalização → toast de erro "GPS não disponível"
2. Se o usuário **nega** permissão → toast de erro "Permissão de localização negada"
3. Se **sucesso** → preenche `comercioLat` e `comercioLng` no formulário

**Nenhuma API externa é necessária.** O Google Maps resolve coordenadas → endereço quando o operador clica em Navegar.

---

## Escopo Total

| Fase | Arquivos | ~Linhas |
|---|---|---|
| A — Database | 1 | 20 |
| B — Backend | 7 | 50 |
| C — Frontend tipos | 2 | 15 |
| D — Frontend forms | 2 | 80 |
| E — Frontend display | 2 | 25 |
| F — i18n | 3 | 30 |
| **Total** | **~17** | **~220** |
