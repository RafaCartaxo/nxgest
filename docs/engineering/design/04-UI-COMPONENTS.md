# UI COMPONENTS

Catálogo atual gerado do código por `npm run docs:visual`. Abrange componentes compartilhados, shells/guards/providers e componentes locais de módulos; os contratos abaixo são fonte extraída, não descrições históricas de APIs.

Navegação: [rotas/consumidores/elementos](UI-INVENTORY.md), [cobertura e gate visual](UI-COVERAGE.md), [JSON com cada ocorrência JSX](ui-inventory.json). Para um componente, localizar seu nome neste documento ou usar `node scripts/consumers.mjs Nome`.

## Convenções

Card.Root/KpiCard são cards; Modal implementa overlay/portal e bottom-sheet responsivo; confirmação/empty/skeleton/list-item podem ser composições, não componentes autônomos. Usar nomes exportados reais e conferir o componente no código antes de criar um novo. Preservar semântica, acessibilidade, escopo por perfil/módulo e comportamento ao repaginar.

## frontend/src/App.tsx

Fonte: [frontend/src/App.tsx](../../../frontend/src/App.tsx). Componentes: `App`.

Consumidores diretos: [frontend/src/main.tsx](../../../frontend/src/main.tsx).

### App

Linha 61; exportado. Assinatura:

```typescript

```

## frontend/src/main.tsx

Fonte: [frontend/src/main.tsx](../../../frontend/src/main.tsx). Componentes: composição JSX.

Consumidores diretos: nenhum import direto.

## frontend/src/modules/admin/components/CapacidadesModal.tsx

Fonte: [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx). Componentes: `CapacidadesModal`.

Consumidores diretos: [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx).

### CapacidadesModal

Linha 25; exportado. Assinatura:

```typescript
{ open, empresaNome, initial, modulos, saving, onSave, onClose }: Props
```

### Contrato Props

```typescript
interface Props {
  open: boolean
  empresaNome: string
  /** `null` = todas ativas (ausência de override). */
  initial: string[] | null | undefined
  /** Módulos ativos — capacidade com dono off fica desativada. */
  modulos: string[] | null | undefined
  saving?: boolean
  onSave: (capacidades: string[] | null) => void
  onClose: () => void
}
```

## frontend/src/modules/admin/components/ContribuicaoModal.tsx

Fonte: [frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx). Componentes: `ContribuicaoModal`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx).

### ContribuicaoModal

Linha 19; exportado. Assinatura:

```typescript
{ open, metric, equipe, empresaId, onClose }: Props
```

### Contrato Props

```typescript
interface Props {
  open: boolean
  metric: ContribuicaoMetric
  equipe: EquipeResult | null
  empresaId?: string
  onClose: () => void
}
```

## frontend/src/modules/admin/components/EmpresaForm.tsx

Fonte: [frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx). Componentes: `EmpresaForm`.

Consumidores diretos: [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx).

### EmpresaForm

Linha 32; exportado. Assinatura:

```typescript
{ onSubmit, onCancel, initial }: EmpresaFormProps
```

### Contrato EmpresaFormData

```typescript
interface EmpresaFormData {
  nome: string
  documento?: string
  nomeFantasia?: string
  ativa: boolean
  adminNome: string
  adminEmail: string
}
```

### Contrato EmpresaFormInitial

```typescript
export interface EmpresaFormInitial {
  nome: string
  documento?: string | null
  nomeFantasia?: string | null
  ativa: boolean
}
```

### Contrato EmpresaFormProps

```typescript
interface EmpresaFormProps {
  onSubmit: (data: EmpresaFormData) => void
  onCancel: () => void
  /** Presente = modo edição (esconde os campos de admin). */
  initial?: EmpresaFormInitial
}
```

## frontend/src/modules/admin/components/EmpresaList.tsx

Fonte: [frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx). Componentes: `EmpresaList`.

Consumidores diretos: [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx).

### EmpresaList

Linha 20; exportado. Assinatura:

```typescript
{ empresas, onConfigurar, onRecursos, onEditar }: EmpresaListProps
```

### Contrato EmpresaListProps

```typescript
interface EmpresaListProps {
  empresas: EmpresaComStats[]
  onConfigurar: (empresa: EmpresaComStats) => void
  onRecursos: (empresa: EmpresaComStats) => void
  onEditar: (empresa: EmpresaComStats) => void
}
```

## frontend/src/modules/admin/components/EquipeModal.tsx

Fonte: [frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx). Componentes: `EquipeModal`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx).

### EquipeModal

Linha 18; exportado. Assinatura:

```typescript
{ open, role, operadores, empresaId, onClose }: EquipeModalProps
```

### Contrato EquipeModalProps

```typescript
interface EquipeModalProps {
  open: boolean
  role: "admin" | "operator" | "socio"
  operadores: OperadorRow[]
  empresaId?: string
  onClose: () => void
}
```

## frontend/src/modules/admin/components/ImpactConfirmModal.tsx

Fonte: [frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx). Componentes: `ImpactConfirmModal`.

Consumidores diretos: [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx).

### ImpactConfirmModal

Linha 21; exportado. Assinatura:

```typescript
{ open, impacto, canForce, saving, onConfirm, onClose }: Props
```

### Contrato Props

```typescript
interface Props {
  open: boolean
  impacto: ImpactoDesativacao | null
  canForce: boolean
  saving?: boolean
  onConfirm: (force: boolean, motivo: string) => void
  onClose: () => void
}
```

## frontend/src/modules/admin/components/ModulosModal.tsx

Fonte: [frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx). Componentes: `ModulosModal`.

Consumidores diretos: [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx).

### ModulosModal

Linha 26; exportado. Assinatura:

```typescript
{ open, empresaNome, initial, saving, onSave, onOpenCapacidades, onClose }: Props
```

### Contrato Props

```typescript
interface Props {
  open: boolean
  empresaNome: string
  initial: string[] | null | undefined
  saving?: boolean
  onSave: (modulos: string[]) => void
  onOpenCapacidades?: () => void
  onClose: () => void
}
```

## frontend/src/modules/admin/components/OperadorForm.tsx

Fonte: [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx). Componentes: `OperadorForm`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx).

### OperadorForm

Linha 46; exportado. Assinatura:

```typescript
({ editing, chefes = [], actorRole, onSubmit, onAlterarStatus, onReenviarConvite, onRevogarConvite }: Props, ref)
```

### Contrato FieldErrors

```typescript
interface FieldErrors {
  nome?: string
  email?: string
}
```

### Contrato OperadorFormData

```typescript
export interface OperadorFormData {
  nome: string
  email: string
  telefone: string | null
  role: "admin" | "socio" | "operator"
  chefeId?: string | null
  foto?: string | null
}
```

### Contrato Props

```typescript
interface Props {
  editing: OperadorRow | null
  /** Possíveis chefes (admins + sócios da empresa) — apenas para admin/super. */
  chefes?: OperadorRow[]
  /** Role de quem está criando/gerenciando (admin/socio/super_admin). */
  actorRole?: "admin" | "socio" | "super_admin"
  onSubmit: (data: OperadorFormData) => Promise<void>
  onCancel: () => void
  /** Ações de conta (modo edição) — quando ausentes, a seção "Status da conta" não renderiza. */
  onAlterarStatus?: () => void
  onReenviarConvite?: () => void
  onRevogarConvite?: () => void
}
```

### Contrato OperadorFormHandle

```typescript
export interface OperadorFormHandle {
  submit: () => Promise<void>
}
```

## frontend/src/modules/admin/components/OperadoresList.tsx

Fonte: [frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx). Componentes: `OperadoresList`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx).

### OperadoresList

Linha 36; exportado. Assinatura:

```typescript
{ operadores, empresaId, onEdit, onDelete, onReenviarConvite }: Props
```

### Contrato Props

```typescript
interface Props {
  operadores: OperadorRow[]
  empresaId?: string
  onEdit: (op: OperadorRow) => void
  onDelete: (id: string) => void
  onReenviarConvite: (id: string) => void
}
```

### Contrato RowDef

```typescript
type RowDef = { label: string; items: OperadorRow[] }
```

## frontend/src/modules/admin/components/ReassignModal.tsx

Fonte: [frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx). Componentes: `ReassignModal`.

Consumidores diretos: [frontend/src/modules/admin/hooks/useEditarOperador.ts](../../../frontend/src/modules/admin/hooks/useEditarOperador.ts), [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx).

### ReassignModal

Linha 26; exportado. Assinatura:

```typescript
{ open, reassign, chefes, saving, onConfirm, onClose }: Props
```

### Contrato ReassignState

```typescript
export interface ReassignState {
  operador: OperadorRow
  roleDesejado: "admin" | "socio" | "operator"
  subordinados: number
}
```

### Contrato Props

```typescript
interface Props {
  open: boolean
  reassign: ReassignState | null
  /** Chefes válidos (admins da empresa, excluindo o alvo). */
  chefes: OperadorRow[]
  saving?: boolean
  onConfirm: (novoChefeId: string) => void
  onClose: () => void
}
```

## frontend/src/modules/admin/pages/AdminPage.tsx

Fonte: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx). Componentes: `AdminPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### AdminPage

Linha 28; exportado. Assinatura:

```typescript

```

## frontend/src/modules/admin/pages/OperadorDetail.tsx

Fonte: [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx). Componentes: `OperadorDetail`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### OperadorDetail

Linha 29; exportado. Assinatura:

```typescript

```

## frontend/src/modules/admin/pages/SuperAdminPage.tsx

Fonte: [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx). Componentes: `SuperAdminPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### SuperAdminPage

Linha 30; exportado. Assinatura:

```typescript

```

## frontend/src/modules/auth/components/PublicPageShell.tsx

Fonte: [frontend/src/modules/auth/components/PublicPageShell.tsx](../../../frontend/src/modules/auth/components/PublicPageShell.tsx). Componentes: `PublicPageShell`.

Consumidores diretos: [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx), [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx), [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx), [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx), [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx).

### PublicPageShell

Linha 5; exportado. Assinatura:

```typescript
{ children }: { children: ReactNode }
```

## frontend/src/modules/auth/pages/AtivarPage.tsx

Fonte: [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx). Componentes: `AtivarPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### AtivarPage

Linha 13; exportado. Assinatura:

```typescript

```

## frontend/src/modules/auth/pages/LoginPage.tsx

Fonte: [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx). Componentes: `LoginPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### LoginPage

Linha 12; exportado. Assinatura:

```typescript

```

## frontend/src/modules/auth/pages/PerfilPage.tsx

Fonte: [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx). Componentes: `PerfilPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### PerfilPage

Linha 24; exportado. Assinatura:

```typescript

```

### Contrato PerfilErros

```typescript
interface PerfilErros {
  novoEmail?: string
  senhaAlteracao?: string
}
```

## frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx

Fonte: [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx). Componentes: `RecuperarSenhaPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### RecuperarSenhaPage

Linha 13; exportado. Assinatura:

