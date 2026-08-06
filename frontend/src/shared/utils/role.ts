export type Role = "super_admin" | "admin" | "socio" | "operator"

/** Rótulo i18n do papel — fonte única (consolidado do AppLayout/OperadoresList). */
export function roleLabel(role: Role | undefined, t: (k: string) => string): string {
  if (role === "super_admin") return t("admin.roleSuperAdmin")
  if (role === "admin") return t("admin.roleAdmin")
  if (role === "socio") return t("admin.roleSocio")
  return t("admin.roleOperator")
}

/** Variante visual do StatusBadge do papel. */
export function roleVariant(role: Role | undefined): "info" | "neutral" {
  return role === "operator" ? "neutral" : "info"
}
