import type { Request, Response, NextFunction } from "express"
import { verifyToken, type JwtPayload } from "../utils/jwt.js"
import { db, usuarios, empresas } from "../../database.js"
import { eq, and, isNull } from "drizzle-orm"

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
    return
  }

  try {
    const token = header.slice(7)
    const payload = verifyToken(token)

    const [usuario] = await db.select().from(usuarios).where(
      and(eq(usuarios.id, payload.userId), isNull(usuarios.deletedAt))
    ).limit(1)

    if (!usuario) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Usuário não encontrado ou removido." })
      return
    }

    // Role/empresa resolvidos do BANCO, não da claim do token (que pode estar stale
    // até 7 dias após promoção/rebaixamento — PLAN "roles"). A claim ainda autentica.
    req.userId = usuario.id
    req.userRole = usuario.role as JwtPayload["role"]
    req.empresaId = usuario.empresaId

    // PLAN-077: grava o usuário resolvido no request — o requireModule e outros
    // middlewares reutilizam em vez de re-consultar (antes: +1 query por request).
    req.authUsuario = {
      id: usuario.id,
      role: usuario.role as JwtPayload["role"],
      empresaId: usuario.empresaId,
      senhaHash: usuario.senhaHash,
      suspensoEm: usuario.suspensoEm,
    }

    // Empresa suspensa (ativa = 0) bloqueia todas as rotas operacionais (BR-106).
    // super_admin (empresaId null) nunca é bloqueado — gestão global.
    // PLAN-077: já resolve `modulos` aqui (uma única query) para o requireModule.
    if (usuario.empresaId) {
      const [empresa] = await db
        .select({ id: empresas.id, ativa: empresas.ativa, modulos: empresas.modulos })
        .from(empresas)
        .where(eq(empresas.id, usuario.empresaId))
        .limit(1)
      if (empresa) {
        req.authEmpresa = { id: empresa.id, ativa: empresa.ativa, modulos: empresa.modulos }
      }
      if (empresa && empresa.ativa === 0) {
        res.status(403).json({ code: "EMPRESA_INATIVA", message: "A empresa está inativa." })
        return
      }
    } else {
      req.authEmpresa = null
    }

    // Conta suspensa (N3 — PLAN-075): bloqueia TODAS as rotas, inclusive sessões com
    // JWT ainda vivo (a suspensão vale por-request, não só no login). Exceção: só o
    // `GET /api/auth/me` fica liberado para o front exibir o status "Suspenso".
    if (usuario.suspensoEm && req.originalUrl !== "/api/auth/me") {
      res.status(403).json({ code: "CONTA_SUSPENSA", message: "Conta suspensa. Fale com o administrador da sua empresa." })
      return
    }

    // Conta convidada sem senha (PLAN-065) → bloqueia rotas operacionais, exceto
    // `/api/auth/me` (que devolve o status para o front saber do convite).
    if (!usuario.senhaHash && !req.originalUrl.startsWith("/api/auth/")) {
      res.status(403).json({ code: "ACCOUNT_PENDING", message: "Ativação pendente — defina sua senha pelo link do convite." })
      return
    }

    next()
  } catch {
    res.status(401).json({ code: "TOKEN_EXPIRED", message: "Token inválido ou expirado." })
  }
}