```typescript

```

## frontend/src/modules/auth/pages/ResetarSenhaPage.tsx

Fonte: [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx). Componentes: `ResetarSenhaPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ResetarSenhaPage

Linha 13; exportado. Assinatura:

```typescript

```

## frontend/src/modules/auth/pages/VerificarEmailPage.tsx

Fonte: [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx). Componentes: `VerificarEmailPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### VerificarEmailPage

Linha 18; exportado. Assinatura:

```typescript

```

## frontend/src/modules/caixa/components/AjustarCaixaModal.tsx

Fonte: [frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx). Componentes: `AjustarCaixaModal`.

Consumidores diretos: [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx).

### AjustarCaixaModal

Linha 17; exportado. Assinatura:

```typescript
{ open, onClose, caixaBase, saldoAtual, title, onAjustar }: AjustarCaixaModalProps
```

### Contrato AjustarCaixaModalProps

```typescript
interface AjustarCaixaModalProps {
  open: boolean
  onClose: () => void
  caixaBase: number
  saldoAtual: number
  /** Título contextual (ex.: "Ajustar Caixa Total" no caixa próprio · "Ajustar caixa base do operador" no operador). */
  title: string
  onAjustar: (valor: number, motivo: string) => Promise<void>
}
```

## frontend/src/modules/caixa/components/AjusteCaixaForm.tsx

Fonte: [frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx). Componentes: `AjusteCaixaForm`.

Consumidores diretos: [frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx).

### AjusteCaixaForm

Linha 26; exportado. Assinatura:

```typescript
{ caixaBase, saldoAtual, onAjustar, onSuccess }: AjusteCaixaFormProps
```

### Contrato AjusteCaixaFormProps

```typescript
interface AjusteCaixaFormProps {
  caixaBase: number
  saldoAtual: number
  onAjustar: (valor: number, motivo: string) => Promise<void>
  onSuccess?: () => void
}
```

## frontend/src/modules/caixa/components/AjusteHistorico.tsx

Fonte: [frontend/src/modules/caixa/components/AjusteHistorico.tsx](../../../frontend/src/modules/caixa/components/AjusteHistorico.tsx). Componentes: `AjusteRow`, `AjusteHistorico`.

Consumidores diretos: [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx).

### AjusteRow

Linha 5; exportado. Assinatura:

```typescript
{ ajuste: a }: { ajuste: AuditoriaCaixaItem }
```

### AjusteHistorico

Linha 36; exportado. Assinatura:

```typescript
{ auditoria }: AjusteHistoricoProps
```

### Contrato AjusteHistoricoProps

```typescript
interface AjusteHistoricoProps {
  auditoria: AuditoriaCaixaItem[]
}
```

## frontend/src/modules/caixa/components/CaixaKpis.tsx

Fonte: [frontend/src/modules/caixa/components/CaixaKpis.tsx](../../../frontend/src/modules/caixa/components/CaixaKpis.tsx). Componentes: `CaixaKpis`.

Consumidores diretos: [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx).

### CaixaKpis

Linha 19; exportado. Assinatura:

```typescript
{ caixa, kpis = ALL, onKpiClick }: CaixaKpisProps
```

### Contrato CaixaKpiKey

```typescript
export type CaixaKpiKey = "caixaBase" | "saldoAtual" | "lucro" | "aReceberHoje" | "recebidoSemana" | "cobradoHoje"
```

### Contrato CaixaKpisProps

```typescript
interface CaixaKpisProps {
  caixa: CaixaStatus
  /** Quais KPIs exibir (default: todos). Permite agrupar por seção (ex.: só "Hoje"). */
  kpis?: CaixaKpiKey[]
  /** Callbacks opcionais por KPI (ex.: abertura de modais). Sem cliques quando ausente. */
  onKpiClick?: Partial<Record<CaixaKpiKey, () => void>>
}
```

## frontend/src/modules/caixa/components/ContratosSemanaModal.tsx

Fonte: [frontend/src/modules/caixa/components/ContratosSemanaModal.tsx](../../../frontend/src/modules/caixa/components/ContratosSemanaModal.tsx). Componentes: `ContratosSemanaModal`.

Consumidores diretos: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx).

### ContratosSemanaModal

Linha 15; exportado. Assinatura:

```typescript
{ open, items, loading, onClose }: ContratosSemanaModalProps
```

### Contrato ContratosSemanaModalProps

```typescript
interface ContratosSemanaModalProps {
  open: boolean
  items: Contrato[]
  loading?: boolean
  onClose: () => void
}
```

## frontend/src/modules/caixa/components/GastosPeriodoModal.tsx

Fonte: [frontend/src/modules/caixa/components/GastosPeriodoModal.tsx](../../../frontend/src/modules/caixa/components/GastosPeriodoModal.tsx). Componentes: `GastosPeriodoModal`.

Consumidores diretos: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx).

### GastosPeriodoModal

Linha 16; exportado. Assinatura:

```typescript
{ open, items, dataInicio, dataFim, loading, onClose }: GastosPeriodoModalProps
```

### Contrato GastosPeriodoModalProps

```typescript
interface GastosPeriodoModalProps {
  open: boolean
  items: GastoItem[]
  dataInicio: string
  dataFim: string
  loading?: boolean
  onClose: () => void
}
```

## frontend/src/modules/caixa/components/MovimentacoesList.tsx

Fonte: [frontend/src/modules/caixa/components/MovimentacoesList.tsx](../../../frontend/src/modules/caixa/components/MovimentacoesList.tsx). Componentes: `MovimentacaoRow`, `MovimentacoesList`.

Consumidores diretos: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx).

### MovimentacaoRow

Linha 7; exportado. Assinatura:

```typescript
{ movimentacao: m }: { movimentacao: MovimentacaoItem }
```

### MovimentacoesList

Linha 52; exportado. Assinatura:

```typescript
{ movimentacoes }: MovimentacoesListProps
```

### Contrato MovimentacoesListProps

```typescript
interface MovimentacoesListProps {
  movimentacoes: MovimentacaoItem[]
}
```

## frontend/src/modules/caixa/pages/CaixaPage.tsx

Fonte: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx). Componentes: `CaixaPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### CaixaPage

Linha 33; exportado. Assinatura:

```typescript

```

## frontend/src/modules/cliente/components/AnexosSection.tsx

Fonte: [frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx). Componentes: `AnexoRow`, `AnexosSection`.

Consumidores diretos: [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx).

### AnexoRow

Linha 21; local. Assinatura:

```typescript
{ anexo, onAbrir, onRemover }: { anexo: AnexoDto; onAbrir: () => void; onRemover: (id: string) => void }
```

### AnexosSection

Linha 68; exportado. Assinatura:

```typescript
{ clienteId }: Props
```

### Contrato Props

```typescript
interface Props {
  clienteId: string
}
```

## frontend/src/modules/cliente/components/ClienteCard.tsx

Fonte: [frontend/src/modules/cliente/components/ClienteCard.tsx](../../../frontend/src/modules/cliente/components/ClienteCard.tsx). Componentes: `ClienteCard`.

Consumidores diretos: [frontend/src/modules/cliente/components/ClienteInfo.tsx](../../../frontend/src/modules/cliente/components/ClienteInfo.tsx), [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx).

### ClienteCard

Linha 21; local. Assinatura:

```typescript
{ cliente, variant }: ClienteCardProps
```

### Contrato ClienteCardProps

```typescript
interface ClienteCardProps {
  cliente: Cliente
  variant: "list-item" | "detail"
}
```

## frontend/src/modules/cliente/components/ClienteForm.tsx

Fonte: [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx). Componentes: `EnderecoFields`, `ClienteForm`.

Consumidores diretos: [frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../../frontend/src/modules/cliente/pages/ClienteEdit.tsx), [frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../../frontend/src/modules/cliente/pages/ClienteNovo.tsx).

### EnderecoFields

Linha 72; local. Assinatura:

```typescript
{ prefix, comComplemento, register, errors, t, setValue, onCepResolved, onCepInvalid, onCepChanged }: EnderecoFieldsProps
```

### ClienteForm

Linha 159; exportado. Assinatura:

```typescript
{ initial = null, onSubmit, onCancel }: ClienteFormProps
```

### Contrato ClienteFormProps

```typescript
interface ClienteFormProps {
  /** Cliente a editar (null = novo). */
  initial?: Cliente | null
  /** Executa o create/update real (pode lançar ApiError). */
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}
```

### Contrato EnderecoFieldsProps

```typescript
interface EnderecoFieldsProps {
  prefix: "comercio" | ""
  comComplemento: boolean
  register: UseFormRegister<ClienteFormData>
  errors: FieldErrors<ClienteFormData>
  t: TFunction
  setValue: UseFormSetValue<ClienteFormData>
  onCepResolved: (prefix: "comercio" | "", resultado: ResultadoCep) => Promise<void>
  onCepInvalid: (prefix: "comercio" | "") => void
  onCepChanged: (prefix: "comercio" | "") => void
}
```

### Contrato BlocoGps

```typescript
type BlocoGps = {
  coords: { lat: number; lng: number } | null
  estado: GpsEstado
  origem: "gps" | "cep_aproximado" | null
  aviso: string | null
}
```

## frontend/src/modules/cliente/components/ClienteInfo.tsx

Fonte: [frontend/src/modules/cliente/components/ClienteInfo.tsx](../../../frontend/src/modules/cliente/components/ClienteInfo.tsx). Componentes: `ClienteInfo`.

Consumidores diretos: [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx).

### ClienteInfo

Linha 8; exportado. Assinatura:

```typescript
{ cliente }: ClienteInfoProps
```

### Contrato ClienteInfoProps

```typescript
interface ClienteInfoProps {
  cliente: Cliente
}
```

## frontend/src/modules/cliente/components/SituacaoFinanceira.tsx

Fonte: [frontend/src/modules/cliente/components/SituacaoFinanceira.tsx](../../../frontend/src/modules/cliente/components/SituacaoFinanceira.tsx). Componentes: `SituacaoFinanceira`.

Consumidores diretos: [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx).

### SituacaoFinanceira

Linha 11; exportado. Assinatura:

```typescript
{ cliente }: SituacaoFinanceiraProps
```

### Contrato SituacaoFinanceiraProps

```typescript
interface SituacaoFinanceiraProps {
  cliente: Cliente
}
```

## frontend/src/modules/cliente/pages/ClienteDetail.tsx

Fonte: [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx). Componentes: `ClienteDetail`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ClienteDetail

Linha 21; exportado. Assinatura:

```typescript

```

## frontend/src/modules/cliente/pages/ClienteEdit.tsx

Fonte: [frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../../frontend/src/modules/cliente/pages/ClienteEdit.tsx). Componentes: `ClienteEdit`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ClienteEdit

Linha 11; exportado. Assinatura:

```typescript

```

## frontend/src/modules/cliente/pages/ClienteList.tsx

Fonte: [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx). Componentes: `ClienteList`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ClienteList

Linha 18; exportado. Assinatura:

```typescript

