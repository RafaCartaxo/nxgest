type MarkVariant = "lg" | "sm" | "mono"

export interface LogoProps {
  /** `lg` (login/landing) · `sm` (sidebar/navbar) · `mono` (<= 24px, favicon) */
  variant?: MarkVariant
  /** desenha o quadrado preenchido de fundo (app icon / favicon, full-bleed) */
  boxed?: boolean
  className?: string
  title?: string
}

type Ponto = [number, number]

/** Geometria da marca NX (viewBox quadrado 0 0 64 64). O "N" é a forma primária. */
const N: Record<"esq" | "esqTopo" | "dirBase" | "dirTopo" | "hub", Ponto> = {
  esq: [20, 46],
  esqTopo: [20, 18],
  dirBase: [44, 46],
  dirTopo: [44, 18],
  hub: [32, 32],
}

/** Nós do "N": sempre presentes, garantem leitura em 16px. */
const NOS_N: Array<[number, number]> = [N.esqTopo, N.esq, N.dirTopo, N.dirBase]

/** Nós de malha (decorativos) — usados em `lg` e, reduzidos, em `sm`. */
const NOS_MALHA_LG: Array<[number, number]> = [
  [8, 26],
  [12, 50],
  [32, 8],
  [56, 24],
  [52, 50],
  [32, 58],
]
const NOS_MALHA_SM: Array<[number, number]> = [
  [9, 27],
  [55, 25],
  [32, 57],
]

/** Arestas decorativas: do nó de malha até o vértice do N mais próximo. */
const MALHA_EDGES_LG: Array<[[number, number], [number, number]]> = [
  [[8, 26], N.esqTopo],
  [[8, 26], [12, 50]],
  [[12, 50], N.esq],
  [[32, 8], N.esqTopo],
  [[32, 8], N.dirTopo],
  [[56, 24], N.dirTopo],
  [[56, 24], [52, 50]],
  [[52, 50], N.dirBase],
  [[32, 58], N.esq],
  [[32, 58], N.dirBase],
]
const MALHA_EDGES_SM: Array<[[number, number], [number, number]]> = [
  [[9, 27], N.esqTopo],
  [[55, 25], N.dirTopo],
  [[32, 57], N.esq],
  [[32, 57], N.dirBase],
]

/**
 * Marca NX Gest — "N" limpo e centralizado emergindo da malha Nexus, com hub
 * central no cruzamento da diagonal.
 *
 * Cores só por token: traço herda `currentColor`, nós quentes e hub usam o
 * `--color-accent` do tema. Com `boxed`, o fundo full-bleed usa `--color-primary`
 * e o traço `--color-primary-foreground` (ícone de app / favicon).
 *
 * - `lg`   → login / landing (malha completa)
 * - `sm`   → navbar, sidebar (malha reduzida)
 * - `mono` → <= 24px e favicon (só o N + hub, traço mais grosso)
 */
export function Logo({ variant = "sm", boxed = false, className, title = "NX Gest" }: LogoProps) {
  const stroke = variant === "mono" ? 7 : variant === "sm" ? 6 : 5.2
  const nodeR = variant === "mono" ? 5.4 : variant === "sm" ? 4.6 : 4.2
  const hubR = variant === "mono" ? 8 : 7

  const malha = variant === "lg" ? NOS_MALHA_LG : variant === "sm" ? NOS_MALHA_SM : []
  const malhaEdges = variant === "lg" ? MALHA_EDGES_LG : variant === "sm" ? MALHA_EDGES_SM : []

  const traco = boxed ? "var(--color-primary-foreground)" : "currentColor"

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={`h-8 w-8 ${className ?? ""}`}
      fill="none"
    >
      <title>{title}</title>

      {boxed && <rect width="64" height="64" rx="14" fill="var(--color-primary)" />}

      {/* malha decorativa */}
      {malhaEdges.length > 0 && (
        <g
          stroke={traco}
          strokeWidth={variant === "lg" ? 2.4 : 2.8}
          strokeLinecap="round"
          opacity={0.32}
        >
          {malhaEdges.map(([a, b], i) => (
            <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
          ))}
        </g>
      )}

      {/* o "N" — forma primária */}
      <path
        d={`M${N.esq[0]} ${N.esq[1]} L${N.esqTopo[0]} ${N.esqTopo[1]} L${N.dirBase[0]} ${N.dirBase[1]} L${N.dirTopo[0]} ${N.dirTopo[1]}`}
        stroke={traco}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* nós de malha (accent) */}
      {malha.map(([x, y], i) => (
        <circle key={`m${i}`} cx={x} cy={y} r={nodeR - 0.6} fill="var(--color-accent)" />
      ))}

      {/* nós do N */}
      {NOS_N.map(([x, y], i) => (
        <circle key={`n${i}`} cx={x} cy={y} r={nodeR} fill={traco} />
      ))}

      {/* hub central (o Nexus) */}
      <circle cx={N.hub[0]} cy={N.hub[1]} r={hubR} fill="var(--color-accent)" />
      <circle cx={N.hub[0]} cy={N.hub[1]} r={hubR - 3.4} fill={traco} />
    </svg>
  )
}

export interface LogoLockupProps {
  className?: string
  tagline?: boolean
  size?: "sm" | "md" | "lg"
}

export function LogoLockup({ className, tagline = false, size = "md" }: LogoLockupProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <Logo
        variant={size === "lg" ? "lg" : "sm"}
        className={`text-primary ${size === "lg" ? "h-14 w-14" : "h-9 w-9"}`}
      />
      <div className="leading-tight">
        <div
          className={`font-display font-semibold tracking-tight ${
            size === "lg" ? "text-[28px]" : size === "sm" ? "text-base" : "text-lg"
          }`}
        >
          NX <span className="text-brand-gradient">Gest</span>
        </div>
        {tagline && <p className="text-sm text-text-muted">Gestão centralizada para o seu negócio</p>}
      </div>
    </div>
  )
}
