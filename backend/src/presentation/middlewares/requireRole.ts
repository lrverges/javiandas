import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return next(new AppError('No autenticado', 401));
        }

        if (!allowedRoles.includes(user.role)) {
            return next(new AppError('Acceso denegado: privilegios insuficientes', 403));
        }

        next();
    };
}