```

## frontend/src/modules/cliente/pages/ClienteNovo.tsx

Fonte: [frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../../frontend/src/modules/cliente/pages/ClienteNovo.tsx). Componentes: `ClienteNovo`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ClienteNovo

Linha 8; exportado. Assinatura:

```typescript

```

## frontend/src/modules/contrato/components/ClienteSelect.tsx

Fonte: [frontend/src/modules/contrato/components/ClienteSelect.tsx](../../../frontend/src/modules/contrato/components/ClienteSelect.tsx). Componentes: `ClienteSelect`.

Consumidores diretos: [frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx), [frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx).

### ClienteSelect

Linha 21; exportado. Assinatura:

```typescript
{ value, onChange, clientes, error }: ClienteSelectProps
```

### Contrato ClienteResumoSelect

```typescript
export interface ClienteResumoSelect {
  id: string
  nome: string
  telefone?: string
  bairro?: string
}
```

### Contrato ClienteSelectProps

```typescript
interface ClienteSelectProps {
  value: string | null
  onChange: (id: string) => void
  clientes: ClienteResumoSelect[]
  error?: string
}
```

## frontend/src/modules/contrato/components/ContratoCard.tsx

Fonte: [frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx). Componentes: `BadgePeriodicidade`, `ContratoCard`.

Consumidores diretos: [frontend/src/modules/contrato/components/ContratoInfo.tsx](../../../frontend/src/modules/contrato/components/ContratoInfo.tsx), [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx).

### BadgePeriodicidade

Linha 16; local. Assinatura:

```typescript
{ c }: { c: Contrato }
```

### ContratoCard

Linha 27; local. Assinatura:

```typescript
{ contrato: c, variant }: ContratoCardProps
```

### Contrato ContratoCardProps

```typescript
interface ContratoCardProps {
  contrato: Contrato
  variant: "list-item" | "detail"
}
```

## frontend/src/modules/contrato/components/ContratoForm.tsx

Fonte: [frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx). Componentes: `ContratoForm`.

Consumidores diretos: [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx), [frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx).

### ContratoForm

Linha 36; exportado. Assinatura:

```typescript
{ mode, clientes = [], clienteFixado, initial, onSubmit, onCancel }: ContratoFormProps
```

### Contrato ContratoSubmit

```typescript
export interface ContratoSubmit {
  clienteId?: string
  valorBase: number
  percentualJuros: number
  quantidadeParcelas: number
  periodicidade: Periodicidade
  dataInicio: string
}
```

### Contrato ContratoFormProps

```typescript
interface ContratoFormProps {
  mode: "novo" | "editar"
  /** Lista p/ o seletor buscável (novo). */
  clientes?: ClienteResumoSelect[]
  /** Cliente fixado (edit ou novo via ?clienteId=) — exibido em Card read-only. */
  clienteFixado?: { id: string; nome: string }
  initial?: Partial<ContratoFormData>
  onSubmit: (data: ContratoSubmit) => Promise<void>
  onCancel: () => void
}
```

## frontend/src/modules/contrato/components/ContratoInfo.tsx

Fonte: [frontend/src/modules/contrato/components/ContratoInfo.tsx](../../../frontend/src/modules/contrato/components/ContratoInfo.tsx). Componentes: `ContratoInfo`.

Consumidores diretos: [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx).

### ContratoInfo

Linha 8; exportado. Assinatura:

```typescript
{ contrato }: ContratoInfoProps
```

### Contrato ContratoInfoProps

```typescript
interface ContratoInfoProps {
  contrato: Contrato
}
```

## frontend/src/modules/contrato/components/ParcelaList.tsx

Fonte: [frontend/src/modules/contrato/components/ParcelaList.tsx](../../../frontend/src/modules/contrato/components/ParcelaList.tsx). Componentes: `ParcelaList`.

Consumidores diretos: [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx).

### ParcelaList

Linha 37; exportado. Assinatura:

```typescript
{ parcelas, onPagar }: ParcelaListProps
```

### Contrato ParcelaListProps

```typescript
interface ParcelaListProps {
  parcelas: Parcela[]
  onPagar?: (parcela: Parcela) => void
}
```

## frontend/src/modules/contrato/pages/ContratoDetail.tsx

Fonte: [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx). Componentes: `ContratoDetail`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ContratoDetail

Linha 81; exportado. Assinatura:

```typescript

```

## frontend/src/modules/contrato/pages/ContratoEdit.tsx

Fonte: [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx). Componentes: `ContratoEdit`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ContratoEdit

Linha 13; exportado. Assinatura:

```typescript

```

## frontend/src/modules/contrato/pages/ContratoList.tsx

Fonte: [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx). Componentes: `ContratoList`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ContratoList

Linha 16; exportado. Assinatura:

```typescript

```

## frontend/src/modules/contrato/pages/ContratoNovo.tsx

Fonte: [frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx). Componentes: `ContratoNovo`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ContratoNovo

Linha 14; exportado. Assinatura:

```typescript

```

## frontend/src/modules/devboard/components/DependabotList.tsx

Fonte: [frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx). Componentes: `DependabotList`.

Consumidores diretos: [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx).

### DependabotList

Linha 8; exportado. Assinatura:

```typescript
{ dependabot, loading, error, onRetry }: { dependabot: DependabotPR[] loading: boolean error: string | null onRetry?: () => void }
```

## frontend/src/modules/devboard/components/PRsList.tsx

Fonte: [frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx). Componentes: `PRsList`.

Consumidores diretos: [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx).

### PRsList

Linha 8; exportado. Assinatura:

```typescript
{ prs, loading, error, onRetry }: { prs: PRInfo[] loading: boolean error: string | null onRetry?: () => void }
```

## frontend/src/modules/devboard/components/RunsList.tsx

Fonte: [frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx). Componentes: `RunsList`.

Consumidores diretos: [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx).

### RunsList

Linha 36; exportado. Assinatura:

```typescript
{ runs, loading, error, onRetry }: { runs: RunInfo[] loading: boolean error: string | null onRetry?: () => void }
```

## frontend/src/modules/devboard/pages/DevBoardPage.tsx

Fonte: [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx). Componentes: `DevBoardPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### DevBoardPage

Linha 11; exportado. Assinatura:

```typescript

```

## frontend/src/modules/gasto/components/GastoForm.tsx

Fonte: [frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx). Componentes: `GastoForm`.

Consumidores diretos: [frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx).

### GastoForm

Linha 19; exportado. Assinatura:

```typescript
{ onSuccess }: GastoFormProps
```

### Contrato GastoFormProps

```typescript
interface GastoFormProps {
  onSuccess: () => void
}
```

## frontend/src/modules/gasto/components/GastoList.tsx

Fonte: [frontend/src/modules/gasto/components/GastoList.tsx](../../../frontend/src/modules/gasto/components/GastoList.tsx). Componentes: `GastoList`.

Consumidores diretos: nenhum import direto.

### GastoList

Linha 13; exportado. Assinatura:

```typescript
{ items, totalPeriodo, onDelete }: GastoListProps
```

### Contrato GastoListProps

```typescript
interface GastoListProps {
  items: GastoItem[]
  totalPeriodo: number
  onDelete: (id: string) => void
}
```

## frontend/src/modules/gasto/pages/GastoPage.tsx

Fonte: [frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx). Componentes: `GastoPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### GastoPage

Linha 9; exportado. Assinatura:

```typescript

```

## frontend/src/modules/insights/components/CarteiraChart.tsx

Fonte: [frontend/src/modules/insights/components/CarteiraChart.tsx](../../../frontend/src/modules/insights/components/CarteiraChart.tsx). Componentes: `CarteiraChart`.

Consumidores diretos: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx).

### CarteiraChart

Linha 13; exportado. Assinatura:

```typescript
{ carteira, ariaLabel }: CarteiraChartProps
```

### Contrato CarteiraChartProps

```typescript
interface CarteiraChartProps {
  carteira: CarteiraSnapshot
  ariaLabel: string
}
```

## frontend/src/modules/insights/components/ContribuicaoChart.tsx

Fonte: [frontend/src/modules/insights/components/ContribuicaoChart.tsx](../../../frontend/src/modules/insights/components/ContribuicaoChart.tsx). Componentes: `ContribuicaoChart`.

Consumidores diretos: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx).

### ContribuicaoChart

Linha 14; exportado. Assinatura:

```typescript
{ operadores, ariaLabel }: ContribuicaoChartProps
```

### Contrato ContribuicaoChartProps

```typescript
interface ContribuicaoChartProps {
  operadores: ContribuicaoOperador[]
  ariaLabel: string
}
```

## frontend/src/modules/insights/components/GastosCategoriaChart.tsx

Fonte: [frontend/src/modules/insights/components/GastosCategoriaChart.tsx](../../../frontend/src/modules/insights/components/GastosCategoriaChart.tsx). Componentes: `GastosCategoriaChart`.

Consumidores diretos: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx).

### GastosCategoriaChart

Linha 12; exportado. Assinatura:

```typescript
{ gastos, ariaLabel }: GastosCategoriaChartProps
```

### Contrato GastosCategoriaChartProps

```typescript
interface GastosCategoriaChartProps {
  gastos: GastoCategoria[]
  ariaLabel: string
}
```

## frontend/src/modules/insights/components/PrevistoRecebidoChart.tsx

Fonte: [frontend/src/modules/insights/components/PrevistoRecebidoChart.tsx](../../../frontend/src/modules/insights/components/PrevistoRecebidoChart.tsx). Componentes: `PrevistoRecebidoChart`.

Consumidores diretos: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx).

### PrevistoRecebidoChart

Linha 15; exportado. Assinatura:

```typescript
{ serie, ariaLabel }: PrevistoRecebidoChartProps
```

### Contrato PrevistoRecebidoChartProps

```typescript
interface PrevistoRecebidoChartProps {
  serie: SerieItem[]
  /** aria-label descritivo (a11y — F1-f4). */
  ariaLabel: string
}
```

## frontend/src/modules/insights/components/TendenciaChart.tsx

Fonte: [frontend/src/modules/insights/components/TendenciaChart.tsx](../../../frontend/src/modules/insights/components/TendenciaChart.tsx). Componentes: `TendenciaChart`.

Consumidores diretos: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx).

### TendenciaChart

Linha 15; exportado. Assinatura:

```typescript
{ serie, ariaLabel }: TendenciaChartProps
```

### Contrato TendenciaChartProps

```typescript
interface TendenciaChartProps {
  serie: SerieItem[]
  /** aria-label descritivo (a11y — F1-f4). */
  ariaLabel: string
}
```

## frontend/src/modules/insights/pages/InsightsPage.tsx

Fonte: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx). Componentes: `InsightsPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### InsightsPage

Linha 24; exportado. Assinatura:

```typescript

```

## frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx

Fonte: [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx). Componentes: `ConfirmarLeadPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ConfirmarLeadPage

Linha 18; exportado. Assinatura:

```typescript

