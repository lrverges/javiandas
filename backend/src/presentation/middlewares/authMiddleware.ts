import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { SequelizeUserRepository } from '../../infrastructure/repositories/SequelizeUserRepository';

const userRepository = new SequelizeUserRepository();

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return next(new AppError('Not authenticated', 401));
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return next(new AppError('Internal Server Error', 500));
        }

        const decoded = jwt.verify(token, secret) as { userId: number; email: string };
        
        const user = await userRepository.findByEmail(decoded.email);
        if (!user) {
            return next(new AppError('User no longer exists', 401));
        }

        req.user = {
            id: user.id!,
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            dni: user.dni,
            companyId: user.companyId
        };
        next();
    } catch (error) {
        next(new AppError('Invalid or expired token', 401));
    }
};
