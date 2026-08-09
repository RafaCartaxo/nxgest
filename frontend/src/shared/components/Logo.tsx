type MarkVariant = "lg" | "sm" | "mono"

export interface LogoProps {
  /** `lg` (login/landing) · `sm` (sidebar/navbar) · `mono` (<= 24px, favicon) */
  variant?: MarkVariant
  className?: string
  title?: string
}

/**
 * Marca NX Gest — malha de nós conectados formando a silhueta de um cérebro,
 * com um hub central (o Nexus) e o traço do "N" emergindo da rede.
 *
 * Monocromática: o traço herda `currentColor`. Os nós de destaque usam o accent
 * do tema (token `--accent`), então a marca acompanha tema e whitelabel.
 */
export function Logo({ variant = "sm", className, title = "NX Gest" }: LogoProps) {
  const stroke = variant === "mono" ? 6 : variant === "sm" ? 4.5 : 3.6
  const nodeR = variant === "mono" ? 9 : 7.5

  // Nós da malha: [x, y, destaque?]
  const full: Array<[number, number, boolean]> = [
    [46, 30, false],
    [22, 46, true],
    [12, 70, false],
    [30, 84, false],
    [40, 58, true],
    [62, 46, false],
    [50, 72, true],
    [76, 40, false],
    [86, 52, false],
    [92, 34, true],
    [78, 66, false],
    [64, 88, true],
    [86, 78, false],
    [50, 102, false],
    [66, 108, true],
  ]
  const reduced: Array<[number, number, boolean]> = [
    [46, 30, false],
    [22, 46, true],
    [30, 84, false],
    [50, 72, true],
    [76, 40, false],
    [92, 34, true],
    [86, 78, false],
    [64, 108, true],
  ]
  const nodes = variant === "lg" ? full : reduced

  const edgesFull: Array<[number, number]> = [
    [0, 1],
    [0, 4],
    [0, 5],
    [0, 7],
    [1, 2],
    [1, 4],
    [2, 3],
    [3, 4],
    [4, 5],
    [4, 6],
    [5, 6],
    [5, 7],
    [7, 8],
    [7, 9],
    [8, 9],
    [8, 10],
    [6, 10],
    [10, 12],
    [11, 12],
    [6, 11],
    [6, 13],
    [13, 14],
    [11, 14],
  ]
  const edgesReduced: Array<[number, number]> = [
    [0, 1],
    [0, 3],
    [0, 4],
    [1, 2],
    [2, 3],
    [3, 6],
    [4, 5],
    [4, 6],
    [3, 7],
    [6, 7],
  ]
  const edges = variant === "lg" ? edgesFull : edgesReduced

  return (
    <svg
      viewBox="0 0 112 124"
      role="img"
      aria-label={title}
      className={`h-8 w-8 ${className ?? ""}`}
      fill="none"
    >
      <title>{title}</title>
      <g stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        {edges.map(([a, b], i) => {
          const from = nodes[a]!
          const to = nodes[b]!
          return <line key={i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
        })}

        {/* haste inferior — o cérebro se apoia na base (tronco/hub) */}
        <path d="M66 108 L74 118 Q76 124 70 124 L54 124 Q48 124 50 118 L50 102" />

        {/* traço do "N" emergindo da malha */}
        <path
          d="M22 46 L22 84 M22 46 L50 72 M50 72 L50 34"
          opacity={variant === "mono" ? 0 : 0.28}
        />
      </g>

      {nodes.map(([x, y, hot], i) => (
        <circle key={i} cx={x} cy={y} r={nodeR} fill={hot ? "var(--color-accent)" : "currentColor"} />
      ))}

      {/* hub central (o Nexus) */}
      <circle cx={40} cy={58} r={nodeR + 3.5} fill="var(--color-accent)" />
      <circle cx={40} cy={58} r={nodeR - 2} fill="currentColor" opacity={0.85} />
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
        className={`text-primary ${size === "lg" ? "h-14 w-14" : "h-8 w-8"}`}
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