```

### Contrato Estado

```typescript
type Estado =
  | { fase: "loading" }
  | { fase: "sucesso" }
  | { fase: "erro"; mensagem: string }
  | { fase: "tokenAusente" }
```

## frontend/src/modules/leads/pages/LeadsAdminPage.tsx

Fonte: [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx). Componentes: `LeadsAdminPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### LeadsAdminPage

Linha 38; exportado. Assinatura:

```typescript

```

## frontend/src/modules/leads/pages/QueroConhecerPage.tsx

Fonte: [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx). Componentes: `QueroConhecerPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### QueroConhecerPage

Linha 24; exportado. Assinatura:

```typescript

```

### Contrato Erros

```typescript
type Erros = Partial<Record<"nomeResponsavel" | "empresa" | "email" | "telefone", string>>
```

## frontend/src/modules/operacoes/components/CobrancaCard.tsx

Fonte: [frontend/src/modules/operacoes/components/CobrancaCard.tsx](../../../frontend/src/modules/operacoes/components/CobrancaCard.tsx). Componentes: `CobrancaCard`.

Consumidores diretos: [frontend/src/modules/operacoes/components/CobrancaList.tsx](../../../frontend/src/modules/operacoes/components/CobrancaList.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx).

### CobrancaCard

Linha 25; exportado. Assinatura:

```typescript
{ item, onClick, className = "" }: CobrancaCardProps
```

### Contrato CobrancaCardProps

```typescript
interface CobrancaCardProps {
  item: CobrancaItem
  onClick?: () => void
  className?: string
}
```

## frontend/src/modules/operacoes/components/CobrancaList.tsx

Fonte: [frontend/src/modules/operacoes/components/CobrancaList.tsx](../../../frontend/src/modules/operacoes/components/CobrancaList.tsx). Componentes: `CobrancaList`.

Consumidores diretos: [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx), [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx).

### CobrancaList

Linha 11; exportado. Assinatura:

```typescript
{ items, onCardClick, emptyMessageKey }: CobrancaListProps
```

### Contrato CobrancaListProps

```typescript
interface CobrancaListProps {
  items: CobrancaItem[]
  onCardClick?: (item: CobrancaItem) => void
  emptyMessageKey?: string
}
```

## frontend/src/modules/operacoes/components/IndicadoresCards.tsx

Fonte: [frontend/src/modules/operacoes/components/IndicadoresCards.tsx](../../../frontend/src/modules/operacoes/components/IndicadoresCards.tsx). Componentes: `IndicadoresCards`.

Consumidores diretos: [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx).

### IndicadoresCards

Linha 23; exportado. Assinatura:

```typescript
{ aReceberHoje, recebidoHoje, clientesParaCobrar, resultadoDoDia, atrasado, aVencer, gastosHoje, hideGastos = false, hideCobrancas = false, onRecebidoClick, onAReceberClick, onPendentesClick, onAtrasadoClick, onAVencerClick, onGastosClick, }: IndicadoresCardsProps
```

### Contrato IndicadoresCardsProps

```typescript
interface IndicadoresCardsProps {
  aReceberHoje: number
  recebidoHoje: number
  clientesParaCobrar: number
  resultadoDoDia: number
  atrasado: number
  aVencer: number
  gastosHoje?: number
  hideGastos?: boolean
  hideCobrancas?: boolean
  onRecebidoClick?: () => void
  onAReceberClick?: () => void
  onPendentesClick?: () => void
  onAtrasadoClick?: () => void
  onAVencerClick?: () => void
  onGastosClick?: () => void
}
```

## frontend/src/modules/operacoes/components/PagamentoCard.tsx

Fonte: [frontend/src/modules/operacoes/components/PagamentoCard.tsx](../../../frontend/src/modules/operacoes/components/PagamentoCard.tsx). Componentes: `PagamentoCard`.

Consumidores diretos: [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx).

### PagamentoCard

Linha 25; exportado. Assinatura:

```typescript
{ item, onClick, className = "" }: PagamentoCardProps
```

### Contrato PagamentoCardProps

```typescript
interface PagamentoCardProps {
  item: PagamentoDoDiaItem
  onClick?: () => void
  className?: string
}
```

## frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx

Fonte: [frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx). Componentes: `PagamentosHojeModal`.

Consumidores diretos: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx).

### PagamentosHojeModal

Linha 13; exportado. Assinatura:

```typescript
{ open, items, loading, onClose }: PagamentosHojeModalProps
```

### Contrato PagamentosHojeModalProps

```typescript
interface PagamentosHojeModalProps {
  open: boolean
  items: PagamentoDoDiaItem[]
  loading?: boolean
  onClose: () => void
}
```

## frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx

Fonte: [frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx). Componentes: `PagamentosPeriodoModal`.

Consumidores diretos: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx).

### PagamentosPeriodoModal

Linha 15; exportado. Assinatura:

```typescript
{ open, items, dataInicio, dataFim, loading, onClose }: PagamentosPeriodoModalProps
```

### Contrato PagamentosPeriodoModalProps

```typescript
interface PagamentosPeriodoModalProps {
  open: boolean
  items: PagamentoDoDiaItem[]
  dataInicio: string
  dataFim: string
  loading?: boolean
  onClose: () => void
}
```

## frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx

Fonte: [frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx](../../../frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx). Componentes: `ParcelasHojeModal`.

Consumidores diretos: [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx).

### ParcelasHojeModal

Linha 14; exportado. Assinatura:

```typescript
{ open, items, loading, title, onClose }: ParcelasHojeModalProps
```

### Contrato ParcelasHojeModalProps

```typescript
interface ParcelasHojeModalProps {
  open: boolean
  items: ParcelaHojeCliente[]
  loading?: boolean
  title?: string
  onClose: () => void
}
```

## frontend/src/modules/operacoes/components/RouteProgress.tsx

Fonte: [frontend/src/modules/operacoes/components/RouteProgress.tsx](../../../frontend/src/modules/operacoes/components/RouteProgress.tsx). Componentes: `RouteProgress`.

Consumidores diretos: [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx).

### RouteProgress

Linha 13; exportado. Assinatura:

```typescript
{ total, completed, pending, visitados = 0, promessas = 0, pagos = 0 }: RouteProgressProps
```

### Contrato RouteProgressProps

```typescript
interface RouteProgressProps {
  total: number
  completed: number
  pending: number
  visitados?: number
  promessas?: number
  naoEncontrados?: number
  pagos?: number
}
```

## frontend/src/modules/operacoes/pages/AtendidosPage.tsx

Fonte: [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx). Componentes: `AtendidosPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### AtendidosPage

Linha 25; exportado. Assinatura:

```typescript

```

### Contrato Filtro

```typescript
type Filtro = "all" | "VISITADO" | "NAO_ENCONTRADO" | "PROMESSA" | "PAGOS"
```

## frontend/src/modules/operacoes/pages/CobrancaListPage.tsx

Fonte: [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx). Componentes: `CobrancaListPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### CobrancaListPage

Linha 30; exportado. Assinatura:

```typescript

```

## frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx

Fonte: [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx). Componentes: `OperacoesDashboard`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### OperacoesDashboard

Linha 25; exportado. Assinatura:

```typescript

```

## frontend/src/modules/operacoes/pages/RotaPage.tsx

Fonte: [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx). Componentes: `RotaPage`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### RotaPage

Linha 64; exportado. Assinatura:

```typescript

```

## frontend/src/modules/pagamento/components/PagamentoModal.tsx

Fonte: [frontend/src/modules/pagamento/components/PagamentoModal.tsx](../../../frontend/src/modules/pagamento/components/PagamentoModal.tsx). Componentes: `PagamentoModal`.

Consumidores diretos: [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx).

### PagamentoModal

Linha 27; exportado. Assinatura:

```typescript
{ contratoId, valorSugerido, saldoDevedor, parcelaLabel, onClose, onSuccess, sucessoContent, }: PagamentoModalProps
```

### Contrato PagamentoSuccessData

```typescript
export interface PagamentoSuccessData {
  valor: number
  pagasRange: { inicio: number; fim: number } | null
  saldoRestante: number
}
```

### Contrato PagamentoModalProps

```typescript
interface PagamentoModalProps {
  contratoId: string
  valorSugerido: number
  saldoDevedor: number
  parcelaLabel?: string
  onClose: () => void
  onSuccess: (data: PagamentoSuccessData) => void
  /** PLAN-062: passo comprovante DENTRO do mesmo modal (modais 3→2). `fechar` fecha o modal. */
  sucessoContent?: (data: PagamentoSuccessData, fechar: () => void) => ReactNode
}
```

## frontend/src/shared/auth/AdminRoute.tsx

Fonte: [frontend/src/shared/auth/AdminRoute.tsx](../../../frontend/src/shared/auth/AdminRoute.tsx). Componentes: `AdminRoute`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### AdminRoute

Linha 4; exportado. Assinatura:

```typescript
{ children }: { children: React.ReactNode }
```

## frontend/src/shared/auth/AuthContext.tsx

Fonte: [frontend/src/shared/auth/AuthContext.tsx](../../../frontend/src/shared/auth/AuthContext.tsx). Componentes: `AuthProvider`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx), [frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx), [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx), [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx), [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx), [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx), [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx), [frontend/src/shared/auth/AdminRoute.tsx](../../../frontend/src/shared/auth/AdminRoute.tsx), [frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx), [frontend/src/shared/auth/ProtectedRoute.tsx](../../../frontend/src/shared/auth/ProtectedRoute.tsx), [frontend/src/shared/auth/RequireModule.tsx](../../../frontend/src/shared/auth/RequireModule.tsx), [frontend/src/shared/auth/SuperAdminRoute.tsx](../../../frontend/src/shared/auth/SuperAdminRoute.tsx), [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx), [frontend/src/shared/layout/BottomTabBar.tsx](../../../frontend/src/shared/layout/BottomTabBar.tsx), [frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx).

### AuthProvider

Linha 37; exportado. Assinatura:

```typescript
{ children }: { children: ReactNode }
```

### Contrato AuthUser

```typescript
export interface AuthUser {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "socio" | "operator"
  empresaId?: string | null
  empresaNome?: string | null
  modulos?: string[] | null
  capacidades?: string[] | null
  chefeId?: string | null
  foto?: string | null
  /** PLAN-065: "convidado" = conta sem senha definida (aguardando ativação). */
  status?: "convidado" | "ativo" | "suspenso"
  /** PLAN-075: dados de contato, troca de e-mail e e-mail verificado (derivado). */
  telefone?: string | null
  emailPendente?: string | null
  emailVerificado?: boolean
}
```

### Contrato AuthContextType

```typescript
interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, senha: string) => Promise<LoginResponse>
  logout: () => void
  loading: boolean
  /** Refaz GET /me e atualiza o usuário (ex.: após trocar a foto no Perfil). */
  refreshUser: () => Promise<void>
}
```

## frontend/src/shared/auth/ContaSuspensaScreen.tsx

Fonte: [frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx). Componentes: `ContaSuspensaScreen`.

Consumidores diretos: [frontend/src/shared/auth/ProtectedRoute.tsx](../../../frontend/src/shared/auth/ProtectedRoute.tsx).

### ContaSuspensaScreen

Linha 13; exportado. Assinatura:

```typescript

