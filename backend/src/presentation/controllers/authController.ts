import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../../application/services/authService';
import { User } from '../../domain/models/User';

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

const googleLoginSchema = z.object({
    idToken: z.string().min(1, 'idToken is required'),
});

const sendOtpSchema = z.object({
    email: z.string().email('Invalid email format'),
});

const verifyOtpSchema = z.object({
    email: z.string().email('Invalid email format'),
    code: z.string().length(6, 'Code must be exactly 6 digits'),
});

const resendOtpSchema = z.object({
    email: z.string().email('Invalid email format'),
});

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(1, 'Phone is required'),
    dni: z.string().min(1, 'DNI is required'),
    address: z.object({
        street: z.string().min(1, 'Street is required'),
        number: z.string().min(1, 'Number is required'),
        locality: z.string().min(1, 'Locality is required'),
        reference: z.string().optional(),
    }).optional(),
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
        } catch (error: any) {
            if (error.message === 'Email is not verified') {
                res.status(403).json({
                    success: false,
                    message: error.message,
                    data: null
                });
                return;
            }
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

    async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = sendOtpSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const { email } = parsed.data;
            await this.authService.sendOtp(email);

            res.json({
                success: true,
                message: 'OTP sent successfully',
                data: null
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = registerSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const { email, password, firstName, lastName, phone, dni, address } = parsed.data;

            const userData = new User({
                email,
                password,
                firstName,
                lastName,
                phone,
                dni,
                role: 'user'
            });

            const result = await this.authService.register(userData, address);

            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 3600000
            });

            res.status(201).json({
                success: true,
                message: result.message,
                data: { user: result.user }
            });
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError' || (error.message && error.message.includes('unique'))) {
                // Comprobación robusta de qué campo duplicado causó el error
                const errors = error.errors || [];
                const hasEmailError = errors.some((err: any) => err.path === 'email') || error.message.includes('email');
                const field = hasEmailError ? 'Email' : 'DNI';
                res.status(400).json({
                    success: false,
                    message: `${field} already registered`,
                    data: null
                });
                return;
            }
            next(error);
        }
    }

    async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = verifyOtpSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const { email, code } = parsed.data;
            const result = await this.authService.verifyOtp(email, code);

            res.json({
                success: true,
                message: 'Email verified successfully',
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    }

    async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = resendOtpSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            await this.authService.resendOtp(parsed.data.email);
            
            res.json({
                success: true,
                message: 'OTP sent successfully',
                data: null
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
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
