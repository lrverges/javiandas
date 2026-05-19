import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../../application/services/authService';
import { SequelizeUserRepository } from '../../infrastructure/repositories/SequelizeUserRepository';
import { GoogleAuthProvider } from '../../infrastructure/providers/GoogleAuthProvider';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Rate limiting middleware for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 20 : 10000, // Limit requests per window
    message: { success: false, message: 'Too many requests, please try again later.', data: null }
});

// Instanciar dependencias (DI manual)
const userRepository = new SequelizeUserRepository();
const googleAuthProvider = new GoogleAuthProvider();
const authService = new AuthService(userRepository, googleAuthProvider);
const authController = new AuthController(authService);

// Definir rutas con rate limiting
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/google', authLimiter, (req, res, next) => authController.googleLogin(req, res, next));
router.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));
router.post('/logout', authLimiter, (req, res, next) => authController.logout(req, res, next));

export default router;