```

## frontend/src/shared/auth/ProtectedRoute.tsx

Fonte: [frontend/src/shared/auth/ProtectedRoute.tsx](../../../frontend/src/shared/auth/ProtectedRoute.tsx). Componentes: `ProtectedRoute`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ProtectedRoute

Linha 7; exportado. Assinatura:

```typescript
{ children }: { children: React.ReactNode }
```

## frontend/src/shared/auth/RequireModule.tsx

Fonte: [frontend/src/shared/auth/RequireModule.tsx](../../../frontend/src/shared/auth/RequireModule.tsx). Componentes: `RequireModule`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### RequireModule

Linha 12; exportado. Assinatura:

```typescript
{ mod, children }: Props
```

### Contrato Props

```typescript
interface Props {
  mod: ModuleId
  children: ReactNode
}
```

## frontend/src/shared/auth/SuperAdminRoute.tsx

Fonte: [frontend/src/shared/auth/SuperAdminRoute.tsx](../../../frontend/src/shared/auth/SuperAdminRoute.tsx). Componentes: `SuperAdminRoute`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### SuperAdminRoute

Linha 5; exportado. Assinatura:

```typescript
{ children }: { children: React.ReactNode }
```

## frontend/src/shared/components/Avatar/Avatar.tsx

Fonte: [frontend/src/shared/components/Avatar/Avatar.tsx](../../../frontend/src/shared/components/Avatar/Avatar.tsx). Componentes: `Avatar`, `AvatarField`.

Consumidores diretos: [frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx), [frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx), [frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx), [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx), [frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx), [frontend/src/modules/cliente/components/ClienteCard.tsx](../../../frontend/src/modules/cliente/components/ClienteCard.tsx), [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx), [frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx).

### Avatar

Linha 50; exportado. Assinatura:

```typescript
{ foto, nome, size = "md", className = "", ampliar = false }: AvatarProps
```

### AvatarField

Linha 108; exportado. Assinatura:

```typescript
{ nome, foto, onChange, label, size = "xl" }: AvatarFieldProps
```

### Contrato AvatarSize

```typescript
export type AvatarSize = "sm" | "md" | "lg" | "xl"
```

### Contrato AvatarProps

```typescript
interface AvatarProps {
  foto?: string | null
  nome: string
  size?: AvatarSize
  className?: string
  /** Clicar abre a foto ampliada (lightbox — PLAN-058). Só ativo quando há foto. */
  ampliar?: boolean
}
```

### Contrato AvatarFieldProps

```typescript
interface AvatarFieldProps {
  nome: string
  foto: string | null
  onChange: (foto: string | null) => void
  label?: string
  size?: AvatarSize
}
```

## frontend/src/shared/components/Button.tsx

Fonte: [frontend/src/shared/components/Button.tsx](../../../frontend/src/shared/components/Button.tsx). Componentes: `Button`, `ButtonLink`.

Consumidores diretos: [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx), [frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx), [frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx), [frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx), [frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx), [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx), [frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx), [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx), [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx), [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx), [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx), [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx), [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx), [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx), [frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx), [frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx), [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx), [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx), [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx), [frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx), [frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx), [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx), [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx), [frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx), [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx), [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx), [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx), [frontend/src/modules/pagamento/components/PagamentoModal.tsx](../../../frontend/src/modules/pagamento/components/PagamentoModal.tsx), [frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx), [frontend/src/shared/components/Avatar/Avatar.tsx](../../../frontend/src/shared/components/Avatar/Avatar.tsx), [frontend/src/shared/components/ConfirmModal.tsx](../../../frontend/src/shared/components/ConfirmModal.tsx), [frontend/src/shared/components/ErrorBoundary.tsx](../../../frontend/src/shared/components/ErrorBoundary.tsx), [frontend/src/shared/components/EstadoTela.tsx](../../../frontend/src/shared/components/EstadoTela.tsx), [frontend/src/shared/geo/GpsControl.tsx](../../../frontend/src/shared/geo/GpsControl.tsx), [frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx).

### Button

Linha 34; exportado. Assinatura:

```typescript
{ variant = "primary", size = "md", disabled, children, className = "", ...props }: ButtonProps
```

### ButtonLink

Linha 57; exportado. Assinatura:

```typescript
{ variant = "primary", size = "md", to, children, className = "", ...props }: ButtonLinkProps
```

### Contrato Variant

```typescript
type Variant = "primary" | "secondary" | "soft" | "outline" | "ghost" | "danger" | "success"
```

### Contrato Size

```typescript
type Size = "sm" | "md" | "lg" | "block"
```

### Contrato ButtonBaseProps

```typescript
interface ButtonBaseProps {
  variant?: Variant
  size?: Size
}
```

### Contrato ButtonProps

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonBaseProps {}
```

### Contrato ButtonLinkProps

```typescript
interface ButtonLinkProps extends Omit<LinkProps, "className">, ButtonBaseProps {
  className?: string
}
```

## frontend/src/shared/components/Card/Card.tsx

Fonte: [frontend/src/shared/components/Card/Card.tsx](../../../frontend/src/shared/components/Card/Card.tsx). Componentes: `CardRoot`, `CardTitle`, `CardHeader`, `CardBody`, `CardDot`, `CardIndicator`, `CardIndicators`, `CardBadge`, `CardActions`.

Consumidores diretos: [frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx), [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx), [frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx), [frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx), [frontend/src/modules/cliente/components/ClienteCard.tsx](../../../frontend/src/modules/cliente/components/ClienteCard.tsx), [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx), [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx), [frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx), [frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx), [frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx), [frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx), [frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx), [frontend/src/modules/operacoes/components/CobrancaCard.tsx](../../../frontend/src/modules/operacoes/components/CobrancaCard.tsx), [frontend/src/modules/operacoes/components/PagamentoCard.tsx](../../../frontend/src/modules/operacoes/components/PagamentoCard.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx), [frontend/src/shared/components/ChartCard/ChartCard.tsx](../../../frontend/src/shared/components/ChartCard/ChartCard.tsx), [frontend/src/shared/components/KpiCard/KpiCard.tsx](../../../frontend/src/shared/components/KpiCard/KpiCard.tsx).

### CardRoot

Linha 36; local. Assinatura:

```typescript
{ variant = "detail", as = "div", to, onClick, tone, interactive, className = "", children }: CardRootProps
```

### CardTitle

Linha 67; local. Assinatura:

```typescript
{ children, className = "" }: CardTitleProps
```

### CardHeader

Linha 77; local. Assinatura:

```typescript
{ children, className = "", border }: CardHeaderProps
```

### CardBody

Linha 90; local. Assinatura:

```typescript
{ children, className = "" }: CardBodyProps
```

### CardDot

Linha 112; local. Assinatura:

```typescript
{ color, size = "sm" }: CardDotProps
```

### CardIndicator

Linha 121; local. Assinatura:

```typescript
{ label, value }: CardIndicatorProps
```

### CardIndicators

Linha 135; local. Assinatura:

```typescript
{ children, className = "" }: CardIndicatorsProps
```

### CardBadge

Linha 148; local. Assinatura:

```typescript
{ variant, label }: CardBadgeProps
```

### CardActions

Linha 165; local. Assinatura:

```typescript
{ actions, layout = "horizontal", disabled, size }: CardActionsProps
```

### Contrato CardVariant

```typescript
type CardVariant = "list-item" | "detail" | "collection"
```

### Contrato CardTone

```typescript
export type CardTone = "info" | "success" | "warning" | "danger" | "neutral"
```

### Contrato CardRootProps

```typescript
interface CardRootProps {
  variant?: CardVariant
  as?: "link" | "button" | "div"
  to?: string
  onClick?: () => void
  tone?: CardTone
  interactive?: boolean
  className?: string
  children: ReactNode
}
```

### Contrato CardTitleProps

```typescript
interface CardTitleProps {
  children: ReactNode
  className?: string
}
```

### Contrato CardHeaderProps

```typescript
interface CardHeaderProps {
  children: ReactNode
  className?: string
  border?: boolean
}
```

### Contrato CardBodyProps

```typescript
interface CardBodyProps {
  children: ReactNode
  className?: string
}
```

### Contrato CardDotProps

```typescript
interface CardDotProps {
  color: "red" | "blue" | "green" | "yellow" | "gray"
  size?: "sm" | "md"
}
```

### Contrato CardIndicatorProps

```typescript
interface CardIndicatorProps {
  label: string
  value: string
}
```

### Contrato CardIndicatorsProps

```typescript
interface CardIndicatorsProps {
  children: ReactNode
  className?: string
}
```

### Contrato CardBadgeProps

```typescript
interface CardBadgeProps {
  variant: "success" | "warning" | "danger" | "info" | "neutral"
  label: string
}
```

### Contrato CardActionsProps

```typescript
interface CardActionsProps {
  actions: Array<{
    icon?: LucideIcon
    label: string
    onClick: () => void
    variant?: "blue" | "green" | "gray" | "warning" | "danger"
    show?: boolean
  }>
  layout?: "horizontal" | "vertical"
  disabled?: boolean
  size?: "sm" | "md"
}
```

Export/composição Card:

```typescript
{ Root: CardRoot, Header: CardHeader, Title: CardTitle, Body: CardBody, Dot: CardDot, Indicator: CardIndicator, Indicators: CardIndicators, Badge: CardBadge, Actions: CardActions, }
```

## frontend/src/shared/components/Carousel/Carousel.tsx

Fonte: [frontend/src/shared/components/Carousel/Carousel.tsx](../../../frontend/src/shared/components/Carousel/Carousel.tsx). Componentes: `Carousel`.

Consumidores diretos: [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx).

### Carousel

Linha 17; exportado. Assinatura:

```typescript
{ mode, items, renderItem, currentIndex, onIndexChange, itemWidth = "w-72", className = "", hideDots = false, maxDots, itemKey, }: CarouselProps<T>
```

### Contrato CarouselProps

```typescript
interface CarouselProps<T> {
  mode: "slide" | "scroll"
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  currentIndex?: number
  onIndexChange?: (index: number) => void
  itemWidth?: string
  className?: string
  hideDots?: boolean
  maxDots?: number
  itemKey?: (item: T) => string
}
```

## frontend/src/shared/components/ChartCard/ChartCard.tsx

Fonte: [frontend/src/shared/components/ChartCard/ChartCard.tsx](../../../frontend/src/shared/components/ChartCard/ChartCard.tsx). Componentes: `ChartCard`.

Consumidores diretos: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx).

### ChartCard

Linha 17; exportado. Assinatura:

