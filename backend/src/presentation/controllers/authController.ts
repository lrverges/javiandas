import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../../application/services/authService';

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

const googleLoginSchema = z.object({
    idToken: z.string().min(1, 'idToken is required'),
});

export class AuthController {
    constructor(private authService: AuthService) {}

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = loginSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const { email, password } = parsed.data;

            const result = await this.authService.login(email, password);
            if (!result) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    data: null
                });
                return;
            }

            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 3600000 // 1 hora
            });

            res.json({
                success: true,
                message: 'Login successful',
                data: { user: result.user }
            });
        } catch (error) {
            next(error);
        }
    }

    async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = googleLoginSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const { idToken } = parsed.data;

            const result = await this.authService.loginWithGoogle(idToken);
            if (!result) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid Google token',
                    data: null
                });
                return;
            }

            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 3600000 // 1 hora
            });

            res.json({
                success: true,
                message: 'Google login successful',
                data: { user: result.user }
            });
        } catch (error) {
            next(error);
        }
    }

    async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated',
                    data: null
                });
                return;
            }

            res.json({
                success: true,
                message: 'User retrieved successfully',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            res.json({
                success: true,
                message: 'Logged out successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
}
