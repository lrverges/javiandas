import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../infrastructure/logging/logger';

export class AppError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction) {
    if (err instanceof AppError) {
        Logger.warn(`AppError: ${err.message}`, { path: req.path, method: req.method });
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            data: null
        });
    }

    Logger.error(`Unhandled Exception: ${err.message}`, err);
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
    });
}