```typescript
{ title, className, children }: ChartCardProps
```

### Contrato ChartCardProps

```typescript
interface ChartCardProps {
  /** Título do gráfico (i18n). */
  title: string
  className?: string
  /** Conteúdo do gráfico (ResponsiveContainer/Recharts) ou estados (EstadoTela). */
  children: ReactNode
}
```

## frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx

Fonte: [frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx](../../../frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx). Componentes: `CollapsibleSection`.

Consumidores diretos: [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx).

### CollapsibleSection

Linha 31; exportado. Assinatura:

```typescript
{ title, count, items, renderItem, limit, defaultCollapsed = false, open, onToggle, children, className = "", }: CollapsibleSectionProps<T>
```

### Contrato CollapsibleSectionProps

```typescript
interface CollapsibleSectionProps<T = unknown> {
  title: string
  /** Contagem exibida no header (ex.: total de itens). */
  count?: number
  /** Itens a listar (com `renderItem`) — habilita limite + "Ver mais". */
  items?: T[]
  renderItem?: (item: T) => ReactNode
  /** Máximo de itens antes do "Ver mais" (default: todos). */
  limit?: number
  /** Começa colapsada (default: false). */
  defaultCollapsed?: boolean
  /** Modo controlado (opcional): estado externo da expansão. Sem isso, o estado é interno. */
  open?: boolean
  /** Callback quando o usuário alterna (só usado no modo controlado). */
  onToggle?: (open: boolean) => void
  /** Conteúdo direto (quando não usa items/renderItem). */
  children?: ReactNode
  className?: string
}
```

## frontend/src/shared/components/ConfirmModal.tsx

Fonte: [frontend/src/shared/components/ConfirmModal.tsx](../../../frontend/src/shared/components/ConfirmModal.tsx). Componentes: `ConfirmModal`.

Consumidores diretos: [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx), [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx), [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx).

### ConfirmModal

Linha 16; exportado. Assinatura:

```typescript
{ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger = false, }: ConfirmModalProps
```

### Contrato ConfirmModalProps

```typescript
interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}
```

## frontend/src/shared/components/ErrorBanner/ErrorBanner.tsx

Fonte: [frontend/src/shared/components/ErrorBanner/ErrorBanner.tsx](../../../frontend/src/shared/components/ErrorBanner/ErrorBanner.tsx). Componentes: `ErrorBanner`.

Consumidores diretos: [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx), [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx), [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx), [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx), [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx), [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx), [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx), [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx).

### ErrorBanner

Linha 11; exportado. Assinatura:

```typescript
{ message, onRetry, onDismiss, className = "" }: ErrorBannerProps
```

### Contrato ErrorBannerProps

```typescript
interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}
```

## frontend/src/shared/components/ErrorBoundary.tsx

Fonte: [frontend/src/shared/components/ErrorBoundary.tsx](../../../frontend/src/shared/components/ErrorBoundary.tsx). Componentes: `ErrorBoundary`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### ErrorBoundary

Linha 13; exportado. Assinatura:

```typescript
class
```

### Contrato ErrorBoundaryProps

```typescript
interface ErrorBoundaryProps {
  children: ReactNode
}
```

### Contrato ErrorBoundaryState

```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}
```

## frontend/src/shared/components/EstadoTela.tsx

Fonte: [frontend/src/shared/components/EstadoTela.tsx](../../../frontend/src/shared/components/EstadoTela.tsx). Componentes: `EstadoTela`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx), [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx), [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx), [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx), [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx), [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx), [frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx), [frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx), [frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx), [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx).

### EstadoTela

Linha 17; exportado. Assinatura:

```typescript
{ loading, error, empty, emptyMessage, emptyAction, onRetry, children, }: EstadoTelaProps
```

### Contrato EstadoTelaProps

```typescript
interface EstadoTelaProps {
  loading: boolean
  error: string | null
  empty: boolean
  emptyMessage?: string
  emptyAction?: { label: string; to: string }
  onRetry?: () => void
  children: React.ReactNode
}
```

## frontend/src/shared/components/Field/Field.tsx

Fonte: [frontend/src/shared/components/Field/Field.tsx](../../../frontend/src/shared/components/Field/Field.tsx). Componentes: `Field`.

Consumidores diretos: [frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx), [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx), [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx), [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx), [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx), [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx), [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx), [frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx), [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx), [frontend/src/modules/contrato/components/ContratoForm.tsx](../../../frontend/src/modules/contrato/components/ContratoForm.tsx), [frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx), [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx), [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx).

### Field

Linha 15; exportado. Assinatura:

```typescript
({ label, error, hint, right, className, ...props }, ref)
```

### Contrato FieldProps

```typescript
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  right?: ReactNode
}
```

## frontend/src/shared/components/Field/FieldSelect.tsx

Fonte: [frontend/src/shared/components/Field/FieldSelect.tsx](../../../frontend/src/shared/components/Field/FieldSelect.tsx). Componentes: `FieldSelect`.

Consumidores diretos: [frontend/src/modules/admin/components/EmpresaForm.tsx](../../../frontend/src/modules/admin/components/EmpresaForm.tsx), [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx), [frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx), [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx), [frontend/src/modules/gasto/components/GastoForm.tsx](../../../frontend/src/modules/gasto/components/GastoForm.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx).

### FieldSelect

Linha 14; exportado. Assinatura:

```typescript
({ label, error, hint, placeholder, options, className, ...props }, ref)
```

### Contrato FieldSelectProps

```typescript
interface FieldSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  /** Option placeholder (value vazio, disabled + hidden). */
  placeholder?: string
  options: Array<{ value: string; label: string }>
}
```

## frontend/src/shared/components/Field/FieldTextarea.tsx

Fonte: [frontend/src/shared/components/Field/FieldTextarea.tsx](../../../frontend/src/shared/components/Field/FieldTextarea.tsx). Componentes: `FieldTextarea`.

Consumidores diretos: [frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx), [frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx).

### FieldTextarea

Linha 11; exportado. Assinatura:

```typescript
({ label, error, hint, className, rows = 3, ...props }, ref)
```

### Contrato FieldTextareaProps

```typescript
interface FieldTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}
```

## frontend/src/shared/components/KpiCard/KpiCard.tsx

Fonte: [frontend/src/shared/components/KpiCard/KpiCard.tsx](../../../frontend/src/shared/components/KpiCard/KpiCard.tsx). Componentes: `KpiCard`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx), [frontend/src/modules/caixa/components/AjusteCaixaForm.tsx](../../../frontend/src/modules/caixa/components/AjusteCaixaForm.tsx), [frontend/src/modules/caixa/components/CaixaKpis.tsx](../../../frontend/src/modules/caixa/components/CaixaKpis.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/cliente/components/SituacaoFinanceira.tsx](../../../frontend/src/modules/cliente/components/SituacaoFinanceira.tsx), [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx), [frontend/src/modules/operacoes/components/IndicadoresCards.tsx](../../../frontend/src/modules/operacoes/components/IndicadoresCards.tsx).

### KpiCard

Linha 23; exportado. Assinatura:

```typescript
{ title, value, variant = "info", onClick, valueClassName, subtitle }: KpiCardProps
```

### Contrato KpiVariant

```typescript
type KpiVariant = "info" | "green" | "yellow" | "gray" | "danger"
```

### Contrato KpiCardProps

```typescript
interface KpiCardProps {
  title: string
  value: ReactNode
  variant?: KpiVariant
  onClick?: () => void
  valueClassName?: string
  subtitle?: ReactNode
}
```

## frontend/src/shared/components/Logo.tsx

Fonte: [frontend/src/shared/components/Logo.tsx](../../../frontend/src/shared/components/Logo.tsx). Componentes: `Logo`, `LogoLockup`.

Consumidores diretos: [frontend/src/modules/auth/components/PublicPageShell.tsx](../../../frontend/src/modules/auth/components/PublicPageShell.tsx), [frontend/src/modules/auth/pages/LoginPage.tsx](../../../frontend/src/modules/auth/pages/LoginPage.tsx), [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx), [frontend/src/shared/auth/ContaSuspensaScreen.tsx](../../../frontend/src/shared/auth/ContaSuspensaScreen.tsx), [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx).

### Logo

Linha 73; exportado. Assinatura:

```typescript
{ variant = "sm", boxed = false, className, title = "NX Gest" }: LogoProps
```

### LogoLockup

Linha 141; exportado. Assinatura:

```typescript
{ className, tagline = false, size = "md" }: LogoLockupProps
```

### Contrato MarkVariant

```typescript
type MarkVariant = "lg" | "sm" | "mono"
```

### Contrato LogoProps

```typescript
export interface LogoProps {
  /** `lg` (login/landing) · `sm` (sidebar/navbar) · `mono` (<= 24px, favicon) */
  variant?: MarkVariant
  /** desenha o quadrado preenchido de fundo (app icon / favicon, full-bleed) */
  boxed?: boolean
  className?: string
  title?: string
}
```

### Contrato Ponto

```typescript
type Ponto = [number, number]
```

### Contrato LogoLockupProps

```typescript
export interface LogoLockupProps {
  className?: string
  tagline?: boolean
  size?: "sm" | "md" | "lg"
}
```

## frontend/src/shared/components/Modal/Modal.tsx

Fonte: [frontend/src/shared/components/Modal/Modal.tsx](../../../frontend/src/shared/components/Modal/Modal.tsx). Componentes: `Modal`.

Consumidores diretos: [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx), [frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx), [frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx), [frontend/src/modules/admin/components/ImpactConfirmModal.tsx](../../../frontend/src/modules/admin/components/ImpactConfirmModal.tsx), [frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx), [frontend/src/modules/admin/components/ReassignModal.tsx](../../../frontend/src/modules/admin/components/ReassignModal.tsx), [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx), [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx), [frontend/src/modules/caixa/components/AjustarCaixaModal.tsx](../../../frontend/src/modules/caixa/components/AjustarCaixaModal.tsx), [frontend/src/modules/caixa/components/ContratosSemanaModal.tsx](../../../frontend/src/modules/caixa/components/ContratosSemanaModal.tsx), [frontend/src/modules/caixa/components/GastosPeriodoModal.tsx](../../../frontend/src/modules/caixa/components/GastosPeriodoModal.tsx), [frontend/src/modules/cliente/components/AnexosSection.tsx](../../../frontend/src/modules/cliente/components/AnexosSection.tsx), [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx), [frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosHojeModal.tsx), [frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx](../../../frontend/src/modules/operacoes/components/PagamentosPeriodoModal.tsx), [frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx](../../../frontend/src/modules/operacoes/components/ParcelasHojeModal.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx), [frontend/src/modules/pagamento/components/PagamentoModal.tsx](../../../frontend/src/modules/pagamento/components/PagamentoModal.tsx), [frontend/src/shared/components/Avatar/Avatar.tsx](../../../frontend/src/shared/components/Avatar/Avatar.tsx), [frontend/src/shared/components/ConfirmModal.tsx](../../../frontend/src/shared/components/ConfirmModal.tsx), [frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx).

