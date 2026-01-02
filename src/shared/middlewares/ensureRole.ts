// src/shared/middlewares/ensureRole.ts
import {Request, Response, NextFunction} from 'express'

export function ensureRole(role: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user
        if (!user || user.role !== role) {
            return res.status(403).json({error: 'Acesso negado'})
        }
        next()
    }
}
