import jwt from "jsonwebtoken"

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET env var is required. Set it in your .env file.")
  }
  return secret
}

export interface JwtPayload {
  userId: string
  role: "super_admin" | "admin" | "operator"
  empresaId: string | null
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload
}