### Modal

Linha 17; exportado. Assinatura:

```typescript
{ open, onClose, title, descricao, footer, children, backdropClose = false, escapeClose = true, maxWidth = "max-w-sm", }: ModalProps
```

### Contrato ModalProps

```typescript
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  descricao?: string
  footer?: ReactNode
  children?: ReactNode
  backdropClose?: boolean
  escapeClose?: boolean
  maxWidth?: string
}
```

## frontend/src/shared/components/PageHeader/PageHeader.tsx

Fonte: [frontend/src/shared/components/PageHeader/PageHeader.tsx](../../../frontend/src/shared/components/PageHeader/PageHeader.tsx). Componentes: `PageHeader`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx), [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx), [frontend/src/modules/cliente/pages/ClienteEdit.tsx](../../../frontend/src/modules/cliente/pages/ClienteEdit.tsx), [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx), [frontend/src/modules/cliente/pages/ClienteNovo.tsx](../../../frontend/src/modules/cliente/pages/ClienteNovo.tsx), [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx), [frontend/src/modules/contrato/pages/ContratoEdit.tsx](../../../frontend/src/modules/contrato/pages/ContratoEdit.tsx), [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx), [frontend/src/modules/contrato/pages/ContratoNovo.tsx](../../../frontend/src/modules/contrato/pages/ContratoNovo.tsx), [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx), [frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx), [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx), [frontend/src/modules/operacoes/pages/AtendidosPage.tsx](../../../frontend/src/modules/operacoes/pages/AtendidosPage.tsx), [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx).

### PageHeader

Linha 15; exportado. Assinatura:

```typescript
{ icon: Icon, title, subtitle, eyebrow, action, back }: PageHeaderProps
```

### Contrato PageHeaderProps

```typescript
interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  /** linha pequena acima do título (ex.: data do dia) */
  eyebrow?: string
  action?: ReactNode
  back?: { onClick: () => void; title?: string }
}
```

## frontend/src/shared/components/QuickActions/QuickActions.tsx

Fonte: [frontend/src/shared/components/QuickActions/QuickActions.tsx](../../../frontend/src/shared/components/QuickActions/QuickActions.tsx). Componentes: `QuickActions`.

Consumidores diretos: [frontend/src/modules/cliente/pages/ClienteDetail.tsx](../../../frontend/src/modules/cliente/pages/ClienteDetail.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx), [frontend/src/shared/components/Card/Card.tsx](../../../frontend/src/shared/components/Card/Card.tsx).

### QuickActions

Linha 38; exportado. Assinatura:

```typescript
{ actions, layout = "horizontal", disabled, size = "sm", singleRow = false }: QuickActionsProps
```

### Contrato QuickAction

```typescript
export interface QuickAction {
  icon?: LucideIcon
  label: string
  onClick: () => void
  variant?: "blue" | "green" | "gray" | "warning" | "danger"
  show?: boolean
}
```

### Contrato QuickActionsProps

```typescript
interface QuickActionsProps {
  actions: QuickAction[]
  layout?: "horizontal" | "vertical" | "grid"
  disabled?: boolean
  size?: "sm" | "md"
  /** No layout "grid": força uma linha única com todas as ações visíveis (adaptável a itens ocultos). */
  singleRow?: boolean
}
```

## frontend/src/shared/components/SearchBar/SearchBar.tsx

Fonte: [frontend/src/shared/components/SearchBar/SearchBar.tsx](../../../frontend/src/shared/components/SearchBar/SearchBar.tsx). Componentes: `SearchBar`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx).

### SearchBar

Linha 10; exportado. Assinatura:

```typescript
{ value, onChange, placeholder, onClear }: SearchBarProps
```

### Contrato SearchBarProps

```typescript
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}
```

## frontend/src/shared/components/SectionHeader/SectionHeader.tsx

Fonte: [frontend/src/shared/components/SectionHeader/SectionHeader.tsx](../../../frontend/src/shared/components/SectionHeader/SectionHeader.tsx). Componentes: `SectionHeader`.

Consumidores diretos: [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/admin/pages/SuperAdminPage.tsx](../../../frontend/src/modules/admin/pages/SuperAdminPage.tsx), [frontend/src/modules/caixa/pages/CaixaPage.tsx](../../../frontend/src/modules/caixa/pages/CaixaPage.tsx), [frontend/src/modules/contrato/pages/ContratoDetail.tsx](../../../frontend/src/modules/contrato/pages/ContratoDetail.tsx), [frontend/src/modules/devboard/pages/DevBoardPage.tsx](../../../frontend/src/modules/devboard/pages/DevBoardPage.tsx), [frontend/src/modules/gasto/pages/GastoPage.tsx](../../../frontend/src/modules/gasto/pages/GastoPage.tsx), [frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx](../../../frontend/src/shared/components/CollapsibleSection/CollapsibleSection.tsx).

### SectionHeader

Linha 8; exportado. Assinatura:

```typescript
{ title, action }: SectionHeaderProps
```

### Contrato SectionHeaderProps

```typescript
interface SectionHeaderProps {
  title: string
  action?: { label: string; onClick: () => void }
}
```

## frontend/src/shared/components/SegmentedControl/SegmentedControl.tsx

Fonte: [frontend/src/shared/components/SegmentedControl/SegmentedControl.tsx](../../../frontend/src/shared/components/SegmentedControl/SegmentedControl.tsx). Componentes: `SegmentedControl`.

Consumidores diretos: [frontend/src/modules/insights/pages/InsightsPage.tsx](../../../frontend/src/modules/insights/pages/InsightsPage.tsx), [frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx).

### SegmentedControl

Linha 18; exportado. Assinatura:

```typescript
{ value, onChange, items, label, className = "" }: SegmentedControlProps<T>
```

### Contrato Item

```typescript
interface Item<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}
```

### Contrato SegmentedControlProps

```typescript
interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (v: T) => void
  items: Item<T>[]
  label: string
  className?: string
}
```

## frontend/src/shared/components/StatusBadge/StatusBadge.tsx

Fonte: [frontend/src/shared/components/StatusBadge/StatusBadge.tsx](../../../frontend/src/shared/components/StatusBadge/StatusBadge.tsx). Componentes: `StatusBadge`.

Consumidores diretos: [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx), [frontend/src/modules/admin/components/ContribuicaoModal.tsx](../../../frontend/src/modules/admin/components/ContribuicaoModal.tsx), [frontend/src/modules/admin/components/EmpresaList.tsx](../../../frontend/src/modules/admin/components/EmpresaList.tsx), [frontend/src/modules/admin/components/EquipeModal.tsx](../../../frontend/src/modules/admin/components/EquipeModal.tsx), [frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx), [frontend/src/modules/admin/components/OperadorForm.tsx](../../../frontend/src/modules/admin/components/OperadorForm.tsx), [frontend/src/modules/admin/components/OperadoresList.tsx](../../../frontend/src/modules/admin/components/OperadoresList.tsx), [frontend/src/modules/admin/pages/AdminPage.tsx](../../../frontend/src/modules/admin/pages/AdminPage.tsx), [frontend/src/modules/admin/pages/OperadorDetail.tsx](../../../frontend/src/modules/admin/pages/OperadorDetail.tsx), [frontend/src/modules/auth/pages/PerfilPage.tsx](../../../frontend/src/modules/auth/pages/PerfilPage.tsx), [frontend/src/modules/contrato/components/ContratoCard.tsx](../../../frontend/src/modules/contrato/components/ContratoCard.tsx), [frontend/src/modules/contrato/components/ParcelaList.tsx](../../../frontend/src/modules/contrato/components/ParcelaList.tsx), [frontend/src/modules/devboard/components/DependabotList.tsx](../../../frontend/src/modules/devboard/components/DependabotList.tsx), [frontend/src/modules/devboard/components/PRsList.tsx](../../../frontend/src/modules/devboard/components/PRsList.tsx), [frontend/src/modules/devboard/components/RunsList.tsx](../../../frontend/src/modules/devboard/components/RunsList.tsx), [frontend/src/modules/leads/pages/LeadsAdminPage.tsx](../../../frontend/src/modules/leads/pages/LeadsAdminPage.tsx), [frontend/src/modules/operacoes/components/CobrancaCard.tsx](../../../frontend/src/modules/operacoes/components/CobrancaCard.tsx), [frontend/src/modules/operacoes/components/PagamentoCard.tsx](../../../frontend/src/modules/operacoes/components/PagamentoCard.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx), [frontend/src/shared/components/Card/Card.tsx](../../../frontend/src/shared/components/Card/Card.tsx), [frontend/src/shared/geo/GpsControl.tsx](../../../frontend/src/shared/geo/GpsControl.tsx).

### StatusBadge

Linha 33; exportado. Assinatura:

```typescript
{ variant, label, size = "sm", className = "", ...props }: StatusBadgeProps
```

### Contrato Variant

```typescript
type Variant = "success" | "warning" | "danger" | "info" | "neutral"
```

### Contrato Size

```typescript
type Size = "sm" | "md"
```

### Contrato StatusBadgeProps

```typescript
interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: Variant
  label: string
  size?: Size
}
```

## frontend/src/shared/components/SuccessState/SuccessState.tsx

Fonte: [frontend/src/shared/components/SuccessState/SuccessState.tsx](../../../frontend/src/shared/components/SuccessState/SuccessState.tsx). Componentes: `SuccessState`.

Consumidores diretos: [frontend/src/modules/auth/pages/AtivarPage.tsx](../../../frontend/src/modules/auth/pages/AtivarPage.tsx), [frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/RecuperarSenhaPage.tsx), [frontend/src/modules/auth/pages/ResetarSenhaPage.tsx](../../../frontend/src/modules/auth/pages/ResetarSenhaPage.tsx), [frontend/src/modules/auth/pages/VerificarEmailPage.tsx](../../../frontend/src/modules/auth/pages/VerificarEmailPage.tsx), [frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx](../../../frontend/src/modules/leads/pages/ConfirmarLeadPage.tsx), [frontend/src/modules/leads/pages/QueroConhecerPage.tsx](../../../frontend/src/modules/leads/pages/QueroConhecerPage.tsx), [frontend/src/modules/operacoes/pages/CobrancaListPage.tsx](../../../frontend/src/modules/operacoes/pages/CobrancaListPage.tsx), [frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx](../../../frontend/src/modules/operacoes/pages/OperacoesDashboard.tsx), [frontend/src/modules/operacoes/pages/RotaPage.tsx](../../../frontend/src/modules/operacoes/pages/RotaPage.tsx).

### SuccessState

Linha 10; exportado. Assinatura:

```typescript
{ title, detail, linkLabel, onLinkClick }: SuccessStateProps
```

### Contrato SuccessStateProps

```typescript
interface SuccessStateProps {
  title: string
  detail?: string
  linkLabel?: string
  onLinkClick?: () => void
}
```

