//importações do projeto
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
    sub: number
    role: string
}

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado no .env')
}

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
    const token = (req as any).cookies?.auth_token

    if (!token) {
        return res.status(401).json({ error: 'Não autenticado' })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as JwtPayload;
        ;(req as any).user = { id: decoded.sub, role: decoded.role }
        next()
    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado' })
    }
}