## frontend/src/shared/components/Switch/Switch.tsx

Fonte: [frontend/src/shared/components/Switch/Switch.tsx](../../../frontend/src/shared/components/Switch/Switch.tsx). Componentes: `Switch`.

Consumidores diretos: [frontend/src/modules/admin/components/CapacidadesModal.tsx](../../../frontend/src/modules/admin/components/CapacidadesModal.tsx), [frontend/src/modules/admin/components/ModulosModal.tsx](../../../frontend/src/modules/admin/components/ModulosModal.tsx).

### Switch

Linha 11; exportado. Assinatura:

```typescript
{ checked, onChange, disabled, label, motivo }: SwitchProps
```

### Contrato SwitchProps

```typescript
interface SwitchProps {
  checked: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
  label: string
  /** Tooltip exibido quando desabilitado (motivo). */
  motivo?: string
}
```

## frontend/src/shared/components/Tabs/Tabs.tsx

Fonte: [frontend/src/shared/components/Tabs/Tabs.tsx](../../../frontend/src/shared/components/Tabs/Tabs.tsx). Componentes: `Tabs`.

Consumidores diretos: nenhum import direto.

### Tabs

Linha 9; exportado. Assinatura:

```typescript
{ value, onChange, items, className = "" }: TabsProps<T>
```

### Contrato TabsProps

```typescript
interface TabsProps<T extends string> {
  value: T
  onChange: (v: T) => void
  items: Array<{ value: T; label: string }>
  className?: string
}
```

## frontend/src/shared/fab/Fab.tsx

Fonte: [frontend/src/shared/fab/Fab.tsx](../../../frontend/src/shared/fab/Fab.tsx). Componentes: `Fab`.

Consumidores diretos: [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx).

### Fab

Linha 6; exportado. Assinatura:

```typescript

```

## frontend/src/shared/fab/FabContext.tsx

Fonte: [frontend/src/shared/fab/FabContext.tsx](../../../frontend/src/shared/fab/FabContext.tsx). Componentes: `FabProvider`.

Consumidores diretos: [frontend/src/modules/cliente/pages/ClienteList.tsx](../../../frontend/src/modules/cliente/pages/ClienteList.tsx), [frontend/src/modules/contrato/pages/ContratoList.tsx](../../../frontend/src/modules/contrato/pages/ContratoList.tsx), [frontend/src/shared/fab/Fab.tsx](../../../frontend/src/shared/fab/Fab.tsx), [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx).

### FabProvider

Linha 15; exportado. Assinatura:

```typescript
{ children }: { children: ReactNode }
```

### Contrato FabState

```typescript
export interface FabState {
  label: string
  to: string
}
```

### Contrato FabContextType

```typescript
interface FabContextType {
  fab: FabState | null
  setFab: (fab: FabState | null) => void
}
```

## frontend/src/shared/feedback/FeedbackOverlay.tsx

Fonte: [frontend/src/shared/feedback/FeedbackOverlay.tsx](../../../frontend/src/shared/feedback/FeedbackOverlay.tsx). Componentes: `FeedbackOverlay`.

Consumidores diretos: [frontend/src/shared/feedback/FeedbackProvider.tsx](../../../frontend/src/shared/feedback/FeedbackProvider.tsx).

### FeedbackOverlay

Linha 18; exportado. Assinatura:

```typescript
{ status, message }: FeedbackOverlayProps
```

### Contrato FeedbackStatus

```typescript
export type FeedbackStatus = "hidden" | "loading" | "success" | "error" | "warning" | "info"
```

### Contrato FeedbackOverlayProps

```typescript
interface FeedbackOverlayProps {
  status: FeedbackStatus
  message: string
}
```

## frontend/src/shared/feedback/FeedbackProvider.tsx

Fonte: [frontend/src/shared/feedback/FeedbackProvider.tsx](../../../frontend/src/shared/feedback/FeedbackProvider.tsx). Componentes: `FeedbackProvider`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx), [frontend/src/shared/feedback/useFeedback.ts](../../../frontend/src/shared/feedback/useFeedback.ts).

### FeedbackProvider

Linha 30; exportado. Assinatura:

```typescript
{ children }: { children: ReactNode }
```

### Contrato FeedbackState

```typescript
interface FeedbackState {
  status: FeedbackStatus
  message: string
}
```

### Contrato RunOptions

```typescript
interface RunOptions {
  loading: string
  success: string
  error: string
  action: () => Promise<void>
}
```

### Contrato FeedbackContextValue

```typescript
interface FeedbackContextValue {
  show: (state: FeedbackState) => void
  dismiss: () => void
  run: (options: RunOptions) => Promise<void>
  status: FeedbackStatus
  message: string
}
```

## frontend/src/shared/geo/GpsControl.tsx

Fonte: [frontend/src/shared/geo/GpsControl.tsx](../../../frontend/src/shared/geo/GpsControl.tsx). Componentes: `GpsControl`.

Consumidores diretos: [frontend/src/modules/cliente/components/ClienteForm.tsx](../../../frontend/src/modules/cliente/components/ClienteForm.tsx), [frontend/src/shared/geo/estadoGps.ts](../../../frontend/src/shared/geo/estadoGps.ts).

### GpsControl

Linha 28; exportado. Assinatura:

```typescript
{ coords, estado, capturando = false, erro, aviso, origem = "gps", onCapturar, className = "", }: GpsControlProps
```

### Contrato GpsEstado

```typescript
export type GpsEstado = "vazio" | "capturada" | "invalidada"
```

### Contrato GpsControlProps

```typescript
interface GpsControlProps {
  coords: Localizacao | null
  estado: GpsEstado
  capturando?: boolean
  /** Mensagem de erro já traduzida (permissão/indisponível). */
  erro?: string | null
  /** Aviso já traduzido (ex.: geocode sem endereço). */
  aviso?: string | null
  origem?: "gps" | "cep_aproximado" | null
  onCapturar: () => void
  className?: string
}
```

## frontend/src/shared/layout/AppLayout.tsx

Fonte: [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx). Componentes: `SidebarContent`, `AppLayout`.

Consumidores diretos: [frontend/src/App.tsx](../../../frontend/src/App.tsx).

### SidebarContent

Linha 62; local. Assinatura:

```typescript

```

### AppLayout

Linha 133; exportado. Assinatura:

```typescript
{ children }: { children: ReactNode }
```

### Contrato NavItem

```typescript
interface NavItem {
  to: string
  label: string
  icon: typeof Users
  end?: boolean
}
```

## frontend/src/shared/layout/BottomTabBar.tsx

Fonte: [frontend/src/shared/layout/BottomTabBar.tsx](../../../frontend/src/shared/layout/BottomTabBar.tsx). Componentes: `BottomTabBar`.

Consumidores diretos: [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx).

### BottomTabBar

Linha 46; exportado. Assinatura:

```typescript

```

### Contrato ChaveNav

```typescript
type ChaveNav = "nav.central" | "nav.clientes" | "nav.contratos" | "nav.caixa" | "nav.rota" | "superAdmin.navEmpresas" | "lead.navLeads" | "admin.painel" | "devboard.nav"
```

### Contrato Aba

```typescript
interface Aba {
  modulo?: ModuleId
  chave: ChaveNav
  to: string
  icon: LucideIcon
  /** rota exata (Central). As demais ativam por prefixo via NavLink. */
  end?: boolean
}
```

## frontend/src/shared/layout/UserMenu.tsx

Fonte: [frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx). Componentes: `UserMenu`.

Consumidores diretos: [frontend/src/shared/layout/AppLayout.tsx](../../../frontend/src/shared/layout/AppLayout.tsx).

### UserMenu

Linha 32; exportado. Assinatura:

```typescript
{ detalhado = false, crescer = "cima", className = "", }: UserMenuProps
```

### Contrato Item

```typescript
interface Item {
  chave: string
  icon: LucideIcon
  to?: string
  onClick?: () => void
}
```

### Contrato UserMenuProps

```typescript
interface UserMenuProps {
  /** desktop: exibe nome + papel ao lado do avatar (rodapé da sidebar) */
  detalhado?: boolean
  /** para onde o popover cresce no desktop (padrão: acima, rodapé da sidebar) */
  crescer?: "cima" | "baixo"
  className?: string
}
```

## frontend/src/shared/theme/PreferenciasModal.tsx

Fonte: [frontend/src/shared/theme/PreferenciasModal.tsx](../../../frontend/src/shared/theme/PreferenciasModal.tsx). Componentes: `ThemeSwatch`, `PreferenciasModal`.

Consumidores diretos: [frontend/src/shared/layout/UserMenu.tsx](../../../frontend/src/shared/layout/UserMenu.tsx).

### ThemeSwatch

Linha 24; local. Assinatura:

```typescript
{ nome, ativo, onClick, label }: { nome: string; ativo: boolean; onClick: () => void; label: string }
```

### PreferenciasModal

Linha 47; exportado. Assinatura:

```typescript
{ open, onClose }: { open: boolean; onClose: () => void }
```

## frontend/src/shared/theme/ThemeProvider.tsx

Fonte: [frontend/src/shared/theme/ThemeProvider.tsx](../../../frontend/src/shared/theme/ThemeProvider.tsx). Componentes: `ThemeProvider`.

Consumidores diretos: [frontend/src/main.tsx](../../../frontend/src/main.tsx), [frontend/src/shared/theme/useTheme.ts](../../../frontend/src/shared/theme/useTheme.ts), [frontend/src/shared/utils/chartColors.ts](../../../frontend/src/shared/utils/chartColors.ts).

### ThemeProvider

Linha 62; exportado. Assinatura:

```typescript
{ children }: ThemeProviderProps
```

### Contrato ThemeMode

```typescript
export type ThemeMode = "light" | "dark" | "system"
```

### Contrato ThemeContextValue

```typescript
interface ThemeContextValue {
  /** Paleta ativa (default/violeta/ocean/grape/sunset). */
  palette: ThemeId
  /** Modo de tema: claro/escuro/sistema (preferência do SO). */
  mode: ThemeMode
  /** Escuro efetivo (derivado do modo). */
  isDark: boolean
  setPalette: (id: ThemeId) => void
  setMode: (m: ThemeMode) => void
  toggleDark: () => void
}
```

### Contrato ThemeProviderProps

```typescript
interface ThemeProviderProps {
  children: ReactNode
}
```

## Recursos complementares

AvatarField usa o processador compartilhado de imagens (MAX_LADO=640), não uma constante de200px do catálogo anterior. Seletores CSS, pseudo-elementos, declarações, media/keyframes e os elementos dos SVG locais são extraídos no JSON. Ícones lucide/SVG locais, mapas, gráficos Recharts, favicon/PWA, fontes, CSS, paletas e traduções estão localizados no inventário e em supportFiles do JSON. Props dinâmicas, componentes de bibliotecas e aparência efetiva exigem revisão no navegador.


[Estados por rota, referências visuais e lacunas](UI-STATES.md).
